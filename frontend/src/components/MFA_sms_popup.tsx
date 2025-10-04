import React, { useState, useEffect } from 'react';

export default function MFASMSPopup({
  onClose,
  onSubmit,
  deviceName,
}: {
  onClose?: () => void;
  onSubmit?: (passcode: string) => void;
  deviceName?: string;
}) {
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length !== 7 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.(passcode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 7) {
      setPasscode(value);
    }
  };

  return (
    <div className="mfa-popup-overlay">
      <div className="mfa-popup">
        <button className="mfa-close" onClick={() => onClose?.()} aria-label="Close">
          ×
        </button>
        <h2 className="mfa-title">Enter SMS Code</h2>
        <p className="mfa-sub">
          A 7-digit code has been sent to {deviceName || 'your device'}
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
          <div style={{ margin: '20px 0' }}>
            <input
              type="text"
              value={passcode}
              onChange={handlePasscodeChange}
              placeholder="1234567"
              maxLength={7}
              style={{
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                padding: '12px 16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                width: '200px',
                fontFamily: 'monospace'
              }}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={passcode.length !== 7 || isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: passcode.length === 7 && !isSubmitting ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: passcode.length === 7 && !isSubmitting ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}