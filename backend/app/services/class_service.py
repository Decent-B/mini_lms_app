"""
Service layer for class operations.

Handles business logic for class management and registration.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_
from fastapi import HTTPException, status

from app.models.class_model import ClassModel
from app.models.student import Student
from app.models.class_registration import ClassRegistration
from app.models.subscription import Subscription
from app.schemas.class_schema import ClassCreate


def create_class(db: Session, class_data: ClassCreate) -> ClassModel:
    """
    Create a new class.
    
    Args:
        db: Database session
        class_data: Class creation data
        
    Returns:
        Created class object
        
    Raises:
        HTTPException: If validation fails
    """
    # Validate time slot format (HH:MM-HH:MM only)
    if class_data.time_slot:
        try:
            if "-" not in class_data.time_slot:
                raise ValueError("Time slot must contain a range with '-' separator")
            
            # Format: "09:00-10:30"
            start_time, end_time = class_data.time_slot.split("-")
            for time_part in [start_time.strip(), end_time.strip()]:
                hours, minutes = map(int, time_part.split(":"))
                if not (0 <= hours < 24 and 0 <= minutes < 60):
                    raise ValueError("Invalid time values")
            
            # Validate that end time is after start time
            start_hours, start_minutes = map(int, start_time.strip().split(":"))
            end_hours, end_minutes = map(int, end_time.strip().split(":"))
            start_total_minutes = start_hours * 60 + start_minutes
            end_total_minutes = end_hours * 60 + end_minutes
            
            if end_total_minutes <= start_total_minutes:
                raise ValueError("End time must be after start time")
                
        except (ValueError, AttributeError) as e:
            error_msg = str(e) if "must" in str(e) else "Invalid time_slot format"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{error_msg}. Use 'HH:MM-HH:MM' format (e.g., '09:00-10:30')"
            )
    
    try:
        new_class = ClassModel(
            name=class_data.name,
            subject=class_data.subject,
            day_of_week=class_data.day_of_week,
            time_slot=class_data.time_slot,
            teacher_name=class_data.teacher_name,
            max_students=class_data.max_students
        )
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        
        return new_class
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )


def get_classes_by_day(db: Session, day: str | None = None) -> list[ClassModel]:
    """
    Get classes, optionally filtered by day of week.
    
    Args:
        db: Database session
        day: Day of week (monday, tuesday, etc.) or None for all classes
        
    Returns:
        List of classes
    """
    query = db.query(ClassModel)
    
    if day:
        # Validate day (case-insensitive)
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        day_lower = day.lower()
        if day_lower not in valid_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid day. Must be one of: {', '.join(valid_days)}"
            )
        # Capitalize first letter to match database format
        day_capitalized = day_lower.capitalize()
        query = query.filter(ClassModel.day_of_week == day_capitalized)
    
    return query.all()


def get_class_registrations(db: Session, class_id: int) -> list[ClassRegistration]:
    """
    Get all registrations for a specific class.
    
    Args:
        db: Database session
        class_id: Class ID
        
    Returns:
        List of class registrations with student information
        
    Raises:
        HTTPException: If class not found
    """
    # Check if class exists
    class_obj = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Get all registrations for this class
    registrations = db.query(ClassRegistration).filter(
        ClassRegistration.class_id == class_id
    ).all()
    
    return registrations


def register_student_to_class(db: Session, class_id: int, student_id: int) -> ClassRegistration:
    """
    Register a student to a class with schedule conflict checking.
    
    Args:
        db: Database session
        class_id: Class ID
        student_id: Student ID
        
    Returns:
        Created class registration
        
    Raises:
        HTTPException: If class/student not found, already registered, 
                      class full, no active subscription, or schedule conflict
    """
    # Check if class exists
    class_obj = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check if already registered
    existing_registration = db.query(ClassRegistration).filter(
        and_(
            ClassRegistration.student_id == student_id,
            ClassRegistration.class_id == class_id
        )
    ).first()
    
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student already registered for this class"
        )
    
    # Check if class is full
    current_students = db.query(ClassRegistration).filter(
        ClassRegistration.class_id == class_id
    ).count()
    
    max_students = class_obj.max_students or 999  # Default to large number if None
    if current_students >= max_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class is full"
        )
    
    # Check if student has active subscription with available sessions
    active_subscription = db.query(Subscription).filter(
        and_(
            Subscription.student_id == student_id,
            Subscription.is_active == True,
            Subscription.total_sessions > Subscription.used_sessions
        )
    ).first()
    
    if not active_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has no active subscription with available sessions"
        )
    
    # Check for schedule conflicts
    # Get the time slot of the target class
    target_time_str = class_obj.time_slot or "00:00"  # Default if None
    target_day = class_obj.day_of_week
    
    # Parse target time (format: "09:00-10:30")
    if "-" in target_time_str:
        start_time_str, end_time_str = target_time_str.split("-")
        start_hour, start_minute = map(int, start_time_str.strip().split(":"))
        end_hour, end_minute = map(int, end_time_str.strip().split(":"))
        target_start_minutes = start_hour * 60 + start_minute
        target_end_minutes = end_hour * 60 + end_minute
    else:
        # Handle single time format (assume 90 min duration)
        start_hour, start_minute = map(int, target_time_str.split(":"))
        target_start_minutes = start_hour * 60 + start_minute
        target_end_minutes = target_start_minutes + 90
    
    # Get all student's existing registrations for the same day
    existing_registrations = db.query(ClassRegistration).join(
        ClassModel, ClassRegistration.class_id == ClassModel.id
    ).filter(
        and_(
            ClassRegistration.student_id == student_id,
            ClassModel.day_of_week == target_day
        )
    ).all()
    
    # Check each existing class for time overlap
    for registration in existing_registrations:
        existing_class = registration.class_model
        existing_time_str = existing_class.time_slot or "00:00"
        
        # Parse existing time (format: "09:00-10:30")
        if "-" in existing_time_str:
            start_time_str, end_time_str = existing_time_str.split("-")
            start_hour, start_minute = map(int, start_time_str.strip().split(":"))
            end_hour, end_minute = map(int, end_time_str.strip().split(":"))
            existing_start_minutes = start_hour * 60 + start_minute
            existing_end_minutes = end_hour * 60 + end_minute
        else:
            # Handle single time format (assume 90 min duration)
            start_hour, start_minute = map(int, existing_time_str.split(":"))
            existing_start_minutes = start_hour * 60 + start_minute
            existing_end_minutes = existing_start_minutes + 90
        
        # Check for overlap
        # Classes overlap if: (start1 < end2) AND (start2 < end1)
        if (target_start_minutes < existing_end_minutes and 
            existing_start_minutes < target_end_minutes):
            conflict_msg = (
                f"Schedule conflict: Student already has '{existing_class.name}' "
                f"on {target_day} at {existing_class.time_slot}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=conflict_msg
            )
    
    try:
        # Create registration
        registration = ClassRegistration(
            student_id=student_id,
            class_id=class_id
        )
        db.add(registration)
        db.commit()
        db.refresh(registration)
        
        return registration
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )
