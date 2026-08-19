from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.api.deps import get_db, RoleChecker
from app.models.patient import Patient
from app.models.referral import Referral
from app.services.quality_engine import check_referral_quality

router = APIRouter()

ALLOWED_ROLES = ["Admin", "Doctor", "CareCoordinator"]

@router.get("/metrics", dependencies=[Depends(RoleChecker(ALLOWED_ROLES))])
def get_metrics(db: Session = Depends(get_db)):
    """
    Retrieve real-time metrics for the healthcare dashboard.
    Aggregates patient/referral metrics, status & priority distributions, and dynamic data quality.
    """
    # 1. Base Counts
    total_patients = db.execute(select(func.count(Patient.id))).scalar_one()
    
    pending_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "Pending")).scalar_one()
    approved_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "Approved")).scalar_one()
    missing_info_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "MissingInfo")).scalar_one()
    under_review_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "UnderReview")).scalar_one()
    rejected_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "Rejected")).scalar_one()

    # 2. High Priority Cases (High priority referrals that are not completed)
    high_priority_referrals = db.execute(
        select(func.count(Referral.id))
        .where(Referral.priority == "High")
        .where(Referral.status.notin_(["Approved", "Rejected"]))
    ).scalar_one()

    # 3. Dynamic Data Quality calculations
    referrals = db.execute(select(Referral)).scalars().all()
    if referrals:
        total_score = sum(check_referral_quality(r).quality_score for r in referrals)
        average_data_quality_score = round(total_score / len(referrals), 1)
    else:
        average_data_quality_score = 100.0

    # 4. Status Distributions (Chart Data)
    status_distribution = [
        {"name": "Pending", "value": pending_referrals},
        {"name": "Under Review", "value": under_review_referrals},
        {"name": "Missing Info", "value": missing_info_referrals},
        {"name": "Approved", "value": approved_referrals},
        {"name": "Rejected", "value": rejected_referrals}
    ]

    # 5. Priority Distributions (Chart Data)
    low_priority = db.execute(select(func.count(Referral.id)).where(Referral.priority == "Low")).scalar_one()
    medium_priority = db.execute(select(func.count(Referral.id)).where(Referral.priority == "Medium")).scalar_one()
    high_priority = db.execute(select(func.count(Referral.id)).where(Referral.priority == "High")).scalar_one()
    
    priority_distribution = [
        {"name": "Low", "value": low_priority},
        {"name": "Medium", "value": medium_priority},
        {"name": "High", "value": high_priority}
    ]

    return {
        "total_patients": total_patients,
        "pending_referrals": pending_referrals,
        "approved_referrals": approved_referrals,
        "missing_info_referrals": missing_info_referrals,
        "high_priority_referrals": high_priority_referrals,
        "average_data_quality_score": average_data_quality_score,
        "status_distribution": status_distribution,
        "priority_distribution": priority_distribution
    }
