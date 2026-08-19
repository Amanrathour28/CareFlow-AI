from datetime import date, datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, EmailStr, Field
from app.schemas.quality import DataQualityReport

class InsuranceBase(BaseModel):
    insurance_provider: str = Field(..., max_length=100, description="Name of insurance provider")
    policy_number: str = Field(..., max_length=50, description="Insurance policy number")
    group_number: Optional[str] = Field(None, max_length=50, description="Insurance group number")
    plan_type: str = Field("PPO", description="PPO, HMO, or EPO")
    status: str = Field("Active", description="Active or Inactive")

class InsuranceCreate(InsuranceBase):
    pass

class InsuranceResponse(InsuranceBase):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class MedicationBase(BaseModel):
    drug_name: str = Field(..., max_length=100, description="Brand or generic name of drug")
    dosage: str = Field(..., max_length=50, description="Strength of drug (e.g. 500mg)")
    frequency: str = Field(..., max_length=50, description="Dosing frequency (e.g. once daily)")
    status: str = Field("Active", description="Active or Discontinued")
    prescribed_date: date

class MedicationCreate(MedicationBase):
    pass

class MedicationResponse(MedicationBase):
    id: uuid.UUID
    patient_id: uuid.UUID

    model_config = {
        "from_attributes": True
    }


class LabResultBase(BaseModel):
    test_name: str = Field(..., max_length=100, description="Diagnostic test name")
    test_value: str = Field(..., max_length=50, description="Measured lab value")
    unit: str = Field(..., max_length=20, description="Measurement unit (e.g. mg/dL)")
    reference_range: str = Field(..., max_length=50, description="Expected normal reference range")
    status: str = Field("Normal", description="Normal or Abnormal")
    test_date: date

class LabResultCreate(LabResultBase):
    pass

class LabResultResponse(LabResultBase):
    id: uuid.UUID
    patient_id: uuid.UUID

    model_config = {
        "from_attributes": True
    }


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: date
    gender: str = Field(..., max_length=20)
    phone: str = Field(..., max_length=20)
    email: EmailStr
    address: Optional[str] = Field(None, max_length=255)
    medical_history_summary: Optional[str] = Field(None, max_length=1000)
    assigned_doctor_id: Optional[uuid.UUID] = Field(None, description="UUID of assigned Doctor")
    assigned_caregiver_id: Optional[uuid.UUID] = Field(None, description="UUID of assigned Caregiver")

class PatientCreate(PatientBase):
    insurance: Optional[InsuranceCreate] = None
    medications: Optional[List[MedicationCreate]] = Field(default_factory=list)
    laboratory_results: Optional[List[LabResultCreate]] = Field(default_factory=list)

class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=255)
    medical_history_summary: Optional[str] = Field(None, max_length=1000)
    assigned_doctor_id: Optional[uuid.UUID] = None
    assigned_caregiver_id: Optional[uuid.UUID] = None

class PatientResponse(PatientBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class PatientDetailResponse(PatientResponse):
    insurance: Optional[InsuranceResponse] = None
    medications: List[MedicationResponse] = []
    laboratory_results: List[LabResultResponse] = []
    data_quality: Optional[DataQualityReport] = None

    model_config = {
        "from_attributes": True
    }

class PatientListResponse(BaseModel):
    items: List[PatientResponse]
    total: int
    page: int
    size: int
