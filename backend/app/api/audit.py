from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel

from app.api.deps import get_db, RoleChecker
from app.models.user import UserRole
from app.models.audit import AuditLog

router = APIRouter()
ADMIN_ONLY = [UserRole.ADMIN.value]

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    resource_type: str
    resource_id: Optional[uuid.UUID]
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }

@router.get("", response_model=List[AuditLogResponse], dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve security audit logs (Admin only).
    Returns 403 Forbidden for Doctor or Caregiver users.
    """
    statement = select(AuditLog)
    if action:
        statement = statement.where(AuditLog.action == action)
    statement = statement.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
    return list(db.execute(statement).scalars().all())
