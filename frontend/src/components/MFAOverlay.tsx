import React from 'react';

const MFAOverlay: React.FC<{ visible: boolean; message?: string }> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <div className="mfa-overlay" role="status" aria-live="polite">
      <div className="mfa-spinner" />
      <div className="mfa-message">{message || 'Waiting for MFA confirmation...'}</div>
    </div>
  );
};

export default MFAOverlay;
