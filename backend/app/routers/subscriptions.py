"""
Subscription management API endpoints.
"""

from fastapi import APIRouter, status

from app.core.dependencies import DatabaseSession, StaffUser
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, SubscriptionUpdate
from app.services import subscription_service

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("", response_model=list[SubscriptionResponse])
def get_all_subscriptions(
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Get all subscriptions.
    
    Requires: Staff role
    Returns a list of all subscriptions with student information.
    """
    subscriptions = subscription_service.get_all_subscriptions(db)
    return subscriptions


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    subscription_data: SubscriptionCreate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Create a new subscription for a student.
    
    Requires: Staff role
    Validates:
    - Student exists
    - end_date is after start_date
    - total_sessions is positive
    """
    subscription = subscription_service.create_subscription(db, subscription_data)
    return subscription


@router.patch("/{subscription_id}/use", response_model=SubscriptionResponse)
def use_session(
    subscription_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Mark one session as used.
    
    Requires: Staff role
    Increments used_sessions and deactivates subscription if all sessions are used.
    
    Validates:
    - Subscription exists and is active
    - Subscription has remaining sessions
    - Subscription has not expired
    """
    subscription = subscription_service.use_subscription_session(db, subscription_id)
    return subscription


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Get subscription details.
    
    Requires: Staff role
    Returns subscription information including total sessions, used sessions,
    and remaining sessions.
    """
    subscription = subscription_service.get_subscription_by_id(db, subscription_id)
    return subscription


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    subscription_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Delete a subscription.
    
    Requires: Staff role
    Removes the subscription from the database.
    """
    subscription_service.delete_subscription(db, subscription_id)
    return None


@router.patch("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription(
    subscription_id: int,
    subscription_data: SubscriptionUpdate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Update subscription information.
    
    Requires: Staff role
    Updates subscription package name, dates, total sessions, and/or used sessions.
    """
    subscription = subscription_service.update_subscription(db, subscription_id, subscription_data)
    return subscription
