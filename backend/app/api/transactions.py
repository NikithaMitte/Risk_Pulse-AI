from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
import datetime

from ..database import get_db
from ..models import Transaction, RiskAssessment, AuditLog, User, Customer
from ..schemas import TransactionOut, TransactionActionRequest
from .auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=List[TransactionOut])
def get_transactions(
    risk_level: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    merchant_category: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("newest"),  # newest, highest_risk, highest_amount
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(Transaction.risk_level == risk_level.upper())
    
    if decision and decision.upper() != "ALL":
        query = query.filter(Transaction.decision == decision.upper())

    if merchant_category and merchant_category.upper() != "ALL":
        query = query.filter(Transaction.merchant_category == merchant_category)

    if payment_method and payment_method.upper() != "ALL":
        query = query.filter(Transaction.payment_method == payment_method)

    if search:
        search_pattern = f"%{search}%"
        query = query.join(Customer, isouter=True).filter(
            or_(
                Transaction.txn_id.ilike(search_pattern),
                Transaction.merchant.ilike(search_pattern),
                Customer.customer_code.ilike(search_pattern),
                Customer.name.ilike(search_pattern)
            )
        )

    if sort_by == "highest_risk":
        query = query.order_by(desc(Transaction.risk_score))
    elif sort_by == "highest_amount":
        query = query.order_by(desc(Transaction.amount))
    else:  # newest
        query = query.order_by(desc(Transaction.created_at))

    txns = query.offset(offset).limit(limit).all()
    return [TransactionOut.model_validate(t) for t in txns]


@router.get("/{txn_id_or_code}", response_model=TransactionOut)
def get_transaction_detail(txn_id_or_code: str, db: Session = Depends(get_db)):
    if txn_id_or_code.isdigit():
        txn = db.query(Transaction).filter(Transaction.id == int(txn_id_or_code)).first()
    else:
        txn = db.query(Transaction).filter(Transaction.txn_id == txn_id_or_code).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return TransactionOut.model_validate(txn)


@router.post("/{txn_id}/approve", response_model=TransactionOut)
def approve_transaction(
    txn_id: int,
    req: TransactionActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "APPROVED"
    txn.decision = "ALLOW"

    note_text = f" Note: {req.note}" if req.note else ""
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_name=current_user.name,
        user_email=current_user.email,
        action="APPROVE_TRANSACTION",
        entity="Transaction",
        entity_id=txn.txn_id,
        description=f"Analyst {current_user.name} approved transaction {txn.txn_id} (₹{txn.amount:,.2f}).{note_text}"
    )
    db.add(audit)
    db.commit()
    db.refresh(txn)

    return TransactionOut.model_validate(txn)


@router.post("/{txn_id}/block", response_model=TransactionOut)
def block_transaction(
    txn_id: int,
    req: TransactionActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "BLOCKED"
    txn.decision = "BLOCK"

    note_text = f" Note: {req.note}" if req.note else ""
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_name=current_user.name,
        user_email=current_user.email,
        action="BLOCK_TRANSACTION",
        entity="Transaction",
        entity_id=txn.txn_id,
        description=f"Analyst {current_user.name} blocked transaction {txn.txn_id} (Score: {txn.risk_score:.0f}, Amount: ₹{txn.amount:,.2f}).{note_text}"
    )
    db.add(audit)
    db.commit()
    db.refresh(txn)

    return TransactionOut.model_validate(txn)


@router.post("/{txn_id}/escalate", response_model=TransactionOut)
def escalate_transaction(
    txn_id: int,
    req: TransactionActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "REVIEW"
    txn.decision = "REVIEW"

    note_text = f" Note: {req.note}" if req.note else ""
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_name=current_user.name,
        user_email=current_user.email,
        action="ESCALATE_TRANSACTION",
        entity="Transaction",
        entity_id=txn.txn_id,
        description=f"Analyst {current_user.name} escalated transaction {txn.txn_id} for senior review.{note_text}"
    )
    db.add(audit)
    db.commit()
    db.refresh(txn)

    return TransactionOut.model_validate(txn)
