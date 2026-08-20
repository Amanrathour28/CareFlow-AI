from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, RoleChecker
from app.services.referral import referral_service
from app.services.quality_engine import check_referral_quality
from app.schemas.referral import (
    ReferralCreate,
    ReferralUpdate,
    ReferralResponse,
    ReferralDetailResponse,
    ReferralListResponse
)

router = APIRouter()

# Authorizations
ALL_ROLES = ["Admin", "Doctor", "Caregiver", "CareCoordinator"]
WRITE_ROLES = ["Admin", "Doctor", "Caregiver", "CareCoordinator"]
PATCH_ROLES = ["Admin", "Caregiver", "CareCoordinator"]
ADMIN_ONLY = ["Admin"]

@router.get("", response_model=ReferralListResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def list_referrals(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    patient_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    """Retrieve a paginated list of referral files. Supports status, priority, and patient filters."""
    items, total = referral_service.list_referrals(
        db, page=page, size=size, status=status, priority=priority, patient_id=patient_id
    )
    return ReferralListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(WRITE_ROLES))])
def create_referral(
    referral_in: ReferralCreate,
    db: Session = Depends(get_db)
):
    """Submit a new referral request. Runs Data Quality Engine and returns quality report with the result."""
    # Run quality check before saving
    quality_report = check_referral_quality(referral_in)
    try:
        referral = referral_service.create_referral(db, referral_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    # Attach quality report to response
    response = ReferralResponse.model_validate(referral)
    response.data_quality = quality_report
    return response


@router.get("/{id}", response_model=ReferralDetailResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def get_referral(
    id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Fetch details of a single referral file, including referenced patient summary and provider contact."""
    try:
        return referral_service.get_referral(db, referral_id=id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{id}", response_model=ReferralResponse, dependencies=[Depends(RoleChecker(PATCH_ROLES))])
def update_referral(
    id: uuid.UUID,
    referral_in: ReferralUpdate,
    db: Session = Depends(get_db)
):
    """Partially update a referral request (e.g. status transition, priority upgrade)."""
    try:
        return referral_service.update_referral(db, referral_id=id, referral_in=referral_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def delete_referral(
    id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Remove a referral request from the system."""
    try:
        referral_service.delete_referral(db, referral_id=id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
