"""
Data Quality Engine for CareFlow AI.

Validates incoming Patient and Referral data against a defined rule set.
Each rule that fails deducts a weighted penalty from a base score of 100.
Errors (critical missing fields) carry higher penalties than warnings
(formatting issues or optional-but-recommended fields).

This module intentionally performs ADMINISTRATIVE data quality checks only.
It does NOT make clinical judgments or medical recommendations.
"""
import re
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.schemas.quality import DataQualityReport, DataQualityIssue
from app.schemas.patient import PatientCreate
from app.schemas.referral import ReferralCreate


# ---------------------------------------------------------------------------
# Penalty weights — must sum reasonably so the score range stays 0-100
# ---------------------------------------------------------------------------
PENALTY_WEIGHTS = {
    # Patient checks
    "missing_insurance":        15,   # error   — no coverage = blocked referral
    "missing_policy_number":    10,   # error   — insurance block incomplete
    "missing_diagnosis_summary": 5,   # warning — useful context absent
    "invalid_phone":             8,   # error   — contact unreachable
    "invalid_dob_future":       12,   # error   — impossible date of birth
    "invalid_dob_too_old":       5,   # warning — likely data entry error (>130 yrs)
    "missing_address":           4,   # warning — mailing notifications broken
    # Referral checks
    "missing_diagnosis_code":   15,   # error   — ICD-10 required for auth
    "missing_procedure":        15,   # error   — CPT code required for auth
    "missing_insurance_prov":   10,   # error   — cannot submit claim
    "invalid_status":            8,   # error   — unknown workflow state
    "invalid_priority":          5,   # warning — defaults to Medium
}


def _is_valid_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))


def _is_valid_phone(phone: str) -> bool:
    """Accept common US phone formats: digits, hyphens, spaces, parens, +."""
    digits_only = re.sub(r"[\s\-().+]", "", phone)
    return len(digits_only) >= 7 and digits_only.isdigit()


# ---------------------------------------------------------------------------
# Patient Data Quality Check
# ---------------------------------------------------------------------------
def check_patient_quality(patient_in: PatientCreate) -> DataQualityReport:
    """
    Evaluate a PatientCreate payload against the CareFlow data quality rules.
    Returns a DataQualityReport containing a score (0-100) and a list of issues.
    """
    issues: List[DataQualityIssue] = []
    total_penalty = 0

    def add_issue(field: str, message: str, severity: str, penalty_key: str):
        nonlocal total_penalty
        issues.append(DataQualityIssue(field=field, message=message, severity=severity))
        total_penalty += PENALTY_WEIGHTS.get(penalty_key, 5)

    # ── Insurance checks ──────────────────────────────────────────────────
    if patient_in.insurance is None:
        add_issue(
            "insurance",
            "No insurance information provided. Referrals may be blocked without coverage details.",
            "error",
            "missing_insurance"
        )
    else:
        if not patient_in.insurance.policy_number.strip():
            add_issue(
                "insurance.policy_number",
                "Insurance policy number is empty.",
                "error",
                "missing_policy_number"
            )

    # ── Date of birth checks ──────────────────────────────────────────────
    today = date.today()
    dob = patient_in.date_of_birth
    if dob >= today:
        add_issue(
            "date_of_birth",
            "Date of birth is in the future. This is likely a data entry error.",
            "error",
            "invalid_dob_future"
        )
    elif (today - dob).days > 365 * 130:
        add_issue(
            "date_of_birth",
            "Date of birth implies an age over 130 years. Please verify.",
            "warning",
            "invalid_dob_too_old"
        )

    # ── Contact checks ────────────────────────────────────────────────────
    # Note: email format is validated upstream by Pydantic EmailStr; the engine
    # only checks the phone number since it is stored as a plain varchar.
    if not _is_valid_phone(patient_in.phone):
        add_issue(
            "phone",
            f"Phone '{patient_in.phone}' does not match an expected format.",
            "error",
            "invalid_phone"
        )

    # ── Optional but recommended fields ──────────────────────────────────
    if not patient_in.medical_history_summary:
        add_issue(
            "medical_history_summary",
            "No medical history summary provided. AI analysis quality will be reduced.",
            "warning",
            "missing_diagnosis_summary"
        )

    if not patient_in.address:
        add_issue(
            "address",
            "No mailing address provided. Correspondence may be delayed.",
            "warning",
            "missing_address"
        )

    score = max(0, 100 - total_penalty)
    return DataQualityReport(quality_score=score, issues=issues, passed=score >= 70)


# ---------------------------------------------------------------------------
# Referral Data Quality Check
# ---------------------------------------------------------------------------
def check_referral_quality(referral_in: ReferralCreate) -> DataQualityReport:
    """
    Evaluate a ReferralCreate payload against the CareFlow referral quality rules.
    Returns a DataQualityReport containing a score (0-100) and a list of issues.
    """
    issues: List[DataQualityIssue] = []
    total_penalty = 0

    def add_issue(field: str, message: str, severity: str, penalty_key: str):
        nonlocal total_penalty
        issues.append(DataQualityIssue(field=field, message=message, severity=severity))
        total_penalty += PENALTY_WEIGHTS.get(penalty_key, 5)

    # ── Required clinical/admin fields ────────────────────────────────────
    if not referral_in.diagnosis_code.strip():
        add_issue(
            "diagnosis_code",
            "ICD-10 diagnosis code is required for prior authorization submission.",
            "error",
            "missing_diagnosis_code"
        )

    if not referral_in.requested_procedure.strip():
        add_issue(
            "requested_procedure",
            "Requested procedure (CPT code or description) is missing.",
            "error",
            "missing_procedure"
        )

    if not referral_in.insurance_provider.strip():
        add_issue(
            "insurance_provider",
            "Insurance provider name is missing. Claims cannot be submitted.",
            "error",
            "missing_insurance_prov"
        )

    # ── Status / priority validation ──────────────────────────────────────
    valid_statuses = {"Pending", "UnderReview", "MissingInfo", "Approved", "Rejected"}
    if referral_in.status not in valid_statuses:
        add_issue(
            "status",
            f"Status '{referral_in.status}' is not a recognized workflow state.",
            "error",
            "invalid_status"
        )

    valid_priorities = {"Low", "Medium", "High"}
    if referral_in.priority not in valid_priorities:
        add_issue(
            "priority",
            f"Priority '{referral_in.priority}' is not valid. Defaulting to Medium.",
            "warning",
            "invalid_priority"
        )

    score = max(0, 100 - total_penalty)
    return DataQualityReport(quality_score=score, issues=issues, passed=score >= 70)
