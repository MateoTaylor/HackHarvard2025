import pytest
from services.auth_methods import get_auth_method

def test_get_auth_method_webauthn():
    method = get_auth_method("webauthn")
    assert method is not None
    assert method["question"] == "Yes"
    assert method["answer"] == "Yes"

def test_get_auth_method_otp():
    method = get_auth_method("otp")
    assert method is not None
    assert method["question"] == "Authenticate using OTP."
    assert method["answer"] == "Please enter the One-Time Password sent to your device."

def test_get_auth_method_invalid():
    method = get_auth_method("invalid")
    assert method is None
