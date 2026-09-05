import logging
import urllib.request
import urllib.error
import json
from typing import Tuple, Dict, Any
from ..config import EMAIL_MODE, RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL


def send_verification_email(to_email: str, name: str, raw_token: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Sends account verification email using Resend API in production,
    or logs verification link in development mode.
    """
    verify_url = f"{FRONTEND_URL}/verify-email?token={raw_token}"
    subject = "Verify your RiskPulse account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #060A12; color: #e2e8f0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #0B132B; border: 1px solid #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 22px; font-weight: 800; color: #ffffff; tracking-spacing: 1px;">RISKPULSE <span style="color: #3B82F6;">AI</span></span>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Real-Time Payment Risk Intelligence</p>
        </div>
        
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify your RiskPulse account</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello {name},</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Welcome to RiskPulse AI. Please verify your email address to activate your account and access the Risk Operations Center.</p>
        
        <div style="margin: 32px 0;">
          <a href="{verify_url}" style="background-color: #2563EB; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block;">Verify Email</a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">This verification link expires in 15 minutes.</p>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">If you did not create this account, you can safely ignore this email.</p>
        
        <hr style="border: 0; border-top: 1px solid #1E293B; margin: 24px 0;" />
        <p style="color: #64748B; font-size: 11px;">RiskPulse AI — Fraud Prevention Platform Sandbox</p>
      </div>
    </body>
    </html>
    """

    if EMAIL_MODE == "production":
        if not RESEND_API_KEY:
            logging.error("[EmailService] RESEND_API_KEY is not set in environment variables.")
            return False, "Email service not configured. RESEND_API_KEY is missing.", {}

        return _send_via_resend(to_email, subject, html_content)
    else:
        # Development Mode Console Output
        print("\n=======================================================")
        print(" [DEV MODE] DEVELOPMENT EMAIL SERVICE — VERIFICATION EMAIL")
        print(f" To: {to_email} ({name})")
        print(f" Verification Link: {verify_url}")
        print("=======================================================\n")
        return True, "Development email logged to console.", {"dev_link": verify_url, "mode": "development"}


def send_password_reset_email(to_email: str, name: str, raw_token: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Sends password reset email using Resend API in production,
    or logs reset link in development mode.
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={raw_token}"
    subject = "Reset your RiskPulse password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #060A12; color: #e2e8f0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #0B132B; border: 1px solid #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 22px; font-weight: 800; color: #ffffff; tracking-spacing: 1px;">RISKPULSE <span style="color: #3B82F6;">AI</span></span>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Payment Risk Intelligence</p>
        </div>
        
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Reset your RiskPulse password</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello {name},</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">We received a request to reset your RiskPulse account password. Click the button below to set a new password:</p>
        
        <div style="margin: 32px 0;">
          <a href="{reset_url}" style="background-color: #2563EB; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">This link expires in 15 minutes.</p>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">If you did not request this password reset, you can safely ignore this email.</p>
        
        <hr style="border: 0; border-top: 1px solid #1E293B; margin: 24px 0;" />
        <p style="color: #64748B; font-size: 11px;">RiskPulse AI — Real-Time Risk Intelligence</p>
      </div>
    </body>
    </html>
    """

    if EMAIL_MODE == "production":
        if not RESEND_API_KEY:
            logging.error("[EmailService] RESEND_API_KEY is not set in environment variables.")
            return False, "Email service not configured. RESEND_API_KEY is missing.", {}

        return _send_via_resend(to_email, subject, html_content)
    else:
        # Development Mode Console Output
        print("\n=======================================================")
        print(" [DEV MODE] DEVELOPMENT EMAIL SERVICE — PASSWORD RESET EMAIL")
        print(f" To: {to_email} ({name})")
        print(f" Reset Link: {reset_url}")
        print("=======================================================\n")
        return True, "Development email logged to console.", {"dev_link": reset_url, "mode": "development"}


def _send_via_resend(to_email: str, subject: str, html_content: str) -> Tuple[bool, str, Dict[str, Any]]:
    """Helper method to execute Resend REST API HTTP POST request."""
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return True, "Email delivered successfully via Resend.", res_data
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        logging.error(f"[Resend Email Error] HTTP {e.code}: {error_body}")
        return False, f"Email delivery failed (HTTP {e.code}): {error_body}", {}
    except Exception as err:
        logging.error(f"[Resend Email Exception] {err}")
        return False, f"Email delivery exception: {str(err)}", {}
