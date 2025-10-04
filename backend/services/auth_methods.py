# Define available authentication methods

def get_auth_method(method_name):
    methods = {
        "webauthn": {
            "question": "Yes",
            "answer": "Yes"
        },
        "otp": {
            "question": "Authenticate using OTP.",
            "answer": "Please enter the One-Time Password sent to your device."
        }
    }
    return methods.get(method_name, None)
