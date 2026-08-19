import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.repositories.patient import patient_repository
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate

class PatientService:
    def get_patient(self, db: Session, patient_id: uuid.UUID) -> Patient:
        """Retrieve a patient by UUID. Raises ValueError if not found."""
        patient = patient_repository.get_by_id(db, patient_id)
        if not patient:
            raise ValueError("Patient not found")
        return patient

    def list_patients(
        self, db: Session, *, user: User, page: int = 1, size: int = 20, search: Optional[str] = None
    ) -> Tuple[List[Patient], int]:
        """Fetch list of patients filtered at the database level by user role & assignments."""
        if page < 1:
            page = 1
        if size < 1:
            size = 20
        skip = (page - 1) * size
        items = patient_repository.list_patients(db, user=user, skip=skip, limit=size, search=search)
        total = patient_repository.count_patients(db, user=user, search=search)
        return items, total

    def create_patient(self, db: Session, patient_in: PatientCreate) -> Patient:
        """Create a new unified patient record."""
        return patient_repository.create_patient_with_details(db, obj_in=patient_in)

    def update_patient(self, db: Session, patient_id: uuid.UUID, patient_in: PatientUpdate) -> Patient:
        """Update core details of an existing patient."""
        patient = patient_repository.get_by_id(db, patient_id)
        if not patient:
            raise ValueError("Patient not found")
        return patient_repository.update(db, db_obj=patient, obj_in=patient_in)

    def delete_patient(self, db: Session, patient_id: uuid.UUID) -> Patient:
        """Delete a patient record."""
        patient = patient_repository.get_by_id(db, patient_id)
        if not patient:
            raise ValueError("Patient not found")
        return patient_repository.delete(db, patient_id)

patient_service = PatientService()
