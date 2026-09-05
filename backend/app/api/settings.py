from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import datetime

from ..database import get_db
from ..models import RiskSetting, AuditLog, User
from ..schemas import RiskSettingsOut, RiskSettingsUpdate
from .auth import get_current_user

router = APIRouter(prefix="/api/risk-settings", tags=["Settings"])


@router.get("", response_model=RiskSettingsOut)
def get_risk_settings(db: Session = Depends(get_db)):
    settings_records = db.query(RiskSetting).all()
    res = {s.key: s.value for s in settings_records}
    return RiskSettingsOut(settings=res)


@router.put("", response_model=RiskSettingsOut)
def update_risk_settings(
    update_in: RiskSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    for key, value in update_in.settings.items():
        setting = db.query(RiskSetting).filter(RiskSetting.key == key).first()
        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.datetime.utcnow()
        else:
            setting = RiskSetting(key=key, value=str(value), description=f"Setting for {key}")
            db.add(setting)

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_name=current_user.name,
        user_email=current_user.email,
        action="UPDATE_SETTINGS",
        entity="RiskSetting",
        entity_id="GLOBAL_SETTINGS",
        description=f"Analyst {current_user.name} updated risk engine thresholds and system parameters."
    )
    db.add(audit)
    db.commit()

    settings_records = db.query(RiskSetting).all()
    res = {s.key: s.value for s in settings_records}
    return RiskSettingsOut(settings=res)
