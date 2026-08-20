import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.services.notification_service import notification_service

router = APIRouter()

@router.get("/")
def get_my_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notifications = notification_service.get_user_notifications(db, current_user.id)
    unread_count = sum(1 for n in notifications if not n.is_read)
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    updated = notification_service.mark_as_read(db, notification_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return updated
