import os
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.patient import Patient
from app.models.user import User

def get_upload_dir() -> str:
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"))
    if is_serverless or (os.name != "nt" and os.path.exists("/tmp")):
        target_dir = "/tmp/careflow_uploads"
    else:
        target_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    
    try:
        os.makedirs(target_dir, exist_ok=True)
    except OSError:
        pass
    return target_dir

UPLOAD_DIR = get_upload_dir()

class DocumentService:
    def upload_document(
        self,
        db: Session,
        file: UploadFile,
        patient_id: uuid.UUID,
        document_type: str,
        user: User,
        referral_id: Optional[uuid.UUID] = None
    ) -> Document:
        patient = db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

        # Save file to disk
        file_id = uuid.uuid4()
        extension = os.path.splitext(file.filename)[1] or ".pdf"
        safe_filename = f"{file_id}{extension}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        contents = file.file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        doc = Document(
            id=file_id,
            patient_id=patient_id,
            referral_id=referral_id,
            uploaded_by_user_id=user.id,
            document_type=document_type,
            file_name=file.filename or safe_filename,
            file_path=file_path,
            mime_type=file.content_type or "application/pdf",
            file_size_bytes=len(contents)
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def list_documents(
        self,
        db: Session,
        patient_id: Optional[uuid.UUID] = None,
        referral_id: Optional[uuid.UUID] = None
    ) -> List[Document]:
        query = db.query(Document)
        if patient_id:
            query = query.filter(Document.patient_id == patient_id)
        if referral_id:
            query = query.filter(Document.referral_id == referral_id)
        return query.order_by(Document.created_at.desc()).all()

    def get_document(self, db: Session, document_id: uuid.UUID) -> Optional[Document]:
        return db.get(Document, document_id)

document_service = DocumentService()
