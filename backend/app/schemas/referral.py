import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.patient import PatientResponse
from app.schemas.provider import ProviderResponse
from app.schemas.quality import DataQualityReport

class ReferralBase(BaseModel):
    patient_id: uuid.UUID
    provider_id: uuid.UUID
    diagnosis_code: str = Field(..., max_length=20, description="ICD-10 Code")
    diagnosis_description: str = Field(..., max_length=255, description="ICD-10 Code Description")
    requested_procedure: str = Field(..., max_length=255, description="CPT Code or description of procedure")
    insurance_provider: str = Field(..., max_length=100)
    status: str = Field("Pending", description="Pending, UnderReview, MissingInfo, Approved, Rejected")
    priority: str = Field("Medium", description="Low, Medium, High")

class ReferralCreate(ReferralBase):
    pass

class ReferralUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Pending, UnderReview, MissingInfo, Approved, Rejected")
    priority: Optional[str] = Field(None, description="Low, Medium, High")
    diagnosis_code: Optional[str] = Field(None, max_length=20)
    diagnosis_description: Optional[str] = Field(None, max_length=255)
    requested_procedure: Optional[str] = Field(None, max_length=255)
    insurance_provider: Optional[str] = Field(None, max_length=100)

class AIAnalysisResponse(BaseModel):
    completeness_score: int = Field(..., description="0-100 score of referral data completeness")
    missing_information: List[str] = Field(..., description="List of missing documents/information")
    potential_issues: List[str] = Field(..., description="Potential administrative or prior auth issues")
    recommendation: str = Field(..., description="Recommended next administrative action")
    confidence: float = Field(..., description="LLM confidence score (0.0-1.0)")
    human_review_required: bool = True
    disclaimer: str = "Administrative workflow assistance only. Not a clinical decision."

class ReferralResponse(ReferralBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    data_quality: Optional[DataQualityReport] = None  # populated on create/validate
    ai_analysis: Optional[AIAnalysisResponse] = None  # populated on analysis

    model_config = {
        "from_attributes": True
    }

class ReferralDetailResponse(ReferralResponse):
    patient: PatientResponse
    provider: ProviderResponse

    model_config = {
        "from_attributes": True
    }

class ReferralListResponse(BaseModel):
    items: List[ReferralResponse]
    total: int
    page: int
    size: int
