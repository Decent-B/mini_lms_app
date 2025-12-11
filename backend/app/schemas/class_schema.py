"""
Pydantic schemas for ClassModel.

Defines request/response structures for class management operations.
"""

from pydantic import BaseModel, Field


# Base schema with common fields
class ClassBase(BaseModel):
    """Base class schema with shared fields."""
    name: str = Field(..., min_length=1, max_length=255)
    subject: str | None = Field(None, max_length=255)
    day_of_week: str | None = Field(None, max_length=20)
    time_slot: str | None = Field(None, max_length=50)
    teacher_name: str | None = Field(None, max_length=255)
    max_students: int | None = Field(None, ge=1)


# Schema for class creation
class ClassCreate(ClassBase):
    """Schema for creating a new class."""
    pass


# Schema for class update
class ClassUpdate(BaseModel):
    """Schema for updating class information."""
    name: str | None = Field(None, min_length=1, max_length=255)
    subject: str | None = Field(None, max_length=255)
    day_of_week: str | None = Field(None, max_length=20)
    time_slot: str | None = Field(None, max_length=50)
    teacher_name: str | None = Field(None, max_length=255)
    max_students: int | None = Field(None, ge=1)


# Schema for class response
class ClassResponse(ClassBase):
    """Schema for class in API responses."""
    id: int

    model_config = {"from_attributes": True}


# Schema for class response with registration count
class ClassWithCountResponse(ClassResponse):
    """Schema for class with current enrollment count."""
    current_students: int = 0
