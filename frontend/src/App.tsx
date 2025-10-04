import React, { useState } from 'react';
import './App.css';
import PaymentAmount from './components/PaymentAmount';
import CardDetailsForm from './components/CardDetailsForm';
import CheckoutButton from './components/CheckoutButton';
import { startMFA } from './components/MFA';
import MFAOverlay from './components/MFAOverlay';

const App: React.FC = () => {
  const [formData, setFormData] = useState({
    amount: '500.00',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    firstName: '',
    lastName: '',
    address: '',
  });

  const [mfaRequired, setMfaRequired] = useState(false); // Track MFA requirement
  const [mfaPending, setMfaPending] = useState(false); // Show spinner overlay while starting MFA
  const [mfaSelection, setMfaSelection] = useState<{ method: string; device: any } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Lightly sanitize card number (remove spaces) but do not perform strict validation
      const sanitizedCardNumber = formData.cardNumber.replace(/\s+/g, '');

      const payload = {
        ...formData,
        card_number: sanitizedCardNumber,
      };

      // Show overlay while MFA starts
      setMfaPending(true);

      // Delegate MFA logic to startMFA helper
      const result = await startMFA(payload);
      console.log('MFA result:', result);

      // If user selected a method/device, store it and set MFA required
      if (result && result.selection) {
        setMfaSelection(result.selection);
        setMfaRequired(true);
        console.log('User selected method:', result.selection.method, 'device:', result.selection.device);
      } else {
        // No selection -> leave as-is or handle direct success
        setMfaSelection(null);
        setMfaRequired(false);
      }

      setMfaPending(false);

    } catch (error) {
      setMfaPending(false);
      console.error('Error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const handleEditAmount = () => {
    const newAmount = prompt('Enter new amount:', formData.amount);
    if (newAmount) {
      setFormData({ ...formData, amount: newAmount });
    }
  };

  return (
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
        </div>
      )}
    </div>
  );
};

export default App;
