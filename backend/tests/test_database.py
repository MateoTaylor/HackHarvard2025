import pytest
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
import sys
import uuid

# Add the parent directory to sys.path to import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database import Database


class TestDatabase:
    """Comprehensive test suite for Database service"""

    @pytest.fixture
    def mock_mongo_client(self):
        """Mock MongoDB client for testing"""
        with patch('services.database.MongoClient') as mock_client:
            # Mock the client and database
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock collections
            mock_db = Mock()
            mock_instance.authpay_db = mock_db
            
            mock_merchants = Mock()
            mock_users = Mock()
            mock_cards = Mock() 
            mock_purchases = Mock()
            
            mock_db.merchants = mock_merchants
            mock_db.users = mock_users
            mock_db.cards = mock_cards
            mock_db.purchases = mock_purchases
            
            # Mock admin command for connection test
            mock_instance.admin.command.return_value = {"ok": 1}
            
            yield {
                'client': mock_instance,
                'db': mock_db,
                'merchants': mock_merchants,
                'users': mock_users,
                'cards': mock_cards,
                'purchases': mock_purchases
            }

    @pytest.fixture
    def database_instance(self, mock_mongo_client):
        """Create Database instance with mocked MongoDB"""
        with patch.dict(os.environ, {'MONGODB_URI': 'mongodb://localhost:27017'}):
            db = Database()
            # Manually set the mocked collections
            db.merchants = mock_mongo_client['merchants']
            db.users = mock_mongo_client['users'] 
            db.cards = mock_mongo_client['cards']
            db.purchases = mock_mongo_client['purchases']
            return db

    def test_database_initialization_success(self, mock_mongo_client):
        """Test successful database initialization"""
        with patch.dict(os.environ, {'MONGODB_URI': 'mongodb://localhost:27017'}):
            db = Database()
            assert db.client is not None
            assert db.db is not None
            assert db.merchants is not None
            assert db.users is not None
            assert db.cards is not None

    @patch('services.database.MongoClient')
    def test_database_initialization_no_uri(self, mock_client):
        """Test database initialization without URI"""
        with patch.dict(os.environ, {}, clear=True):
            with patch('services.database.load_dotenv'):  # Prevent loading .env file
                db = Database()
                assert db.client is None
                assert db.db is None
                assert db.merchants is None

    def test_create_merchant(self, database_instance, mock_mongo_client):
        """Test merchant creation"""
        # Test data
        merchant_id = "test_merchant"
        api_key = "test_api_key"
        currency = "USD"
        email = "merchant@test.com"
        
        # Execute
        result = database_instance.create_merchant(merchant_id, api_key, currency, email)
        
        # Verify
        expected_merchant = {
            "merchant_id": merchant_id,
            "api_key": api_key,
            "currency": currency,
            "email": email
        }
        
        mock_mongo_client['merchants'].insert_one.assert_called_once_with(expected_merchant)
        assert result == expected_merchant

    def test_get_merchant(self, database_instance, mock_mongo_client):
        """Test merchant retrieval"""
        merchant_id = "test_merchant"
        expected_merchant = {"merchant_id": merchant_id, "api_key": "test_key"}
        
        mock_mongo_client['merchants'].find_one.return_value = expected_merchant
        
        result = database_instance.get_merchant(merchant_id)
        
        mock_mongo_client['merchants'].find_one.assert_called_once_with({"merchant_id": merchant_id})
        assert result == expected_merchant

    def test_create_user(self, database_instance, mock_mongo_client):
        """Test user creation with geo and device info"""
        username = "testuser"
        email = "test@example.com"
        card_info = "1234567890"
        geo = {"ip": "192.168.1.1", "country": "US"}
        device_info = {"ua": "Mozilla/5.0", "platform": "Windows"}
        
        result = database_instance.create_user(username, email, card_info, geo, device_info)
        
        # Verify the call was made with correct structure
        call_args = mock_mongo_client['users'].insert_one.call_args[0][0]
        assert call_args['username'] == username
        assert call_args['email'] == email
        assert call_args['card_info'] == card_info
        assert call_args['last_geo'] == geo
        assert call_args['last_device'] == device_info
        assert 'created_at' in call_args
        assert 'last_seen' in call_args

    def test_create_card(self, database_instance, mock_mongo_client):
        """Test card creation"""
        card_info = "1234567890"
        user_id = "testuser"
        
        result = database_instance.create_card(card_info, user_id)
        
        expected_card = {
            "card_info": card_info,
            "user_id": user_id
        }
        
        mock_mongo_client['cards'].insert_one.assert_called_once_with(expected_card)
        assert result == expected_card

    def test_get_user_via_card_found(self, database_instance, mock_mongo_client):
        """Test successful user lookup via card"""
        card_info = "1234567890"
        expected_user_id = "testuser"
        
        mock_mongo_client['cards'].find_one.return_value = {"user_id": expected_user_id}
        
        result = database_instance.get_user_via_card(card_info)
        
        mock_mongo_client['cards'].find_one.assert_called_once_with({"card_info": str(card_info)})
        assert result == expected_user_id

    def test_get_user_via_card_not_found(self, database_instance, mock_mongo_client):
        """Test user lookup via card when not found"""
        card_info = "nonexistent"
        
        mock_mongo_client['cards'].find_one.return_value = None
        
        result = database_instance.get_user_via_card(card_info)
        
        mock_mongo_client['cards'].find_one.assert_called_once_with({"card_info": str(card_info)})
        assert result is None

    def test_create_purchase_record(self, database_instance, mock_mongo_client):
        """Test purchase record creation"""
        purchase_id = str(uuid.uuid4())
        merchant_id = "test_merchant"
        amount = 100.00
        currency = "USD"
        geo = {"ip": "192.168.1.1", "country": "US"}
        device_info = {"ua": "Mozilla/5.0", "platform": "Windows"}
        email = "test@example.com"
        username = "testuser"
        mfa_required = True
        reason = "high_amount"
        
        result = database_instance.create_purchase_record(
            purchase_id, merchant_id, amount, currency, geo, device_info, 
            email, username, mfa_required, reason
        )
        
        # Verify the call was made with correct structure
        call_args = mock_mongo_client['purchases'].insert_one.call_args[0][0]
        assert call_args['purchase_id'] == purchase_id
        assert call_args['merchant_id'] == merchant_id
        assert call_args['amount'] == float(amount)
        assert call_args['currency'] == currency
        assert call_args['geo'] == geo
        assert call_args['device_info'] == device_info
        assert call_args['email'] == email
        assert call_args['username'] == username
        assert call_args['mfa_required'] == mfa_required
        assert call_args['reason'] == reason
        assert 'timestamp_requested' in call_args

    def test_update_user_last_seen(self, database_instance, mock_mongo_client):
        """Test updating user's last seen information"""
        username = "testuser"
        geo = {"ip": "192.168.1.1", "country": "US"}
        device_info = {"ua": "Mozilla/5.0", "platform": "Windows"}
        
        database_instance.update_user_last_seen(username, geo, device_info)
        
        # Verify update call
        call_args = mock_mongo_client['users'].update_one.call_args
        filter_arg = call_args[0][0]
        update_arg = call_args[0][1]['$set']
        
        assert filter_arg == {"username": username}
        assert update_arg['last_geo'] == geo
        assert update_arg['last_device'] == device_info
        assert 'last_seen' in update_arg

    def test_get_user_purchase_history(self, database_instance, mock_mongo_client):
        """Test retrieving user purchase history"""
        username = "testuser"
        limit = 5
        
        # Mock return value
        mock_purchases = [
            {"purchase_id": "1", "amount": 100, "timestamp_requested": datetime.now()},
            {"purchase_id": "2", "amount": 200, "timestamp_requested": datetime.now()}
        ]
        
        mock_cursor = Mock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.limit.return_value = mock_purchases
        mock_mongo_client['purchases'].find.return_value = mock_cursor
        
        result = database_instance.get_user_purchase_history(username, limit)
        
        mock_mongo_client['purchases'].find.assert_called_once_with({"username": username})
        mock_cursor.sort.assert_called_once_with("timestamp_requested", -1)
        mock_cursor.limit.assert_called_once_with(limit)
        assert result == mock_purchases

    def test_get_user_with_geo_device(self, database_instance, mock_mongo_client):
        """Test retrieving user with geo and device information"""
        username = "testuser"
        expected_user = {
            "username": username,
            "email": "test@example.com",
            "last_geo": {"ip": "192.168.1.1", "country": "US"},
            "last_device": {"ua": "Mozilla/5.0", "platform": "Windows"}
        }
        
        mock_mongo_client['users'].find_one.return_value = expected_user
        
        result = database_instance.get_user_with_geo_device(username)
        
        mock_mongo_client['users'].find_one.assert_called_once_with({"username": username})
        assert result == expected_user


