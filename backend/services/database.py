# Database service for managing user info and authentication

'''
Database models:

Merchant:
- merchant_id (str): Unique identifier for the merchant.
- api_key (str): API key for the merchant.
- currency (str): Default currency for the merchant.
- email (str): Contact email for the merchant.

User:
- user_id (str): Unique identifier for the user.
- email (str): User's email address.
- previous purchases (list): List of previous purchase records.

Purchase Record (last 6 months):
- purchase_id (str): Unique identifier for the purchase.
- merchant_id (str): ID of the merchant.
- amount (float): Transaction amount.
- currency (str): Currency code (e.g., 'USD').
- geo (dict): Geolocation data.
- device_info (dict): Device information.
- email (str): User's email address.
- timestamp_requested (datetime): Timestamp of the purchase.
- mfa_required (bool): Whether MFA was required.
- mfa_successful (bool): Whether MFA was successful.
- timestamp_approved (datetime): Timestamp when the purchase was approved.
- reason (str): Reason for approval/denial.

'''

import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

class Database:
    def __init__(self):
        # For Atlas, you need to set MONGODB_URI environment variable
        # Example: mongodb+srv://username:password@cluster.mongodb.net/database
        load_dotenv()  # This will look for .env in current directory and parent directories
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            print("Error: MONGODB_URI environment variable not set!")
            print("For Atlas: Set MONGODB_URI to your Atlas connection string")
            print("For local: Set MONGODB_URI to mongodb://localhost:27017")
            self.client = None
            self.db = None
            self.merchants = None
            self.users = None
            self.cards = None
            return
        
        try:
            self.client = MongoClient(
                mongo_uri,
                tls=True,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
            )
            
            # Test the connection
            self.client.admin.command("ping")
            print("MongoDB connection successful!")
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
            self.client = None
            self.db = None
            self.merchants = None
            self.users = None
            self.cards = None
            return
        self.db = self.client.authpay_db

        self.merchants = self.db.merchants
        self.users = self.db.users
        self.cards = self.db.cards

    def create_merchant(self, merchant_id, api_key, currency, email):
        """Create a new merchant record"""
        merchant = {
            "merchant_id": merchant_id,
            "api_key": api_key,
            "currency": currency,
            "email": email
        }
        self.merchants.insert_one(merchant)
        return merchant

    def get_merchant(self, merchant_id):
        """Retrieve a merchant by ID"""
        return self.merchants.find_one({"merchant_id": merchant_id})
    
    def create_user(self, username, email, card_info):
        """Create a new user record"""
        user = {
            "username": username,
            "email": email,
            "card_info": card_info,
            "previous_purchases": []
        }
        result = self.users.insert_one(user)
        return user
    
    def create_card(self, card_info, user_id):
        """Create a new card record"""
        card = {
            "card_info": card_info,
            "user_id": user_id
        }
        self.cards.insert_one(card)
        return card
    
    def get_user_via_card(self, card_info):
        """Retrieve a user by card info"""
        print("Looking up user for card:", card_info)
        print("Cards collection contents:", list(self.cards.find()))
        card = self.cards.find_one({"card_info": str(card_info)})
        if card:
            user_id = card["user_id"]
            return user_id
        return None
    
if __name__ == "__main__":
    db = Database()
    # Example usage
    merchant = db.create_merchant("merchant_123", "api_key_abc", "USD", "merchant@example.com")
    user = db.create_user("testuser", "testuser@gmail.com", "1234")
    card = db.create_card("1234", "testuser")