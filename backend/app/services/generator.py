import random
import datetime
import uuid
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session

from ..models import Customer, Transaction, RiskAssessment, RiskAlert, AuditLog
from .risk_engine import evaluate_transaction_risk

MERCHANTS = [
    ("ElectroMart", "Electronics"),
    ("TechGear Store", "Electronics"),
    ("Global Luxury Boutique", "Jewelry"),
    ("QuickPay Wallet Transfer", "Wire_Transfer"),
    ("Apex Crypto Exchange", "Crypto"),
    ("Starbucks Coffee", "Food & Beverage"),
    ("Amazon India", "E-Commerce"),
    ("Flipkart India", "E-Commerce"),
    ("Taj Hotels & Resorts", "Travel & Hospitality"),
    ("MakeMyTrip Aviation", "Travel & Hospitality"),
    ("Uber Mobility", "Transportation"),
    ("Reliance Digital", "Electronics"),
    ("Zomato Dining", "Food & Beverage"),
    ("Royal Watch Vault", "Jewelry"),
    ("Casino Royal Online", "Gambling"),
]

PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "NetBanking", "Wire Transfer"]
DEVICES = ["DEV-IPHONE-15P", "DEV-MACBOOK-M3", "DEV-SAMSUNG-S24", "DEV-CHROME-WIN11", "DEV-UNKNOWN-8921"]
CITIES = ["Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad", "London", "Dubai", "Singapore", "New York"]


def generate_synthetic_transaction(db: Session) -> Tuple[Transaction, RiskAssessment, RiskAlert]:
    customers = db.query(Customer).all()
    if not customers:
        raise ValueError("No customers available in database to generate transaction.")

    customer = random.choice(customers)

    # 30% chance to generate an anomalous/suspicious transaction scenario
    is_anomaly = random.random() < 0.30

    merchant, category = random.choice(MERCHANTS)

    if is_anomaly:
        # High value anomaly, new device, velocity or foreign location
        amount = round(customer.typical_amount_max * random.uniform(3.5, 12.0), 2)
        city = random.choice([c for c in CITIES if c not in customer.typical_locations] or ["London"])
        country = "India" if city in ["Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad"] else "International"
        device_id = f"DEV-UNRECOGNIZED-{random.randint(1000, 9999)}"
        is_new_device = True
        ip_risk = round(random.uniform(65.0, 95.0), 1)
        velocity = random.randint(3, 5)
    else:
        # Normal customer behavior
        amount = round(random.uniform(customer.typical_amount_min, customer.typical_amount_max), 2)
        city = random.choice(customer.typical_locations) if customer.typical_locations else customer.city
        country = customer.country
        device_id = random.choice(customer.known_device_ids) if customer.known_device_ids else "DEV-PRIMARY-01"
        is_new_device = False
        ip_risk = round(random.uniform(2.0, 25.0), 1)
        velocity = random.randint(1, 2)

    payment_method = random.choice(PAYMENT_METHODS)
    txn_code = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.datetime.utcnow()

    # Evaluate Risk
    assessment_res = evaluate_transaction_risk(
        amount=amount,
        country=country,
        city=city,
        device_id=device_id,
        is_new_device=is_new_device,
        ip_risk_score=ip_risk,
        transaction_velocity=velocity,
        merchant_category=category,
        timestamp_hour=now.hour,
        customer=customer,
        customer_history_count=len(customer.transactions) if customer.transactions else 5
    )

    # Create Transaction record
    transaction = Transaction(
        txn_id=txn_code,
        customer_id=customer.id,
        merchant=merchant,
        merchant_category=category,
        amount=amount,
        currency="INR",
        timestamp=now,
        country=country,
        city=city,
        payment_method=payment_method,
        device_id=device_id,
        is_new_device=is_new_device,
        ip_risk_score=ip_risk,
        transaction_velocity=velocity,
        status="PENDING" if assessment_res["risk_level"] in ["HIGH", "CRITICAL"] else "APPROVED",
        risk_score=assessment_res["score"],
        risk_level=assessment_res["risk_level"],
        decision=assessment_res["decision"],
        created_at=now
    )
    db.add(transaction)
    db.flush()

    # Create Risk Assessment record
    assessment = RiskAssessment(
        transaction_id=transaction.id,
        score=assessment_res["score"],
        risk_level=assessment_res["risk_level"],
        amount_score=assessment_res["amount_score"],
        device_score=assessment_res["device_score"],
        location_score=assessment_res["location_score"],
        velocity_score=assessment_res["velocity_score"],
        ip_score=assessment_res["ip_score"],
        time_score=assessment_res["time_score"],
        behavior_score=assessment_res["behavior_score"],
        reasons=assessment_res["reasons"],
        factor_breakdown=assessment_res["factor_breakdown"],
        summary=assessment_res["summary"],
        created_at=now
    )
    db.add(assessment)

    # Create Risk Alert if High or Critical
    alert = None
    if assessment_res["risk_level"] in ["HIGH", "CRITICAL"]:
        alert_code = f"ALT-{uuid.uuid4().hex[:6].upper()}"
        alert = RiskAlert(
            alert_code=alert_code,
            transaction_id=transaction.id,
            risk_score=assessment_res["score"],
            risk_level=assessment_res["risk_level"],
            primary_signal=assessment_res["reasons"][0] if assessment_res["reasons"] else "High Risk Anomaly",
            status="OPEN",
            created_at=now
        )
        db.add(alert)

    db.commit()
    db.refresh(transaction)
    return transaction, assessment, alert
