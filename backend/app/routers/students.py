"""
Student management API endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import DatabaseSession, StaffUser, StudentUser, CurrentUser
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.schemas.class_schema import ClassResponse
from app.schemas.subscription import SubscriptionResponse
from app.services import student_service, subscription_service

router = APIRouter(prefix="/api/students", tags=["students"])


# Student dashboard endpoints (student can access their own data)
@router.get("/me", response_model=StudentResponse)
def get_current_student(
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get current authenticated student's information.
    
    Requires: Student role
    Returns student's profile with user and parent information.
    """
    student = student_service.get_student_by_user_id(db, current_user["user_id"])
    return student


@router.get("/me/classes", response_model=list[ClassResponse])
def get_current_student_classes(
    current_user: StudentUser,
    db: DatabaseSession
):
    """
    Get current authenticated student's enrolled classes.
    
    Requires: Student role
    Returns list of classes the student is registered for.
    """
    student = student_service.get_student_by_user_id(db, current_user["user_id"])
    classes = student_service.get_student_classes(db, student.id)
    return classes


@router.get("/me/subscriptions", response_model=list[SubscriptionResponse])
def get_current_student_subscriptions(
    current_user: StudentUser,
    db: DatabaseSession
):
    """
    Get current authenticated student's subscriptions.
    
    Requires: Student role
    Returns list of all subscriptions for the student.
    """
    student = student_service.get_student_by_user_id(db, current_user["user_id"])
    subscriptions = subscription_service.get_subscriptions_by_student_id(db, student.id)
    return subscriptions


# Admin-only endpoints
@router.get("", response_model=list[StudentResponse])
def get_all_students(
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Get all students.
    
    Requires: Staff role
    Returns a list of all students with their user and parent information.
    """
    students = student_service.get_all_students(db)
    return students


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Create a new student account.
    
    Requires: Staff role
    Creates both a user account and student profile.
    Requires a valid parent_id.
    """
    student = student_service.create_student(db, student_data)
    return student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get student details by ID.
    
    Requires: Staff role OR the student themselves OR parent of the student
    Returns student information including user details and parent information.
    """
    student = student_service.get_student_by_id(db, student_id)
    
    # Check authorization: staff, or student themselves, or their parent
    if current_user["role"] == "staff":
        return student
    elif current_user["role"] == "student":
        current_student = student_service.get_student_by_user_id(db, current_user["user_id"])
        if current_student.id != student_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return student
    elif current_user["role"] == "parent":
        from app.services import parent_service
        parent = parent_service.get_parent_by_user_id(db, current_user["user_id"])
        if student.parent_id != parent.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return student
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


@router.get("/{student_id}/classes", response_model=list[ClassResponse])
def get_student_classes(
    student_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get all classes registered by a student.
    
    Requires: Staff role OR the student themselves OR parent of the student
    Returns a list of classes the student is enrolled in.
    """
    student = student_service.get_student_by_id(db, student_id)
    
    # Check authorization
    if current_user["role"] == "staff":
        pass
    elif current_user["role"] == "student":
        current_student = student_service.get_student_by_user_id(db, current_user["user_id"])
        if current_student.id != student_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif current_user["role"] == "parent":
        from app.services import parent_service
        parent = parent_service.get_parent_by_user_id(db, current_user["user_id"])
        if student.parent_id != parent.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    classes = student_service.get_student_classes(db, student_id)
    return classes


@router.get("/{student_id}/subscriptions", response_model=list[SubscriptionResponse])
def get_student_subscriptions(
    student_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get all subscriptions for a student.
    
    Requires: Staff role OR the student themselves OR parent of the student
    Returns list of subscriptions for the student.
    """
    student = student_service.get_student_by_id(db, student_id)
    
    # Check authorization
    if current_user["role"] == "staff":
        pass
    elif current_user["role"] == "student":
        current_student = student_service.get_student_by_user_id(db, current_user["user_id"])
        if current_student.id != student_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif current_user["role"] == "parent":
        from app.services import parent_service
        parent = parent_service.get_parent_by_user_id(db, current_user["user_id"])
        if student.parent_id != parent.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    subscriptions = subscription_service.get_subscriptions_by_student_id(db, student_id)
    return subscriptions


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Delete a student.
    
    Requires: Staff role
    Deletes the student and their associated user account.
    Also removes all class registrations and subscriptions.
    """
    student_service.delete_student(db, student_id)
    return None


@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Update student information.
    
    Requires: Staff role
    Updates student's name, date of birth, gender, grade, and/or parent.
    """
    student = student_service.update_student(db, student_id, student_data)
    return student
