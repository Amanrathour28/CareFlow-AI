import uuid
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.referral import Referral
from app.schemas.referral import ReferralCreate, ReferralUpdate

class ReferralRepository:
    def get_by_id(self, db: Session, referral_id: uuid.UUID) -> Optional[Referral]:
        """Retrieve a referral record by UUID, including patient and provider relationships."""
        return db.get(Referral, referral_id)

    def list_referrals(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        patient_id: Optional[uuid.UUID] = None
    ) -> List[Referral]:
        """Fetch list of referrals with dynamic filters for status, priority, and patient ID."""
        statement = select(Referral)
        if status:
            statement = statement.where(Referral.status == status)
        if priority:
            statement = statement.where(Referral.priority == priority)
        if patient_id:
            statement = statement.where(Referral.patient_id == patient_id)
            
        statement = statement.order_by(Referral.created_at.desc()).offset(skip).limit(limit)
        return list(db.execute(statement).scalars().all())

    def count_referrals(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        patient_id: Optional[uuid.UUID] = None
    ) -> int:
        """Count total referrals matching filter criteria."""
        statement = select(func.count(Referral.id))
        if status:
            statement = statement.where(Referral.status == status)
        if priority:
            statement = statement.where(Referral.priority == priority)
        if patient_id:
            statement = statement.where(Referral.patient_id == patient_id)
            
        return db.execute(statement).scalar_one()

    def create(self, db: Session, *, obj_in: ReferralCreate) -> Referral:
        """Create a new referral record."""
        db_obj = Referral(
            patient_id=obj_in.patient_id,
            provider_id=obj_in.provider_id,
            diagnosis_code=obj_in.diagnosis_code,
            diagnosis_description=obj_in.diagnosis_description,
            requested_procedure=obj_in.requested_procedure,
            insurance_provider=obj_in.insurance_provider,
            status=obj_in.status,
            priority=obj_in.priority
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Referral, obj_in: ReferralUpdate) -> Referral:
        """Update an existing referral record's details."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, referral_id: uuid.UUID) -> Optional[Referral]:
        """Delete a referral record by UUID."""
        db_obj = db.get(Referral, referral_id)
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj

referral_repository = ReferralRepository()
