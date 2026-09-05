import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    organization: str
    password: str = Field(..., min_length=8)
    role: str = "Risk Analyst"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    organization: str
    role: str
    email_verified: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterResponse(BaseModel):
    message: str
    email: str
    email_verified: bool
    dev_link: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# Customer Schemas
class CustomerOut(BaseModel):
    id: int
    customer_code: str
    name: str
    email: str
    country: str
    city: str
    typical_amount_min: float
    typical_amount_max: float
    typical_locations: List[str]
    known_device_ids: List[str]
    avg_daily_txns: int

    class Config:
        from_attributes = True


# Risk Assessment Schemas
class RiskAssessmentOut(BaseModel):
    id: int
    score: float
    risk_level: str
    amount_score: float
    device_score: float
    location_score: float
    velocity_score: float
    ip_score: float
    time_score: float
    behavior_score: float
    reasons: List[str]
    factor_breakdown: Dict[str, float]
    summary: Optional[str] = None

    class Config:
        from_attributes = True


# Transaction Schemas
class TransactionOut(BaseModel):
    id: int
    txn_id: str
    customer_id: int
    merchant: str
    merchant_category: str
    amount: float
    currency: str
    timestamp: datetime.datetime
    country: str
    city: str
    payment_method: str
    device_id: str
    is_new_device: bool
    ip_risk_score: float
    transaction_velocity: int
    status: str
    risk_score: float
    risk_level: str
    decision: str
    created_at: datetime.datetime
    customer: Optional[CustomerOut] = None
    assessment: Optional[RiskAssessmentOut] = None

    class Config:
        from_attributes = True


class TransactionActionRequest(BaseModel):
    note: Optional[str] = ""


# Alert Schemas
class RiskAlertOut(BaseModel):
    id: int
    alert_code: str
    transaction_id: int
    risk_score: float
    risk_level: str
    primary_signal: str
    status: str
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    resolved_by: Optional[str] = None
    transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True


class AlertResolveRequest(BaseModel):
    status: str = "RESOLVED"
    note: Optional[str] = None


# Audit Log Schema
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime.datetime
    user_name: str
    user_email: str
    action: str
    entity: str
    entity_id: str
    description: str

    class Config:
        from_attributes = True


# Dashboard & Risk Settings Schemas
class DashboardSummary(BaseModel):
    total_monitored: int
    high_risk_count: int
    blocked_count: int
    amount_at_risk: float
    medium_risk_count: int
    low_risk_count: int
    risk_detection_rate: float
    avg_risk_score: float
    total_volume_amount: float


class RiskSettingsOut(BaseModel):
    settings: Dict[str, str]


class RiskSettingsUpdate(BaseModel):
    settings: Dict[str, str]
