import pytest
from fastapi import status
from datetime import date, timedelta
import uuid
from sqlalchemy import select
from app.models.user import User
from app.models.task import Task

@pytest.fixture
def test_coordinator_user(db_session):
    """Retrieve the registered coordinator user from DB to assign tasks."""
    statement = select(User).where(User.username == "coord_p")
    return db_session.execute(statement).scalar_one()


def test_create_task_success(client, auth_headers, seeded_referral, test_coordinator_user):
    task_data = {
        "referral_id": str(seeded_referral.id),
        "assigned_to_user_id": str(test_coordinator_user.id),
        "priority": "High",
        "due_date": str(date.today() + timedelta(days=2)),
        "status": "Pending",
        "notes": "Verify medical justification history"
    }

    response = client.post(
        "/api/v1/tasks",
        json=task_data,
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] == "Pending"
    assert data["priority"] == "High"
    assert data["notes"] == "Verify medical justification history"
    assert "id" in data


def test_create_task_invalid_referral(client, auth_headers, test_coordinator_user):
    fake_referral_id = str(uuid.uuid4())
    task_data = {
        "referral_id": fake_referral_id,
        "assigned_to_user_id": str(test_coordinator_user.id),
        "priority": "Medium",
        "due_date": str(date.today() + timedelta(days=2)),
        "status": "Pending",
        "notes": "Follow up"
    }

    response = client.post(
        "/api/v1/tasks",
        json=task_data,
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "referral not found" in response.json()["detail"].lower()


def test_create_task_invalid_assignee(client, auth_headers, seeded_referral):
    fake_user_id = str(uuid.uuid4())
    task_data = {
        "referral_id": str(seeded_referral.id),
        "assigned_to_user_id": fake_user_id,
        "priority": "Medium",
        "due_date": str(date.today() + timedelta(days=2)),
        "status": "Pending"
    }

    response = client.post(
        "/api/v1/tasks",
        json=task_data,
        headers=auth_headers["coordinator"]
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "user not found" in response.json()["detail"].lower()


def test_list_tasks_and_filter(client, auth_headers, seeded_referral, test_coordinator_user):
    # Create Task 1 (Pending)
    client.post(
        "/api/v1/tasks",
        json={
            "referral_id": str(seeded_referral.id),
            "assigned_to_user_id": str(test_coordinator_user.id),
            "priority": "Medium",
            "due_date": str(date.today() + timedelta(days=2)),
            "status": "Pending"
        },
        headers=auth_headers["coordinator"]
    )

    # Create Task 2 (InProgress)
    client.post(
        "/api/v1/tasks",
        json={
            "referral_id": str(seeded_referral.id),
            "assigned_to_user_id": str(test_coordinator_user.id),
            "priority": "High",
            "due_date": str(date.today() + timedelta(days=1)),
            "status": "InProgress"
        },
        headers=auth_headers["coordinator"]
    )

    # List all tasks
    list_all = client.get("/api/v1/tasks", headers=auth_headers["coordinator"])
    assert list_all.status_code == status.HTTP_200_OK
    assert list_all.json()["total"] == 2

    # Filter by status Pending
    list_pending = client.get(
        f"/api/v1/tasks?status=Pending",
        headers=auth_headers["coordinator"]
    )
    assert list_pending.status_code == status.HTTP_200_OK
    assert list_pending.json()["total"] == 1
    assert list_pending.json()["items"][0]["status"] == "Pending"

    # Filter by assignee
    list_assignee = client.get(
        f"/api/v1/tasks?assigned_to={test_coordinator_user.id}",
        headers=auth_headers["coordinator"]
    )
    assert list_assignee.json()["total"] == 2


def test_patch_task_rbac(client, auth_headers, seeded_referral, test_coordinator_user, db_session):
    # Create task
    create_res = client.post(
        "/api/v1/tasks",
        json={
            "referral_id": str(seeded_referral.id),
            "assigned_to_user_id": str(test_coordinator_user.id),
            "priority": "Medium",
            "due_date": str(date.today() + timedelta(days=2)),
            "status": "Pending"
        },
        headers=auth_headers["coordinator"]
    )
    task_id = create_res.json()["id"]

    # Doctor tries to patch status (should be Forbidden 403)
    patch_fail = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "Completed"},
        headers=auth_headers["doctor"]
    )
    assert patch_fail.status_code == status.HTTP_403_FORBIDDEN

    # Coordinator patches status successfully
    patch_success = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "Completed", "notes": "Documentation verified"},
        headers=auth_headers["coordinator"]
    )
    assert patch_success.status_code == status.HTTP_200_OK
    assert patch_success.json()["status"] == "Completed"
    assert patch_success.json()["notes"] == "Documentation verified"

    # Verify directly in DB
    db_session.expire_all()
    task_in_db = db_session.get(Task, uuid.UUID(task_id))
    assert task_in_db.status == "Completed"
