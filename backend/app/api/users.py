from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.repositories.user import user_repository
from app.services.audit import log_audit_event

router = APIRouter()
ADMIN_ONLY = [UserRole.ADMIN.value]


@router.get("", response_model=List[UserResponse], dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all system users (Admin only)."""
    statement = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(statement).scalars().all())


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def create_user_admin(
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new user account with assigned role (Admin only)."""
    if user_repository.get_by_username(db, user_in.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    if user_repository.get_by_email(db, user_in.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    new_user = user_repository.create(db, obj_in=user_in)
    log_audit_event(db, user_id=current_user.id, action="create_user", resource_type="users", resource_id=new_user.id)
    return new_user


@router.patch("/{id}", response_model=UserResponse, dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def update_user_admin(
    id: uuid.UUID,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user role, active status, or email (Admin only)."""
    user_obj = user_repository.get_by_id(db, id)
    if not user_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updated = user_repository.update(db, db_obj=user_obj, obj_in=user_in)
    log_audit_event(db, user_id=current_user.id, action="update_user", resource_type="users", resource_id=id)
    return updated
