import uuid
from typing import List, Optional
from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session
from app.models.patient import Patient, Insurance, Medication, LaboratoryResult
from app.schemas.patient import PatientCreate, PatientUpdate

class PatientRepository:
    def get_by_id(self, db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
        """Fetch a single patient record by UUID, including all relationships automatically loaded."""
        return db.get(Patient, patient_id)

    def list_patients(
        self, db: Session, *, skip: int = 0, limit: int = 100, search: Optional[str] = None
    ) -> List[Patient]:
        """Fetch a paginated list of patients, with optional case-insensitive search on names and email."""
        statement = select(Patient)
        if search:
            search_filter = f"%{search}%"
            statement = statement.where(
                or_(
                    Patient.first_name.ilike(search_filter),
                    Patient.last_name.ilike(search_filter),
                    Patient.email.ilike(search_filter)
                )
            )
        statement = statement.order_by(Patient.last_name.asc()).offset(skip).limit(limit)
        return list(db.execute(statement).scalars().all())

    def count_patients(self, db: Session, *, search: Optional[str] = None) -> int:
        """Count total patients matching search query."""
        statement = select(func.count(Patient.id))
        if search:
            search_filter = f"%{search}%"
            statement = statement.where(
                or_(
                    Patient.first_name.ilike(search_filter),
                    Patient.last_name.ilike(search_filter),
                    Patient.email.ilike(search_filter)
                )
            )
        return db.execute(statement).scalar_one()

    def create_patient_with_details(self, db: Session, *, obj_in: PatientCreate) -> Patient:
        """Create a patient record along with optional insurance, medications, and labs inside a transaction."""
        db_patient = Patient(
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            date_of_birth=obj_in.date_of_birth,
            gender=obj_in.gender,
            phone=obj_in.phone,
            email=obj_in.email,
            address=obj_in.address,
            medical_history_summary=obj_in.medical_history_summary
        )
        db.add(db_patient)
        db.flush()  # Populates db_patient.id without committing

        # Create nested insurance record if provided
        if obj_in.insurance:
            db_insurance = Insurance(
                patient_id=db_patient.id,
                insurance_provider=obj_in.insurance.insurance_provider,
                policy_number=obj_in.insurance.policy_number,
                group_number=obj_in.insurance.group_number,
                plan_type=obj_in.insurance.plan_type,
                status=obj_in.insurance.status
            )
            db.add(db_insurance)

        # Create nested medication records if provided
        if obj_in.medications:
            for med in obj_in.medications:
                db_med = Medication(
                    patient_id=db_patient.id,
                    drug_name=med.drug_name,
                    dosage=med.dosage,
                    frequency=med.frequency,
                    status=med.status,
                    prescribed_date=med.prescribed_date
                )
                db.add(db_med)

        # Create nested laboratory records if provided
        if obj_in.laboratory_results:
            for lab in obj_in.laboratory_results:
                db_lab = LaboratoryResult(
                    patient_id=db_patient.id,
                    test_name=lab.test_name,
                    test_value=lab.test_value,
                    unit=lab.unit,
                    reference_range=lab.reference_range,
                    status=lab.status,
                    test_date=lab.test_date
                )
                db.add(db_lab)

        db.commit()
        db.refresh(db_patient)
        return db_patient

    def update(self, db: Session, *, db_obj: Patient, obj_in: PatientUpdate) -> Patient:
        """Update core demographic fields of a patient."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
        """Delete a patient record and cascade delete associated nested records."""
        db_obj = db.get(Patient, patient_id)
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj

patient_repository = PatientRepository()
