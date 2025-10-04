import React from 'react';

interface CheckoutButtonProps {
  amount: string;
  disabled?: boolean; // Add disabled prop
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ amount, disabled }) => {
  return (
    <button
      type="submit"
      disabled={disabled} // Apply disabled prop
      style={{
        width: '100%',
        padding: '10px',
        backgroundColor: disabled ? '#ccc' : '#007BFF', // Change color if disabled
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer', // Change cursor if disabled
        fontSize: '16px',
      }}
    >
      Pay ${amount}
    </button>
  );
};

export default CheckoutButton;
