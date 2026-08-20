import uuid
from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALGORITHM
from app.database.session import get_db
from app.repositories.user import user_repository
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.task import Task
from app.models.referral import Referral
from app.schemas.user import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Dependency to retrieve and validate the current user from their JWT access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id_str is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id_str, role=role)
    except (JWTError, ValidationError):
        raise credentials_exception
        
    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    user = user_repository.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to ensure the current authenticated user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

class RoleChecker:
    """Dependency class to enforce Role-Based Access Control checks."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required role: {', '.join(self.allowed_roles)}"
            )
        return user


# Resource-Level Access Verification Dependencies

def verify_patient_access(patient_id: uuid.UUID, db: Session, user: User) -> Patient:
    """Resource-level verification: Admin has full access, Doctor/Caregiver must be assigned."""
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient record not found")

    if user.role == UserRole.ADMIN.value:
        return patient

    if user.role == UserRole.DOCTOR.value:
        # Access allowed if assigned to this doctor or not yet assigned
        if patient.assigned_doctor_id and patient.assigned_doctor_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Forbidden: You are not assigned as the attending doctor for this patient record."
            )
        return patient

    if user.role == UserRole.CAREGIVER.value:
        if patient.assigned_caregiver_id and patient.assigned_caregiver_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Forbidden: You are not assigned as the caregiver for this patient record."
            )
        return patient

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Forbidden")


def verify_task_access(task_id: uuid.UUID, db: Session, user: User) -> Task:
    """Resource-level verification for Task modifications."""
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if user.role == UserRole.ADMIN.value:
        return task

    if task.assigned_to_user_id and task.assigned_to_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Forbidden: You are not assigned to modify this task."
        )

    return task

def verify_referral_access(referral_id: uuid.UUID, db: Session, user: User) -> Referral:
    """Resource-level verification for Referral modifications and views."""
    referral = db.get(Referral, referral_id)
    if not referral or getattr(referral, "is_deleted", False):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral record not found")

    if user.role == UserRole.ADMIN.value:
        return referral

    # Verify patient ownership/assignment for non-admin users
    verify_patient_access(referral.patient_id, db, user)
    return referral
