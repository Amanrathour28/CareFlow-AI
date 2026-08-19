from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, RoleChecker
from app.services.patient import patient_service
from app.services.quality_engine import check_patient_quality
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientDetailResponse,
    PatientListResponse
)

router = APIRouter()

# Authorizations
ALL_ROLES = ["Admin", "Doctor", "CareCoordinator"]
WRITE_ROLES = ["Admin", "CareCoordinator"]
ADMIN_ONLY = ["Admin"]

@router.get("", response_model=PatientListResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def list_patients(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve a paginated list of patient records. Supports name/email search."""
    items, total = patient_service.list_patients(db, page=page, size=size, search=search)
    return PatientListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=PatientDetailResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(WRITE_ROLES))])
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db)
):
    """Create a new patient file. Runs Data Quality Engine before saving and returns the quality report."""
    # Run data quality check BEFORE saving
    quality_report = check_patient_quality(patient_in)
    patient = patient_service.create_patient(db, patient_in)
    # Build response and attach the quality report (ORM object → schema)
    response = PatientDetailResponse.model_validate(patient)
    response.data_quality = quality_report
    return response


@router.get("/{id}", response_model=PatientDetailResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def get_patient(
    id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Fetch the Unified Patient Record including demographics, insurance, medications, and labs."""
    try:
        return patient_service.get_patient(db, patient_id=id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{id}", response_model=PatientResponse, dependencies=[Depends(RoleChecker(WRITE_ROLES))])
def update_patient(
    id: uuid.UUID,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db)
):
    """Update demographic and history details on a patient record."""
    try:
        return patient_service.update_patient(db, patient_id=id, patient_in=patient_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def delete_patient(
    id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Delete a patient record from the system (Cascade deletes all associated tables)."""
    try:
        patient_service.delete_patient(db, patient_id=id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
