"""
Pydantic schemas for ClassRegistration model.

Defines request/response structures for class registration operations.
"""

from pydantic import BaseModel, Field


# Base schema with common fields
class RegistrationBase(BaseModel):
    """Base registration schema with shared fields."""
    student_id: int = Field(..., gt=0)
    class_id: int = Field(..., gt=0)


# Schema for registration creation
class RegistrationCreate(RegistrationBase):
    """Schema for creating a new class registration."""
    pass


# Schema for registration response
class RegistrationResponse(RegistrationBase):
    """Schema for registration in API responses."""
    id: int

    model_config = {"from_attributes": True}


# Schema for registration with details
class RegistrationDetailResponse(RegistrationResponse):
    """Schema for registration with student and class details."""
    student_name: str
    class_name: str
    class_subject: str | None = None
    day_of_week: str | None = None
    time_slot: str | None = None
