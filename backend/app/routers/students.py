"""
Student management API endpoints.
"""

from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.student import StudentCreate, StudentResponse
from app.schemas.class_schema import ClassResponse
from app.services import student_service

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=List[StudentResponse])
def get_all_students(
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get all students.
    
    Returns a list of all students with their user and parent information.
    """
    students = student_service.get_all_students(db)
    return students


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


@router.get("/{student_id}/classes", response_model=List[ClassResponse])
def get_student_classes(
    student_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get all classes registered by a student.
    
    Returns a list of classes the student is enrolled in.
    """
    classes = student_service.get_student_classes(db, student_id)
    return classes


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Delete a student.
    
    Deletes the student and their associated user account.
    Also removes all class registrations and subscriptions.
    """
    student_service.delete_student(db, student_id)
    return None
