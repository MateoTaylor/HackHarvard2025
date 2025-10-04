from flask import Blueprint, jsonify, request
from services.auth_service import initialize_challenge_service, verify_challenge_service
from services.health_service import health_check_service

# Define Blueprint for auth routes
auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/authpay/health', methods=['GET'])
def health_check():
    return health_check_service()

@auth_routes.route('/authpay/init', methods=['POST'])
def initialize_challenge():
    return initialize_challenge_service(request)

@auth_routes.route('/authpay/verify', methods=['POST'])
def verify_challenge():
    return verify_challenge_service(request)
