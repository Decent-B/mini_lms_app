"""
Parent management API endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import DatabaseSession, StaffUser, ParentUser, CurrentUser
from app.schemas.parent import ParentCreate, ParentResponse, ParentWithChildren, ParentUpdate
from app.schemas.student import StudentResponse
from app.services import parent_service

router = APIRouter(prefix="/api/parents", tags=["parents"])


# Parent dashboard endpoints (parent can access their own data)
@router.get("/me", response_model=ParentWithChildren)
def get_current_parent(
    current_user: ParentUser,
    db: DatabaseSession
):
    """
    Get current authenticated parent's information with children.
    
    Requires: Parent role
    Returns parent's profile with user information and list of children.
    """
    parent = parent_service.get_parent_by_user_id(db, current_user["user_id"])
    return parent


# Admin-only endpoints
@router.post("", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
def create_parent(
    parent_data: ParentCreate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Create a new parent account.
    
    Requires: Staff role
    Creates both a user account and parent profile.
    """
    parent = parent_service.create_parent(db, parent_data)
    return parent


@router.get("", response_model=list[ParentResponse])
def get_all_parents(
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Get all parents.
    
    Requires: Staff role
    Returns a list of all parents with their user information.
    """
    parents = parent_service.get_all_parents(db)
    return parents


@router.get("/{parent_id}", response_model=ParentWithChildren)
def get_parent(
    parent_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get parent details by ID.
    
    Requires: Staff role OR the parent themselves
    Returns parent information including user details and children.
    """
    parent = parent_service.get_parent_by_id(db, parent_id)
    
    # Check authorization: staff or the parent themselves
    if current_user["role"] == "staff":
        return parent
    elif current_user["role"] == "parent":
        current_parent = parent_service.get_parent_by_user_id(db, current_user["user_id"])
        if current_parent.id != parent_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return parent
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


@router.delete("/{parent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parent(
    parent_id: int,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Delete a parent by ID.
    
    Requires: Staff role
    Deletes both the parent profile and associated user account.
    """
    parent_service.delete_parent(db, parent_id)
    return None


@router.patch("/{parent_id}", response_model=ParentResponse)
def update_parent(
    parent_id: int,
    parent_data: ParentUpdate,
    staff_user: StaffUser,
    db: DatabaseSession
):
    """
    Update parent information.
    
    Requires: Staff role
    Updates parent's name and/or phone number.
    """
    parent = parent_service.update_parent(db, parent_id, parent_data)
    return parent
