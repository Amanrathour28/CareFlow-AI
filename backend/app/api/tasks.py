from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, RoleChecker
from app.services.task import task_service
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse
)

router = APIRouter()

# All authenticated clinical roles can manage tasks
ALLOWED_ROLES = ["Admin", "CareCoordinator", "Doctor"]

@router.get("", response_model=TaskListResponse, dependencies=[Depends(RoleChecker(ALLOWED_ROLES))])
def list_tasks(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    assigned_to: Optional[uuid.UUID] = None,
    referral_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    """Retrieve a paginated list of follow-up tasks, filterable by status, assignee, and referral."""
    items, total = task_service.list_tasks(
        db, page=page, size=size, status=status, assigned_to=assigned_to, referral_id=referral_id
    )
    return TaskListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(ALLOWED_ROLES))])
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db)
):
    """Create a new follow-up task related to an administrative referral workflow."""
    try:
        return task_service.create_task(db, task_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{id}", response_model=TaskResponse, dependencies=[Depends(RoleChecker(ALLOWED_ROLES))])
def update_task(
    id: uuid.UUID,
    task_in: TaskUpdate,
    db: Session = Depends(get_db)
):
    """Partially update a task (e.g. mark status as InProgress or Completed, add coordinator notes)."""
    try:
        return task_service.update_task(db, task_id=id, task_in=task_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
