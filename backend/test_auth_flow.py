import urllib.request
import urllib.error
import json
import sqlite3

BASE_URL = "http://127.0.0.1:8000/api/auth"

def make_request(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_content = e.read().decode('utf-8')
        try:
            return e.code, json.loads(error_content)
        except Exception:
            return e.code, {"detail": error_content}

def test_full_auth_flow():
    print("\n--- STARTING AUTHENTICATION VERIFICATION SUITE ---\n")

    test_email = "test.officer@riskpulse.ai"

    # 1. Register new user
    reg_payload = {
        "name": "Sarah Connor",
        "email": test_email,
        "organization": "Cyberdyne Security",
        "role": "Security Officer",
        "password": "SecurePassword123!"
    }
    status_code, reg_res = make_request(f"{BASE_URL}/register", method="POST", data=reg_payload)
    print(f"1. Registration Response ({status_code}):", reg_res)
    assert status_code == 200, f"Registration failed: {reg_res}"
    assert reg_res["email_verified"] is False
    dev_link = reg_res.get("dev_link")
    assert dev_link is not None
    verif_token = dev_link.split("token=")[1]

    # 2. Attempt login BEFORE verification (Should fail with 403 Forbidden)
    login_payload = {
        "email": test_email,
        "password": "SecurePassword123!"
    }
    status_code, login_unverified_res = make_request(f"{BASE_URL}/login", method="POST", data=login_payload)
    print(f"2. Unverified Login Attempt ({status_code}):", login_unverified_res)
    assert status_code == 403, f"Expected 403 for unverified user, got {status_code}"
    assert "verify your email" in login_unverified_res["detail"].lower()

    # 3. Verify Email with valid token
    status_code, verif_res = make_request(f"{BASE_URL}/verify-email?token={verif_token}", method="GET")
    print(f"3. Email Verification ({status_code}):", verif_res)
    assert status_code == 200, f"Email verification failed: {verif_res}"
    assert verif_res["success"] is True

    # 4. Attempt login AFTER verification (Should succeed with 200 OK + JWT token)
    status_code, login_res = make_request(f"{BASE_URL}/login", method="POST", data=login_payload)
    print(f"4. Verified Login Attempt ({status_code}):", login_res)
    assert status_code == 200, f"Verified login failed: {login_res}"
    assert "access_token" in login_res

    # 5. Forgot Password Request
    forgot_payload = {"email": test_email}
    status_code, forgot_res = make_request(f"{BASE_URL}/forgot-password", method="POST", data=forgot_payload)
    print(f"5. Forgot Password Request ({status_code}):", forgot_res)
    assert status_code == 200

    # 6. Database Verification & Token Retrieval
    conn = sqlite3.connect("./riskpulse.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email=?", (test_email,))
    user_id = cursor.fetchone()[0]

    cursor.execute("SELECT used_at FROM email_verification_tokens WHERE user_id=?", (user_id,))
    verif_used_at = cursor.fetchone()[0]
    assert verif_used_at is not None
    print("   [OK] EmailVerificationToken marked used_at in SQLite database.")

    # Get latest password reset token hash to simulate reset flow
    cursor.execute("SELECT token_hash FROM password_reset_tokens WHERE user_id=?", (user_id,))
    reset_hash = cursor.fetchone()[0]
    assert reset_hash is not None
    print("   [OK] PasswordResetToken hash stored securely in SQLite database.")
    conn.close()

    # 7. Test Invalid Token for Email Verification (Should fail with 400 Bad Request)
    status_code, invalid_verif = make_request(f"{BASE_URL}/verify-email?token=INVALID_TOKEN_XYZ", method="GET")
    print(f"7. Invalid Verification Token ({status_code}):", invalid_verif)
    assert status_code == 400

    # 8. Test Demo Seed Account (analyst@riskpulse.ai / password123)
    demo_login_payload = {
        "email": "analyst@riskpulse.ai",
        "password": "password123"
    }
    status_code, demo_login_res = make_request(f"{BASE_URL}/login", method="POST", data=demo_login_payload)
    print(f"8. Demo Seed Analyst Account Login ({status_code}):", demo_login_res["user"]["email"])
    assert status_code == 200

    print("\n--- ALL PRODUCTION AUTHENTICATION TESTS PASSED CLEANLY! ---\n")

if __name__ == "__main__":
    test_full_auth_flow()
