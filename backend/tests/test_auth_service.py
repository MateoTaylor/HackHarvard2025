import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock
from services.auth_service import initialize_challenge_service, verify_challenge_service
from app import active_challenges, CHALLENGE_EXPIRY_MINUTES, app  # Import the Flask app

@pytest.fixture
def mock_request():
    class MockRequest:
        def __init__(self, json_data):
            self.json_data = json_data

        def get_json(self):
            return self.json_data

    return MockRequest

def test_initialize_challenge_service(mock_request):
    with app.app_context():  # Set up the application context
        request = mock_request({
            "merchant_id": "demo_merchant",
            "api_key": "sk_test_demo_key_12345",
            "amount": 50.0,
            "currency": "USD",
            "email": "test@example.com",
            "geo": "US",
            "device": {"user_agent": "test-browser"}
        })

        response, status_code = initialize_challenge_service(request)
        assert status_code == 200
        assert "challenge_id" in response.json

def test_verify_challenge_service(mock_request):
    with app.app_context():  # Set up the application context
        challenge_id = "test-challenge-id"
        active_challenges[challenge_id] = {
            "challenge_id": challenge_id,
            "expires_at": datetime.now() + timedelta(minutes=CHALLENGE_EXPIRY_MINUTES),
            "verified": False,
            "mfa_required": False
        }

        request = mock_request({"challenge_id": challenge_id})
        response, status_code = verify_challenge_service(request)
        assert status_code == 200
        assert response.json["allow"] is True
