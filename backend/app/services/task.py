import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.repositories.task import task_repository
from app.repositories.referral import referral_repository
from app.repositories.user import user_repository
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:
    def get_task(self, db: Session, task_id: uuid.UUID) -> Task:
        """Fetch a task record by UUID. Raises ValueError if not found."""
        task = task_repository.get_by_id(db, task_id)
        if not task:
            raise ValueError("Task not found")
        return task

    def list_tasks(
        self,
        db: Session,
        *,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        assigned_to: Optional[uuid.UUID] = None,
        referral_id: Optional[uuid.UUID] = None
    ) -> Tuple[List[Task], int]:
        """Fetch a paginated list of tasks matching assignee and status filters."""
        if page < 1:
            page = 1
        if size < 1:
            size = 20
        skip = (page - 1) * size
        items = task_repository.list_tasks(
            db, skip=skip, limit=size, status=status, assigned_to=assigned_to, referral_id=referral_id
        )
        total = task_repository.count_tasks(
            db, status=status, assigned_to=assigned_to, referral_id=referral_id
        )
        return items, total

    def create_task(self, db: Session, task_in: TaskCreate) -> Task:
        """Create a new task, validating that the linked referral and assignee exist."""
        # Check referral exists
        referral = referral_repository.get_by_id(db, task_in.referral_id)
        if not referral:
            raise ValueError("linked referral not found. Task cannot be created.")
            
        # Check assignee exists if assigned
        if task_in.assigned_to_user_id:
            user = user_repository.get_by_id(db, task_in.assigned_to_user_id)
            if not user:
                raise ValueError("Assigned user not found.")
            if not user.is_active:
                raise ValueError("Assigned user is inactive.")

        # Validate status/priority
        valid_statuses = {"Pending", "InProgress", "Completed"}
        if task_in.status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        valid_priorities = {"Low", "Medium", "High"}
        if task_in.priority not in valid_priorities:
            raise ValueError(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")

        return task_repository.create(db, obj_in=task_in)

    def update_task(self, db: Session, task_id: uuid.UUID, task_in: TaskUpdate) -> Task:
        """Update fields on an existing task, with status and assignee validations."""
        task = task_repository.get_by_id(db, task_id)
        if not task:
            raise ValueError("Task not found")

        # Validate status if updating
        if task_in.status is not None:
            valid_statuses = {"Pending", "InProgress", "Completed"}
            if task_in.status not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        # Validate priority if updating
        if task_in.priority is not None:
            valid_priorities = {"Low", "Medium", "High"}
            if task_in.priority not in valid_priorities:
                raise ValueError(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")

        # Validate assignee if updating
        if task_in.assigned_to_user_id is not None:
            user = user_repository.get_by_id(db, task_in.assigned_to_user_id)
            if not user:
                raise ValueError("Assigned user not found.")
            if not user.is_active:
                raise ValueError("Assigned user is inactive.")

        return task_repository.update(db, db_obj=task, obj_in=task_in)

    def delete_task(self, db: Session, task_id: uuid.UUID) -> Task:
        """Delete a task record."""
        task = task_repository.get_by_id(db, task_id)
        if not task:
            raise ValueError("Task not found")
        return task_repository.delete(db, task_id)

task_service = TaskService()
