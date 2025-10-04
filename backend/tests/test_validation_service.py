import pytest
from services.validation_service import validate_merchant_api_key, should_require_mfa
from app import MERCHANT_API_KEYS, AMOUNT_THRESHOLD, HIGH_RISK_COUNTRIES

@pytest.fixture
def setup_merchant_keys():
    MERCHANT_API_KEYS.clear()
    MERCHANT_API_KEYS["valid_merchant"] = "valid_key"

def test_validate_merchant_api_key(setup_merchant_keys):
    assert validate_merchant_api_key("valid_merchant", "valid_key") is True
    assert validate_merchant_api_key("invalid_merchant", "invalid_key") is False

def test_should_require_mfa():
    assert should_require_mfa(AMOUNT_THRESHOLD["mfa_required"] + 1, "USD", None, None, "test@example.com") == (True, "high_amount")
    assert should_require_mfa(50, "USD", "NG", None, "test@example.com") == (True, "high_risk_location")
    assert should_require_mfa(50, "USD", "US", {"new_device": True}, "test@example.com") == (True, "new_device")
    assert should_require_mfa(50, "USD", "US", None, "temp@mail.com") == (True, "suspicious_email")
    assert should_require_mfa(50, "USD", "US", None, "test@example.com") == (False, None)
