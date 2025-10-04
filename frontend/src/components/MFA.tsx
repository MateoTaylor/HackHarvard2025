import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Simple MFA helper module
// Exports a startMFA function that sends the payload to the backend
// and handles Duo redirect when needed. Designed to be imported by any app.

export type MFASelection = { method: string; device: any } | null;
export async function startMFA(payload: Record<string, any>, options?: { endpoint?: string }) {
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

const methodLabelMap: Record<string, string> = {
    push: 'Push Notification',
    sms: 'SMS',
    phone: 'Phone Call',
    passcode: 'Passcode',
};

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

const MFAOptionsPopup: React.FC<{
    methods: Array<{ method: string; devices: any[] }>;
    onClose?: () => void;
    onSelect?: (method: string, device: any) => void;
}> = ({ methods, onClose, onSelect }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="mfa-popup-overlay">
            <div className="mfa-popup">
                <button className="mfa-close" onClick={() => onClose?.()} aria-label="Close">
                    ×
                </button>
                <h2 className="mfa-title">Verify your identity</h2>
                <p className="mfa-sub">Choose a verification method to continue</p>

                <div className="mfa-grid">
                    {methods.map((m) => {
                        const method = m.method || 'unknown';
                        const devices = Array.isArray(m.devices) ? m.devices : m.devices ? [m.devices] : [];
                        const top = devices[0] || null;
                        const label = methodLabelMap[method] || method;

                        return (
                            <div key={method} className="mfa-card">
                                <div className="mfa-card-header">
                                    <div className="mfa-method">{label}</div>
                                </div>

                                <div className="mfa-card-body">
                                    {top ? (
                                        <div className="mfa-device">
                                            <div className="mfa-device-name">
                                                {top.display_name || top.display || top.name || top.number || top.device || 'Primary device'}
                                            </div>
                                            {top.number && <div className="mfa-device-phone">{top.number}</div>}
                                        </div>
                                    ) : (
                                        <div className="mfa-device-empty">No device available</div>
                                    )}
                                </div>

                                <div className="mfa-card-footer">
                                    <button
                                        className="mfa-choose"
                                        onClick={() => onSelect?.(method, top)}
                                        disabled={!top}
                                    >
                                        Use {label}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button className="mfa-cancel" onClick={() => onClose?.()}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

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
