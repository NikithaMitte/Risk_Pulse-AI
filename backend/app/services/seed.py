import datetime
import random
import uuid
from sqlalchemy.orm import Session
from ..models import User, Organization, Customer, Transaction, RiskAssessment, RiskAlert, AuditLog, RiskSetting
from ..core.security import get_password_hash
from .risk_engine import evaluate_transaction_risk


def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first() is not None:
        return

    print("Seeding initial RISKPULSE AI database...")

    # 1. Organization & User
    org = Organization(name="RiskOps Global Enterprise")
    db.add(org)
    db.flush()

    user = User(
        full_name="Alex Vance",
        email="analyst@riskpulse.ai",
        password_hash=get_password_hash("password123"),
        organization="RiskOps Global Enterprise",
        role="Lead Risk Analyst",
        email_verified=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(user)

    # 2. Customers
    customers_data = [
        {
            "customer_code": "CUS-10482",
            "name": "Aarav Sharma",
            "email": "aarav.sharma@example.com",
            "country": "India",
            "city": "Hyderabad",
            "typical_amount_min": 1000.0,
            "typical_amount_max": 5000.0,
            "typical_locations": ["Hyderabad", "Bengaluru"],
            "known_device_ids": ["DEV-AARAV-MAC", "DEV-AARAV-IPHONE"],
            "avg_daily_txns": 2
        },
        {
            "customer_code": "CUS-20891",
            "name": "Priya Patel",
            "email": "priya.patel@example.com",
            "country": "India",
            "city": "Mumbai",
            "typical_amount_min": 500.0,
            "typical_amount_max": 3500.0,
            "typical_locations": ["Mumbai", "Pune"],
            "known_device_ids": ["DEV-PRIYA-PIXEL"],
            "avg_daily_txns": 3
        },
        {
            "customer_code": "CUS-30514",
            "name": "Vikram Malhotra",
            "email": "vikram.malhotra@example.com",
            "country": "India",
            "city": "Delhi NCR",
            "typical_amount_min": 15000.0,
            "typical_amount_max": 95000.0,
            "typical_locations": ["Delhi NCR", "Mumbai", "Dubai"],
            "known_device_ids": ["DEV-VIKRAM-IP15P", "DEV-VIKRAM-IPAD"],
            "avg_daily_txns": 1
        },
        {
            "customer_code": "CUS-40112",
            "name": "Ananya Iyer",
            "email": "ananya.iyer@example.com",
            "country": "India",
            "city": "Bengaluru",
            "typical_amount_min": 2000.0,
            "typical_amount_max": 12000.0,
            "typical_locations": ["Bengaluru", "Singapore", "London"],
            "known_device_ids": ["DEV-ANANYA-MACBOOK"],
            "avg_daily_txns": 4
        },
        {
            "customer_code": "CUS-50993",
            "name": "Rajesh Gupta",
            "email": "rajesh.gupta@example.com",
            "country": "India",
            "city": "Kolkata",
            "typical_amount_min": 800.0,
            "typical_amount_max": 4000.0,
            "typical_locations": ["Kolkata"],
            "known_device_ids": ["DEV-RAJESH-WIN10"],
            "avg_daily_txns": 2
        }
    ]

    customers_objs = []
    for c_data in customers_data:
        c = Customer(**c_data)
        db.add(c)
        customers_objs.append(c)
    
    db.flush()

    # 3. Risk Settings
    settings_data = {
        "high_risk_threshold": "60",
        "critical_risk_threshold": "80",
        "velocity_window_minutes": "10",
        "large_transaction_threshold": "50000",
        "auto_block_critical": "true",
        "simulation_speed_seconds": "3",
    }
    for k, v in settings_data.items():
        s = RiskSetting(key=k, value=v, description=f"Configuration for {k}")
        db.add(s)

    # 4. Initial Historical Transactions
    merchants = [
        ("ElectroMart", "Electronics"),
        ("Global Luxury Boutique", "Jewelry"),
        ("Apex Crypto Exchange", "Crypto"),
        ("Amazon India", "E-Commerce"),
        ("Taj Hotels", "Travel & Hospitality"),
        ("Uber India", "Transportation"),
        ("Zomato", "Food & Beverage"),
        ("QuickPay Wire", "Wire_Transfer"),
        ("Reliancedigital", "Electronics")
    ]

    now = datetime.datetime.utcnow()

    for i in range(28):
        cust = random.choice(customers_objs)
        time_offset = datetime.timedelta(hours=random.uniform(0.1, 24.0))
        txn_time = now - time_offset

        is_suspicious = (i % 4 == 0)

        merchant, category = random.choice(merchants)

        if is_suspicious:
            amount = round(cust.typical_amount_max * random.uniform(3.0, 10.0), 2)
            city = "Dubai" if cust.city != "Dubai" else "London"
            country = "International"
            device_id = f"DEV-UNRECOGNIZED-{random.randint(1000, 9999)}"
            is_new_device = True
            ip_risk = round(random.uniform(70.0, 95.0), 1)
            velocity = random.randint(3, 5)
        else:
            amount = round(random.uniform(cust.typical_amount_min, cust.typical_amount_max), 2)
            city = cust.city
            country = cust.country
            device_id = cust.known_device_ids[0]
            is_new_device = False
            ip_risk = round(random.uniform(5.0, 20.0), 1)
            velocity = 1

        assessment_res = evaluate_transaction_risk(
            amount=amount,
            country=country,
            city=city,
            device_id=device_id,
            is_new_device=is_new_device,
            ip_risk_score=ip_risk,
            transaction_velocity=velocity,
            merchant_category=category,
            timestamp_hour=txn_time.hour,
            customer=cust,
            customer_history_count=i + 1
        )

        txn_status = "APPROVED"
        if assessment_res["risk_level"] == "CRITICAL":
            txn_status = "BLOCKED"
        elif assessment_res["risk_level"] == "HIGH":
            txn_status = "REVIEW"

        txn = Transaction(
            txn_id=f"TXN-{uuid.uuid4().hex[:8].upper()}",
            customer_id=cust.id,
            merchant=merchant,
            merchant_category=category,
            amount=amount,
            currency="INR",
            timestamp=txn_time,
            country=country,
            city=city,
            payment_method=random.choice(["UPI", "Credit Card", "Debit Card", "NetBanking"]),
            device_id=device_id,
            is_new_device=is_new_device,
            ip_risk_score=ip_risk,
            transaction_velocity=velocity,
            status=txn_status,
            risk_score=assessment_res["score"],
            risk_level=assessment_res["risk_level"],
            decision=assessment_res["decision"],
            created_at=txn_time
        )
        db.add(txn)
        db.flush()

        assessment = RiskAssessment(
            transaction_id=txn.id,
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
            created_at=txn_time
        )
        db.add(assessment)

        if assessment_res["risk_level"] in ["HIGH", "CRITICAL"]:
            alert_status = "OPEN" if i < 15 else "RESOLVED"
            alert = RiskAlert(
                alert_code=f"ALT-{uuid.uuid4().hex[:6].upper()}",
                transaction_id=txn.id,
                risk_score=assessment_res["score"],
                risk_level=assessment_res["risk_level"],
                primary_signal=assessment_res["reasons"][0] if assessment_res["reasons"] else "High Risk Anomaly",
                status=alert_status,
                created_at=txn_time,
                resolved_at=now if alert_status == "RESOLVED" else None,
                resolved_by="Alex Vance" if alert_status == "RESOLVED" else None
            )
            db.add(alert)

    # 5. Audit Log Initial Entries
    audit1 = AuditLog(
        timestamp=now - datetime.timedelta(hours=5),
        user_name="System",
        user_email="system@riskpulse.ai",
        action="SYSTEM_INIT",
        entity="Risk Engine",
        entity_id="ENGINE-V1",
        description="RISKPULSE AI Risk Scoring & Behavioral Anomaly Engine initialized."
    )
    audit2 = AuditLog(
        timestamp=now - datetime.timedelta(hours=2),
        user_name="Alex Vance",
        user_email="analyst@riskpulse.ai",
        action="LOGIN",
        entity="UserSession",
        entity_id="SESS-001",
        description="Analyst Alex Vance logged into Risk Operations Center."
    )
    db.add(audit1)
    db.add(audit2)

    db.commit()
    print("Database seeding completed successfully!")
