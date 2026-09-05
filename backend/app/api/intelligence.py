from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from ..database import get_db
from ..models import Transaction

router = APIRouter(prefix="/api", tags=["Intelligence & Analytics"])


@router.get("/risk-intelligence")
def get_risk_intelligence(db: Session = Depends(get_db)):
    txns = db.query(Transaction).all()

    # 1. Risk Level Distribution
    level_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for t in txns:
        if t.risk_level in level_counts:
            level_counts[t.risk_level] += 1
    
    risk_distribution = [
        {"name": "Low Risk", "value": level_counts["LOW"], "color": "#10B981"},
        {"name": "Medium Risk", "value": level_counts["MEDIUM"], "color": "#F59E0B"},
        {"name": "High Risk", "value": level_counts["HIGH"], "color": "#EF4444"},
        {"name": "Critical Risk", "value": level_counts["CRITICAL"], "color": "#881337"},
    ]

    # 2. Score Histogram (0-20, 21-40, 41-60, 61-80, 81-100)
    score_ranges = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0
    }
    for t in txns:
        s = t.risk_score
        if s <= 20:
            score_ranges["0-20"] += 1
        elif s <= 40:
            score_ranges["21-40"] += 1
        elif s <= 60:
            score_ranges["41-60"] += 1
        elif s <= 80:
            score_ranges["61-80"] += 1
        else:
            score_ranges["81-100"] += 1

    risk_score_distribution = [{"range": k, "count": v} for k, v in score_ranges.items()]

    # 3. Transactions by Category with Amount at Risk
    category_map: Dict[str, Dict[str, Any]] = {}
    for t in txns:
        cat = t.merchant_category
        if cat not in category_map:
            category_map[cat] = {"category": cat, "total": 0, "high_risk": 0, "amount_at_risk": 0.0}
        category_map[cat]["total"] += 1
        if t.risk_level in ["HIGH", "CRITICAL"]:
            category_map[cat]["high_risk"] += 1
            category_map[cat]["amount_at_risk"] += t.amount

    risky_categories = list(category_map.values())
    risky_categories.sort(key=lambda x: x["amount_at_risk"], reverse=True)

    # 4. Top Risky Merchants
    merchant_map: Dict[str, Dict[str, Any]] = {}
    for t in txns:
        m = t.merchant
        if m not in merchant_map:
            merchant_map[m] = {"merchant": m, "category": t.merchant_category, "total_txns": 0, "high_risk_count": 0, "avg_score": 0.0, "scores": []}
        merchant_map[m]["total_txns"] += 1
        merchant_map[m]["scores"].append(t.risk_score)
        if t.risk_level in ["HIGH", "CRITICAL"]:
            merchant_map[m]["high_risk_count"] += 1

    top_risky_merchants = []
    for m, data in merchant_map.items():
        data["avg_score"] = round(sum(data["scores"]) / len(data["scores"]), 1)
        del data["scores"]
        top_risky_merchants.append(data)
    top_risky_merchants.sort(key=lambda x: (x["high_risk_count"], x["avg_score"]), reverse=True)

    # 5. Geographic Activity
    geo_map: Dict[str, Dict[str, Any]] = {}
    for t in txns:
        loc = f"{t.city}, {t.country}"
        if loc not in geo_map:
            geo_map[loc] = {"location": loc, "total": 0, "high_risk": 0, "volume": 0.0}
        geo_map[loc]["total"] += 1
        geo_map[loc]["volume"] += t.amount
        if t.risk_level in ["HIGH", "CRITICAL"]:
            geo_map[loc]["high_risk"] += 1

    geographic_activity = list(geo_map.values())
    geographic_activity.sort(key=lambda x: x["total"], reverse=True)

    # 6. Hourly Trend (Past 12 hours)
    now = datetime.datetime.utcnow()
    hourly_map = {}
    for h in range(12, -1, -1):
        hr_time = now - datetime.timedelta(hours=h)
        label = hr_time.strftime("%H:00")
        hourly_map[label] = {"time": label, "monitored": 0, "high_risk": 0, "blocked": 0, "volume": 0.0}

    for t in txns:
        if t.timestamp:
            label = t.timestamp.strftime("%H:00")
            if label in hourly_map:
                hourly_map[label]["monitored"] += 1
                hourly_map[label]["volume"] += t.amount
                if t.risk_level in ["HIGH", "CRITICAL"]:
                    hourly_map[label]["high_risk"] += 1
                if t.status == "BLOCKED":
                    hourly_map[label]["blocked"] += 1

    hourly_trend = list(hourly_map.values())

    return {
        "risk_distribution": risk_distribution,
        "risk_score_distribution": risk_score_distribution,
        "risky_categories": risky_categories,
        "top_risky_merchants": top_risky_merchants[:8],
        "geographic_activity": geographic_activity[:10],
        "hourly_trend": hourly_trend
    }


@router.get("/analytics")
def get_analytics(
    period: str = Query("7d"),  # today, 7d, 30d
    db: Session = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    if period == "today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "30d":
        cutoff = now - datetime.timedelta(days=30)
    else:  # 7d default
        cutoff = now - datetime.timedelta(days=7)

    txns = db.query(Transaction).filter(Transaction.timestamp >= cutoff).all()

    total_volume = len(txns)
    total_amount = sum(t.amount for t in txns)
    high_risk_count = sum(1 for t in txns if t.risk_level in ["HIGH", "CRITICAL"])
    blocked_count = sum(1 for t in txns if t.status == "BLOCKED")
    blocked_amount = sum(t.amount for t in txns if t.status == "BLOCKED")
    reviewed_count = sum(1 for t in txns if t.status == "REVIEW")
    approved_count = sum(1 for t in txns if t.status == "APPROVED")

    avg_risk_score = round(sum(t.risk_score for t in txns) / total_volume, 1) if total_volume > 0 else 0.0
    detection_rate = round((high_risk_count / total_volume) * 100.0, 1) if total_volume > 0 else 0.0

    decision_distribution = [
        {"name": "Approved (Allow)", "count": approved_count, "color": "#10B981"},
        {"name": "Under Review", "count": reviewed_count, "color": "#F59E0B"},
        {"name": "Blocked", "count": blocked_count, "color": "#EF4444"},
    ]

    return {
        "period": period,
        "total_volume": total_volume,
        "total_amount": round(total_amount, 2),
        "high_risk_count": high_risk_count,
        "blocked_count": blocked_count,
        "blocked_amount": round(blocked_amount, 2),
        "avg_risk_score": avg_risk_score,
        "detection_rate": detection_rate,
        "decision_distribution": decision_distribution,
    }
