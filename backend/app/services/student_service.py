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
from app.models.class_model import ClassModel
from app.models.class_registration import ClassRegistration
from app.schemas.student import StudentCreate, StudentUpdate
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


def get_all_students(db: Session) -> list[Student]:
    """
    Get all students.
    
    Args:
        db: Database session
        
    Returns:
        List of all students with relationships loaded
    """
    students = db.query(Student).all()
    return students


def get_student_classes(db: Session, student_id: int) -> list[ClassModel]:
    """
    Get all classes a student is registered for.
    
    Args:
        db: Database session
        student_id: Student ID
        
    Returns:
        List of classes the student is enrolled in
        
    Raises:
        HTTPException: If student not found
    """
    # Verify student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Get all classes through registrations
    classes = (
        db.query(ClassModel)
        .join(ClassRegistration, ClassRegistration.class_id == ClassModel.id)
        .filter(ClassRegistration.student_id == student_id)
        .all()
    )
    
    return classes


def delete_student(db: Session, student_id: int) -> None:
    """
    Delete a student and their associated user account.
    
    Args:
        db: Database session
        student_id: Student ID
        
    Raises:
        HTTPException: If student not found
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Get the user_id before deleting student
    user_id = student.user_id
    
    # Delete student (cascade will handle registrations and subscriptions)
    db.delete(student)
    
    # Delete associated user account
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
    
    db.commit()


def get_student_by_user_id(db: Session, user_id: int) -> Student:
    """
    Get student by their user ID.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Student object with relationships loaded
        
    Raises:
        HTTPException: If student not found
    """
    student = db.query(Student).filter(Student.user_id == user_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return student


def update_student(db: Session, student_id: int, student_data: "StudentUpdate") -> Student:
    """
    Update student information.
    
    Args:
        db: Database session
        student_id: Student ID to update
        student_data: StudentUpdate schema with updated fields
        
    Returns:
        Updated student object
        
    Raises:
        HTTPException: If student not found or parent not found
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate parent_id if provided
    if student_data.parent_id is not None:
        from app.models.parent import Parent
        parent = db.query(Parent).filter(Parent.id == student_data.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found"
            )
        student.parent_id = student_data.parent_id
    
    # Update student fields
    if student_data.dob is not None:
        student.dob = student_data.dob.isoformat()  # type: ignore
    if student_data.gender is not None:
        student.gender = student_data.gender
    if student_data.current_grade is not None:
        student.current_grade = student_data.current_grade
    
    # Update user name if provided
    if student_data.name is not None:
        user = db.query(User).filter(User.id == student.user_id).first()
        if user:
            user.name = student_data.name
    
    db.commit()
    db.refresh(student)
    
    return student
