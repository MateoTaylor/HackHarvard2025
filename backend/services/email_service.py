import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import logger
import os
import pathlib
import json


# Email configuration - you should set these as environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@example.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your-app-password")
COMPANY_NAME = os.getenv("COMPANY_NAME", "SecurePayments")
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "smtp")  # 'smtp' or 'file'
EMAIL_FILE_PATH = os.getenv("EMAIL_FILE_PATH", "tmp_emails")


def send_email(to_email, subject, html_content, text_content=None):
    """
    Send an email using SMTP.


    Args:
        to_email (str): Recipient's email address.
        subject (str): Email subject line.
        html_content (str): HTML content of the email.
        text_content (str, optional): Plain text alternative content.


    Returns:
        bool: True if email sent successfully, False otherwise.


    Notes:
        - Uses TLS encryption for secure email transmission.
        - Falls back to text content if HTML is not supported.
    """
    try:
        # Dev: file backend — write message JSON to disk instead of sending
        if EMAIL_BACKEND == "file":
            out_dir = pathlib.Path(EMAIL_FILE_PATH)
            out_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S%fZ")
            filename = out_dir / f"email_{timestamp}.json"
            payload = {
                "from": SENDER_EMAIL,
                "to": to_email,
                "subject": subject,
                "text": text_content,
                "html": html_content,
                "company": COMPANY_NAME,
                "created_at": datetime.utcnow().isoformat() + "Z",
            }
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            logger.info(f"Email written to file backend: {filename}")
            return True

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{COMPANY_NAME} <{SENDER_EMAIL}>"
        message["To"] = to_email


        # Add text and HTML parts
        if text_content:
            part1 = MIMEText(text_content, "plain")
            message.attach(part1)
       
        part2 = MIMEText(html_content, "html")
        message.attach(part2)


        # Send email
        # Support two common modes:
        # - SMTPS (implicit SSL) on port 465 -> smtplib.SMTP_SSL
        # - SMTP + STARTTLS (explicit TLS) on port 587 (or other) -> smtplib.SMTP + starttls()
        if SMTP_PORT == 465:
            # Implicit SSL
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
                try:
                    server.login(SENDER_EMAIL, SENDER_PASSWORD)
                except smtplib.SMTPAuthenticationError as auth_err:
                    logger.error(f"SMTP authentication failed (code={getattr(auth_err,'smtp_code',None)}): {getattr(auth_err,'smtp_error',auth_err)}")
                    raise
                server.sendmail(SENDER_EMAIL, to_email, message.as_string())
        else:
            # Start with plain SMTP and then upgrade to TLS
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
                server.ehlo()
                try:
                    server.starttls()
                    server.ehlo()
                except Exception as tls_err:
                    logger.warning(f"Could not start TLS: {tls_err}")
                try:
                    server.login(SENDER_EMAIL, SENDER_PASSWORD)
                except smtplib.SMTPAuthenticationError as auth_err:
                    logger.error(f"SMTP authentication failed (code={getattr(auth_err,'smtp_code',None)}): {getattr(auth_err,'smtp_error',auth_err)}")
                    raise
                server.sendmail(SENDER_EMAIL, to_email, message.as_string())


        logger.info(f"Email sent successfully to {to_email}")
        return True


    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False




