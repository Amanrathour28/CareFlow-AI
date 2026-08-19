import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TaskBase(BaseModel):
    referral_id: uuid.UUID
    assigned_to_user_id: Optional[uuid.UUID] = Field(None, description="UUID of the user assigned to this task")
    priority: str = Field("Medium", description="Low, Medium, High")
    due_date: date = Field(..., description="Task due date")
    status: str = Field("Pending", description="Pending, InProgress, Completed")
    notes: Optional[str] = Field(None, max_length=500)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    assigned_to_user_id: Optional[uuid.UUID] = None
    priority: Optional[str] = Field(None, description="Low, Medium, High")
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, description="Pending, InProgress, Completed")
    notes: Optional[str] = Field(None, max_length=500)

class TaskResponse(TaskBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    size: int
