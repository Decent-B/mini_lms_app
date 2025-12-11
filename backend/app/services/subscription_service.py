"""
Service layer for subscription operations.

Handles business logic for subscription management.
"""

from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.subscription import Subscription
from app.models.student import Student
from app.schemas.subscription import SubscriptionCreate


def create_subscription(db: Session, subscription_data: SubscriptionCreate) -> Subscription:
    """
    Create a new subscription for a student.
    
    Args:
        db: Database session
        subscription_data: Subscription creation data
        
    Returns:
        Created subscription object
        
    Raises:
        HTTPException: If student not found or validation fails
    """
    # Check if student exists
    student = db.query(Student).filter(Student.id == subscription_data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate dates
    if subscription_data.end_date <= subscription_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be after start_date"
        )
    
    # Validate session counts
    if subscription_data.total_sessions <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="total_sessions must be greater than 0"
        )
    
    try:
        subscription = Subscription(
            student_id=subscription_data.student_id,
            package_name=subscription_data.package_name,
            start_date=subscription_data.start_date,
            end_date=subscription_data.end_date,
            total_sessions=subscription_data.total_sessions,
            used_sessions=0,
            is_active=True
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        return subscription
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )


def use_subscription_session(db: Session, subscription_id: int) -> Subscription:
    """
    Mark one session as used in a subscription.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        
    Returns:
        Updated subscription object
        
    Raises:
        HTTPException: If subscription not found, inactive, or no sessions left
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    if not subscription.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not active"
        )
    
    if subscription.remaining_sessions <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No sessions remaining"
        )
    
    # Check if subscription has expired
    if subscription.end_date:
        end_date = subscription.end_date if isinstance(subscription.end_date, date) else date.fromisoformat(subscription.end_date)
        if end_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription has expired"
            )
    
    try:
        # Increment used_sessions
        subscription.used_sessions += 1
        
        # Deactivate if all sessions used
        if subscription.remaining_sessions == 0:
            subscription.is_active = False
        
        db.commit()
        db.refresh(subscription)
        
        return subscription
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update subscription: {str(e)}"
        )


def get_subscription_by_id(db: Session, subscription_id: int) -> Subscription:
    """
    Get subscription by ID with student information.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        
    Returns:
        Subscription object
        
    Raises:
        HTTPException: If subscription not found
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return subscription


def get_all_subscriptions(db: Session) -> list[Subscription]:
    """
    Get all subscriptions.
    
    Args:
        db: Database session
        
    Returns:
        List of all subscriptions with student relationships loaded
    """
    subscriptions = db.query(Subscription).all()
    return subscriptions


def delete_subscription(db: Session, subscription_id: int) -> None:
    """
    Delete a subscription.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        
    Raises:
        HTTPException: If subscription not found
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    db.delete(subscription)
    db.commit()
