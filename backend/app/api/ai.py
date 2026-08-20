from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from pydantic import BaseModel, Field

from app.api.deps import get_db, RoleChecker, get_current_active_user, verify_patient_access
from app.services.referral import referral_service
from app.services.ai_agent import ai_agent_service
from app.services.audit import log_audit_event
from app.models.user import User, UserRole
from app.schemas.referral import AIAnalysisResponse

router = APIRouter()

# Strictly Admin and Doctor can trigger AI analysis. Caregiver receives 403 Forbidden.
ALLOWED_ROLES = [UserRole.ADMIN.value, UserRole.DOCTOR.value, UserRole.CAREGIVER.value]

class AIAnalysisRequest(BaseModel):
    referral_id: uuid.UUID = Field(..., description="UUID of the referral to analyze")

@router.post("/analyze-referral", response_model=AIAnalysisResponse, dependencies=[Depends(RoleChecker(ALLOWED_ROLES))])
def analyze_referral(
    payload: AIAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Trigger AI analysis for a referral (Admin and Doctor only).
    Caregivers attempting to trigger AI analysis will receive HTTP 403 Forbidden.
    """
    try:
        referral = referral_service.get_referral(db, referral_id=payload.referral_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
        
    # Check resource access to referral's patient
    verify_patient_access(patient_id=referral.patient_id, db=db, user=current_user)

    analysis = ai_agent_service.analyze_referral(db, referral)
    
    # Audit log
    log_audit_event(db, user_id=current_user.id, action="ai_analysis_requested", resource_type="referrals", resource_id=referral.id)
    
    return analysis
