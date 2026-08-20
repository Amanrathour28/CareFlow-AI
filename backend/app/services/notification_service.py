import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification

class NotificationService:
    def create_notification(
        self,
        db: Session,
        user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: str = "INFO",
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            resource_type=resource_type,
            resource_id=resource_id,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def get_user_notifications(self, db: Session, user_id: uuid.UUID, limit: int = 50) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    def mark_as_read(self, db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            db.add(notification)
            db.commit()
            db.refresh(notification)
        return notification

notification_service = NotificationService()
