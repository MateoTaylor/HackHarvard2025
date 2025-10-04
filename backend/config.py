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
MFA_AMOUNT_THRESHOLD = 100  # Amount above which MFA is required
HIGH_RISK_COUNTRIES = ["NG", "PK", "IR"]

# Logger setup
import logging
logger = logging.getLogger("mfa_service")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
