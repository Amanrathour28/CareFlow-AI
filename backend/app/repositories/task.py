import uuid
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskRepository:
    def get_by_id(self, db: Session, task_id: uuid.UUID) -> Optional[Task]:
        """Fetch a single task by its UUID."""
        return db.get(Task, task_id)

    def list_tasks(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        assigned_to: Optional[uuid.UUID] = None,
        referral_id: Optional[uuid.UUID] = None
    ) -> List[Task]:
        """List tasks with pagination and optional filters by status, assignee, and referral ID."""
        statement = select(Task)
        if status:
            statement = statement.where(Task.status == status)
        if assigned_to:
            statement = statement.where(Task.assigned_to_user_id == assigned_to)
        if referral_id:
            statement = statement.where(Task.referral_id == referral_id)
            
        statement = statement.order_by(Task.due_date.asc()).offset(skip).limit(limit)
        return list(db.execute(statement).scalars().all())

    def count_tasks(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        assigned_to: Optional[uuid.UUID] = None,
        referral_id: Optional[uuid.UUID] = None
    ) -> int:
        """Count total tasks matching filter criteria."""
        statement = select(func.count(Task.id))
        if status:
            statement = statement.where(Task.status == status)
        if assigned_to:
            statement = statement.where(Task.assigned_to_user_id == assigned_to)
        if referral_id:
            statement = statement.where(Task.referral_id == referral_id)
            
        return db.execute(statement).scalar_one()

    def create(self, db: Session, *, obj_in: TaskCreate) -> Task:
        """Create a new follow-up task record."""
        db_obj = Task(
            referral_id=obj_in.referral_id,
            assigned_to_user_id=obj_in.assigned_to_user_id,
            priority=obj_in.priority,
            due_date=obj_in.due_date,
            status=obj_in.status,
            notes=obj_in.notes
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Task, obj_in: TaskUpdate) -> Task:
        """Update fields on an existing task."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, task_id: uuid.UUID) -> Optional[Task]:
        """Delete a task record by UUID."""
        db_obj = db.get(Task, task_id)
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj

task_repository = TaskRepository()
