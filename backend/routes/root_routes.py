from flask import Blueprint, jsonify, request

# Create a new Blueprint for the root route
root_routes = Blueprint('root_routes', __name__)

@root_routes.route('/', methods=['GET'])
def mfa_verification_page():
    """
    Root route to display MFA verification information.

    Returns:
        flask.Response: JSON response with MFA verification details.
    """
    return jsonify({
        "message": "Welcome to the MFA Verification Page",
        "instructions": "Please follow the instructions sent to your device to complete verification."
    }), 200
