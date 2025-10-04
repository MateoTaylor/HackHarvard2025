from datetime import datetime, timedelta
import uuid
from flask import jsonify
from services.validation_service import validate_merchant_api_key, should_require_mfa
from config import active_challenges, CHALLENGE_EXPIRY_MINUTES, SUPPORTED_CURRENCIES, logger
from config import DEFAULT_MERCHANT_ID, DEFAULT_API_KEY, DEFAULT_CURRENCY, DEFAULT_EMAIL, AMOUNT_THRESHOLD
from services.auth2_duo import DuoAuthAPIService
from services.database import Database

from services.email_service import (
    send_transaction_success_email,
    send_fraud_alert_email,
    send_mfa_required_email
)


def initialize_challenge_service(request):
    """
    Initialize a challenge for multi-factor authentication (MFA).

    Args:
        request (flask.Request): The HTTP request object containing JSON payload with the following fields:
            - merchant_id (str): Unique identifier for the merchant.
            - api_key (str): API key for authentication.
            - amount (float): Transaction amount.
            - currency (str): Currency code (e.g., 'USD').
            - email (str): User's email address.
            - geo (Optional[dict]): Geolocation data (optional).
            - device (Optional[dict]): Device information (optional).

    Returns:
        flask.Response: JSON response containing the challenge ID, MFA requirement status, and expiration time.

    Notes:
        - Validates the merchant API key and currency.
        - Determines if MFA is required based on transaction details.
        - Generates and stores a challenge with expiration.
        - Logs the initialization process and any errors encountered.
    """
    try:
        data = request.get_json()

        # Fill in default values for missing fields
        data['merchant_id'] = data.get('merchant_id', DEFAULT_MERCHANT_ID)
        data['api_key'] = data.get('api_key', DEFAULT_API_KEY)
        data['currency'] = data.get('currency', DEFAULT_CURRENCY)
        data['email'] = data.get('email', DEFAULT_EMAIL)

        # Validate required fields
        required_fields = ['merchant_id', 'api_key', 'amount', 'currency', 'email']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return jsonify({
                "error": "Missing required fields",
                "missing_fields": missing_fields
            }), 400

        # Validate merchant API key
        if not validate_merchant_api_key(data['merchant_id'], data['api_key']):
            logger.warning(f"Invalid API key for merchant: {data['merchant_id']}")
            return jsonify({"error": "Invalid merchant credentials"}), 401

        # Validate currency
        currency = data.get('currency')
        if not isinstance(currency, str):
            return jsonify({"error": "Invalid currency format"}), 400
        currency = currency.upper()
        if currency not in SUPPORTED_CURRENCIES:
            return jsonify({
                "error": "Unsupported currency",
                "supported_currencies": SUPPORTED_CURRENCIES
            }), 400

        # Check if the amount is too high
        if float(data['amount']) > AMOUNT_THRESHOLD["high_amount"]:
            return jsonify({
                "error": "Amount exceeds the allowed threshold",
                "threshold": AMOUNT_THRESHOLD["high_amount"]
            }), 400

        # Determine if MFA is required
        mfa_required, reason = should_require_mfa(
            amount=float(data['amount']),
            currency=currency,
            geo=data.get('geo'),
            device_info=data.get('device', {}),
            email=data['email']
        )

        # Generate challenge ID
        challenge_id = str(uuid.uuid4())

        # Store challenge information
        challenge_info = {
            "challenge_id": challenge_id,
            "merchant_id": data['merchant_id'],
            "amount": float(data['amount']),
            "currency": currency,
            "geo": data.get('geo'),
            "email": data['email'],
            "device": data.get('device', {}),
            "mfa_required": mfa_required,
            "reason": reason,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=CHALLENGE_EXPIRY_MINUTES),
            "verified": False
        }

        active_challenges[challenge_id] = challenge_info
        
        # Send email notifications
        if mfa_required:
            # Send MFA required notification
            send_mfa_required_email(data['email'], challenge_info)
           
            # If it's a high-risk reason, also send fraud alert
            if reason in ["high_risk_location", "suspicious_email", "new_device"]:
                send_fraud_alert_email(data['email'], challenge_info, reason)

        # Prepare response
        response = {
            "challenge_id": challenge_id,
            "mfa_required": mfa_required,
            "expires_in_seconds": CHALLENGE_EXPIRY_MINUTES * 60
        }
        if mfa_required:
            # first try to access the card in the database to see if MFA exists for it
            db = Database()
            if data.get('cardNumber'):
                username = db.get_user_via_card(data.get('cardNumber'))
                if username:
                    print("Found user for card:", username)
                    DuoAuth = DuoAuthAPIService()
                    response["reason"] = reason
                    response["auth_method"] = DuoAuth.preauth(username)
                else:
                    response["reason"] = "Card not attached to a user"
                    response["auth_method"] = None
            else:
                response["reason"] = "No card information provided"

        print("response:", response)
        print("Initialized challenge:", challenge_info)  # Debug print
        return jsonify(response), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid amount format: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error initializing challenge: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def verify_challenge_service(request):
    """
    Verify a challenge for multi-factor authentication (MFA).

    Args:
        request (flask.Request): The HTTP request object containing JSON payload with the following fields:
            - challenge_id (str): Unique identifier for the challenge.
            - proof (Optional[str]): Proof of verification (optional).

    Returns:
        flask.Response: JSON response indicating whether the challenge was successfully verified.

    Notes:
        - Checks if the challenge exists and is not expired.
        - Ensures the challenge has not already been verified.
        - Mock verification logic is used for now (always approves if proof is provided).
        - Logs the verification process and any errors encountered.
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('challenge_id'):
            return jsonify({"error": "Missing challenge_id"}), 400

        challenge_id = data['challenge_id']

        # Check if challenge exists
        if challenge_id not in active_challenges:
            return jsonify({
                "allow": False,
                "reason": "Invalid or expired challenge_id"
            }), 404

        challenge = active_challenges[challenge_id]

        # Check if challenge has expired
        if challenge['expires_at'] < datetime.now():
            del active_challenges[challenge_id]
            return jsonify({
                "allow": False,
                "reason": "Challenge expired"
            }), 410

        # Check if challenge was already verified
        if challenge['verified']:
            return jsonify({
                "allow": False,
                "reason": "Challenge already verified"
            }), 409

        # Mock verification logic - always approve for now
        # Future: Implement real WebAuthn verification
        proof = data.get('proof')

        if not challenge['mfa_required']:
            # No MFA required, auto-approve
            verification_result = True
        else:
            # For now, mock verification - always approve if proof is provided
            verification_result = bool(proof)

        # Update challenge status
        challenge['verified'] = True
        challenge['verified_at'] = datetime.now()

        if verification_result:
            logger.info(f"Challenge verified successfully: {challenge_id}")
            # Send success email after verification
            send_transaction_success_email(challenge['email'], challenge)
            return jsonify({
                "allow": True,
                "challenge_id": challenge_id,
                "verified_at": challenge['verified_at'].isoformat()
            }), 200
        else:
            logger.warning(f"Challenge verification failed: {challenge_id}")
            return jsonify({
                "allow": False,
                "reason": "Invalid proof provided"
            }), 400

    except Exception as e:
        logger.error(f"Error verifying challenge: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


def send_mfa_request_service(request):
    """
    Send MFA request using the selected method and username.
    
    Args:
        request (flask.Request): The HTTP request object containing JSON payload with:
            - method (str): The MFA method selected (e.g., 'push', 'sms', 'phone')
            - username (str): The username to send MFA request to
            
    Returns:
        flask.Response: JSON response containing the Duo auth result
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['method', 'username']
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        method = data['method']
        username = data['username']
        
        logger.info(f"Sending MFA request - Method: {method}, Username: {username}")
        
        # Initialize Duo Auth API service
        duo_service = DuoAuthAPIService()
        
        # Send auth request using Duo
        auth_response = duo_service.send_auth_request(username=username, factor=method)
        
        logger.info(f"Duo auth response: {auth_response}")
        
        return jsonify({
            "success": True,
            "method": method,
            "username": username,
            "duo_response": auth_response
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending MFA request: {str(e)}")
        return jsonify({"error": f"Failed to send MFA request: {str(e)}"}), 500
