import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.task import Task
from app.services.audit import log_audit_event

router = APIRouter()
ADMIN_ONLY = [UserRole.ADMIN.value]


class PatientAssignmentRequest(BaseModel):
    patient_id: uuid.UUID = Field(..., description="UUID of the patient")
    assigned_doctor_id: Optional[uuid.UUID] = Field(None, description="UUID of Doctor to assign")
    assigned_caregiver_id: Optional[uuid.UUID] = Field(None, description="UUID of Caregiver to assign")


class TaskAssignmentRequest(BaseModel):
    task_id: uuid.UUID = Field(..., description="UUID of the task")
    assigned_to_user_id: uuid.UUID = Field(..., description="UUID of user to assign task to")


@router.post("/patient", dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def assign_patient(
    payload: PatientAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Assign/reassign Doctor and Caregiver to a patient (Admin only)."""
    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    old_doctor = str(patient.assigned_doctor_id) if patient.assigned_doctor_id else None
    old_caregiver = str(patient.assigned_caregiver_id) if patient.assigned_caregiver_id else None

    if payload.assigned_doctor_id is not None:
        patient.assigned_doctor_id = payload.assigned_doctor_id
    if payload.assigned_caregiver_id is not None:
        patient.assigned_caregiver_id = payload.assigned_caregiver_id

    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="patient_assignment_changed",
        resource_type="patients",
        resource_id=patient.id,
        old_value={"doctor_id": old_doctor, "caregiver_id": old_caregiver},
        new_value={"doctor_id": str(patient.assigned_doctor_id), "caregiver_id": str(patient.assigned_caregiver_id)}
    )

    return {
        "message": "Patient assignments updated successfully",
        "patient_id": patient.id,
        "assigned_doctor_id": patient.assigned_doctor_id,
        "assigned_caregiver_id": patient.assigned_caregiver_id
    }


@router.post("/task", dependencies=[Depends(RoleChecker(ADMIN_ONLY))])
def assign_task(
    payload: TaskAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Assign or reassign a task to a user (Admin only)."""
    task = db.get(Task, payload.task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    old_assignee = str(task.assigned_to_user_id) if task.assigned_to_user_id else None
    task.assigned_to_user_id = payload.assigned_to_user_id

    db.add(task)
    db.commit()
    db.refresh(task)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="task_assignment_changed",
        resource_type="tasks",
        resource_id=task.id,
        old_value={"assigned_to_user_id": old_assignee},
        new_value={"assigned_to_user_id": str(task.assigned_to_user_id)}
    )

    return {
        "message": "Task reassigned successfully",
        "task_id": task.id,
        "assigned_to_user_id": task.assigned_to_user_id
    }
