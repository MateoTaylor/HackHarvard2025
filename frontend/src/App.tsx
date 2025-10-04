import React, { useState } from 'react';
import './App.css';
import PaymentAmount from './components/PaymentAmount';
import CardDetailsForm from './components/CardDetailsForm';
import CheckoutButton from './components/CheckoutButton';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5001/authpay/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.mfa_required) {
        setMfaRequired(true); // Set MFA required state
        console.log('Authentication required. Please complete MFA.');
      } else {
        setMfaRequired(false); // Clear MFA required state
        console.log('Authentication successful.');
      }
    } catch (error) {
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
    </div>
  );
};

export default App;
