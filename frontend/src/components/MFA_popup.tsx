import React, { useEffect } from 'react';

const methodLabelMap: Record<string, string> = {
  push: 'Push Notification',
  sms: 'SMS',
  phone: 'Phone Call',
  passcode: 'Passcode',
};

export default function MFAOptionsPopup({
  methods,
  onClose,
  onSelect,
}: {
  methods: Array<{ method: string; devices: any[] }>;
  onClose?: () => void;
  onSelect?: (method: string, device: any) => void;
}) {
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
}
