import unittest
from services.auth_duo import DuoAuthService

class TestDuoAuthService(unittest.TestCase):

    def setUp(self):
        self.duo_service = DuoAuthService()

    def test_create_auth_url(self):
        # Create auth URL for a user
        result = self.duo_service.create_auth_url(
            username="sushmit",
            transaction_data={
                "amount": "150.00",
                "description": "Payment to Vendor ABC"
            }
        )

        self.assertIn('auth_url', result)
        self.assertIn('transaction_id', result)
        self.assertEqual(result['status'], 'pending')
        print("Auth URL:", result['auth_url'])
        print("Transaction ID:", result['transaction_id'])

    def test_get_transaction_status(self):
        # Create auth URL for a user
        result = self.duo_service.create_auth_url(
            username="sushmit",
            transaction_data={
                "amount": "150.00",
                "description": "Payment to Vendor ABC"
            }
        )

        # Simulate checking status
        status = self.duo_service.get_transaction_status(result['transaction_id'])
        self.assertIsNotNone(status)
        self.assertEqual(status['status'], 'pending')
        print("Status:", status)

if __name__ == "__main__":
    unittest.main()
