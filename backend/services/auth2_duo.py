'''
Duo Auth API Service

Barebones implementation using Duo's Auth API for direct MFA integration.
Uses the /auth/v2 endpoints for authentication requests.

Environment variables required:
DUO_INTEGRATION_KEY (ikey),
DUO_SECRET_KEY (skey),
DUO_API_HOSTNAME,
'''
import os
import dotenv
import duo_client
from duo_client.auth import Auth

class DuoAuthAPIService:
    def __init__(self):
        """Initialize Duo Auth API client and validate connection"""
        dotenv.load_dotenv()
        
        # Load Duo Auth API configuration
        self.integration_key = os.getenv("DUO_INTEGRATION_KEY")
        self.secret_key = os.getenv("DUO_SECRET_KEY")
        self.api_hostname = os.getenv("DUO_AUTH_API_HOSTNAME")

        if not all([self.integration_key, self.secret_key, self.api_hostname]):
            raise ValueError("Duo Auth API environment variables are not properly set.")

        # Initialize Auth API client
        self.auth_api = Auth(
            ikey=self.integration_key,
            skey=self.secret_key,
            host=self.api_hostname
        )
        try:
            # Call the check endpoint to validate API access
            self.auth_api.check()
        except Exception as e:
            raise ValueError(f"Error connecting to Duo Auth API: {str(e)}")
        
    def enroll_user(self, username, email):
        """
        Enroll a new user in Duo
        Args:
            username (str): Unique username for the user
            email (str): User's email address
            
        Returns:
            dict: User details from Duo
        """
        try:
            user = self.auth_api.enroll(username=username)
            return user
        except Exception as e:
            raise ValueError(f"Error enrolling user in Duo: {str(e)}")

    def preauth(self, username, client_supports_verified_push="1", trusted_device_token=None):
        '''
        returns a list of available auth methods for the user
        '''
        try:
            response = self.auth_api.preauth(
                username=username,
                client_supports_verified_push=client_supports_verified_push,
            )
            print(response)
            return response
        except Exception as e:
            raise ValueError(f"Error in preauth for user {username}: {str(e)}")
        
    def send_auth_request(self, username, factor, passcode=None):
        ''' Send an authentication request to the user'''
        # For passcode verification, device parameter is not allowed (mutually exclusive)
        if factor == "passcode":
            response = self.auth_api.auth(
                username=username,
                factor=factor,
                passcode=passcode
            )
        else:
            # For other factors (push, sms, phone), use device="auto"
            response = self.auth_api.auth(
                username=username,
                factor=factor,
                device="auto",
                passcode=passcode
            )
        return response
    

# Testing
if __name__ == "__main__":
    try:
        duo_auth = DuoAuthAPIService()
        print("Duo Auth API service initialized successfully")
    except ValueError as e:
        print(f"Initialization failed: {e}")

    # Example usage
    # response = duo_auth.enroll_user("sushmituser", "sushmituser@gmail.com")
    # print("Enroll response:", response)
    testing_user = "testuser"
    testing_email = "testemail@gmail.com"

    try:
        preauth_response = duo_auth.preauth(testing_user)
        # print("Preauth response:", preauth_response)
    except ValueError as e:
        print(f"Preauth failed: {e}")

    try:
        auth_response = duo_auth.send_auth_request(testing_user, factor="phone")
        print("Auth request response:", auth_response)
    except ValueError as e:
        print(f"Auth request failed: {e}")