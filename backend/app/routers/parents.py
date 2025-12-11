"""
Parent management API endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.parent import ParentCreate, ParentResponse, ParentWithChildren
from app.services import parent_service

router = APIRouter(prefix="/api/parents", tags=["parents"])


@router.post("", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
def create_parent(
    parent_data: ParentCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new parent account.
    
    Creates both a user account and parent profile.
    """
    parent = parent_service.create_parent(db, parent_data)
    return parent


@router.get("", response_model=list[ParentResponse])
def get_all_parents(
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get all parents.
    
    Returns a list of all parents with their user information.
    """
    parents = parent_service.get_all_parents(db)
    return parents


@router.get("/{parent_id}", response_model=ParentWithChildren)
def get_parent(
    parent_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get parent details by ID.
    
    Returns parent information including user details and children.
    """
    parent = parent_service.get_parent_by_id(db, parent_id)
    return parent


@router.delete("/{parent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parent(
    parent_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Delete a parent by ID.
    
    Deletes both the parent profile and associated user account.
    """
    parent_service.delete_parent(db, parent_id)
    return None
