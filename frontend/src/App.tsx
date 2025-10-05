import React, { useState } from 'react';
import './App.css';
import PaymentAmount from './components/PaymentAmount';
import CardDetailsForm from './components/CardDetailsForm';
import CheckoutButton from './components/CheckoutButton';
import { startMFA } from './components/MFA';
import MFAOverlay from './components/MFAOverlay';
import Success from './components/Success';

const App: React.FC = () => {
  const [formData, setFormData] = useState({
    amount: '500.00',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    firstName: '',
    lastName: '',
    address: '',
    email: '',
  });

  const [mfaRequired, setMfaRequired] = useState(false); // Track MFA requirement
  const [mfaPending, setMfaPending] = useState(false); // Show spinner overlay while starting MFA
  const [mfaSelection, setMfaSelection] = useState<{ method: string; device: any } | null>(null);
  const [authStatus, setAuthStatus] = useState<'none' | 'success' | 'failed'>('none'); // Track auth result
  const [showSuccess, setShowSuccess] = useState(false); // Track whether to show success page

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean and sanitize all formatted fields before sending to backend
      const sanitizedCardNumber = formData.cardNumber.replace(/\s+/g, ''); // Remove spaces
      const sanitizedExpiryDate = formData.expiryDate.replace(/\D/g, ''); // Remove slash, keep only digits
      const sanitizedCvv = formData.cvv.replace(/\D/g, ''); // Keep only digits
      const sanitizedZipCode = formData.address.replace(/\D/g, ''); // Keep only digits

      // Fixed device information (static for demo/testing)
      const deviceInfo = {
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        platform: "MacIntel",
        language: "en-US"
      };

      // Geo info will be determined by backend from request headers
      // Backend will extract real IP from X-Forwarded-For, X-Real-IP, or remote_addr

      const payload = {
        ...formData,
        // Override formatted fields with clean data
        cardNumber: sanitizedCardNumber,
        expiryDate: sanitizedExpiryDate,
        cvv: sanitizedCvv,
        address: sanitizedZipCode,
        // Add default backend fields
        merchant_id: "demo_merchant",
        api_key: "sk_test_demo_key_12345",
        currency: "USD",
        email: formData.email || "user@example.com",
        // Add device information (geo will be determined by backend from request headers)
        device: deviceInfo
      };

      // Show overlay while MFA starts
      setMfaPending(true);

      // Delegate MFA logic to startMFA helper
      const result = await startMFA(payload);
      console.log('MFA result:', result);
      
      // Check if MFA was successful
      if (result && result.success) {
        console.log('✅ MFA Authentication SUCCESS!');
        console.log('Authentication details:', {
          method: result.selection?.method || 'No MFA required',
          device: result.selection?.device?.display_name || result.selection?.device?.name || 'N/A',
          success: result.success,
          mfaRequired: result.data?.mfa_required || false
        });
        
        // Redirect to success page instead of alert
        setAuthStatus('success');
        setMfaSelection(result.selection);
        setMfaRequired(false);
        setShowSuccess(true); // Show success page
      } else if (result && result.selection && !result.success) {
        console.log('❌ MFA Authentication FAILED');
        console.log('Failed authentication details:', {
          method: result.selection?.method,
          device: result.selection?.device?.display_name || result.selection?.device?.name,
          success: result.success,
          error: result.sendError || result.smsError || 'Unknown error'
        });
        
        // Update UI state but don't show alert popup
        setAuthStatus('failed');
        setMfaSelection(result.selection);
        setMfaRequired(true);
      } else if (result && result.selection) {
        // Selection made but no clear success/failure (shouldn't happen with new flow)
        setMfaSelection(result.selection);
        setMfaRequired(true);
        setAuthStatus('none');
        console.log('User selected method:', result.selection.method, 'device:', result.selection.device);
      } else {
        // No selection -> cancelled or no MFA required
        setMfaSelection(null);
        setMfaRequired(false);
        setAuthStatus('none');
      }

      setMfaPending(false);

    } catch (error) {
      setMfaPending(false);
      console.error('Error:', error);
      // Removed alert popup - just log the error
    }
  };

  const handleEditAmount = () => {
    const newAmount = prompt('Enter new amount:', formData.amount);
    if (newAmount) {
      setFormData({ ...formData, amount: newAmount });
    }
  };

  return (
    <>
      {showSuccess ? (
        <Success />
      ) : (
        <div
          className="App"
          style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '400px',
            margin: '0 auto',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <MFAOverlay visible={mfaPending} />
          <header
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              width: '100%',
            }}
          >
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Purchase</h1>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                alt="Visa"
                style={{ width: '40px' }}
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg"
                alt="MasterCard"
                style={{ width: '40px' }}
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                alt="American Express"
                style={{ width: '40px' }}
              />
              <img
                src="https://www.discoversignage.com/uploads/DGN_AcceptanceMark_FC_Hrz_RGB.jpg"
                alt="Discover"
                style={{ width: '40px' }}
              />
            </div>
            <PaymentAmount amount={formData.amount} onEdit={handleEditAmount} />
          </header>
          <form
            onSubmit={handleSubmit}
            style={{
              width: '80%',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              alignItems: 'center',
            }}
          >
            <CardDetailsForm formData={formData} onChange={handleChange} />
            <CheckoutButton amount={formData.amount} disabled={mfaRequired} />
          </form>

          {mfaSelection && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <strong>MFA Method:</strong> {mfaSelection.method} <br />
              <strong>Device:</strong> {mfaSelection.device?.display_name || mfaSelection.device?.name || mfaSelection.device?.number}
              <br />
              {authStatus === 'success' && (
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 16px', 
                  backgroundColor: '#d4edda', 
                  border: '1px solid #c3e6cb', 
                  borderRadius: '6px',
                  color: '#155724'
                }}>
                  ✅ <strong>Authentication Successful!</strong>
                </div>
              )}
              {authStatus === 'failed' && (
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 16px', 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb', 
                  borderRadius: '6px',
                  color: '#721c24'
                }}>
                  ❌ <strong>Authentication Failed</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default App;
