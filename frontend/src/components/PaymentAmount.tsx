import React from 'react';

interface PaymentAmountProps {
  amount: string;
  onEdit: () => void;
}

const PaymentAmount: React.FC<PaymentAmountProps> = ({ amount, onEdit }) => {
  return (
    <div style={{ marginBottom: '15px', textAlign: 'center' }}>
      <h2>Payment amount</h2>
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>${amount}</p>
      <button
        onClick={onEdit}
        style={{
          padding: '5px 10px',
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Edit
      </button>
    </div>
  );
};

export default PaymentAmount;
