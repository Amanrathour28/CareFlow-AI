import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional, Any
from sqlalchemy import String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base

class ReferralStatus(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "UnderReview"
    MISSING_INFORMATION = "MissingInfo"
    READY_FOR_AUTHORIZATION = "ReadyForAuthorization"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class ReferralPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("providers.id", ondelete="RESTRICT"), nullable=False, index=True)
    diagnosis_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # e.g., ICD-10 Code
    diagnosis_description: Mapped[str] = mapped_column(String(255), nullable=False)
    requested_procedure: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., CPT code or desc
    insurance_provider: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False, index=True)  
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False, index=True)  # Low, Medium, High
    ai_analysis: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # Stores current AI analysis report
    
    # Soft deletion
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="referrals")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="referrals")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="referral", cascade="all, delete-orphan")
    timeline_events: Mapped[List["ReferralTimeline"]] = relationship(
        "ReferralTimeline", back_populates="referral", cascade="all, delete-orphan", order_by="ReferralTimeline.timestamp.asc()"
    )
    analysis_history: Mapped[List["AIAnalysisHistory"]] = relationship(
        "AIAnalysisHistory", back_populates="referral", cascade="all, delete-orphan", order_by="AIAnalysisHistory.created_at.desc()"
    )
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="referral")