def send_transaction_success_email(email, challenge_info):
    """
    Send a transaction success notification email.


    Args:
        email (str): Recipient's email address.
        challenge_info (dict): Dictionary containing transaction details:
            - amount (float): Transaction amount.
            - currency (str): Currency code.
            - merchant_id (str): Merchant identifier.
            - verified_at (datetime): Timestamp of verification.
            - challenge_id (str): Unique challenge identifier.


    Returns:
        bool: True if email sent successfully, False otherwise.
    """
    amount = challenge_info.get('amount', 0)
    currency = challenge_info.get('currency', 'USD')
    merchant_id = challenge_info.get('merchant_id', 'Unknown')
    verified_at = challenge_info.get('verified_at', datetime.now())
    challenge_id = challenge_info.get('challenge_id', 'N/A')


    subject = f"Transaction Successful - {currency} {amount:.2f}"


    # HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
            .transaction-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
            .detail-label {{ font-weight: bold; color: #555; }}
            .detail-value {{ color: #333; }}
            .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 5px 5px; }}
            .success-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✓ Transaction Successful</h1>
            </div>
            <div class="content">
                <div class="success-icon">✅</div>
                <p>Dear Customer,</p>
                <p>Your transaction has been successfully processed and verified.</p>
               
                <div class="transaction-details">
                    <h3>Transaction Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">{currency} {amount:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Merchant ID:</span>
                        <span class="detail-value">{merchant_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date & Time:</span>
                        <span class="detail-value">{verified_at.strftime('%Y-%m-%d %H:%M:%S')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">{challenge_id}</span>
                    </div>
                </div>
               
                <p>If you did not authorize this transaction, please contact our support team immediately.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from {COMPANY_NAME}. Please do not reply to this email.</p>
                <p>&copy; {datetime.now().year} {COMPANY_NAME}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


    # Plain text alternative
    text_content = f"""
    Transaction Successful
   
    Dear Customer,
   
    Your transaction has been successfully processed and verified.
   
    Transaction Details:
    - Amount: {currency} {amount:.2f}
    - Merchant ID: {merchant_id}
    - Date & Time: {verified_at.strftime('%Y-%m-%d %H:%M:%S')}
    - Transaction ID: {challenge_id}
   
    If you did not authorize this transaction, please contact our support team immediately.
   
    This is an automated message from {COMPANY_NAME}.
    """


    return send_email(email, subject, html_content, text_content)




def send_fraud_alert_email(email, challenge_info, fraud_reason):
    """
    Send a fraud alert notification email.


    Args:
        email (str): Recipient's email address.
        challenge_info (dict): Dictionary containing transaction details.
        fraud_reason (str): Reason for fraud detection (e.g., 'high_amount', 'high_risk_location').


    Returns:
        bool: True if email sent successfully, False otherwise.
    """
    amount = challenge_info.get('amount', 0)
    currency = challenge_info.get('currency', 'USD')
    merchant_id = challenge_info.get('merchant_id', 'Unknown')
    created_at = challenge_info.get('created_at', datetime.now())
    challenge_id = challenge_info.get('challenge_id', 'N/A')
   
    # Map fraud reasons to user-friendly messages
    fraud_messages = {
        "high_amount": "High transaction amount detected",
        "foreign_transaction": "Transaction from unusual location",
        "high_risk_location": "Transaction from high-risk location",
        "new_device": "Transaction from new or unrecognized device",
        "suspicious_email": "Suspicious email domain detected"
    }
   
    fraud_description = fraud_messages.get(fraud_reason, "Suspicious activity detected")


    subject = f"⚠️ Fraud Alert - Action Required"


    # HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #fff3cd; padding: 20px; border: 2px solid #f44336; }}
            .alert-icon {{ font-size: 48px; text-align: center; margin: 20px 0; color: #f44336; }}
            .transaction-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
            .detail-label {{ font-weight: bold; color: #555; }}
            .detail-value {{ color: #333; }}
            .warning-box {{ background-color: #ffebee; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; border-radius: 3px; }}
            .action-button {{ display: inline-block; background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }}
            .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 5px 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Fraud Alert</h1>
            </div>
            <div class="content">
                <div class="alert-icon">🚨</div>
                <p><strong>URGENT: Suspicious Transaction Detected</strong></p>
                <p>We have detected a potentially fraudulent transaction on your account that requires your immediate attention.</p>
               
                <div class="warning-box">
                    <strong>Alert Reason:</strong> {fraud_description}
                </div>
               
                <div class="transaction-details">
                    <h3>Transaction Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">{currency} {amount:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Merchant ID:</span>
                        <span class="detail-value">{merchant_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date & Time:</span>
                        <span class="detail-value">{created_at.strftime('%Y-%m-%d %H:%M:%S')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">{challenge_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value" style="color: #f44336; font-weight: bold;">REQUIRES VERIFICATION</span>
                    </div>
                </div>
               
                <p><strong>What you should do:</strong></p>
                <ul>
                    <li>If you recognize this transaction, please verify it through our secure portal</li>
                    <li>If you do NOT recognize this transaction, contact our fraud department immediately</li>
                    <li>Do not share your verification codes or credentials with anyone</li>
                </ul>
               
                <div style="text-align: center;">
                    <a href="#" class="action-button">Verify Transaction</a>
                </div>
               
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                    For your security, this transaction has been temporarily held pending verification.
                </p>
            </div>
            <div class="footer">
                <p><strong>Need help?</strong> Contact our 24/7 fraud support team</p>
                <p>This is an automated security alert from {COMPANY_NAME}.</p>
                <p>&copy; {datetime.now().year} {COMPANY_NAME}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


    # Plain text alternative
    text_content = f"""
    ⚠️ FRAUD ALERT - ACTION REQUIRED
   
    URGENT: Suspicious Transaction Detected
   
    We have detected a potentially fraudulent transaction on your account.
   
    Alert Reason: {fraud_description}
   
    Transaction Details:
    - Amount: {currency} {amount:.2f}
    - Merchant ID: {merchant_id}
    - Date & Time: {created_at.strftime('%Y-%m-%d %H:%M:%S')}
    - Transaction ID: {challenge_id}
    - Status: REQUIRES VERIFICATION
   
    What you should do:
    - If you recognize this transaction, please verify it through our secure portal
    - If you do NOT recognize this transaction, contact our fraud department immediately
    - Do not share your verification codes or credentials with anyone
   
    For your security, this transaction has been temporarily held pending verification.
   
    Need help? Contact our 24/7 fraud support team.
    This is an automated security alert from {COMPANY_NAME}.
    """


    return send_email(email, subject, html_content, text_content)




def send_mfa_required_email(email, challenge_info):
    """
    Send an email notification when MFA is required for a transaction.


    Args:
        email (str): Recipient's email address.
        challenge_info (dict): Dictionary containing transaction details.


    Returns:
        bool: True if email sent successfully, False otherwise.
    """
    amount = challenge_info.get('amount', 0)
    currency = challenge_info.get('currency', 'USD')
    merchant_id = challenge_info.get('merchant_id', 'Unknown')
    reason = challenge_info.get('reason', 'Security verification')
    challenge_id = challenge_info.get('challenge_id', 'N/A')


    subject = f"Verification Required - {currency} {amount:.2f} Transaction"


    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
            .info-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
            .transaction-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
            .detail-label {{ font-weight: bold; color: #555; }}
            .detail-value {{ color: #333; }}
            .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 5px 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Verification Required</h1>
            </div>
            <div class="content">
                <div class="info-icon">🔔</div>
                <p>Dear Customer,</p>
                <p>Additional verification is required to complete your transaction.</p>
               
                <div class="transaction-details">
                    <h3>Transaction Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">{currency} {amount:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Merchant ID:</span>
                        <span class="detail-value">{merchant_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">{challenge_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Verification Reason:</span>
                        <span class="detail-value">{reason}</span>
                    </div>
                </div>
               
                <p>Please complete the verification process to proceed with this transaction.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from {COMPANY_NAME}.</p>
                <p>&copy; {datetime.now().year} {COMPANY_NAME}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


    text_content = f"""
    Verification Required
   
    Dear Customer,
   
    Additional verification is required to complete your transaction.
   
    Transaction Details:
    - Amount: {currency} {amount:.2f}
    - Merchant ID: {merchant_id}
    - Transaction ID: {challenge_id}
    - Verification Reason: {reason}
   
    Please complete the verification process to proceed with this transaction.
   
    This is an automated message from {COMPANY_NAME}.
    """


    return send_email(email, subject, html_content, text_content)

