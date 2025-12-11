"""
Student management API endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.student import StudentCreate, StudentResponse
from app.services import student_service

router = APIRouter(prefix="/api/students", tags=["students"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new student account.
    
    Creates both a user account and student profile.
    Requires a valid parent_id.
    """
    student = student_service.create_student(db, student_data)
    return student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get student details by ID.
    
    Returns student information including user details and parent information.
    """
    student = student_service.get_student_by_id(db, student_id)
    return student
