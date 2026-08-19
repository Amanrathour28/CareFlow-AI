from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from pydantic import BaseModel, Field

from app.api.deps import get_db, RoleChecker
from app.services.referral import referral_service
from app.services.ai_agent import ai_agent_service
from app.schemas.referral import AIAnalysisResponse

router = APIRouter()

# Allow Care Coordinators and Admins to trigger AI analysis
ALLOWED_ROLES = ["Admin", "CareCoordinator"]

class AIAnalysisRequest(BaseModel):
    referral_id: uuid.UUID = Field(..., description="UUID of the referral to analyze")

@router.post("/analyze-referral", response_model=AIAnalysisResponse, dependencies=[Depends(RoleChecker(ALLOWED_ROLES))])
def analyze_referral(
    payload: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger AI analysis for a given referral ID.
    Retrieves referral details and patient profile, runs checks, and saves structured JSON report.
    """
    try:
        referral = referral_service.get_referral(db, referral_id=payload.referral_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
        
    analysis = ai_agent_service.analyze_referral(db, referral)
    return analysis
