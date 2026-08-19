import pytest
from fastapi import status
import uuid


def test_create_referral_success(client, auth_headers, seeded_patient, seeded_provider):
    referral_data = {
        "patient_id": str(seeded_patient.id),
        "provider_id": str(seeded_provider.id),
        "diagnosis_code": "M54.5",
        "diagnosis_description": "Low back pain",
        "requested_procedure": "Lumbar Spine MRI (CPT 72148)",
        "insurance_provider": "Blue Shield",
        "status": "Pending",
        "priority": "High"
    }

    response = client.post(
        "/api/v1/referrals",
        json=referral_data,
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] == "Pending"
    assert data["priority"] == "High"
    assert "id" in data


def test_create_referral_invalid_references(client, auth_headers, seeded_patient, seeded_provider):
    fake_id = str(uuid.uuid4())
    
    # Test invalid patient ID
    response_bad_patient = client.post(
        "/api/v1/referrals",
        json={
            "patient_id": fake_id,
            "provider_id": str(seeded_provider.id),
            "diagnosis_code": "M54.5",
            "diagnosis_description": "Low back pain",
            "requested_procedure": "MRI",
            "insurance_provider": "Blue Shield"
        },
        headers=auth_headers["coordinator"]
    )
    assert response_bad_patient.status_code == status.HTTP_400_BAD_REQUEST
    assert "Patient reference not found" in response_bad_patient.json()["detail"]

    # Test invalid provider ID
    response_bad_provider = client.post(
        "/api/v1/referrals",
        json={
            "patient_id": str(seeded_patient.id),
            "provider_id": fake_id,
            "diagnosis_code": "M54.5",
            "diagnosis_description": "Low back pain",
            "requested_procedure": "MRI",
            "insurance_provider": "Blue Shield"
        },
        headers=auth_headers["coordinator"]
    )
    assert response_bad_provider.status_code == status.HTTP_400_BAD_REQUEST
    assert "Provider reference not found" in response_bad_provider.json()["detail"]


def test_get_referral_by_id(client, auth_headers, seeded_patient, seeded_provider):
    # Coordinator creates the referral
    create_res = client.post(
        "/api/v1/referrals",
        json={
            "patient_id": str(seeded_patient.id),
            "provider_id": str(seeded_provider.id),
            "diagnosis_code": "M54.5",
            "diagnosis_description": "Low back pain",
            "requested_procedure": "MRI",
            "insurance_provider": "Blue Shield"
        },
        headers=auth_headers["coordinator"]
    )
    referral_id = create_res.json()["id"]

    # Get referral details (includes patient & provider)
    get_res = client.get(
        f"/api/v1/referrals/{referral_id}",
        headers=auth_headers["doctor"]
    )
    assert get_res.status_code == status.HTTP_200_OK
    data = get_res.json()
    assert data["patient"]["first_name"] == "Arthur"
    assert data["provider"]["name"] == "Dr. Gregory House"
    assert data["diagnosis_code"] == "M54.5"


def test_list_referrals_and_filter(client, auth_headers, seeded_patient, seeded_provider):
    # Submit Referral 1 (Pending, High)
    client.post(
        "/api/v1/referrals",
        json={
            "patient_id": str(seeded_patient.id),
            "provider_id": str(seeded_provider.id),
            "diagnosis_code": "M54.5",
            "diagnosis_description": "Back Pain",
            "requested_procedure": "MRI",
            "insurance_provider": "Blue Shield",
            "status": "Pending",
            "priority": "High"
        },
        headers=auth_headers["coordinator"]
    )
    # Submit Referral 2 (Approved, Low)
    client.post(
        "/api/v1/referrals",
        json={
            "patient_id": str(seeded_patient.id),
            "provider_id": str(seeded_provider.id),
            "diagnosis_code": "K59.0",
            "diagnosis_description": "Constipation",
            "requested_procedure": "Colonoscopy",
            "insurance_provider": "Aetna",
            "status": "Approved",
            "priority": "Low"
        },
        headers=auth_headers["coordinator"]
    )

    # List all referrals
    list_all = client.get("/api/v1/referrals", headers=auth_headers["doctor"])
    assert list_all.status_code == status.HTTP_200_OK
    assert list_all.json()["total"] == 2

    # Filter by status Approved
    list_approved = client.get("/api/v1/referrals?status=Approved", headers=auth_headers["doctor"])
    assert list_approved.status_code == status.HTTP_200_OK
    assert list_approved.json()["total"] == 1
    assert list_approved.json()["items"][0]["status"] == "Approved"

    # Filter by priority High
    list_high = client.get("/api/v1/referrals?priority=High", headers=auth_headers["doctor"])
    assert list_high.json()["total"] == 1
    assert list_high.json()["items"][0]["priority"] == "High"


def test_patch_referral_rbac(client, auth_headers, seeded_patient, seeded_provider):
    # Coordinator creates the referral
    create_res = client.post(
        "/api/v1/referrals",
        json={
            "patient_id": str(seeded_patient.id),
            "provider_id": str(seeded_provider.id),
            "diagnosis_code": "M54.5",
            "diagnosis_description": "Back Pain",
            "requested_procedure": "MRI",
            "insurance_provider": "Blue Shield"
        },
        headers=auth_headers["coordinator"]
    )
    referral_id = create_res.json()["id"]

    # Doctor tries to patch status (should be Forbidden 403)
    patch_fail = client.patch(
        f"/api/v1/referrals/{referral_id}",
        json={"status": "Approved"},
        headers=auth_headers["doctor"]
    )
    assert patch_fail.status_code == status.HTTP_403_FORBIDDEN

    # Coordinator patches status successfully
    patch_success = client.patch(
        f"/api/v1/referrals/{referral_id}",
        json={"status": "UnderReview", "priority": "High"},
        headers=auth_headers["coordinator"]
    )
    assert patch_success.status_code == status.HTTP_200_OK
    assert patch_success.json()["status"] == "UnderReview"
    assert patch_success.json()["priority"] == "High"


def test_delete_referral_rbac(client, auth_headers, seeded_patient, seeded_provider):
    # Coordinator creates the referral
    create_res = client.post(
        "/api/v1/referrals",
        json={
            "patient_id": str(seeded_patient.id),
            "provider_id": str(seeded_provider.id),
            "diagnosis_code": "M54.5",
            "diagnosis_description": "Back Pain",
            "requested_procedure": "MRI",
            "insurance_provider": "Blue Shield"
        },
        headers=auth_headers["coordinator"]
    )
    referral_id = create_res.json()["id"]

    # Coordinator tries to delete (should be Forbidden 403)
    delete_fail = client.delete(
        f"/api/v1/referrals/{referral_id}",
        headers=auth_headers["coordinator"]
    )
    assert delete_fail.status_code == status.HTTP_403_FORBIDDEN

    # Admin deletes the referral successfully
    delete_success = client.delete(
        f"/api/v1/referrals/{referral_id}",
        headers=auth_headers["admin"]
    )
    assert delete_success.status_code == status.HTTP_204_NO_CONTENT
