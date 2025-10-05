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
    
    def create_user(self, username, email, card_info, geo=None, device_info=None):
        """Create a new user record"""
        from datetime import datetime
        user = {
            "username": username,
            "email": email,
            "card_info": card_info,
            "previous_purchases": [],
            "created_at": datetime.now(),
            "last_seen": datetime.now(),
            "last_geo": geo or {},
            "last_device": device_info or {}
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
        card = self.cards.find_one({"card_info": str(card_info)})
        if card:
            user_id = card["user_id"]
            return user_id
        return None
    
    def create_purchase_record(self, purchase_id, merchant_id, amount, currency, geo, device_info, email, username, mfa_required=False, reason=None):
        """Create a new purchase record"""
        from datetime import datetime
        purchase = {
            "purchase_id": purchase_id,
            "merchant_id": merchant_id,
            "amount": float(amount),
            "currency": currency,
            "geo": geo or {},
            "device_info": device_info or {},
            "email": email,
            "username": username,
            "timestamp_requested": datetime.now(),
            "mfa_required": mfa_required,
            "mfa_successful": None,  # Will be updated later
            "timestamp_approved": None,  # Will be updated later
            "reason": reason
        }
        
        # Create purchases collection if it doesn't exist
        if not hasattr(self, 'purchases'):
            self.purchases = self.db.purchases
        
        self.purchases.insert_one(purchase)
        return purchase
    
    def update_user_last_seen(self, username, geo, device_info):
        """Update user's last seen information with geo and device data"""
        from datetime import datetime
        update_data = {
            "last_seen": datetime.now(),
            "last_geo": geo or {},
            "last_device": device_info or {}
        }
        self.users.update_one(
            {"username": username}, 
            {"$set": update_data}
        )
    
    def get_user_purchase_history(self, username, limit=10):
        """Get purchase history for a user including geo and device info"""
        if not hasattr(self, 'purchases'):
            self.purchases = self.db.purchases
        
        return list(self.purchases.find(
            {"username": username}
        ).sort("timestamp_requested", -1).limit(limit))
    
    def get_user_with_geo_device(self, username):
        """Get user information including last geo and device data"""
        return self.users.find_one({"username": username})
    
    def delete_card(self, card_info):
        """Delete a card record by card info"""
        result = self.cards.delete_one({"card_info": str(card_info)})
        return result.deleted_count > 0

    def delete_user(self, username):
        """Delete a user record by username"""
        result = self.users.delete_one({"username": str(username)})
        return result.deleted_count > 0

    
if __name__ == "__main__":
    db = Database()
    # Example usage
    # merchant = db.create_merchant("merchant_123", "api_key_abc", "USD", "merchant@example.com")
    # user = db.create_user("testuser", "testuser@gmail.com", "1234")
    # card = db.create_card("1234", "testuser")
    
    # To delete a card, you can add this method to the Database class:
    
    # Example usage:
    # db.delete_card("1234")  # This would delete the card with card_info "1234"

    # jorge_user = db.create_user("sushmituser", "sushmituser@gmail.com", "1111")
    # jorge_card = db.create_card("5555555555554444", "testuser")
    # Print all cards in the database
    # delete_success = db.delete_card("5555555555554444")
    # print(f"Card deletion successful: {delete_success}")
    print("All cards in database:")
    for card in db.cards.find():
        print(card)