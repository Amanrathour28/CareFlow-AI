import uuid
from datetime import datetime
from typing import List, Optional, Any
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base

class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    provider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("providers.id", ondelete="RESTRICT"), nullable=False)
    diagnosis_code: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., ICD-10 Code
    diagnosis_description: Mapped[str] = mapped_column(String(255), nullable=False)
    requested_procedure: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., CPT code or desc
    insurance_provider: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending", nullable=False)  # Pending, UnderReview, MissingInfo, Approved, Rejected
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)  # Low, Medium, High
    ai_analysis: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # Stores AI analysis report
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="referrals")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="referrals")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="referral", cascade="all, delete-orphan")
