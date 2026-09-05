from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Transaction
from ..schemas import DashboardSummary
from .auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_monitored = db.query(Transaction).count()

    if total_monitored == 0:
        return DashboardSummary(
            total_monitored=0,
            high_risk_count=0,
            blocked_count=0,
            amount_at_risk=0.0,
            medium_risk_count=0,
            low_risk_count=0,
            risk_detection_rate=0.0,
            avg_risk_score=0.0,
            total_volume_amount=0.0
        )

    high_critical_txns = db.query(Transaction).filter(Transaction.risk_level.in_(["HIGH", "CRITICAL"])).all()
    high_risk_count = len(high_critical_txns)

    blocked_count = db.query(Transaction).filter(Transaction.status == "BLOCKED").count()
    medium_risk_count = db.query(Transaction).filter(Transaction.risk_level == "MEDIUM").count()
    low_risk_count = db.query(Transaction).filter(Transaction.risk_level == "LOW").count()

    amount_at_risk = sum(t.amount for t in high_critical_txns)
    total_volume_amount = db.query(func.sum(Transaction.amount)).scalar() or 0.0

    avg_score = db.query(func.avg(Transaction.risk_score)).scalar() or 0.0
    risk_detection_rate = round((high_risk_count / total_monitored) * 100.0, 1)

    return DashboardSummary(
        total_monitored=total_monitored,
        high_risk_count=high_risk_count,
        blocked_count=blocked_count,
        amount_at_risk=round(amount_at_risk, 2),
        medium_risk_count=medium_risk_count,
        low_risk_count=low_risk_count,
        risk_detection_rate=risk_detection_rate,
        avg_risk_score=round(avg_score, 1),
        total_volume_amount=round(total_volume_amount, 2)
    )
