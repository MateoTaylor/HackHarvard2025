import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    amount: ''
  });
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

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
        body: JSON.stringify({ amount: formData.amount }), // Sending the amount in the request body
      });

      const data = await response.json();
      console.log('Response:', data);
      setResponseMessage(JSON.stringify(data, null, 2)); // Display the response
    } catch (error) {
      console.error('Error:', error);
      setResponseMessage('Failed to send request.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mock Payment Page</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="cardNumber">Card Number:</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="expiryDate">Expiry Date:</label>
            <input
              type="text"
              id="expiryDate"
              name="expiryDate"
              placeholder="MM/YY"
              value={formData.expiryDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="cvv">CVV:</label>
            <input
              type="text"
              id="cvv"
              name="cvv"
              placeholder="123"
              value={formData.cvv}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="cardHolder">Cardholder Name:</label>
            <input
              type="text"
              id="cardHolder"
              name="cardHolder"
              placeholder="John Doe"
              value={formData.cardHolder}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>
          <button type="submit">Checkout</button>
        </form>
        {responseMessage && (
          <div>
            <h2>Response:</h2>
            <pre>{responseMessage}</pre>
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
