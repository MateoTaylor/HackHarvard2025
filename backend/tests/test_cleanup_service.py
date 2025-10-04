import pytest
from datetime import datetime, timedelta
from services.cleanup_service import cleanup_expired_challenges
from app import active_challenges

@pytest.fixture
def setup_challenges():
    active_challenges.clear()
    active_challenges["expired"] = {
        "challenge_id": "expired",
        "expires_at": datetime.now() - timedelta(minutes=1)
    }
    active_challenges["valid"] = {
        "challenge_id": "valid",
        "expires_at": datetime.now() + timedelta(minutes=10)
    }

def test_cleanup_expired_challenges(setup_challenges):
    cleanup_expired_challenges()
    assert "expired" not in active_challenges
    assert "valid" in active_challenges
