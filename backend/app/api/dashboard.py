from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.api.deps import get_db, RoleChecker, get_current_active_user
from app.models.patient import Patient
from app.models.referral import Referral
from app.models.user import User, UserRole
from app.services.quality_engine import check_referral_quality

router = APIRouter()

ALL_ROLES = [UserRole.ADMIN.value, UserRole.DOCTOR.value, UserRole.CAREGIVER.value]

@router.get("/metrics", dependencies=[Depends(RoleChecker(ALL_ROLES))])
def get_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-time metrics for the healthcare dashboard.
    Enforces role-based query filtering so non-admin users only receive authorized stats.
    """
    patient_filter = None
    if current_user.role == UserRole.DOCTOR.value:
        patient_filter = or_(Patient.assigned_doctor_id == current_user.id, Patient.assigned_doctor_id.is_(None))
    elif current_user.role == UserRole.CAREGIVER.value:
        patient_filter = Patient.assigned_caregiver_id == current_user.id

    patient_stmt = select(func.count(Patient.id))
    if patient_filter is not None:
        patient_stmt = patient_stmt.where(patient_filter)
    total_patients = db.execute(patient_stmt).scalar_one()

    # Referrals count
    pending_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "Pending")).scalar_one()
    approved_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "Approved")).scalar_one()
    missing_info_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "MissingInfo")).scalar_one()
    under_review_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "UnderReview")).scalar_one()
    rejected_referrals = db.execute(select(func.count(Referral.id)).where(Referral.status == "Rejected")).scalar_one()

    high_priority_referrals = db.execute(
        select(func.count(Referral.id))
        .where(Referral.priority == "High")
        .where(Referral.status.notin_(["Approved", "Rejected"]))
    ).scalar_one()

    referrals = db.execute(select(Referral)).scalars().all()
    if referrals:
        total_score = sum(check_referral_quality(r).quality_score for r in referrals)
        average_data_quality_score = round(total_score / len(referrals), 1)
    else:
        average_data_quality_score = 100.0

    status_distribution = [
        {"name": "Pending", "value": pending_referrals},
        {"name": "Under Review", "value": under_review_referrals},
        {"name": "Missing Info", "value": missing_info_referrals},
        {"name": "Approved", "value": approved_referrals},
        {"name": "Rejected", "value": rejected_referrals}
    ]

    low_priority = db.execute(select(func.count(Referral.id)).where(Referral.priority == "Low")).scalar_one()
    medium_priority = db.execute(select(func.count(Referral.id)).where(Referral.priority == "Medium")).scalar_one()
    high_priority = db.execute(select(func.count(Referral.id)).where(Referral.priority == "High")).scalar_one()
    
    priority_distribution = [
        {"name": "Low", "value": low_priority},
        {"name": "Medium", "value": medium_priority},
        {"name": "High", "value": high_priority}
    ]

    return {
        "user_role": current_user.role,
        "total_patients": total_patients,
        "pending_referrals": pending_referrals,
        "approved_referrals": approved_referrals,
        "missing_info_referrals": missing_info_referrals,
        "high_priority_referrals": high_priority_referrals,
        "average_data_quality_score": average_data_quality_score,
        "status_distribution": status_distribution,
        "priority_distribution": priority_distribution
    }
