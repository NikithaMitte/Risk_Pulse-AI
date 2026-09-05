import math
from typing import Dict, Any, Tuple, List
from ..models import Customer, Transaction, RiskAssessment


def evaluate_transaction_risk(
    amount: float,
    country: str,
    city: str,
    device_id: str,
    is_new_device: bool,
    ip_risk_score: float,
    transaction_velocity: int,
    merchant_category: str,
    timestamp_hour: int,
    customer: Customer,
    customer_history_count: int = 5
) -> Dict[str, Any]:
    """
    Explainable Risk Engine that compares current transaction against customer baseline
    and outputs a normalized 0-100 risk score, risk level, decision, reasons, and factor breakdown.
    """
    reasons: List[str] = []

    # 1. Amount Anomaly (Max 28 points)
    amount_score = 0.0
    typical_max = customer.typical_amount_max if customer else 5000.0
    typical_min = customer.typical_amount_min if customer else 500.0
    ratio = amount / max(typical_max, 1.0)

    if ratio > 1.0:
        # Scale logarithmically up to 28 points
        multiplier = round(ratio, 1)
        amount_score = min(28.0, 10.0 + (ratio - 1.0) * 2.5)
        reasons.append(
            f"Transaction amount (₹{amount:,.2f}) is {multiplier}× above customer's typical limit (₹{typical_max:,.2f})."
        )
    elif amount > 50000.0:
        amount_score = 15.0
        reasons.append(f"High-value payment (₹{amount:,.2f}) exceeds standard single-transaction thresholds.")

    # 2. Device Anomaly (Max 22 points)
    device_score = 0.0
    known_devices = customer.known_device_ids if (customer and customer.known_device_ids) else []
    if is_new_device or (device_id not in known_devices):
        device_score = 22.0
        reasons.append(f"Payment initiated from a newly observed device ({device_id}).")

    # 3. Velocity Anomaly (Max 25 points)
    velocity_score = 0.0
    if transaction_velocity >= 4:
        velocity_score = 25.0
        reasons.append(f"Extreme transaction velocity: {transaction_velocity} transactions within 10 minutes.")
    elif transaction_velocity == 3:
        velocity_score = 18.0
        reasons.append(f"High transaction velocity: 3 transactions within 10 minutes.")
    elif transaction_velocity == 2:
        velocity_score = 8.0
        reasons.append(f"Elevated velocity: 2 consecutive transactions in a short window.")

    # 4. Location Anomaly (Max 16 points)
    location_score = 0.0
    known_locations = customer.typical_locations if (customer and customer.typical_locations) else [customer.city]
    if city not in known_locations and country not in known_locations:
        location_score = 16.0
        reasons.append(f"Geographic anomaly: Transaction in {city}, {country} differs from customer baseline ({', '.join(known_locations)}).")

    # 5. IP Risk (Max 15 points)
    ip_score = 0.0
    if ip_risk_score > 50:
        ip_score = min(15.0, (ip_risk_score / 100.0) * 15.0)
        reasons.append(f"Originating IP address flagged with high risk score ({ip_risk_score:.0f}/100).")

    # 6. Time & Category Anomaly (Max 10 points)
    time_score = 0.0
    if 1 <= timestamp_hour <= 4:
        time_score += 5.0
        reasons.append(f"Unusual transaction time ({timestamp_hour:02d}:00 HRS off-peak hours).")
    
    if merchant_category.lower() in ["electronics", "jewelry", "crypto", "gambling", "wire_transfer"]:
        time_score += 5.0

    # 7. Customer Behavioral Trust Discount (-15 points)
    behavior_discount = 0.0
    if customer_history_count > 10 and len(reasons) == 0:
        behavior_discount = -15.0

    # Total Raw Calculation
    raw_total = amount_score + device_score + velocity_score + location_score + ip_score + time_score + behavior_discount
    final_score = max(0.0, min(100.0, raw_total))
    final_score = round(final_score, 1)

    # Risk Level Assignment
    if final_score >= 80.0:
        risk_level = "CRITICAL"
        decision = "BLOCK"
    elif final_score >= 60.0:
        risk_level = "HIGH"
        decision = "REVIEW"
    elif final_score >= 30.0:
        risk_level = "MEDIUM"
        decision = "REVIEW" if final_score >= 45.0 else "ALLOW"
    else:
        risk_level = "LOW"
        decision = "ALLOW"

    # Factor Breakdown Percentages
    scores_dict = {
        "Amount Anomaly": max(0.0, amount_score),
        "Device Anomaly": max(0.0, device_score),
        "Velocity Anomaly": max(0.0, velocity_score),
        "Location Anomaly": max(0.0, location_score),
        "IP Risk": max(0.0, ip_score),
        "Time & Category": max(0.0, time_score),
    }

    sum_positive = sum(scores_dict.values())
    factor_breakdown: Dict[str, float] = {}
    if sum_positive > 0:
        for k, v in scores_dict.items():
            factor_breakdown[k] = round((v / sum_positive) * 100.0, 1)
    else:
        factor_breakdown = {k: 0.0 for k in scores_dict.keys()}
        factor_breakdown["Normal Pattern"] = 100.0

    if not reasons:
        reasons.append("Transaction aligns with established customer spending profile and device signatures.")

    # Risk Copilot Summary Generation (Deterministic NLP engine)
    copilot_summary = generate_copilot_explanation(
        amount=amount,
        customer_name=customer.name if customer else "Customer",
        risk_level=risk_level,
        decision=decision,
        reasons=reasons,
        final_score=final_score
    )

    return {
        "score": final_score,
        "risk_level": risk_level,
        "decision": decision,
        "amount_score": amount_score,
        "device_score": device_score,
        "velocity_score": velocity_score,
        "location_score": location_score,
        "ip_score": ip_score,
        "time_score": time_score,
        "behavior_score": behavior_discount,
        "reasons": reasons,
        "factor_breakdown": factor_breakdown,
        "summary": copilot_summary
    }


def generate_copilot_explanation(
    amount: float,
    customer_name: str,
    risk_level: str,
    decision: str,
    reasons: List[str],
    final_score: float
) -> str:
    """
    Generates a clear, professional risk copilot summary for analysts.
    """
    if risk_level in ["CRITICAL", "HIGH"]:
        primary_triggers = "; ".join(reasons[:2])
        return (
            f"Transaction evaluated with a {risk_level} risk score of {final_score:.0f}/100. "
            f"Key anomaly signals detected for {customer_name}: {primary_triggers}. "
            f"Automated policy recommended action: {decision}. Urgent review or block advised."
        )
    elif risk_level == "MEDIUM":
        return (
            f"Transaction exhibits moderate variance (Score: {final_score:.0f}/100) from baseline behavior. "
            f"Primary observation: {reasons[0]}. "
            f"System action set to {decision} for analyst evaluation."
        )
    else:
        return (
            f"Transaction validated successfully with a LOW risk score of {final_score:.0f}/100. "
            f"Payment activity conforms to {customer_name}'s historical velocity, location, and device signatures. "
            f"Decision: ALLOW."
        )
