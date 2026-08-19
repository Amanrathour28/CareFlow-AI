import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.schemas.provider import ProviderCreate

class ProviderRepository:
    def get_by_id(self, db: Session, provider_id: uuid.UUID) -> Optional[Provider]:
        """Retrieve a provider record by UUID."""
        return db.get(Provider, provider_id)

    def get_by_npi(self, db: Session, npi: str) -> Optional[Provider]:
        """Retrieve a provider by their unique National Provider Identifier (NPI)."""
        statement = select(Provider).where(Provider.npi == npi)
        return db.execute(statement).scalars().first()

    def create(self, db: Session, *, obj_in: ProviderCreate) -> Provider:
        """Create a new provider record in the database."""
        db_obj = Provider(
            name=obj_in.name,
            specialty=obj_in.specialty,
            npi=obj_in.npi,
            phone=obj_in.phone,
            email=obj_in.email
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

provider_repository = ProviderRepository()
