# AuthPay MFA Backend Service

A comprehensive Flask-based Multi-Factor Authentication (MFA) service designed for secure payment processing. This backend provides intelligent risk assessment, multiple MFA methods, and seamless integration with payment systems.

## Architecture Overview

The backend follows a modular service-oriented architecture with the following components:

- **Flask Application** (`app.py`) - Main application entry point
- **Route Handlers** (`routes/`) - HTTP endpoint management
- **Service Layer** (`services/`) - Business logic and external integrations
- **Database Layer** (`services/database.py`) - MongoDB integration for persistent storage
- **Configuration** (`config.py`) - Application settings and constants

## Key Features

- **Intelligent MFA Rules**: Risk-based authentication using transaction amount, location, device fingerprinting, and user behavior
- **Multiple MFA Methods**: SMS, Email, and Duo Security integration
- **MongoDB Integration**: Persistent storage for merchants, users, and transaction history
- **Real-time Risk Assessment**: Dynamic decision-making for MFA requirements
- **Email Notifications**: Automated alerts for transactions and fraud detection
- **Comprehensive Testing**: Full test suite covering all components
- **CORS Support**: Cross-origin resource sharing for web integration

## Prerequisites

- Python 3.8+
- MongoDB (local installation or MongoDB Atlas)
- Virtual environment (recommended)

## Installation & Setup

### 1. Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Configuration

Create a `.env` file in the backend directory with your MongoDB connection:

```bash
# For MongoDB Atlas (recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/authpay_db

# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/authpay_db
```

### 3. Environment Variables (Optional)

Additional configuration can be set in `.env`:

```bash
# Duo Security API credentials (if using Duo MFA)
DUO_INTEGRATION_KEY=your_integration_key
DUO_SECRET_KEY=your_secret_key
DUO_API_HOSTNAME=your_api_hostname

# Email service configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 4. Start the Server

```bash
python3 app.py
```

The server will start on `http://127.0.0.1:5001`

### 5. Verify Installation

Test the health endpoint:

```bash
curl http://127.0.0.1:5001/authpay/health
```

## API Documentation

### Core Endpoints

#### 1. Health Check

```http
GET /authpay/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-04T12:00:00.000Z",
  "active_challenges": 0,
  "database_status": "connected"
}
```

#### 2. Initialize MFA Challenge

```http
POST /authpay/init
```

**Request Body:**

```json
{
  "merchant_id": "demo_merchant",
  "api_key": "sk_test_demo_key_12345",
  "amount": 150.0,
  "currency": "USD",
  "email": "user@example.com",
  "geo": {
    "country": "US",
    "state": "CA",
    "ip_address": "192.168.1.1"
  },
  "device": {
    "user_agent": "Mozilla/5.0...",
    "fingerprint": "device_hash",
    "new_device": false
  }
}
```

**Response (MFA Required):**

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "mfa_required": true,
  "method": "sms",
  "reason": "high_amount",
  "expires_in_seconds": 900,
  "message": "MFA challenge sent to your device"
}
```

**Response (No MFA Required):**

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "mfa_required": false,
  "allow": true,
  "reason": "low_risk_transaction"
}
```

#### 3. Send MFA Request

```http
POST /authpay/send
```

**Request Body:**

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "sms",
  "phone_number": "+1234567890"
}
```

#### 4. Verify MFA Challenge

```http
POST /authpay/verify
```

**Request Body:**

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "verification_code": "123456"
}
```

**Response (Success):**

```json
{
  "allow": true,
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "verified_at": "2025-10-04T12:05:00.000Z",
  "method_used": "sms"
}
```

**Response (Failure):**

```json
{
  "allow": false,
  "error": "invalid_code",
  "attempts_remaining": 2
}
```

## MFA Decision Engine

The system employs intelligent risk-based rules to determine MFA requirements:

### Risk Factors

1. **Transaction Amount**

   - MFA required for amounts ≥ $100
   - High-risk threshold at $1,000

2. **Geographic Risk**

   - Foreign transactions (non-US)
   - High-risk countries: Nigeria (NG), Pakistan (PK), Iran (IR)

3. **Device Analysis**

   - New device detection
   - Device fingerprinting
   - User agent analysis

4. **Email Validation**

   - Temporary email provider detection
   - Domain reputation checking

5. **Historical Patterns**
   - User transaction history
   - Behavioral analysis
   - Frequency patterns

### MFA Methods Available

- **SMS**: Text message verification codes
- **Email**: Email-based verification
- **Duo Security**: Push notifications and phone calls
- **WebAuthn**: Future implementation for biometric authentication

## Authentication & Security

### Merchant API Keys

Default test credentials:

```
Merchant ID: demo_merchant
API Key: sk_test_demo_key_12345
```

### Security Features

- **API Key Validation**: Secure merchant authentication
- **Challenge Expiration**: 15-minute time limit for MFA challenges
- **Rate Limiting**: Built-in protection against abuse
- **Encrypted Storage**: Secure handling of sensitive data
- **Audit Logging**: Comprehensive transaction logging

## Project Structure

