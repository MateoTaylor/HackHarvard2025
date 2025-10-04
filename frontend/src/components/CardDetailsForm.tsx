import React from 'react';

interface CardDetailsFormProps {
  formData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    firstName: string;
    lastName: string;
    address: string;
    email: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CardDetailsForm: React.FC<CardDetailsFormProps> = ({ formData, onChange }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="firstName" style={{ display: 'block', marginBottom: '5px' }}>Name on card:</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          placeholder="John"
          value={formData.firstName}
          onChange={onChange}
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="cardNumber" style={{ display: 'block', marginBottom: '5px' }}>Card number:</label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          placeholder="1234 5678 9012 3456"
          value={formData.cardNumber}
          onChange={onChange}
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="expiryDate" style={{ display: 'block', marginBottom: '5px' }}>Expiry date:</label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            placeholder="MM/YY"
            value={formData.expiryDate}
            onChange={onChange}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="cvv" style={{ display: 'block', marginBottom: '5px' }}>Security code:</label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            placeholder="123"
            value={formData.cvv}
            onChange={onChange}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email address:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={onChange}
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="address" style={{ display: 'block', marginBottom: '5px' }}>ZIP/Postal code:</label>
        <input
          type="text"
          id="address"
          name="address"
          placeholder="12345"
          value={formData.address}
          onChange={onChange}
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};

export default CardDetailsForm;
