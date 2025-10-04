import React from 'react';

interface CheckoutButtonProps {
  amount: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ amount }) => {
  return (
    <button
      type="submit"
      style={{
        width: '100%',
        padding: '10px',
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
      }}
    >
      Pay ${amount}
    </button>
  );
};

export default CheckoutButton;
