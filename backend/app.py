"""
Universal MFA Verification Layer for Online Payments

This Flask application provides a universal add-on MFA verification layer
that merchants can integrate with their payment systems to add an extra
layer of security for transactions.

Attributes:
    MERCHANT_API_KEYS (dict): In-memory storage for merchant API keys.
    active_challenges (dict): In-memory storage for active challenges.
    CHALLENGE_EXPIRY_MINUTES (int): Expiry time for challenges in minutes.
    MFA_AMOUNT_THRESHOLD (int): Threshold amount for requiring MFA.
    SUPPORTED_CURRENCIES (list): List of supported currencies.
    HIGH_RISK_COUNTRIES (list): List of high-risk countries.

Functions:
    cleanup_expired_challenges(): Removes expired challenges from memory.
    validate_merchant_api_key(merchant_id, api_key): Validates merchant API key.
    should_require_mfa(amount, currency, geo, device_info, email): Determines if MFA is required.
    health_check(): Health check endpoint.
    initialize_challenge(): Initializes an MFA challenge for a payment.
    verify_challenge(): Verifies an MFA challenge.
    webhook_handler(): Handles webhook events.

Returns:
    Flask App: The Flask application instance.

Future Extensions:
    - Database integration for persistent storage.
    - Real WebAuthn implementation.
    - Advanced fraud detection rules.
    - Merchant authentication with JWT.
    - Rate limiting and security enhancements.
"""

from flask import Flask
from flask_cors import CORS
from routes.root_routes import root_routes
from routes.auth_routes import auth_routes
from config import MERCHANT_API_KEYS, active_challenges, CHALLENGE_EXPIRY_MINUTES, SUPPORTED_CURRENCIES, AMOUNT_THRESHOLD, HIGH_RISK_COUNTRIES, logger

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register Blueprints
app.register_blueprint(root_routes) 
app.register_blueprint(auth_routes)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)