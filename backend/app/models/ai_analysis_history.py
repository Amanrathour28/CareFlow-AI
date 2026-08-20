import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base

class AIAnalysisHistory(Base):
    __tablename__ = "ai_analysis_histories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referral_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    ai_provider: Mapped[str] = mapped_column(String(50), default="Groq", nullable=False)
    model_name: Mapped[str] = mapped_column(String(50), default="llama3-8b-8192", nullable=False)
    analysis_version: Mapped[str] = mapped_column(String(20), default="v1.0", nullable=False)
    used_fallback: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completeness_score: Mapped[int] = mapped_column(nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    analysis_result: Mapped[Any] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    referral: Mapped["Referral"] = relationship("Referral", back_populates="analysis_history")
    triggered_by: Mapped[Optional["User"]] = relationship("User")
