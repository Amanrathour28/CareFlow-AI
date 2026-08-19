import pytest
from fastapi import status
import uuid
from app.models.referral import Referral


def test_analyze_referral_success(client, auth_headers, seeded_referral, db_session):
    # Coordinator triggers AI analysis
    response = client.post(
        "/api/v1/ai/analyze-referral",
        json={"referral_id": str(seeded_referral.id)},
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "completeness_score" in data
    assert "missing_information" in data
    assert "potential_issues" in data
    assert "recommendation" in data
    assert data["confidence"] > 0.0
    assert data["human_review_required"] is True
    assert "disclaimer" in data
    assert "clinical decision" in data["disclaimer"].lower()

    # Verify database update
    db_session.expire_all()  # Force reload from DB
    ref_in_db = db_session.get(Referral, seeded_referral.id)
    assert ref_in_db.ai_analysis is not None
    assert ref_in_db.ai_analysis["completeness_score"] == data["completeness_score"]


def test_analyze_referral_rbac(client, auth_headers, seeded_referral):
    # Doctor triggers AI analysis (should be Forbidden 403)
    response_fail = client.post(
        "/api/v1/ai/analyze-referral",
        json={"referral_id": str(seeded_referral.id)},
        headers=auth_headers["doctor"]
    )
    assert response_fail.status_code == status.HTTP_403_FORBIDDEN

    # Admin triggers AI analysis (should succeed 200)
    response_admin = client.post(
        "/api/v1/ai/analyze-referral",
        json={"referral_id": str(seeded_referral.id)},
        headers=auth_headers["admin"]
    )
    assert response_admin.status_code == status.HTTP_200_OK


def test_analyze_referral_not_found(client, auth_headers):
    fake_id = str(uuid.uuid4())
    response = client.post(
        "/api/v1/ai/analyze-referral",
        json={"referral_id": fake_id},
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Referral not found" in response.json()["detail"]
