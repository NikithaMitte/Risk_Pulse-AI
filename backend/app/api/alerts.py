from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
import datetime

from ..database import get_db
from ..models import RiskAlert, AuditLog, User
from ..schemas import RiskAlertOut, AlertResolveRequest
from .auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[RiskAlertOut])
def get_alerts(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(RiskAlert)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(RiskAlert.status == status_filter.upper())
    
    alerts = query.order_by(desc(RiskAlert.created_at)).limit(limit).all()
    return [RiskAlertOut.model_validate(a) for a in alerts]


@router.post("/{alert_id}/resolve", response_model=RiskAlertOut)
def resolve_alert(
    alert_id: int,
    req: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Risk alert not found")

    alert.status = req.status
    alert.resolved_at = datetime.datetime.utcnow()
    alert.resolved_by = current_user.name

    note_msg = f" Reason: {req.note}" if req.note else ""
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_name=current_user.name,
        user_email=current_user.email,
        action="RESOLVE_ALERT",
        entity="RiskAlert",
        entity_id=alert.alert_code,
        description=f"Analyst {current_user.name} set status of risk alert {alert.alert_code} to {req.status}.{note_msg}"
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)

    return RiskAlertOut.model_validate(alert)