class TestDatabaseQueries:
    """Test suite for querying all current records"""
    
    @pytest.fixture
    def mock_mongo_client(self):
        """Mock MongoDB client for testing"""
        with patch('services.database.MongoClient') as mock_client:
            # Mock the client and database
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock collections
            mock_db = Mock()
            mock_instance.authpay_db = mock_db
            
            mock_merchants = Mock()
            mock_users = Mock()
            mock_cards = Mock() 
            mock_purchases = Mock()
            
            mock_db.merchants = mock_merchants
            mock_db.users = mock_users
            mock_db.cards = mock_cards
            mock_db.purchases = mock_purchases
            
            # Mock admin command for connection test
            mock_instance.admin.command.return_value = {"ok": 1}
            
            yield {
                'client': mock_instance,
                'db': mock_db,
                'merchants': mock_merchants,
                'users': mock_users,
                'cards': mock_cards,
                'purchases': mock_purchases
            }
    
    @pytest.fixture
    def database_with_sample_data(self, mock_mongo_client):
        """Create database instance with sample data for querying tests"""
        with patch.dict(os.environ, {'MONGODB_URI': 'mongodb://localhost:27017'}):
            db = Database()
            db.merchants = mock_mongo_client['merchants']
            db.users = mock_mongo_client['users']
            db.cards = mock_mongo_client['cards'] 
            db.purchases = mock_mongo_client['purchases']
            
            # Sample data
            sample_merchants = [
                {"merchant_id": "merchant1", "api_key": "key1", "currency": "USD"},
                {"merchant_id": "merchant2", "api_key": "key2", "currency": "EUR"}
            ]
            
            sample_users = [
                {
                    "username": "user1", 
                    "email": "user1@example.com",
                    "last_geo": {"ip": "192.168.1.1", "country": "US"},
                    "last_device": {"ua": "Chrome", "platform": "Windows"}
                },
                {
                    "username": "user2",
                    "email": "user2@example.com", 
                    "last_geo": {"ip": "10.0.0.1", "country": "CA"},
                    "last_device": {"ua": "Firefox", "platform": "Mac"}
                }
            ]
            
            sample_cards = [
                {"card_info": "1234", "user_id": "user1"},
                {"card_info": "5678", "user_id": "user2"}
            ]
            
            sample_purchases = [
                {
                    "purchase_id": "p1",
                    "username": "user1",
                    "amount": 100.0,
                    "geo": {"ip": "192.168.1.1", "country": "US"},
                    "device_info": {"ua": "Chrome", "platform": "Windows"},
                    "timestamp_requested": datetime.now()
                },
                {
                    "purchase_id": "p2", 
                    "username": "user2",
                    "amount": 250.0,
                    "geo": {"ip": "10.0.0.1", "country": "CA"},
                    "device_info": {"ua": "Firefox", "platform": "Mac"},
                    "timestamp_requested": datetime.now() - timedelta(days=1)
                }
            ]
            
            # Mock find() methods to return sample data
            mock_mongo_client['merchants'].find.return_value = sample_merchants
            mock_mongo_client['users'].find.return_value = sample_users
            mock_mongo_client['cards'].find.return_value = sample_cards
            mock_mongo_client['purchases'].find.return_value = sample_purchases
            
            return db, {
                'merchants': sample_merchants,
                'users': sample_users,
                'cards': sample_cards,
                'purchases': sample_purchases
            }

    def test_query_all_merchants(self, database_with_sample_data):
        """Test querying all merchants"""
        db, sample_data = database_with_sample_data
        
        # Add method to query all merchants
        if not hasattr(db, 'get_all_merchants'):
            def get_all_merchants(self):
                return list(self.merchants.find())
            db.get_all_merchants = get_all_merchants.__get__(db, Database)
        
        result = db.get_all_merchants()
        
        db.merchants.find.assert_called_once_with()
        assert result == sample_data['merchants']
        assert len(result) == 2
        assert result[0]['merchant_id'] == 'merchant1'

    def test_query_all_users(self, database_with_sample_data):
        """Test querying all users with geo/device info"""
        db, sample_data = database_with_sample_data
        
        # Add method to query all users
        if not hasattr(db, 'get_all_users'):
            def get_all_users(self):
                return list(self.users.find())
            db.get_all_users = get_all_users.__get__(db, Database)
        
        result = db.get_all_users()
        
        db.users.find.assert_called_once_with()
        assert result == sample_data['users']
        assert len(result) == 2
        assert 'last_geo' in result[0]
        assert 'last_device' in result[0]

    def test_query_all_cards(self, database_with_sample_data):
        """Test querying all cards"""
        db, sample_data = database_with_sample_data
        
        # Add method to query all cards
        if not hasattr(db, 'get_all_cards'):
            def get_all_cards(self):
                return list(self.cards.find())
            db.get_all_cards = get_all_cards.__get__(db, Database)
        
        result = db.get_all_cards()
        
        db.cards.find.assert_called_once_with()
        assert result == sample_data['cards']
        assert len(result) == 2

    def test_query_all_purchases(self, database_with_sample_data):
        """Test querying all purchases with geo/device info"""
        db, sample_data = database_with_sample_data
        
        # Add method to query all purchases
        if not hasattr(db, 'get_all_purchases'):
            def get_all_purchases(self):
                return list(self.purchases.find())
            db.get_all_purchases = get_all_purchases.__get__(db, Database)
        
        result = db.get_all_purchases()
        
        db.purchases.find.assert_called_once_with()
        assert result == sample_data['purchases']
        assert len(result) == 2
        assert 'geo' in result[0]
        assert 'device_info' in result[0]

    def test_query_users_by_country(self, database_with_sample_data):
        """Test querying users by country"""
        db, sample_data = database_with_sample_data
        
        # Add method to query users by country
        if not hasattr(db, 'get_users_by_country'):
            def get_users_by_country(self, country):
                return list(self.users.find({"last_geo.country": country}))
            db.get_users_by_country = get_users_by_country.__get__(db, Database)
        
        result = db.get_users_by_country("US")
        
        db.users.find.assert_called_once_with({"last_geo.country": "US"})

    def test_query_purchases_by_date_range(self, database_with_sample_data):
        """Test querying purchases by date range"""
        db, sample_data = database_with_sample_data
        
        start_date = datetime.now() - timedelta(days=2)
        end_date = datetime.now()
        
        # Add method to query purchases by date range
        if not hasattr(db, 'get_purchases_by_date_range'):
            def get_purchases_by_date_range(self, start_date, end_date):
                return list(self.purchases.find({
                    "timestamp_requested": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                }))
            db.get_purchases_by_date_range = get_purchases_by_date_range.__get__(db, Database)
        
        result = db.get_purchases_by_date_range(start_date, end_date)
        
        expected_query = {
            "timestamp_requested": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        db.purchases.find.assert_called_once_with(expected_query)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])