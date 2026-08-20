import pytest
from fastapi import Depends, status
from app.main import app
from app.api.deps import RoleChecker

# Register a temporary test route to test the RoleChecker dependency
@app.get("/test-admin-only")
def admin_only_route(user=Depends(RoleChecker(["Admin"]))):
    return {"message": "Admin authorized"}

@app.get("/test-coordinator-only")
def coordinator_only_route(user=Depends(RoleChecker(["CareCoordinator", "Admin"]))):
    return {"message": "Coordinator authorized"}


def test_user_registration(client):
    # Test successful registration
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "coordinator1",
            "email": "coord1@careflow.ai",
            "password": "securepassword123",
            "role": "CareCoordinator"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "coordinator1"
    assert data["email"] == "coord1@careflow.ai"
    assert data["role"] == "CareCoordinator"
    assert "id" in data
    assert "hashed_password" not in data  # Security check: password hash must be omitted

    # Test duplicate username registration failure
    response_dup_username = client.post(
        "/api/v1/auth/register",
        json={
            "username": "coordinator1",
            "email": "coord2@careflow.ai",
            "password": "password456",
            "role": "CareCoordinator"
        }
    )
    assert response_dup_username.status_code == status.HTTP_400_BAD_REQUEST
    assert "Username already registered" in response_dup_username.json()["detail"]

    # Test duplicate email registration failure
    response_dup_email = client.post(
        "/api/v1/auth/register",
        json={
            "username": "coordinator2",
            "email": "coord1@careflow.ai",
            "password": "password456",
            "role": "CareCoordinator"
        }
    )
    assert response_dup_email.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email already registered" in response_dup_email.json()["detail"]

    # Test invalid role registration failure
    response_bad_role = client.post(
        "/api/v1/auth/register",
        json={
            "username": "coordinator3",
            "email": "coord3@careflow.ai",
            "password": "password456",
            "role": "SuperUser"
        }
    )
    assert response_bad_role.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid role" in response_bad_role.json()["detail"]


def test_user_login(client):
    # Register the user first
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "doctor1",
            "email": "doctor1@careflow.ai",
            "password": "doctorpassword123",
            "role": "Doctor"
        }
    )
    assert register_response.status_code == status.HTTP_201_CREATED

    # Test login with username
    login_response_username = client.post(
        "/api/v1/auth/login",
        json={
            "username": "doctor1",
            "password": "doctorpassword123"
        }
    )
    assert login_response_username.status_code == status.HTTP_200_OK
    token_data = login_response_username.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["username"] == "doctor1"
    assert token_data["user"]["role"] == "Doctor"

    # Test login with email
    login_response_email = client.post(
        "/api/v1/auth/login",
        json={
            "username": "doctor1@careflow.ai",
            "password": "doctorpassword123"
        }
    )
    assert login_response_email.status_code == status.HTTP_200_OK
    assert "access_token" in login_response_email.json()

    # Test login with invalid password
    login_response_bad_pass = client.post(
        "/api/v1/auth/login",
        json={
            "username": "doctor1",
            "password": "wrongpassword"
        }
    )
    assert login_response_bad_pass.status_code == status.HTTP_401_UNAUTHORIZED

    # Test login with non-existent user
    login_response_no_user = client.post(
        "/api/v1/auth/login",
        json={
            "username": "unknownuser",
            "password": "somepassword"
        }
    )
    assert login_response_no_user.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_me(client):
    # Register and login to get token
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "coordinator_me",
            "email": "me@careflow.ai",
            "password": "mypassword123",
            "role": "CareCoordinator"
        }
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "coordinator_me",
            "password": "mypassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Access /me with token
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == status.HTTP_200_OK
    assert me_response.json()["username"] == "coordinator_me"

    # Access /me without token
    me_response_no_token = client.get("/api/v1/auth/me")
    assert me_response_no_token.status_code == status.HTTP_401_UNAUTHORIZED

    # Access /me with invalid token
    headers_bad = {"Authorization": "Bearer invalidtokenbody"}
    me_response_bad_token = client.get("/api/v1/auth/me", headers=headers_bad)
    assert me_response_bad_token.status_code == status.HTTP_401_UNAUTHORIZED


