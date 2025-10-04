import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Simple MFA helper module
// Exports a startMFA function that sends the payload to the backend
// and handles Duo redirect when needed. Designed to be imported by any app.

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
    if (data && data.mfa_required && data.auth_method) {
      // Show MFA options to the user
      showMFAOptions(data.auth_method);
    }

    // Otherwise return the response so caller can handle
    return { redirected: false, data };
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

function normalizeAuthMethods(authMethod: AuthMethodsProp) {
  // If it's already an array of {method, devices}, return as-is
  if (Array.isArray(authMethod)) return authMethod;

  // If it's an object mapping method->devices, convert to array
  if (typeof authMethod === 'object' && authMethod !== null) {
    return Object.keys(authMethod).map((method) => ({ method, devices: authMethod[method] }));
  }

  return [];
}

const MFAOptionsPopup: React.FC<{
  authMethod: AuthMethodsProp;
  onClose?: () => void;
  onSelect?: (method: string, device: any) => void;
}> = ({ authMethod, onClose, onSelect }) => {
  const methods = normalizeAuthMethods(authMethod);

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
          {methods.map((m: any) => {
            const method = m.method || m.name || 'unknown';
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
                        {top.display || top.name || top.number || top.device || 'Primary device'}
                      </div>
                      {top.phone && <div className="mfa-device-phone">{top.phone}</div>}
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

export const showMFAOptions = (authMethod: AuthMethodsProp) => {
  // Create container
  const id = 'mfa-options-root';
  let container = document.getElementById(id) as HTMLDivElement | null;
  if (container) {
    // already open - replace content
    ReactDOM.createRoot(container).render(
      <MFAOptionsPopup
        authMethod={authMethod}
        onClose={() => {
          ReactDOM.createRoot(container!).unmount();
          container!.remove();
        }}
        onSelect={(method, device) => {
          console.log('Selected method', method, device);
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
      authMethod={authMethod}
      onClose={() => {
        root.unmount();
        container!.remove();
      }}
      onSelect={(method, device) => {
        console.log('Selected method', method, device);
      }}
    />
  );
};

// Optional React component to show MFA status or integrate UI later
export const MFA: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default MFA;