from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, verify_patient_access
from app.services.patient import patient_service
from app.services.quality_engine import check_patient_quality
from app.services.audit import log_audit_event
from app.models.user import User, UserRole
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientDetailResponse,
    PatientListResponse
)

router = APIRouter()

# Role Collections
ALL_ROLES = [UserRole.ADMIN.value, UserRole.DOCTOR.value, UserRole.CAREGIVER.value]
ADMIN_ONLY = [UserRole.ADMIN.value]
DOCTOR_AND_ADMIN = [UserRole.ADMIN.value, UserRole.DOCTOR.value]


CREATE_PATIENT_ROLES = [UserRole.ADMIN.value, UserRole.DOCTOR.value, UserRole.CAREGIVER.value]


@router.get("", response_model=PatientListResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def list_patients(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a paginated list of patient records.
    Filters at the database query level:
    - Admin: All patients
    - Doctor: Patients assigned to attending doctor
    - Caregiver: Patients assigned to caregiver
    """
    items, total = patient_service.list_patients(db, user=current_user, page=page, size=size, search=search)
    return PatientListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=PatientDetailResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(CREATE_PATIENT_ROLES))])
def create_patient(
    patient_in: PatientCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new patient file (Admin only). Runs Data Quality Engine and records audit log."""
    quality_report = check_patient_quality(patient_in)
    patient = patient_service.create_patient(db, patient_in)
    
    # Audit log
    log_audit_event(db, user_id=current_user.id, action="create_patient", resource_type="patients", resource_id=patient.id)

    response = PatientDetailResponse.model_validate(patient)
    response.data_quality = quality_report
    return response


@router.get("/{id}", response_model=PatientDetailResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def get_patient(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Fetch patient details after verifying resource-level authorization."""
    # Resource-level authorization check
    patient = verify_patient_access(patient_id=id, db=db, user=current_user)
    return patient_service.get_patient(db, patient_id=patient.id)


@router.put("/{id}", response_model=PatientResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def update_patient(
    id: uuid.UUID,
    patient_in: PatientUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update patient details. Enforces resource-level assignment authorization."""
    patient = verify_patient_access(patient_id=id, db=db, user=current_user)
    updated = patient_service.update_patient(db, patient_id=patient.id, patient_in=patient_in)
    
    # Audit log
    log_audit_event(db, user_id=current_user.id, action="update_patient", resource_type="patients", resource_id=patient.id)
    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def delete_patient(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a patient record (Admin only)."""
    try:
        patient_service.delete_patient(db, patient_id=id)
        log_audit_event(db, user_id=current_user.id, action="delete_patient", resource_type="patients", resource_id=id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
