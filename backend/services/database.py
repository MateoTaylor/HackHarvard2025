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
- phone (str): User's phone number.
- registered_devices (list): List of registered devices for MFA.
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

from pymongo import MongoClient
