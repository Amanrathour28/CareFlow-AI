from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.user import user_repository
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import verify_password

class AuthService:
    def authenticate(self, db: Session, username_or_email: str, password: str) -> Optional[User]:
        """Verify user credentials. Returns the User model if valid and active, else None."""
        # Try finding by email
        user = user_repository.get_by_email(db, username_or_email)
        if not user:
            # Try finding by username
            user = user_repository.get_by_username(db, username_or_email)
            
        if not user:
            return None
            
        if not verify_password(password, user.hashed_password):
            return None
            
        if not user.is_active:
            return None
            
        return user

    def register_user(self, db: Session, user_in: UserCreate) -> User:
        """Register a new user. Validates uniqueness of username/email and role validation."""
        # Check if username already exists
        if user_repository.get_by_username(db, user_in.username):
            raise ValueError("Username already registered")
            
        # Check if email already exists
        if user_repository.get_by_email(db, user_in.email):
            raise ValueError("Email already registered")
            
        # Validate role
        valid_roles = {"Admin", "Doctor", "CareCoordinator"}
        if user_in.role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
            
        return user_repository.create(db, obj_in=user_in)

auth_service = AuthService()