```
backend/
├── app.py                          # Main Flask application entry point
├── config.py                       # Configuration settings and constants
├── requirements.txt                # Python dependencies
├── test_database_queries.py        # Database testing and query demos
├── README.md                       # This documentation
│
├── routes/                         # HTTP route handlers
│   ├── auth_routes.py             # Authentication endpoints
│   └── root_routes.py             # Root and utility endpoints
│
├── services/                       # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py            # MFA challenge management
│   ├── auth2_duo.py               # Duo Security integration
│   ├── cleanup_service.py         # Challenge cleanup utilities
│   ├── database.py                # MongoDB database operations
│   ├── email_service.py           # Email notification service
│   ├── health_service.py          # System health monitoring
│   └── validation_service.py      # Input validation and MFA rules
│
└── tests/                          # Comprehensive test suite
    ├── test_auth_duo.py           # Duo Security tests
    ├── test_auth_methods.py       # MFA method tests
    ├── test_auth_service.py       # Authentication service tests
    ├── test_cleanup_service.py    # Cleanup service tests
    ├── test_database.py           # Database operation tests
    ├── test_health_service.py     # Health check tests
    └── test_validation_service.py # Validation logic tests
```

## Testing

### Running Tests

Execute the complete test suite:

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_auth_service.py

# Run with verbose output
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=services
```

### Database Testing

Test database operations and view current records:

```bash
python3 test_database_queries.py
```

This script will:

- Test database connectivity
- Display all merchants, users, and cards
- Demonstrate query operations
- Test CRUD operations

### Manual API Testing

Use curl or Postman to test endpoints:

```bash
# Health check
curl -X GET http://127.0.0.1:5001/authpay/health

# Initialize MFA challenge
curl -X POST http://127.0.0.1:5001/authpay/init \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "demo_merchant",
    "api_key": "sk_test_demo_key_12345",
    "amount": 150.0,
    "currency": "USD",
    "email": "test@example.com"
  }'
```

## Database Schema

### Collections

#### Merchants

```javascript
{
  "merchant_id": "demo_merchant",
  "api_key": "sk_test_demo_key_12345",
  "currency": "USD",
  "email": "merchant@example.com"
}
```

#### Users

```javascript
{
  "username": "user123",
  "email": "user@example.com",
  "card_info": {
    "last_four": "1234",
    "brand": "visa"
  },
  "previous_purchases": [...],
  "created_at": "2025-10-04T12:00:00.000Z"
}
```

#### Cards

```javascript
{
  "card_id": "card_uuid",
  "user_id": "user_uuid",
  "last_four": "1234",
  "brand": "visa",
  "is_active": true
}
```

## Service Integration

### Email Service

Automated email notifications for:

- Transaction success confirmations
- Fraud alerts and suspicious activity
- MFA requirement notifications

### Duo Security Integration

Enterprise-grade MFA with:

- Push notifications
- Phone call verification
- SMS backup options
- Admin dashboard integration

### Database Service

MongoDB integration providing:

- Merchant management
- User profile storage
- Transaction history
- Real-time analytics

## Development Guide

### Adding New MFA Rules

Extend the risk assessment logic in `services/validation_service.py`:

```python
def should_require_mfa(amount, currency, geo, device_info, email):
    # Add your custom rule here
    if custom_risk_condition(amount, geo, device_info):
        return True, "custom_risk_reason"

    # Existing rules continue...
    return False, None

def custom_risk_condition(amount, geo, device_info):
    # Implement your risk logic
    return False
```

### Adding New MFA Methods

1. Create method handler in `services/auth_service.py`
2. Add method configuration in `config.py`
3. Implement verification logic
4. Add corresponding tests

Example:

```python
def send_biometric_mfa(challenge_id, user_data):
    # Implementation for biometric MFA
    pass

def verify_biometric_response(challenge_id, biometric_data):
    # Verification logic
    pass
```

### Adding New API Endpoints

1. Create route in appropriate blueprint (`routes/auth_routes.py`)
2. Implement service logic in `services/`
3. Add validation and error handling
4. Write comprehensive tests

```python
# In routes/auth_routes.py
@auth_routes.route('/authpay/new-endpoint', methods=['POST'])
def new_endpoint():
    return new_endpoint_service(request)

# In services/new_service.py
def new_endpoint_service(request):
    try:
        data = request.get_json()
        # Business logic here
        return jsonify({"result": "success"}), 200
    except Exception as e:
        logger.error(f"Error in new endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
```

### Configuration Management

Key configuration parameters in `config.py`:

- `MERCHANT_API_KEYS`: Merchant authentication
- `CHALLENGE_EXPIRY_MINUTES`: Challenge timeout
- `AMOUNT_THRESHOLD`: Risk thresholds
- `HIGH_RISK_COUNTRIES`: Geographic risk list
- `SUPPORTED_CURRENCIES`: Accepted currencies

## Deployment

### Production Considerations

1. **Environment Variables**: Use production MongoDB URI
2. **Security**: Enable HTTPS, secure API keys
3. **Monitoring**: Set up logging and health checks
4. **Scaling**: Configure load balancing
5. **Backup**: Database backup strategy

### Docker Deployment

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python3", "app.py"]
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check `MONGODB_URI` in `.env`
   - Verify network connectivity
   - Ensure proper authentication

2. **API Key Validation Errors**

   - Verify merchant credentials
   - Check API key format
   - Review logs for details

3. **MFA Method Failures**
   - Check service integrations (Duo, Email)
   - Verify configuration parameters
   - Test connectivity

### Logs and Debugging

Enable debug mode:

```python
# In app.py
app.run(host="127.0.0.1", port=5001, debug=True)
```

Check logs for detailed error information and request tracking.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`pytest tests/`)
5. Update documentation as needed
6. Submit a pull request

## License

This project is currently in development and not yet licensed for production use.

For educational and development purposes only.

---

For technical support or questions, please refer to the test files and inline documentation for detailed usage examples.
