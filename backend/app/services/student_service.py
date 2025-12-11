"""
Service layer for student operations.

Handles business logic for student management.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.student import Student
from app.models.user import User, UserRole
from app.models.parent import Parent
from app.schemas.student import StudentCreate
from app.core.security import get_password_hash


def create_student(db: Session, student_data: StudentCreate) -> Student:
    """
    Create a new student with associated user account.
    
    Args:
        db: Database session
        student_data: Student creation data
        
    Returns:
        Created student object
        
    Raises:
        HTTPException: If email already exists or parent not found
    """
    # Check if parent exists
    parent = db.query(Parent).filter(Parent.id == student_data.parent_id).first()
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == student_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create user account
        user = User(
            name=student_data.name,
            email=student_data.email,
            password_hash=get_password_hash(student_data.password),
            role=UserRole.STUDENT
        )
        db.add(user)
        db.flush()
        
        # Create student profile
        student = Student(
            user_id=user.id,
            dob=student_data.dob,
            gender=student_data.gender,
            current_grade=student_data.current_grade,
            parent_id=student_data.parent_id
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        
        return student
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )


def get_student_by_id(db: Session, student_id: int) -> Student:
    """
    Get student by ID with user and parent information.
    
    Args:
        db: Database session
        student_id: Student ID
        
    Returns:
        Student object with relationships loaded
        
    Raises:
        HTTPException: If student not found
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return student
