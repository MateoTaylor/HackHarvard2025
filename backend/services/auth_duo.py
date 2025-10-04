'''
Duo Universal Prompt MFA Service

Uses Duo's Universal Prompt (OAuth/OIDC) for browser-based MFA.
Creates auth URLs for frontend redirect and handles OAuth callbacks.

Environment variables required:
DUO_CLIENT_ID,
DUO_CLIENT_SECRET,
DUO_API_HOSTNAME,
DUO_REDIRECT_URI,
'''
import jwt
import uuid
import requests
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import os 
import dotenv

class DuoAuthService:
    def __init__(self):
        dotenv.load_dotenv()
        
        # Load Duo Universal Prompt configuration
        self.client_id = os.getenv("DUO_CLIENT_ID")
        self.client_secret = os.getenv("DUO_CLIENT_SECRET")
        self.api_hostname = os.getenv("DUO_API_HOSTNAME")
        self.redirect_uri = os.getenv("DUO_REDIRECT_URI")

        if not all([self.client_id, self.client_secret, self.api_hostname, self.redirect_uri]):
            raise ValueError("Duo environment variables are not properly set.")

        # Duo Universal Prompt OAuth endpoints
        self.authorize_url = f"https://{self.api_hostname}/oauth/v1/authorize"
        self.token_url = f"https://{self.api_hostname}/oauth/v1/token"
        
        # In-memory transaction storage (use Redis/DB in production)
        self.transactions = {}

    def create_auth_url(self, username, transaction_data=None):
        """
        Create Duo Universal Prompt authentication URL
        
        Args:
            username (str): Duo username (usually email prefix)
            transaction_data (dict): Optional context like amount, description
            
        Returns:
            dict: {
                'auth_url': str,      # URL to redirect user to
                'transaction_id': str, # ID to track this auth request
                'status': str         # Initial status 'pending'
            }
        """
        # Generate unique identifiers
        txid = str(uuid.uuid4())
        state = str(uuid.uuid4())
        nonce = str(uuid.uuid4())
        
        # Store transaction details
        self.transactions[txid] = {
            'state': state,
            'nonce': nonce,
            'username': username,
            'transaction_data': transaction_data or {},
            'status': 'pending',
            'created_at': datetime.now(timezone.utc)
        }
        
        # Create signed JWT request
        now = datetime.now(timezone.utc)
        exp = now + timedelta(minutes=5)
        
        # Build request payload with user context
        request_payload = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'openid',
            'state': state,
            'nonce': nonce,
            'exp': int(exp.timestamp()),
            'duo_uname': username  # Duo username for authentication
        }
        
        # Add transaction context to the authentication prompt
        if transaction_data and 'amount' in transaction_data:
            request_payload['prompt'] = f"Approve transaction: ${transaction_data['amount']}"
        elif transaction_data and 'description' in transaction_data:
            request_payload['prompt'] = f"Approve: {transaction_data['description']}"
        
        # Sign the request JWT with client secret
        request_jwt = jwt.encode(
            request_payload,
            self.client_secret,
            algorithm='HS256'
        )
        
        # Build authorization URL
        auth_params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'request': request_jwt
        }
        
        auth_url = f"{self.authorize_url}?{urlencode(auth_params)}"
        
        return {
            'auth_url': auth_url,
            'transaction_id': txid,
            'status': 'pending'
        }

    def handle_callback(self, code, state, error=None):
        """
        Handle Duo OAuth callback after user authentication
        
        Args:
            code (str): Authorization code from Duo
            state (str): State parameter for CSRF protection
            error (str): Error parameter if authentication failed
            
        Returns:
            dict: {
                'status': str,           # 'approved', 'denied', or 'error'
                'transaction_id': str,   # Original transaction ID
                'message': str           # Human readable result
            }
        """
        if error:
            return {
                'status': 'error',
                'message': f'Duo authentication error: {error}',
                'transaction_id': None
            }
        
        if not code or not state:
            return {
                'status': 'error', 
                'message': 'Missing authorization code or state',
                'transaction_id': None
            }
        
        # Find transaction by state parameter
        txid = self._find_transaction_by_state(state)
        if not txid:
            return {
                'status': 'error',
                'message': 'Invalid or expired state parameter',
                'transaction_id': None
            }
        
        # Exchange authorization code for access token
        token_success = self._exchange_code_for_token(code)
        
        if token_success:
            self.transactions[txid]['status'] = 'approved'
            self.transactions[txid]['completed_at'] = datetime.now(timezone.utc)
            return {
                'status': 'approved',
                'transaction_id': txid,
                'message': 'MFA authentication successful'
            }
        else:
            self.transactions[txid]['status'] = 'denied'
            return {
                'status': 'denied', 
                'transaction_id': txid,
                'message': 'MFA authentication failed'
            }

    def get_transaction_status(self, txid):
        """
        Get current status of an MFA transaction
        
        Args:
            txid (str): Transaction ID
            
        Returns:
            dict or None: Transaction details or None if not found
        """
        transaction = self.transactions.get(txid)
        if not transaction:
            return None
        
        return {
            'transaction_id': txid,
            'status': transaction['status'],
            'username': transaction['username'],
            'transaction_data': transaction['transaction_data'],
            'created_at': transaction['created_at'].isoformat(),
            'completed_at': transaction.get('completed_at', {}).isoformat() if transaction.get('completed_at') else None
        }

    def _find_transaction_by_state(self, state):
        """Find transaction ID by OAuth state parameter"""
        for txid, tx in self.transactions.items():
            if tx['state'] == state:
                return txid
        return None

    def _exchange_code_for_token(self, code):
        """
        Exchange authorization code for access token using client assertion
        
        Args:
            code (str): Authorization code from Duo
            
        Returns:
            bool: True if token exchange successful
        """
        try:
            # Create client assertion JWT for secure authentication
            now = datetime.now(timezone.utc)
            exp = now + timedelta(minutes=5)
            
            client_assertion = jwt.encode({
                'iss': self.client_id,      # Issuer
                'sub': self.client_id,      # Subject  
                'aud': self.token_url,      # Audience
                'jti': str(uuid.uuid4()),   # JWT ID
                'iat': int(now.timestamp()), # Issued at
                'exp': int(exp.timestamp())  # Expires
            }, self.client_secret, algorithm='HS256')
            
            # Prepare token exchange request
            token_data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_assertion': client_assertion,
                'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
            }
            
            # Make token exchange request
            response = requests.post(
                self.token_url,
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Token exchange error: {e}")
            return False


