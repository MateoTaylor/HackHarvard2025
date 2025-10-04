import pytest
from unittest.mock import patch
from services.health_service import health_check_service
from app import active_challenges, app  # Import the Flask app

def test_health_check_service():
    with app.app_context():  # Set up the application context
        with patch("services.cleanup_service.cleanup_expired_challenges") as mock_cleanup:
            mock_cleanup.return_value = None
            response = health_check_service()
            assert response.json["status"] == "ok"
            assert "timestamp" in response.json
            assert "active_challenges" in response.json
