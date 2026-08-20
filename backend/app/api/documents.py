import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, verify_patient_access
from app.models.user import User
from app.services.document_service import document_service

router = APIRouter()

@router.post("/upload")
def upload_document(
    patient_id: str = Form(...),
    document_type: str = Form(...),
    referral_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid patient_id format")

    r_uuid = None
    if referral_id:
        try:
            r_uuid = uuid.UUID(referral_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid referral_id format")

    verify_patient_access(p_uuid, db, current_user)
    doc = document_service.upload_document(
        db=db,
        file=file,
        patient_id=p_uuid,
        document_type=document_type,
        user=current_user,
        referral_id=r_uuid
    )
    return doc

@router.get("/")
def list_documents(
    patient_id: Optional[str] = None,
    referral_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    p_uuid = uuid.UUID(patient_id) if patient_id else None
    r_uuid = uuid.UUID(referral_id) if referral_id else None

    if p_uuid:
        verify_patient_access(p_uuid, db, current_user)

    return document_service.list_documents(db=db, patient_id=p_uuid, referral_id=r_uuid)
