from fastapi.testclient import TestClient
from app.main import app
from app.database.base import Base
from app.api.deps import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup test DB with multi-thread check disabled for SQLite
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

connection = engine.connect()
Base.metadata.create_all(bind=connection)

db = TestingSessionLocal(bind=connection)
def override_get_db():
    try:
        yield db
    finally:
        pass

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

response = client.post(
    "/api/v1/auth/register",
    json={
        "username": "coordinator1",
        "email": "coord1@careflow.ai",
        "password": "securepassword123",
        "role": "CareCoordinator"
    }
)
print("Status Code:", response.status_code)
print("Body:", response.json())

db.close()
connection.close()
