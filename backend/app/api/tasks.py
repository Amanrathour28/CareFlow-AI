from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, verify_task_access
from app.services.task import task_service
from app.services.audit import log_audit_event
from app.models.user import User, UserRole
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse
)

router = APIRouter()

ALL_ROLES = [UserRole.ADMIN.value, UserRole.DOCTOR.value, UserRole.CAREGIVER.value]
CREATE_ROLES = [UserRole.ADMIN.value, UserRole.DOCTOR.value]


@router.get("", response_model=TaskListResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def list_tasks(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    referral_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a paginated list of tasks.
    Database-level filtering: Admin sees all; Doctor/Caregiver see assigned tasks only.
    """
    assigned_filter = None if current_user.role == UserRole.ADMIN.value else current_user.id

    items, total = task_service.list_tasks(
        db, page=page, size=size, status=status, assigned_to=assigned_filter, referral_id=referral_id
    )
    return TaskListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(CREATE_ROLES))])
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new follow-up task (Admin & Doctor only)."""
    try:
        task = task_service.create_task(db, task_in)
        log_audit_event(db, user_id=current_user.id, action="create_task", resource_type="tasks", resource_id=task.id)
        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{id}", response_model=TaskResponse, dependencies=[Depends(RoleChecker(ALL_ROLES))])
def update_task(
    id: uuid.UUID,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update task status / notes.
    Enforces resource-level check: Caregivers/Doctors can only modify tasks assigned to them.
    """
    task = verify_task_access(task_id=id, db=db, user=current_user)
    updated = task_service.update_task(db, task_id=task.id, task_in=task_in)
    
    log_audit_event(db, user_id=current_user.id, action="update_task", resource_type="tasks", resource_id=task.id)
    return updated
