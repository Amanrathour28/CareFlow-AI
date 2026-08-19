"""
Unit tests for the Data Quality Engine.
These tests exercise the rule engine logic directly (no HTTP layer, no DB needed).
"""
import pytest
from datetime import date, timedelta
from app.services.quality_engine import (
    check_patient_quality,
    check_referral_quality,
    PENALTY_WEIGHTS,
)
from app.schemas.patient import PatientCreate, InsuranceCreate
from app.schemas.referral import ReferralCreate
import uuid


# ── Helpers ────────────────────────────────────────────────────────────────

def valid_patient(**overrides) -> PatientCreate:
    defaults = dict(
        first_name="Jane",
        last_name="Doe",
        date_of_birth=date(1990, 6, 15),
        gender="Female",
        phone="555-0100",
        email="jane@example.com",
        address="100 Main St, Boston MA",
        medical_history_summary="No known allergies.",
        insurance=InsuranceCreate(
            insurance_provider="Blue Cross",
            policy_number="BC987654",
            plan_type="PPO",
            status="Active",
        ),
        medications=[],
        laboratory_results=[],
    )
    defaults.update(overrides)
    return PatientCreate(**defaults)


def valid_referral(**overrides) -> ReferralCreate:
    defaults = dict(
        patient_id=uuid.uuid4(),
        provider_id=uuid.uuid4(),
        diagnosis_code="M54.5",
        diagnosis_description="Low back pain",
        requested_procedure="Lumbar MRI (CPT 72148)",
        insurance_provider="Blue Cross",
        status="Pending",
        priority="Medium",
    )
    defaults.update(overrides)
    return ReferralCreate(**defaults)


# ── Patient Quality Tests ──────────────────────────────────────────────────

class TestPatientQuality:
    def test_perfect_score(self):
        report = check_patient_quality(valid_patient())
        assert report.quality_score == 100
        assert report.issues == []
        assert report.passed is True

    def test_no_insurance_deducts_penalty(self):
        patient = valid_patient(insurance=None)
        report = check_patient_quality(patient)
        expected = 100 - PENALTY_WEIGHTS["missing_insurance"] - PENALTY_WEIGHTS["missing_diagnosis_summary"]
        # also no medical_history_summary triggers another deduction — but let's also keep address
        # Full run: missing_insurance + missing_diagnosis_summary deducted only when both absent
        # In this call insurance=None but medical_history and address are present via valid_patient
        assert report.quality_score == 100 - PENALTY_WEIGHTS["missing_insurance"]
        assert report.passed is True
        assert any(i.field == "insurance" for i in report.issues)

    def test_future_dob_is_error(self):
        future_date = date.today() + timedelta(days=1)
        report = check_patient_quality(valid_patient(date_of_birth=future_date))
        assert report.quality_score < 100
        assert any(i.field == "date_of_birth" and i.severity == "error" for i in report.issues)

    def test_email_quality_not_checked_by_engine(self):
        """Pydantic's EmailStr rejects malformed emails before they reach the engine.
        The engine deliberately skips email format checks to avoid duplication.
        We verify a syntactically valid but unusual email does NOT produce an issue."""
        # Pydantic accepts this; engine should not flag it
        report = check_patient_quality(valid_patient(email="user+tag@example.co.uk"))
        assert not any(i.field == "email" for i in report.issues)
        assert report.quality_score == 100

    def test_invalid_phone_deducts_penalty(self):
        report = check_patient_quality(valid_patient(phone="abc-xyz"))
        assert any(i.field == "phone" for i in report.issues)
        assert report.quality_score == 100 - PENALTY_WEIGHTS["invalid_phone"]

    def test_missing_optional_fields_reduces_score(self):
        patient = valid_patient(address=None, medical_history_summary=None)
        report = check_patient_quality(patient)
        expected = 100 - PENALTY_WEIGHTS["missing_diagnosis_summary"] - PENALTY_WEIGHTS["missing_address"]
        assert report.quality_score == expected
        assert report.passed is True  # Still above 70

    def test_multiple_errors_fail_threshold(self):
        """A patient with no insurance, bad phone, and a future DOB should fail the 70 threshold."""
        future = date.today() + timedelta(days=5)
        patient = valid_patient(
            insurance=None,
            email="valid@example.com",   # email is Pydantic's concern, must be valid here
            phone="abc",
            date_of_birth=future,
            address=None,
            medical_history_summary=None,
        )
        report = check_patient_quality(patient)
        assert report.quality_score < 70
        assert report.passed is False
        assert len(report.issues) >= 5


# ── Referral Quality Tests ─────────────────────────────────────────────────

class TestReferralQuality:
    def test_perfect_referral(self):
        report = check_referral_quality(valid_referral())
        assert report.quality_score == 100
        assert report.issues == []
        assert report.passed is True

    def test_missing_diagnosis_code(self):
        report = check_referral_quality(valid_referral(diagnosis_code="   "))
        assert any(i.field == "diagnosis_code" for i in report.issues)
        assert report.quality_score == 100 - PENALTY_WEIGHTS["missing_diagnosis_code"]

    def test_missing_procedure(self):
        report = check_referral_quality(valid_referral(requested_procedure="  "))
        assert any(i.field == "requested_procedure" for i in report.issues)

    def test_missing_insurance_provider(self):
        report = check_referral_quality(valid_referral(insurance_provider="  "))
        assert any(i.field == "insurance_provider" for i in report.issues)
        assert report.quality_score == 100 - PENALTY_WEIGHTS["missing_insurance_prov"]

    def test_invalid_status_deducts_penalty(self):
        report = check_referral_quality(valid_referral(status="AwaitingApproval"))
        assert any(i.field == "status" for i in report.issues)

    def test_invalid_priority_is_warning(self):
        report = check_referral_quality(valid_referral(priority="Urgent"))
        issue = next(i for i in report.issues if i.field == "priority")
        assert issue.severity == "warning"

    def test_all_missing_fields_fail_threshold(self):
        referral = valid_referral(
            diagnosis_code="  ",
            requested_procedure="  ",
            insurance_provider="  ",
        )
        report = check_referral_quality(referral)
        assert report.quality_score < 70
        assert report.passed is False
