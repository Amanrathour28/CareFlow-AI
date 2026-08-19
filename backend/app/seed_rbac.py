"""
CareFlow AI - Demo RBAC Seed Data Script
Creates standard demo accounts for Admin, Doctor, and Caregiver roles.
"""
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.user import User, UserRole
from app.repositories.user import user_repository
from app.schemas.user import UserCreate

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    demo_users = [
        {"username": "AdminUser", "email": "admin@careflow.ai", "password": "Admin123!", "role": UserRole.ADMIN.value},
        {"username": "DrSmith", "email": "doctor@careflow.ai", "password": "Doctor123!", "role": UserRole.DOCTOR.value},
        {"username": "CaregiverJane", "email": "caregiver@careflow.ai", "password": "Caregiver123!", "role": UserRole.CAREGIVER.value},
    ]

    print("=== Seeding CareFlow AI RBAC Demo Users ===")
    for u in demo_users:
        existing = user_repository.get_by_email(db, u["email"])
        if not existing:
            user_in = UserCreate(
                username=u["username"],
                email=u["email"],
                password=u["password"],
                role=u["role"]
            )
            created = user_repository.create(db, obj_in=user_in)
            print(f"[OK] Created {u['role']} Account: {created.email} (Username: {created.username})")
        else:
            print(f"[INFO] Existing {u['role']} Account: {existing.email}")

    db.close()
    print("=== RBAC Seed Complete ===")

if __name__ == "__main__":
    seed()
