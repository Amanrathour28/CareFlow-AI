import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base
from app.api.deps import get_db
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.referral import Referral

# In-memory SQLite for isolated test runs
DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db_session")
def db_session_fixture():
    """Fixture to create all tables and yield a session with transaction rollback support."""
    connection = engine.connect()
    # Create tables on the active connection so they persist in memory
    Base.metadata.create_all(bind=connection)
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.rollback()
    session.close()
    connection.close()

@pytest.fixture(name="client")
def client_fixture(db_session):
    """Fixture to yield a FastAPI test client with mocked get_db dependencies."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Helper fixture to register users and return authorization headers for Admin, Doctor, and Coordinator."""
    client.post(
        "/api/v1/auth/register",
        json={"username": "admin_p", "email": "admin_p@careflow.ai", "password": "adminpassword", "role": "Admin"}
    )
    admin_login = client.post("/api/v1/auth/login", json={"username": "admin_p", "password": "adminpassword"}).json()
    admin_token = admin_login["access_token"]

    client.post(
        "/api/v1/auth/register",
        json={"username": "doctor_p", "email": "doctor_p@careflow.ai", "password": "docpassword", "role": "Doctor"}
    )
    doc_login = client.post("/api/v1/auth/login", json={"username": "doctor_p", "password": "docpassword"}).json()
    doc_token = doc_login["access_token"]

    client.post(
        "/api/v1/auth/register",
        json={"username": "coord_p", "email": "coord_p@careflow.ai", "password": "coordpassword", "role": "Caregiver"}
    )
    coord_login = client.post("/api/v1/auth/login", json={"username": "coord_p", "password": "coordpassword"}).json()
    coord_token = coord_login["access_token"]

    return {
        "admin": {"Authorization": f"Bearer {admin_token}"},
        "doctor": {"Authorization": f"Bearer {doc_token}"},
        "coordinator": {"Authorization": f"Bearer {coord_token}"}
    }


@pytest.fixture
def seeded_provider(db_session):
    """Seed a provider record directly into the test database."""
    provider = Provider(
        name="Dr. Gregory House",
        specialty="Diagnostic Medicine",
        npi="1234567890",
        phone="555-1000",
        email="house@careflow.ai"
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)
    return provider


@pytest.fixture
def seeded_patient(db_session):
    """Seed a patient record directly into the test database."""
    patient = Patient(
        first_name="Arthur",
        last_name="Dent",
        date_of_birth=date(1979, 10, 12),
        gender="Male",
        phone="555-4242",
        email="arthur@example.com"
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient


@pytest.fixture
def seeded_referral(db_session, seeded_patient, seeded_provider):
    """Seed a basic referral directly into the test database."""
    referral = Referral(
        patient_id=seeded_patient.id,
        provider_id=seeded_provider.id,
        diagnosis_code="K21.9",
        diagnosis_description="Gastroesophageal reflux disease without esophagitis",
        requested_procedure="Upper GI Endoscopy (CPT 43239)",
        insurance_provider="Aetna",
        status="Pending",
        priority="Medium"
    )
    db_session.add(referral)
    db_session.commit()
    db_session.refresh(referral)
    return referral
