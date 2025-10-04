# Universal MFA Verification Layer

A Flask-based universal add-on MFA verification layer for online payments that merchants can integrate to add extra security to their payment flows.

## Features

- **Universal Integration**: Works with any payment system through simple HTTP API
- **Rule-based MFA**: Intelligent decision making based on amount, location, device, etc.
- **WebAuthn Ready**: Prepared for WebAuthn implementation (currently mocked)
- **Merchant Authentication**: API key validation for merchants
- **Webhook Support**: Event handling for payment notifications
- **CORS Enabled**: Ready for web integration

## Quick Start

### 1. Setup Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 3. Test the API

In another terminal (with the virtual environment activated):

```bash
python test_api.py
```

## API Endpoints

### 1. Health Check

```http
GET /authpay/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-04T...",
  "active_challenges": 0
}
```

### 2. Initialize MFA Challenge

```http
POST /authpay/init
```

Request:

```json
{
  "merchant_id": "demo_merchant",
  "api_key": "sk_test_demo_key_12345",
  "amount": 150.0,
  "currency": "USD",
  "geo": "CA",
  "device": { "user_agent": "...", "new_device": false },
  "email": "user@example.com"
}
```

Response:

```json
{
  "challenge_id": "uuid-string",
  "mfa_required": true,
  "method": "webauthn",
  "reason": "high_amount",
  "expires_in_seconds": 600
}
```

### 3. Verify Challenge

```http
POST /authpay/verify
```

Request:

```json
{
  "challenge_id": "uuid-string",
  "proof": "webauthn-assertion-data"
}
```

Response:

```json
{
  "allow": true,
  "challenge_id": "uuid-string",
  "verified_at": "2025-10-04T..."
}
```

### 4. Webhook

```http
POST /authpay/webhook
```

Accepts any JSON payload and logs it for processing.

## MFA Rules

The system uses rule-based logic to determine when MFA is required:

1. **High Amount**: Transactions ≥ $100
2. **Foreign Transactions**: Non-US locations
3. **High-risk Countries**: Configurable list
4. **New Devices**: First-time device usage
5. **Suspicious Emails**: Temporary email providers

## Test Merchant Credentials

```
Merchant ID: demo_merchant
API Key: sk_test_demo_key_12345

Merchant ID: merchant_123
API Key: sk_test_merchant123_api_key

Merchant ID: merchant_456
API Key: sk_test_merchant456_api_key
```

## Project Structure

```
backend/
├── app.py              # Main Flask application
├── test_api.py         # API test suite
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Future Extensions

### Database Integration

- Replace in-memory storage with PostgreSQL/MongoDB
- Add proper merchant management
- Persistent challenge storage with TTL

### Real WebAuthn

- Implement FIDO2/WebAuthn server
- Device registration and management
- Biometric authentication support

### Advanced Security

- JWT-based merchant authentication
- Rate limiting and DDoS protection
- Encrypted challenge storage
- Audit logging

### Machine Learning

- Fraud detection algorithms
- Behavioral analysis
- Risk scoring models
- Adaptive MFA thresholds

### Scaling

- Redis for session storage
- Load balancing support
- Monitoring and metrics
- Docker containerization

## Development

### Adding New MFA Rules

Edit the `should_require_mfa()` function in `app.py`:

```python
def should_require_mfa(amount, currency, geo, device_info, email):
    # Add your custom rule here
    if your_condition:
        return True, "your_reason"

    # Existing rules...
    return False, None
```

### Adding New Endpoints

Follow the Flask pattern:

```python
@app.route('/authpay/your-endpoint', methods=['POST'])
def your_endpoint():
    try:
        data = request.get_json()
        # Your logic here
        return jsonify({"result": "success"}), 200
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details
