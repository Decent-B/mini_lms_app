"""
Pydantic schemas for Student model.

Defines request/response structures for student management operations.
"""

from datetime import date
from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


# Base schema with common fields
class StudentBase(BaseModel):
    """Base student schema with shared fields."""
    dob: date | None = None
    gender: str | None = Field(None, max_length=20)
    current_grade: str | None = Field(None, max_length=50)
    parent_id: int | None = None


# Schema for student creation
class StudentCreate(BaseModel):
    """Schema for creating a new student with user details."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=8, max_length=100)
    dob: date | None = None
    gender: str | None = Field(None, max_length=20)
    current_grade: str | None = Field(None, max_length=50)
    parent_id: int | None = None


# Schema for student update
class StudentUpdate(BaseModel):
    """Schema for updating student information."""
    name: str | None = Field(None, min_length=1, max_length=255)
    dob: date | None = None
    gender: str | None = Field(None, max_length=20)
    current_grade: str | None = Field(None, max_length=50)
    parent_id: int | None = None


# Schema for student response
class StudentResponse(StudentBase):
    """Schema for student in API responses."""
    id: int
    user_id: int
    user: UserResponse

    model_config = {"from_attributes": True}
