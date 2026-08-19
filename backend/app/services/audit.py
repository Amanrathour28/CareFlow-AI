import uuid
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit_event(
    db: Session,
    user_id: Optional[uuid.UUID],
    action: str,
    resource_type: str,
    resource_id: Optional[uuid.UUID] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None
) -> AuditLog:
    """Helper function to record a security audit event in the database."""
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=old_value,
        new_value=new_value
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
