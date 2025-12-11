"""
Class management and registration API endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.class_schema import ClassCreate, ClassResponse
from app.schemas.registration import RegistrationCreate, RegistrationResponse
from app.services import class_service

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new class.
    
    Validates time_slot format and creates the class.
    """
    new_class = class_service.create_class(db, class_data)
    return new_class


@router.get("", response_model=list[ClassResponse])
def get_classes(
    db: Annotated[Session, Depends(get_db)],
    day: Annotated[str | None, Query(description="Filter by day of week (e.g., 'monday')")] = None
):
    """
    Get all classes or filter by day of week.
    
    Query parameters:
    - day: Day of week (monday, tuesday, wednesday, thursday, friday, saturday, sunday)
    """
    classes = class_service.get_classes_by_day(db, day)
    return classes


@router.post("/{class_id}/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_student(
    class_id: int,
    registration_data: RegistrationCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Register a student to a class.
    
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
