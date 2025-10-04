import React, { useEffect } from 'react';

const Success: React.FC = () => {
  useEffect(() => {
    // Create confetti animation
    const createConfetti = () => {
      const confettiContainer = document.getElementById('confetti-container');
      if (!confettiContainer) return;

      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = getRandomColor();
        confettiContainer.appendChild(confetti);
      }

      // Clean up confetti after animation
      setTimeout(() => {
        confettiContainer.innerHTML = '';
      }, 5000);
    };

    const getRandomColor = () => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    createConfetti();
  }, []);

  const handleBackToHome = () => {
    window.location.reload(); // Simple way to reset the app
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Confetti container */}
      <div id="confetti-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Success content */}
      <div style={{
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        zIndex: 2,
        position: 'relative'
      }}>
        {/* Green checkmark */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: '#28a745',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px auto',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{
            fontSize: '60px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
        </div>

        {/* Success message */}
        <h1 style={{
          fontSize: '36px',
          color: '#28a745',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          Purchase Successful!
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#6c757d',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          Your payment has been processed successfully.<br />
          Thank you for your purchase!
        </p>

        {/* Back to home button */}
        <button
          onClick={handleBackToHome}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            fontSize: '16px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
        >
          Make Another Purchase
        </button>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #ff6b6b;
          animation: confetti-fall 3s linear infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Success;