def test_role_based_access_control(client):
    # Create Admin user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "admin1",
            "email": "admin@careflow.ai",
            "password": "adminpassword",
            "role": "Admin"
        }
    )
    # Create Care Coordinator user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "coord_rbac",
            "email": "coord_rbac@careflow.ai",
            "password": "coordpassword",
            "role": "CareCoordinator"
        }
    )

    # Login Admin
    login_admin = client.post(
        "/api/v1/auth/login",
        json={"username": "admin1", "password": "adminpassword"}
    )
    admin_token = login_admin.json()["access_token"]

    # Login Coordinator
    login_coord = client.post(
        "/api/v1/auth/login",
        json={"username": "coord_rbac", "password": "coordpassword"}
    )
    coord_token = login_coord.json()["access_token"]

    # Admin accesses Admin-only route
    res = client.get("/test-admin-only", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["message"] == "Admin authorized"

    # Coordinator accesses Admin-only route (should fail)
    res_fail = client.get("/test-admin-only", headers={"Authorization": f"Bearer {coord_token}"})
    assert res_fail.status_code == status.HTTP_403_FORBIDDEN
    assert "Not enough permissions" in res_fail.json()["detail"]

    # Coordinator accesses Coordinator-allowed route (should succeed)
    res_coord_ok = client.get("/test-coordinator-only", headers={"Authorization": f"Bearer {coord_token}"})
    assert res_coord_ok.status_code == status.HTTP_200_OK
    assert res_coord_ok.json()["message"] == "Coordinator authorized"


def test_forgot_password_flow(client):
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "forgot_user",
            "email": "forgot_user@careflow.ai",
            "password": "initialpassword123",
            "role": "Doctor"
        }
    )

    # 1. Request OTP using username
    res_otp = client.post(
        "/api/v1/auth/forgot-password/send-otp",
        json={"username_or_email": "forgot_user"}
    )
    assert res_otp.status_code == status.HTTP_200_OK
    otp_data = res_otp.json()
    assert "otp" in otp_data
    otp_code = otp_data["otp"]
    email = otp_data["email"]

    # 2. Reset password with valid OTP
    res_reset = client.post(
        "/api/v1/auth/forgot-password/reset",
        json={
            "email": email,
            "otp": otp_code,
            "new_password": "newresetpassword123"
        }
    )
    assert res_reset.status_code == status.HTTP_200_OK
    assert res_reset.json()["success"] is True

    # 3. Old password should now fail
    res_old_login = client.post(
        "/api/v1/auth/login",
        json={"username": "forgot_user", "password": "initialpassword123"}
    )
    assert res_old_login.status_code == status.HTTP_401_UNAUTHORIZED

    # 4. New password succeeds
    res_new_login = client.post(
        "/api/v1/auth/login",
        json={"username": "forgot_user", "password": "newresetpassword123"}
    )
    assert res_new_login.status_code == status.HTTP_200_OK
    assert "access_token" in res_new_login.json()


def test_change_password_flow(client):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "changepass_user",
            "email": "changepass@careflow.ai",
            "password": "originalpass123",
            "role": "CareCoordinator"
        }
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "changepass_user", "password": "originalpass123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change password
    change_res = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": "originalpass123",
            "new_password": "brandnewpassword456"
        }
    )
    assert change_res.status_code == status.HTTP_200_OK
    assert change_res.json()["success"] is True

    # Verify login with new password
    verify_login = client.post(
        "/api/v1/auth/login",
        json={"username": "changepass_user", "password": "brandnewpassword456"}
    )
    assert verify_login.status_code == status.HTTP_200_OK
