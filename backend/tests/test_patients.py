import pytest
from datetime import date
from fastapi import status
import uuid




def test_create_and_fetch_unified_patient(client, auth_headers):
    # Coordinator creates a patient with nested insurance, medications, and labs
    patient_data = {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1985-05-15",
        "gender": "Male",
        "phone": "555-0199",
        "email": "johndoe@example.com",
        "address": "123 Health Ave, Boston MA",
        "medical_history_summary": "Mild asthma, allergy to penicillin.",
        "insurance": {
            "insurance_provider": "Blue Cross Blue Shield",
            "policy_number": "BC123456789",
            "group_number": "GRP987",
            "plan_type": "PPO",
            "status": "Active"
        },
        "medications": [
            {
                "drug_name": "Albuterol Inhaler",
                "dosage": "90 mcg/actuation",
                "frequency": "As needed for asthma",
                "status": "Active",
                "prescribed_date": "2026-01-10"
            }
        ],
        "laboratory_results": [
            {
                "test_name": "Basic Metabolic Panel",
                "test_value": "140",
                "unit": "mEq/L",
                "reference_range": "135-145",
                "status": "Normal",
                "test_date": "2026-03-22"
            }
        ]
    }

    create_response = client.post(
        "/api/v1/patients",
        json=patient_data,
        headers=auth_headers["coordinator"]
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    patient_id = create_response.json()["id"]

    # Retrieve unified record (Doctor retrieves it)
    get_response = client.get(
        f"/api/v1/patients/{patient_id}",
        headers=auth_headers["doctor"]
    )
    assert get_response.status_code == status.HTTP_200_OK
    data = get_response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["insurance"]["policy_number"] == "BC123456789"
    assert len(data["medications"]) == 1
    assert data["medications"][0]["drug_name"] == "Albuterol Inhaler"
    assert len(data["laboratory_results"]) == 1
    assert data["laboratory_results"][0]["test_name"] == "Basic Metabolic Panel"


def test_list_patients_and_search(client, auth_headers):
    # Register two patients
    client.post(
        "/api/v1/patients",
        json={
            "first_name": "Alice",
            "last_name": "Smith",
            "date_of_birth": "1990-10-10",
            "gender": "Female",
            "phone": "555-0102",
            "email": "alice@example.com"
        },
        headers=auth_headers["coordinator"]
    )
    client.post(
        "/api/v1/patients",
        json={
            "first_name": "Bob",
            "last_name": "Johnson",
            "date_of_birth": "1972-12-12",
            "gender": "Male",
            "phone": "555-0103",
            "email": "bob@example.com"
        },
        headers=auth_headers["coordinator"]
    )

    # Doctor lists all patients
    list_response = client.get("/api/v1/patients", headers=auth_headers["doctor"])
    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.json()["total"] >= 2

    # Coordinator searches for "alice"
    search_response = client.get("/api/v1/patients?search=alice", headers=auth_headers["coordinator"])
    assert search_response.status_code == status.HTTP_200_OK
    assert search_response.json()["total"] == 1
    assert search_response.json()["items"][0]["first_name"] == "Alice"


def test_update_patient(client, auth_headers):
    # Coordinator creates a patient
    create_response = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Original",
            "last_name": "Name",
            "date_of_birth": "1995-01-01",
            "gender": "Other",
            "phone": "555-0000",
            "email": "original@example.com"
        },
        headers=auth_headers["coordinator"]
    )
    patient_id = create_response.json()["id"]

    # Coordinator updates phone and address
    update_response = client.put(
        f"/api/v1/patients/{patient_id}",
        json={"phone": "555-9999", "address": "New Address"},
        headers=auth_headers["coordinator"]
    )
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.json()["phone"] == "555-9999"
    assert update_response.json()["address"] == "New Address"
    assert update_response.json()["first_name"] == "Original"  # remains unchanged


def test_delete_patient_and_cascade(client, auth_headers):
    # Coordinator creates a patient with insurance and meds
    create_response = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Terminator",
            "last_name": "DeleteMe",
            "date_of_birth": "1980-01-01",
            "gender": "Male",
            "phone": "555-4444",
            "email": "delete@example.com",
            "insurance": {
                "insurance_provider": "Temp Insurance",
                "policy_number": "T1234"
            },
            "medications": [
                {
                    "drug_name": "Aspirin",
                    "dosage": "81mg",
                    "frequency": "Daily",
                    "prescribed_date": "2026-02-02"
                }
            ]
        },
        headers=auth_headers["coordinator"]
    )
    patient_id = create_response.json()["id"]

    # Doctor tries to delete (should fail - forbidden role check)
    delete_fail = client.delete(
        f"/api/v1/patients/{patient_id}",
        headers=auth_headers["doctor"]
    )
    assert delete_fail.status_code == status.HTTP_403_FORBIDDEN

    # Admin deletes the patient
    delete_success = client.delete(
        f"/api/v1/patients/{patient_id}",
        headers=auth_headers["admin"]
    )
    assert delete_success.status_code == status.HTTP_204_NO_CONTENT

    # Accessing deleted patient detail should return 404
    get_response = client.get(
        f"/api/v1/patients/{patient_id}",
        headers=auth_headers["admin"]
    )
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_unauthorized_access(client):
    # No auth header (should return 401 Unauthorized)
    response = client.get("/api/v1/patients")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
