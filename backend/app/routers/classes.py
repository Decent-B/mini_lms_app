"""
Class management and registration API endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Query, status

from app.core.dependencies import DatabaseSession, StaffUser, CurrentUser
from app.schemas.class_schema import ClassCreate, ClassResponse, ClassUpdate
from app.schemas.registration import RegistrationCreate, RegistrationResponse
from app.services import class_service

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Create a new class.
    
    Requires: Staff role
    Validates time_slot format and creates the class.
    """
    new_class = class_service.create_class(db, class_data)
    return new_class


@router.get("", response_model=list[ClassResponse])
def get_classes(
    current_user: CurrentUser,
    db: DatabaseSession,
    day: Annotated[str | None, Query(description="Filter by day of week (e.g., 'monday')")] = None
):
    """
    Get all classes or filter by day of week.
    
    Requires: Any authenticated user
    Query parameters:
    - day: Day of week (monday, tuesday, wednesday, thursday, friday, saturday, sunday)
    """
    classes = class_service.get_classes_by_day(db, day)
    return classes


@router.get("/{class_id}/registrations", response_model=list[RegistrationResponse])
def get_class_registrations(
    class_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Get all registrations for a specific class.
    
    Requires: Staff role
    Returns a list of registrations with student information.
    """
    registrations = class_service.get_class_registrations(db, class_id)
    return registrations


@router.post("/{class_id}/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_student(
    class_id: int,
    registration_data: RegistrationCreate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Register a student to a class.
    
    Requires: Staff role
    Performs the following validations:
    - Class and student must exist
    - Student not already registered
    - Class not full
    - Student has active subscription with available sessions
    - No schedule conflicts (checks for overlapping classes on the same day)
    """
    registration = class_service.register_student_to_class(
        db,
        class_id,
        registration_data.student_id
    )
    return registration


@router.patch("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_data: ClassUpdate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Update class information.
    
    Requires: Staff role
    Updates class name, subject, day, time slot, teacher, and/or max students.
    """
    updated_class = class_service.update_class(db, class_id, class_data)
    return updated_class


@router.delete("/{class_id}/registrations/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def unregister_student(
    class_id: int,
    student_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Remove a student's registration from a class.
    
    Requires: Staff role
    Removes the registration record linking the student to the class.
    """
    class_service.unregister_student_from_class(db, class_id, student_id)
    return None
