#!/usr/bin/env python3
"""
Database Testing and Query Demo Script

This script demonstrates how to query all current records in the database
and test various database functionalities.
"""

import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to sys.path to import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database import Database


def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*50}")
    print(f"{title}")
    print(f"{'='*50}")


def print_records(records, record_type):
    """Print records in a formatted way"""
    print(f"\n{record_type} ({len(records)} found):")
    print("-" * 40)
    
    if not records:
        print("No records found.")
        return
    
    for i, record in enumerate(records, 1):
        print(f"\n{i}. {record}")


def test_database_queries():
    """Test and demonstrate all database query functionality"""
    
    print("🗄️  Database Query Test Suite")
    print("=" * 60)
    
    # Initialize database
    try:
        db = Database()
        if not db.client:
            print("❌ Failed to connect to database. Please check MONGODB_URI.")
            return False
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
    
    # Test 1: Query all merchants
    print_section("1. ALL MERCHANTS")
    try:
        merchants = db.get_all_merchants()
        print_records(merchants, "Merchants")
    except Exception as e:
        print(f"❌ Error querying merchants: {e}")
    
    # Test 2: Query all users with geo/device info
    print_section("2. ALL USERS (with geo/device data)")
    try:
        users = db.get_all_users()
        print_records(users, "Users")
    except Exception as e:
        print(f"❌ Error querying users: {e}")
    
    # Test 3: Query all cards
    print_section("3. ALL CARDS")
    try:
        cards = db.get_all_cards()
        print_records(cards, "Cards")
    except Exception as e:
        print(f"❌ Error querying cards: {e}")
    
    # Test 4: Query all purchases
    print_section("4. ALL PURCHASES (with geo/device data)")
    try:
        purchases = db.get_all_purchases()
        print_records(purchases, "Purchases")
    except Exception as e:
        print(f"❌ Error querying purchases: {e}")
    
    # Test 5: Database statistics
    print_section("5. DATABASE STATISTICS")
    try:
        stats = db.get_database_stats()
        print("\nDatabase Collection Counts:")
        print("-" * 30)
        for key, value in stats.items():
            print(f"{key}: {value}")
    except Exception as e:
        print(f"❌ Error getting database stats: {e}")
    
    # Test 6: Query users by country
    print_section("6. USERS BY COUNTRY (US)")
    try:
        us_users = db.get_users_by_country("US")
        print_records(us_users, "US Users")
    except Exception as e:
        print(f"❌ Error querying users by country: {e}")
    
    # Test 7: Query purchases by date range (last 7 days)
    print_section("7. RECENT PURCHASES (last 7 days)")
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        recent_purchases = db.get_purchases_by_date_range(start_date, end_date)
        print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print_records(recent_purchases, "Recent Purchases")
    except Exception as e:
        print(f"❌ Error querying purchases by date: {e}")
    
    # Test 8: Query high amount purchases
    print_section("8. HIGH AMOUNT PURCHASES (>= $100)")
    try:
        high_purchases = db.get_high_amount_purchases(100)
        print_records(high_purchases, "High Amount Purchases")
    except Exception as e:
        print(f"❌ Error querying high amount purchases: {e}")
    
    # Test 9: Query MFA required purchases
    print_section("9. MFA REQUIRED PURCHASES")
    try:
        mfa_purchases = db.get_mfa_required_purchases()
        print_records(mfa_purchases, "MFA Required Purchases")
    except Exception as e:
        print(f"❌ Error querying MFA purchases: {e}")
    
    # Test 10: Test individual user lookup
    print_section("10. INDIVIDUAL USER LOOKUP")
    try:
        users = db.get_all_users()
        if users:
            test_username = users[0].get('username', 'testuser')
            user_detail = db.get_user_with_geo_device(test_username)
            print(f"\nDetailed info for user '{test_username}':")
            print("-" * 40)
            print(user_detail)
            
            # Get purchase history for this user
            purchase_history = db.get_user_purchase_history(test_username, limit=5)
            print(f"\nPurchase history for '{test_username}' (last 5):")
            print("-" * 40)
            print_records(purchase_history, "User Purchases")
    except Exception as e:
        print(f"❌ Error in individual user lookup: {e}")
    
    print_section("TEST COMPLETE")
    print("✅ Database query tests completed!")
    print("\nTo run unit tests, use: pytest tests/test_database.py -v")
    
    return True


def demo_data_creation():
    """Create some demo data for testing (optional)"""
    print_section("DEMO DATA CREATION")
    
    try:
        db = Database()
        if not db.client:
            print("❌ Cannot create demo data - database not connected")
            return
        
        print("Creating demo data...")
        
        # Create demo merchant
        merchant = db.create_merchant(
            "demo_merchant_test", 
            "sk_test_demo_key_test", 
            "USD", 
            "demo@test.com"
        )
        print("✅ Demo merchant created")
        
        # Create demo user with geo/device info
        demo_geo = {"ip": "203.0.113.10", "country": "US"}
        demo_device = {"ua": "Mozilla/5.0 Test Browser", "platform": "TestOS"}
        
        user = db.create_user(
            "demo_user_test",
            "demo@test.com", 
            "1234567890",
            demo_geo,
            demo_device
        )
        print("✅ Demo user created")
        
        # Create demo card
        card = db.create_card("1234567890", "demo_user_test")
        print("✅ Demo card created")
        
        # Create demo purchase record
        purchase = db.create_purchase_record(
            "demo_purchase_test",
            "demo_merchant_test",
            500.00,
            "USD",
            demo_geo,
            demo_device,
            "demo@test.com",
            "demo_user_test",
            True,
            "high_amount"
        )
        print("✅ Demo purchase record created")
        
        print("\n✅ Demo data creation completed!")
        print("You can now run the query tests to see the demo data.")
        
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")


def main():
    """Main function to run database tests"""
    print("Database Testing Suite")
    print("=====================")
    print()
    print("Choose an option:")
    print("1. Run query tests (view all current data)")
    print("2. Create demo data")
    print("3. Run both")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        test_database_queries()
    elif choice == "2":
        demo_data_creation()
    elif choice == "3":
        demo_data_creation()
        test_database_queries()
    elif choice == "4":
        print("Goodbye!")
    else:
        print("Invalid choice. Please run again.")


if __name__ == "__main__":
    main()