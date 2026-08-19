import pytest
from fastapi import status

def test_get_dashboard_metrics_success(client, auth_headers, seeded_patient, seeded_referral):
    response = client.get(
        "/api/v1/dashboard/metrics",
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "total_patients" in data
    assert "pending_referrals" in data
    assert "approved_referrals" in data
    assert "missing_info_referrals" in data
    assert "high_priority_referrals" in data
    assert "average_data_quality_score" in data
    assert "status_distribution" in data
    assert "priority_distribution" in data
    
    # Assert values match our seeded data (1 patient, 1 referral with status Pending)
    assert data["total_patients"] >= 1
    assert data["pending_referrals"] >= 1
    assert data["status_distribution"][0]["name"] == "Pending"
    assert data["status_distribution"][0]["value"] >= 1


def test_get_dashboard_metrics_unauthorized(client):
    response = client.get("/api/v1/dashboard/metrics")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
