"""
Realistic Demo Data Seeder for CareFlow AI Interview Demonstrations.
Creates fictional patients, providers, referrals, tasks, and audit logs.
"""
import uuid
from datetime import date, datetime, timedelta
from sqlalchemy import text
from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.user import User, UserRole
from app.models.provider import Provider
from app.models.patient import Patient, Insurance, Medication, LaboratoryResult
from app.models.referral import Referral, ReferralStatus, ReferralPriority
from app.models.referral_timeline import ReferralTimeline
from app.models.task import Task, TaskStatus
from app.models.audit import AuditLog
from app.models.document import Document
from app.core.security import get_password_hash

def seed_demo_data():
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;"))
        conn.execute(text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(150);"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;"))

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create Users
    admin = db.query(User).filter_by(email="admin@careflow.ai").first()
    if not admin:
        admin = User(
            username="admin_demo",
            email="admin@careflow.ai",
            hashed_password=get_password_hash("demopassword123"),
            role=UserRole.ADMIN.value
        )
        db.add(admin)

    doctor = db.query(User).filter_by(email="dr.house@careflow.ai").first()
    if not doctor:
        doctor = User(
            username="dr_house",
            email="dr.house@careflow.ai",
            hashed_password=get_password_hash("demopassword123"),
            role=UserRole.DOCTOR.value
        )
        db.add(doctor)

    caregiver = db.query(User).filter_by(email="caregiver.smith@careflow.ai").first()
    if not caregiver:
        caregiver = User(
            username="caregiver_smith",
            email="caregiver.smith@careflow.ai",
            hashed_password=get_password_hash("demopassword123"),
            role=UserRole.CAREGIVER.value
        )
        db.add(caregiver)

    db.commit()

    # Create Provider
    provider = db.query(Provider).filter_by(npi="1982736450").first()
    if not provider:
        provider = Provider(
            name="Dr. Meredith Grey",
            specialty="General Surgery & Gastroenterology",
            npi="1982736450",
            phone="555-0199",
            email="mgrey@seattlegrace.org"
        )
        db.add(provider)
        db.commit()

    # Create Patient
    patient = db.query(Patient).filter_by(email="john.doe.demo@example.com").first()
    if not patient:
        patient = Patient(
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1982, 5, 14),
            gender="Male",
            phone="555-8392",
            email="john.doe.demo@example.com",
            address="742 Evergreen Terrace, Springfield",
            medical_history_summary="Patient reports persistent epigastric pain for 4 weeks. No history of GI bleeding.",
            assigned_doctor_id=doctor.id,
            assigned_caregiver_id=caregiver.id
        )
        db.add(patient)
        db.flush()

        # Insurance
        insurance = Insurance(
            patient_id=patient.id,
            insurance_provider="BlueCross BlueShield",
            policy_number="BCBS-9948271",
            group_number="GRP-8821",
            plan_type="PPO"
        )
        db.add(insurance)

        # Medication
        med = Medication(
            patient_id=patient.id,
            drug_name="Omeprazole",
            dosage="20mg",
            frequency="Once daily",
            prescribed_date=date(2026, 1, 10)
        )
        db.add(med)

        # Lab
        lab = LaboratoryResult(
            patient_id=patient.id,
            test_name="H. Pylori Stool Antigen",
            test_value="Negative",
            unit="Qualitative",
            reference_range="Negative",
            test_date=date(2026, 2, 1)
        )
        db.add(lab)
        db.commit()

    # Create Referral
    referral = db.query(Referral).filter_by(patient_id=patient.id).first()
    if not referral:
        referral = Referral(
            patient_id=patient.id,
            provider_id=provider.id,
            diagnosis_code="K21.9",
            diagnosis_description="Gastro-esophageal reflux disease without esophagitis",
            requested_procedure="Upper GI Endoscopy (CPT 43239)",
            insurance_provider="BlueCross BlueShield",
            status="UnderReview",
            priority="High",
            ai_analysis={
                "completeness_score": 85,
                "missing_information": ["Copy of prior authorization approval form"],
                "potential_issues": ["Requires prior authorization by BCBS for CPT 43239"],
                "recommendation": "Submit clinical notes and request prior authorization from BCBS portal.",
                "confidence": 0.94,
                "human_review_required": True,
                "disclaimer": "Administrative workflow assistance only. Not a clinical decision."
            }
        )
        db.add(referral)
        db.flush()

        # Timeline
        timeline = ReferralTimeline(
            referral_id=referral.id,
            previous_status="Submitted",
            new_status="UnderReview",
            performed_by_user_id=doctor.id,
            notes="Moved to Under Review by Dr. Grey for Prior Auth submission."
        )
        db.add(timeline)

        # Task
        task = Task(
            referral_id=referral.id,
            assigned_to_user_id=caregiver.id,
            title="Request BCBS Prior Auth Form",
            priority="High",
            due_date=date.today() + timedelta(days=2),
            status="InProgress",
            notes="Call payer portal or upload clinical SOAP notes."
        )
        db.add(task)
        db.commit()

    db.close()
    print("Demo dataset seeded successfully!")

if __name__ == "__main__":
    seed_demo_data()
