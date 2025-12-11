"""
Pydantic schemas for Parent model.

Defines request/response structures for parent management operations.
"""

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


# Base schema with common fields
class ParentBase(BaseModel):
    """Base parent schema with shared fields."""
    phone: str | None = Field(None, max_length=50)


# Schema for parent creation
class ParentCreate(BaseModel):
    """Schema for creating a new parent with user details."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=8, max_length=100)
    phone: str | None = Field(None, max_length=50)


# Schema for parent update
class ParentUpdate(BaseModel):
    """Schema for updating parent information."""
    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)


# Schema for parent response
class ParentResponse(ParentBase):
    """Schema for parent in API responses."""
    id: int
    user_id: int
    user: UserResponse

    model_config = {"from_attributes": True}
