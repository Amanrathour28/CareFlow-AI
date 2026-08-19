"""
Integration tests verifying Data Quality reports appear in Patient and Referral API responses.
"""
import pytest
from datetime import date, timedelta
from fastapi import status
from app.models.provider import Provider


@pytest.fixture
def seeded_provider_q(db_session):
    provider = Provider(
        name="Dr. Quality Test",
        specialty="General",
        npi="5550000001",
        phone="555-9001",
        email="quality@careflow.ai"
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)
    return provider


def test_patient_creation_includes_quality_report(client, auth_headers):
    """A newly created patient response should embed a data_quality block."""
    # Perfect patient — all fields present
    response = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Quality",
            "last_name": "Patient",
            "date_of_birth": "1988-04-20",
            "gender": "Female",
            "phone": "555-1234",
            "email": "quality@example.com",
            "address": "10 Quality Lane",
            "medical_history_summary": "Healthy, no known issues.",
            "insurance": {
                "insurance_provider": "Aetna",
                "policy_number": "AET123456",
                "plan_type": "HMO",
                "status": "Active"
            }
        },
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "data_quality" in data
    assert data["data_quality"]["quality_score"] == 100
    assert data["data_quality"]["issues"] == []
    assert data["data_quality"]["passed"] is True


def test_patient_creation_quality_flags_issues(client, auth_headers):
    """A patient missing insurance and address gets a reduced quality score in the response."""
    response = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Flagged",
            "last_name": "Patient",
            "date_of_birth": "1970-01-01",
            "gender": "Male",
            "phone": "555-0000",
            "email": "flagged@example.com"
            # no insurance, no address, no medical_history_summary
        },
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_201_CREATED
    dq = response.json()["data_quality"]
    assert dq["quality_score"] < 100
    issue_fields = [i["field"] for i in dq["issues"]]
    assert "insurance" in issue_fields


def test_referral_creation_includes_quality_report(client, auth_headers, seeded_provider_q):
    # First create a patient
    patient_res = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Referral",
            "last_name": "QualityTest",
            "date_of_birth": "1990-01-01",
            "gender": "Male",
            "phone": "555-7777",
            "email": "refquality@example.com"
        },
        headers=auth_headers["coordinator"]
    )
    patient_id = patient_res.json()["id"]

    # Submit a complete referral
    response = client.post(
        "/api/v1/referrals",
        json={
            "patient_id": patient_id,
            "provider_id": str(seeded_provider_q.id),
            "diagnosis_code": "K21.0",
            "diagnosis_description": "GERD with esophagitis",
            "requested_procedure": "Upper GI Endoscopy (CPT 43239)",
            "insurance_provider": "Blue Shield",
            "status": "Pending",
            "priority": "Medium"
        },
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "data_quality" in data
    assert data["data_quality"]["quality_score"] == 100
    assert data["data_quality"]["passed"] is True
