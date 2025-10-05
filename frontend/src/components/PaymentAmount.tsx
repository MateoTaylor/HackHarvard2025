import React from 'react';

interface PaymentAmountProps {
  amount: string;
  onEdit: () => void;
}

const PaymentAmount: React.FC<PaymentAmountProps> = ({ amount, onEdit }) => {
  return (
    <div style={{ 
      marginBottom: '10px', 
      textAlign: 'center',
      padding: '8px',
      backgroundColor: '#F8F9FA',
      borderRadius: '4px',
      border: '1px solid #E9ECEF'
    }}>
      <div style={{ fontSize: '12px', color: '#6C757D', marginBottom: '4px' }}>Test Amount</div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px' 
      }}>
        <span style={{ fontSize: '16px', fontWeight: '600' }}>${amount}</span>
        <button
          onClick={onEdit}
          style={{
            padding: '4px 8px',
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default PaymentAmount;
