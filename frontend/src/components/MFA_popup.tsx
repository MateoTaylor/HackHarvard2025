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
    <div className="mfa-popup-overlay" style={{
      background: 'rgba(0, 0, 0, 0.6)'
    }}>
      <div className="mfa-popup" style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <button 
          className="mfa-close" 
          onClick={() => onClose?.()} 
          aria-label="Close"
          style={{
            color: '#6B7280',
            fontSize: '24px'
          }}
        >
          ×
        </button>

        <h2 className="mfa-title" style={{
          color: '#111827',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>Verify your identity</span>
          <img
            src="/crop_logo.png"
            alt="Crop Logo"
            style={{
              height: '24px',
              objectFit: 'contain'
            }}
          />
        </h2>
        <p className="mfa-sub" style={{
          color: '#6B7280',
          marginBottom: '24px'
        }}>
          Choose a verification method to continue
        </p>

        <div className="mfa-grid">
          {methods.map((m) => {
            const method = m.method || 'unknown';
            const devices = Array.isArray(m.devices) ? m.devices : m.devices ? [m.devices] : [];
            const top = devices[0] || null;
            const label = methodLabelMap[method] || method;

            return (
              <div key={method} className="mfa-card" style={{
                background: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '20px',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div className="mfa-card-header">
                  <div className="mfa-method" style={{
                    color: '#111827',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    {label}
                  </div>
                </div>

                <div className="mfa-card-body">
                  {top ? (
                    <div className="mfa-device">
                      <div className="mfa-device-name" style={{
                        color: '#111827',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {method === 'push' ? "Duo Push" : (top.display_name || top.display || top.name || top.number || top.device || 'Primary device')}
                      </div>
                    </div>
                  ) : (
                    <div className="mfa-device-empty" style={{
                      color: '#9CA3AF'
                    }}>No device available</div>
                  )}
                </div>

                <div className="mfa-card-footer" style={{ marginTop: '16px' }}>
                  <button
                    className="mfa-choose"
                    onClick={() => onSelect?.(method, top)}
                    disabled={!top}
                    style={{
                      background: !top ? '#E5E7EB' : '#1F2937',
                      color: !top ? '#9CA3AF' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: !top ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: !top ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      width: '100%'
                    }}
                    onMouseOver={(e) => {
                      if (top) {
                        const target = e.target as HTMLButtonElement;
                        target.style.background = '#374151';
                        target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (top) {
                        const target = e.target as HTMLButtonElement;
                        target.style.background = '#1F2937';
                        target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                      }
                    }}
                  >
                    Use {label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 24,
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <div style={{ flex: 1 }}></div>
          <button
            className="mfa-cancel"
            style={{
              background: '#FFFFFF',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onClick={() => onClose?.()}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = '#F9FAFB';
              target.style.borderColor = '#9CA3AF';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = '#FFFFFF';
              target.style.borderColor = '#D1D5DB';
            }}
          >
            Cancel
          </button>
          <div style={{ 
            flex: 1, 
            textAlign: 'right',
            fontSize: '13px',
            color: '#6B7280',
            fontStyle: 'normal',
            paddingLeft: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px'
          }}>
            <span>Inspired by</span>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
              alt="Visa"
              style={{ 
                width: '28px', 
                height: '18px', 
                objectFit: 'contain',
                opacity: 0.8
              }}
            />
            <span>@ HackHarvard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
