# Configuration and constants

# In-memory storage for merchant API keys
MERCHANT_API_KEYS = {
    "demo_merchant": "sk_test_demo_key_12345"
}

# In-memory storage for active challenges
active_challenges = {}

# Constants
CHALLENGE_EXPIRY_MINUTES = 15
SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP"]
HIGH_RISK_COUNTRIES = ["NG", "PK", "IR"]

# Default values for missing fields in requests
DEFAULT_MERCHANT_ID = "demo_merchant"
DEFAULT_API_KEY = "sk_test_demo_key_12345"
DEFAULT_CURRENCY = "USD"
DEFAULT_EMAIL = "user@example.com"

# Thresholds
AMOUNT_THRESHOLD = {
    "mfa_required": 100,  # Amount above which MFA is required
    "high_amount": 1000  # Amount above which transactions are considered too high
}

# Logger setup
import logging
logger = logging.getLogger("mfa_service")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
