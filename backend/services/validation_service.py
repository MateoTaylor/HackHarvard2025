from config import MERCHANT_API_KEYS, AMOUNT_THRESHOLD, HIGH_RISK_COUNTRIES

def validate_merchant_api_key(merchant_id, api_key):
    """
    Validate the API key for a given merchant.

    Args:
        merchant_id (str): Unique identifier for the merchant.
        api_key (str): API key to validate.

    Returns:
        bool: True if the API key is valid for the merchant, False otherwise.

    Notes:
        - Compares the provided API key against stored keys in `MERCHANT_API_KEYS`.
    """
    return MERCHANT_API_KEYS.get(merchant_id) == api_key

def should_require_mfa(amount, currency, geo, device_info, email):
    """
    Determine if multi-factor authentication (MFA) is required based on transaction details.

    Args:
        amount (float): Transaction amount.
        currency (str): Currency code (e.g., 'USD').
        geo (Optional[str]): Geolocation of the transaction (e.g., country code).
        device_info (Optional[dict]): Information about the device used for the transaction.
        email (str): User's email address.

    Returns:
        tuple:
            - bool: True if MFA is required, False otherwise.
            - str: Reason for requiring MFA (or None if not required).

    Notes:
        - Applies rule-based logic to assess transaction risk.
        - Rules include high amounts, foreign transactions, high-risk locations,
          suspicious devices, and suspicious email domains.
        - Future extensions may include machine learning and advanced risk scoring.
    """
    # Rule 1: High amount transactions
    if amount >= AMOUNT_THRESHOLD["mfa_required"]:
        return True, "high_amount"

    # Rule 3: High-risk countries
    if geo and isinstance(geo, str) and geo.upper() in HIGH_RISK_COUNTRIES:
        return True, "high_risk_location"

    # Rule 2: Non-US transactions (example geographic rule)
    if geo and isinstance(geo, str) and geo.upper() != "US":
        return True, "foreign_transaction"

    # Rule 4: Suspicious device information (placeholder)
    if device_info and device_info.get("new_device", False):
        return True, "new_device"

    # Rule 5: Email domain check (example)
    if email and any(domain in email.lower() for domain in ["temp", "tempmail", "10minutemail"]):
        return True, "suspicious_email"

    return False, None
