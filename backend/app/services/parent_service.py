"""
Service layer for parent operations.

Handles business logic for parent management.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.parent import Parent
from app.models.user import User, UserRole
from app.schemas.parent import ParentCreate, ParentUpdate
from app.core.security import get_password_hash


def create_parent(db: Session, parent_data: ParentCreate) -> Parent:
    """
    Create a new parent with associated user account.
    
    Args:
        db: Database session
        parent_data: Parent creation data
        
    Returns:
        Created parent object
        
    Raises:
        HTTPException: If email already exists
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == parent_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create user account
        user = User(
            name=parent_data.name,
            email=parent_data.email,
            password_hash=get_password_hash(parent_data.password),
            role=UserRole.PARENT
        )
        db.add(user)
        db.flush()
        
        # Create parent profile
        parent = Parent(
            user_id=user.id,
            phone=parent_data.phone
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)
        
        return parent
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )


def get_parent_by_id(db: Session, parent_id: int) -> Parent:
    """
    Get parent by ID with user and children information.
    
    Args:
        db: Database session
        parent_id: Parent ID
        
    Returns:
        Parent object with relationships loaded
        
    Raises:
        HTTPException: If parent not found
    """
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    return parent


def get_all_parents(db: Session) -> list[Parent]:
    """
    Get all parents with user information.
    
    Args:
        db: Database session
        
    Returns:
        List of parent objects
    """
    parents = db.query(Parent).all()
    return parents


def delete_parent(db: Session, parent_id: int) -> None:
    """
    Delete a parent by ID.
    
    Also deletes the associated user account (cascade).
    
    Args:
        db: Database session
        parent_id: Parent ID to delete
        
    Raises:
        HTTPException: If parent not found
    """
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    # Delete user (will cascade to parent due to foreign key)
    db.query(User).filter(User.id == parent.user_id).delete()
    db.commit()


def get_parent_by_user_id(db: Session, user_id: int) -> Parent:
    """
    Get parent by their user ID.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Parent object with relationships loaded
        
    Raises:
        HTTPException: If parent not found
    """
    parent = db.query(Parent).filter(Parent.user_id == user_id).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    return parent


def update_parent(db: Session, parent_id: int, parent_data: "ParentUpdate") -> Parent:
    """
    Update parent information.
    
    Args:
        db: Database session
        parent_id: Parent ID to update
        parent_data: ParentUpdate schema with updated fields
        
    Returns:
        Updated parent object
        
    Raises:
        HTTPException: If parent not found
    """
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    # Update parent fields
    if parent_data.phone is not None:
        parent.phone = parent_data.phone
    
    # Update user name if provided
    if parent_data.name is not None:
        user = db.query(User).filter(User.id == parent.user_id).first()
        if user:
            user.name = parent_data.name
    
    db.commit()
    db.refresh(parent)
    
    return parent
