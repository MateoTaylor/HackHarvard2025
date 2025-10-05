**HackHarvard 2025 | Cambridge, Massachusetts**  
_36 Hours of Innovation • Visa Trust & Transparency Track_

# TruelyPay - Secure MFA Payment Authentication

---

## � What We Built

A universal MFA verification layer for secure payments with intelligent risk assessment and seamless merchant integration.

**Key Features:**

- Smart MFA triggers (amount, location, device, behavior)
- Multiple auth methods (SMS, Email, Duo Security)
- ~3-line code integration for merchants
- Real-time processing with MongoDB backend

## 🏗️ Architecture

- **Backend**: Flask API with MongoDB, intelligent risk engine
- **Frontend**: React TypeScript with vendor demo + integration components
- **Integration**: Drop-in MFA components for any payment system

## 🚀 Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt && python3 app.py

# Frontend
cd frontend && npm install && npm run dev
```

Visit `http://localhost:5173` • Try amounts ≥$100 to trigger MFA

## 🔧 Easy Merchant Integration

Merchants can add TruelyPay MFA to their existing systems with just **3 lines of code**:

```typescript
import { startMFA } from "./components/MFA";

const result = await startMFA({
  merchant_id: "your_merchant_id",
  api_key: "your_api_key",
  amount: paymentData.amount,
  email: paymentData.email,
});

if (result.success) {
  // Proceed with payment
}
```

## 🛡️ Security Features

- **Risk-Based Authentication**: Smart MFA triggers based on multiple factors
- **Geographic Analysis**: High-risk country detection
- **Device Fingerprinting**: New device identification
- **Email Validation**: Temporary email provider detection
- **Challenge Expiration**: Time-limited authentication windows
- **Audit Logging**: Comprehensive transaction tracking

## 👥 Team

**Jorge Galvis Carrillo** - Columbia University, CS & Math-Statistics '26  
**Mateo Taylor** - Haverford College, CS '27  
**Ekin Chakma** - Brandeis University, CS '27  
**Sushmit Chakma** - Haverford College, CS '28

## 📚 Documentation

- [Backend API](./backend/README.md) - Complete setup and API reference
- [Frontend Integration](./frontend/README.md) - Component guide and examples

## 📄 License

Educational and development purposes only.

---

_For the memories of these fun days and the creation the future of secure payments_
