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
  // Format card number with spaces (groups of 4)
  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 16 digits
    const limitedDigits = digits.slice(0, 16);
    // Add spaces every 4 digits
    return limitedDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Format expiry date with automatic slash
  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 4 digits (MMYY)
    const limitedDigits = digits.slice(0, 4);
    // Add slash after MM
    if (limitedDigits.length >= 2) {
      return limitedDigits.slice(0, 2) + '/' + limitedDigits.slice(2);
    }
    return limitedDigits;
  };

  // Handle formatted input changes
  const handleFormattedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply specific formatting based on field
    switch (name) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiryDate':
        formattedValue = formatExpiryDate(value);
        break;
      case 'cvv':
        // Limit to 3 digits only
        formattedValue = value.replace(/\D/g, '').slice(0, 3);
        break;
      case 'address': // ZIP code
        // Limit to 5 digits only
        formattedValue = value.replace(/\D/g, '').slice(0, 5);
        break;
      default:
        formattedValue = value;
        break;
    }

    // Create a new event object with the formatted value
    const formattedEvent = {
      target: {
        name,
        value: formattedValue
      }
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(formattedEvent);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginRight: '15px', marginBottom: '15px' }}>
        <label htmlFor="firstName" style={{ display: 'block', marginBottom: '5px' }}>Name on card:</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          placeholder="John"
          value={formData.firstName}
          onChange={onChange}
          autoComplete="off"
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginRight: '15px', marginBottom: '15px' }}>
        <label htmlFor="cardNumber" style={{ display: 'block', marginBottom: '5px' }}>Card number:</label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          placeholder="1234 5678 9012 3456"
          value={formData.cardNumber}
          onChange={handleFormattedChange}
          maxLength={19} // 16 digits + 3 spaces
          autoComplete="off" 
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
            onChange={handleFormattedChange}
            maxLength={5} // MM/YY format
            autoComplete="off"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ flex: 1, marginRight: '15px' }}>
          <label htmlFor="cvv" style={{ display: 'block', marginBottom: '5px' }}>Security code:</label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            placeholder="123"
            value={formData.cvv}
            onChange={handleFormattedChange}
            maxLength={3} // 3 digits max
            autoComplete="off"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
      </div>
      <div style={{ marginRight: '15px', marginBottom: '15px' }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email address:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={onChange}
          autoComplete="off"
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginRight: '15px', marginBottom: '15px' }}>
        <label htmlFor="address" style={{ display: 'block', marginBottom: '5px' }}>ZIP/Postal code:</label>
        <input
          type="text"
          id="address"
          name="address"
          placeholder="12345"
          value={formData.address}
          onChange={handleFormattedChange}
          maxLength={5} // 5 digits max
          autoComplete="off"
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};

export default CardDetailsForm;
