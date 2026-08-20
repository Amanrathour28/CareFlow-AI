import uuid
from typing import Optional, List, Dict, Set
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.referral import Referral, ReferralStatus
from app.models.referral_timeline import ReferralTimeline
from app.models.user import User, UserRole

# Allowed transitions map
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    "Draft": {"Submitted", "Rejected"},
    "Pending": {"Submitted", "UnderReview", "MissingInfo", "Approved", "Rejected", "ReadyForAuthorization"},
    "Submitted": {"UnderReview", "MissingInfo", "Rejected", "ReadyForAuthorization"},
    "UnderReview": {"MissingInfo", "ReadyForAuthorization", "Approved", "Rejected"},
    "MissingInfo": {"Submitted", "UnderReview", "Rejected"},
    "ReadyForAuthorization": {"Approved", "Rejected", "UnderReview"},
    "Approved": {"UnderReview"},  # Admin/Doctor override reopen
    "Rejected": {"UnderReview"},  # Admin/Doctor override reopen
}

class WorkflowEngineService:
    def transition_referral_status(
        self,
        db: Session,
        referral: Referral,
        new_status: str,
        user: User,
        notes: Optional[str] = None
    ) -> Referral:
        """
        Validates and executes a referral status transition.
        Records entry in ReferralTimeline and creates AuditLog.
        """
        current_status = referral.status
        if current_status == new_status:
            return referral

        # Validate transition matrix
        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        if new_status not in allowed and user.role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid workflow transition from '{current_status}' to '{new_status}'. Allowed target statuses: {list(allowed)}"
            )

        # Record timeline event
        timeline_entry = ReferralTimeline(
            referral_id=referral.id,
            previous_status=current_status,
            new_status=new_status,
            performed_by_user_id=user.id,
            notes=notes or f"Status changed from {current_status} to {new_status}"
        )
        db.add(timeline_entry)

        # Update referral status
        referral.status = new_status
        db.add(referral)
        db.commit()
        db.refresh(referral)
        return referral

    def get_referral_timeline(self, db: Session, referral_id: uuid.UUID) -> List[ReferralTimeline]:
        """Fetch chronological timeline events for a referral."""
        return db.query(ReferralTimeline).filter(
            ReferralTimeline.referral_id == referral_id
        ).order_by(ReferralTimeline.timestamp.asc()).all()

workflow_engine_service = WorkflowEngineService()
