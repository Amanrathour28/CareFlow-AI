import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.repositories.referral import referral_repository
from app.repositories.patient import patient_repository
from app.repositories.provider import provider_repository
from app.models.referral import Referral
from app.schemas.referral import ReferralCreate, ReferralUpdate

class ReferralService:
    def get_referral(self, db: Session, referral_id: uuid.UUID) -> Referral:
        """Retrieve a referral by UUID. Raises ValueError if not found."""
        referral = referral_repository.get_by_id(db, referral_id)
        if not referral:
            raise ValueError("Referral not found")
        return referral

    def list_referrals(
        self,
        db: Session,
        *,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        patient_id: Optional[uuid.UUID] = None
    ) -> Tuple[List[Referral], int]:
        """Fetch list of referrals with calculated pagination and optional status/priority filters."""
        if page < 1:
            page = 1
        if size < 1:
            size = 20
        skip = (page - 1) * size
        items = referral_repository.list_referrals(
            db, skip=skip, limit=size, status=status, priority=priority, patient_id=patient_id
        )
        total = referral_repository.count_referrals(
            db, status=status, priority=priority, patient_id=patient_id
        )
        return items, total

    def create_referral(self, db: Session, referral_in: ReferralCreate) -> Referral:
        """Create a new referral after checking referenced patient and provider exist."""
        # Check patient existence
        patient = patient_repository.get_by_id(db, referral_in.patient_id)
        if not patient:
            raise ValueError("Patient reference not found. Referral cannot be created.")
            
        # Check provider existence
        provider = provider_repository.get_by_id(db, referral_in.provider_id)
        if not provider:
            raise ValueError("Provider reference not found. Referral cannot be created.")
            
        # Enforce valid fields
        valid_statuses = {"Pending", "UnderReview", "MissingInfo", "Approved", "Rejected"}
        if referral_in.status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        valid_priorities = {"Low", "Medium", "High"}
        if referral_in.priority not in valid_priorities:
            raise ValueError(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")

        return referral_repository.create(db, obj_in=referral_in)

    def update_referral(self, db: Session, referral_id: uuid.UUID, referral_in: ReferralUpdate) -> Referral:
        """Update fields of an existing referral, enforcing status/priority constraints."""
        referral = referral_repository.get_by_id(db, referral_id)
        if not referral:
            raise ValueError("Referral not found")

        # Validate updates
        if referral_in.status is not None:
            valid_statuses = {"Pending", "UnderReview", "MissingInfo", "Approved", "Rejected"}
            if referral_in.status not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        if referral_in.priority is not None:
            valid_priorities = {"Low", "Medium", "High"}
            if referral_in.priority not in valid_priorities:
                raise ValueError(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")

        return referral_repository.update(db, db_obj=referral, obj_in=referral_in)

    def delete_referral(self, db: Session, referral_id: uuid.UUID) -> Referral:
        """Delete a referral record."""
        referral = referral_repository.get_by_id(db, referral_id)
        if not referral:
            raise ValueError("Referral not found")
        return referral_repository.delete(db, referral_id)

referral_service = ReferralService()
