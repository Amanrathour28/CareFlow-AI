import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class UserRepository:
    def get_by_id(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Fetch a user by their UUID primary key."""
        return db.get(User, user_id)

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        """Fetch a user by their unique username."""
        statement = select(User).where(User.username == username)
        return db.execute(statement).scalars().first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Fetch a user by their unique email."""
        statement = select(User).where(User.email == email)
        return db.execute(statement).scalars().first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """Hash the user's password and save the new record to the database."""
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            role=obj_in.role,
            is_active=obj_in.is_active if obj_in.is_active is not None else True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
        """Update an existing user record. Hashes the password if changed."""
        update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            db_obj.hashed_password = hashed_password
            del update_data["password"]
            
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Delete a user record by UUID."""
        db_obj = db.get(User, user_id)
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj

user_repository = UserRepository()
