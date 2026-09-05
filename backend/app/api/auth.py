from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import datetime

from ..database import get_db
from ..models import User, EmailVerificationToken, PasswordResetToken, AuditLog
from ..schemas import (
    UserRegister,
    UserLogin,
    Token,
    UserOut,
    RegisterResponse,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    generate_secure_token,
    hash_token
)
from ..services.email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload["sub"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


@router.post("/register", response_model=RegisterResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this work email address already exists.",
        )

    now = datetime.datetime.utcnow()
    user = User(
        full_name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        organization=user_in.organization,
        role=user_in.role,
        email_verified=False,
        created_at=now
    )
    db.add(user)
    db.flush()

    # Generate single-use verification token (15-minute expiration)
    raw_token = generate_secure_token()
    token_hash = hash_token(raw_token)
    expires_at = now + datetime.timedelta(minutes=15)

    verif_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=now
    )
    db.add(verif_token)

    # Audit log
    audit = AuditLog(
        timestamp=now,
        user_name=user.full_name,
        user_email=user.email,
        action="REGISTER",
        entity="User",
        entity_id=str(user.id),
        description=f"Account created for {user.full_name} ({user.email}). Verification email issued."
    )
    db.add(audit)
    db.commit()

    # Send verification email
    sent_ok, msg, extra = send_verification_email(user.email, user.full_name, raw_token)

    return RegisterResponse(
        message="Registration successful. Please verify your email address.",
        email=user.email,
        email_verified=False,
        dev_link=extra.get("dev_link")
    )


@router.get("/verify-email")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=400, detail="Verification token is missing.")

    t_hash = hash_token(token)
    verif_record = db.query(EmailVerificationToken).filter(EmailVerificationToken.token_hash == t_hash).first()

    now = datetime.datetime.utcnow()
    if not verif_record:
        raise HTTPException(status_code=400, detail="Verification link is invalid or has expired.")

    if verif_record.used_at is not None:
        raise HTTPException(status_code=400, detail="This verification link has already been used.")

    if verif_record.expires_at < now:
        raise HTTPException(status_code=400, detail="Verification link has expired.")

    # Mark user verified & token used
    user = verif_record.user
    user.email_verified = True
    user.updated_at = now
    verif_record.used_at = now

    audit = AuditLog(
        timestamp=now,
        user_name=user.full_name,
        user_email=user.email,
        action="VERIFY_EMAIL",
        entity="User",
        entity_id=str(user.id),
        description=f"Email address verified successfully for {user.full_name}."
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Email verified successfully. Your RiskPulse account is now active."
    }


@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Enumeration protection
        return {"message": "If an account exists for this email, a verification link has been sent."}

    if user.email_verified:
        return {"message": "This email address has already been verified. You can sign in."}

    now = datetime.datetime.utcnow()
    raw_token = generate_secure_token()
    token_hash = hash_token(raw_token)
    expires_at = now + datetime.timedelta(minutes=15)

    verif_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=now
    )
    db.add(verif_token)
    db.commit()

    send_verification_email(user.email, user.full_name, raw_token)

    return {"message": "Verification link sent. Please check your inbox."}


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before signing in.",
        )

    now = datetime.datetime.utcnow()
    user.last_login_at = now

    audit = AuditLog(
        timestamp=now,
        user_name=user.full_name,
        user_email=user.email,
        action="LOGIN",
        entity="UserSession",
        entity_id=str(user.id),
        description=f"Analyst {user.full_name} logged into RISKPULSE AI platform."
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return Token(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        now = datetime.datetime.utcnow()
        raw_token = generate_secure_token()
        token_hash = hash_token(raw_token)
        expires_at = now + datetime.timedelta(minutes=15)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=now
        )
        db.add(reset_token)
        db.commit()

        send_password_reset_email(user.email, user.full_name, raw_token)

    # Always return generic message to prevent email enumeration
    return {"message": "If an account exists for this email, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    t_hash = hash_token(req.token)
    reset_record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == t_hash).first()

    now = datetime.datetime.utcnow()
    if not reset_record:
        raise HTTPException(status_code=400, detail="Password reset link is invalid or has expired.")

    if reset_record.used_at is not None:
        raise HTTPException(status_code=400, detail="This password reset link has already been used.")

    if reset_record.expires_at < now:
        raise HTTPException(status_code=400, detail="Password reset link has expired.")

    user = reset_record.user
    user.password_hash = get_password_hash(req.new_password)
    user.updated_at = now
    reset_record.used_at = now

    audit = AuditLog(
        timestamp=now,
        user_name=user.full_name,
        user_email=user.email,
        action="RESET_PASSWORD",
        entity="User",
        entity_id=str(user.id),
        description=f"Password updated successfully for {user.full_name}."
    )
    db.add(audit)
    db.commit()

    return {"message": "Password reset successfully. Your password has been updated. You can now sign in."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
