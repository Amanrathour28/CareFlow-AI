import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    medical_history_summary: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Resource-level authorization assignments
    assigned_doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_caregiver_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Soft deletion flags
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    assigned_doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_doctor_id])
    assigned_caregiver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_caregiver_id])
    insurance: Mapped[Optional["Insurance"]] = relationship(
        "Insurance", back_populates="patient", uselist=False, cascade="all, delete-orphan"
    )
    medications: Mapped[List["Medication"]] = relationship(
        "Medication", back_populates="patient", cascade="all, delete-orphan"
    )
    laboratory_results: Mapped[List["LaboratoryResult"]] = relationship(
        "LaboratoryResult", back_populates="patient", cascade="all, delete-orphan"
    )
    referrals: Mapped[List["Referral"]] = relationship(
        "Referral", back_populates="patient", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="patient", cascade="all, delete-orphan"
    )


class Insurance(Base):
    __tablename__ = "insurance"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, unique=True)
    insurance_provider: Mapped[str] = mapped_column(String(100), nullable=False)
    policy_number: Mapped[str] = mapped_column(String(50), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    plan_type: Mapped[str] = mapped_column(String(20), default="PPO", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="insurance")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    drug_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dosage: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)
    prescribed_date: Mapped[date] = mapped_column(Date, nullable=False)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="medications")


class LaboratoryResult(Base):
    __tablename__ = "laboratory_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    test_name: Mapped[str] = mapped_column(String(100), nullable=False)
    test_value: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    reference_range: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Normal", nullable=False)
    test_date: Mapped[date] = mapped_column(Date, nullable=False)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="laboratory_results")
