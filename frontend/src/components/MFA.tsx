import React from 'react';
import ReactDOM from 'react-dom/client';
import MFAOptionsPopup from './MFA_popup';

// Simple MFA helper module
// Exports a startMFA function that sends the payload to the backend
// and handles Duo redirect when needed. Designed to be imported by any app.

export type MFASelection = { method: string; device: any } | null;
export async function startMFA(payload: Record<string, any>, options?: { endpoint?: string; sendEndpoint?: string }) {
    const endpoint = options?.endpoint || 'http://localhost:5001/authpay/init';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        // If backend indicates MFA is required and user found, display popup
        // that allows user to select MFA option
        console.log('MFA start response:', data);
        if (data && data.mfa_required && data.auth_method) {
            // Show MFA options to the user and wait for selection
            const selection = await showMFAOptions(data.auth_method);
            // selection is {method, device} or null if cancelled
            console.log('User selected MFA option:', selection);
            if (selection) {
                // Call the new selection endpoint to trigger actual Duo auth
                const sendEndpoint = options?.sendEndpoint || 'http://localhost:5001/authpay/send';
                try {
                    const sendRes = await fetch(sendEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            method: selection.method,
                            username: payload.email || 'testuser' // Use email from payload or fallback
                        }),
                    });
                    
                    const sendData = await sendRes.json();
                    console.log('MFA send response:', sendData);
                    
                    return { redirected: false, data, selection, sendResult: sendData };
                } catch (sendErr) {
                    console.error('Error sending MFA request:', sendErr);
                    return { redirected: false, data, selection, sendError: sendErr };
                }
            }
            return { redirected: false, data, selection };
        }

        // Otherwise return the response so caller can handle
        return { redirected: false, data, selection: null };
    } catch (err) {
        console.error('MFA start error:', err);
        throw err;
    }
}

// React popup component
type AuthMethodsProp = Record<string, any> | any[];

function deriveMethodsFromAuth(authMethod: any) {
    // Normalize several possible shapes into an array of { method, devices }
    // Case A: authMethod.devices => list of device objects with capabilities
    // Case B: authMethod is { push: [...], sms: [...] }
    // Case C: authMethod is an array like [{method, devices}]

    if (!authMethod) return [];

    // Case C
    if (Array.isArray(authMethod)) {
        return authMethod.map((m) => ({ method: m.method || m.name || 'unknown', devices: m.devices || [] }));
    }

    // Case A
    if (authMethod.devices && Array.isArray(authMethod.devices)) {
        const devices = authMethod.devices;
        // Collect top device for each capability
        const methodMap: Record<string, any[]> = {};
        devices.forEach((d: any) => {
            const caps = d.capabilities || d.capability || [];
            (caps || []).forEach((cap: string) => {
                // normalize cap values: 'auto' includes push, etc. We'll map known capability names
                let key = cap;
                if (cap === 'auto') key = 'push';
                methodMap[key] = methodMap[key] || [];
                methodMap[key].push(d);
            });
        });

        return Object.keys(methodMap).map((method) => ({ method, devices: methodMap[method] }));
    }

    // Case B: mapping
    if (typeof authMethod === 'object') {
        return Object.keys(authMethod).map((method) => ({ method, devices: authMethod[method] }));
    }

    return [];
}

export const showMFAOptions = (authMethod: AuthMethodsProp): Promise<MFASelection> => {
    return new Promise((resolve) => {
        // derive methods
        const methods = deriveMethodsFromAuth(authMethod);

        // Create container
        const id = 'mfa-options-root';
        let container = document.getElementById(id) as HTMLDivElement | null;
        if (container) {
            const root = ReactDOM.createRoot(container);
            root.render(
                <MFAOptionsPopup
                    methods={methods}
                    onClose={() => {
                        root.unmount();
                        container!.remove();
                        resolve(null);
                    }}
                    onSelect={(method, device) => {
                        root.unmount();
                        container!.remove();
                        resolve({ method, device });
                    }}
                />
            );
            return;
        }

        container = document.createElement('div');
        container.id = id;
        document.body.appendChild(container);
        const root = ReactDOM.createRoot(container);
        root.render(
            <MFAOptionsPopup
                methods={methods}
                onClose={() => {
                    root.unmount();
                    container!.remove();
                    resolve(null);
                }}
                onSelect={(method, device) => {
                    root.unmount();
                    container!.remove();
                    resolve({ method, device });
                }}
            />
        );
    });
};

// Optional React component to show MFA status or integrate UI later
export const MFA: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export default MFA;
