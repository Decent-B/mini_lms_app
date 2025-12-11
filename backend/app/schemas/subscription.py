"""
Pydantic schemas for Subscription model.

Defines request/response structures for subscription management operations.
"""

from datetime import date
from pydantic import BaseModel, Field, field_validator, ValidationInfo

from app.schemas.student import StudentResponse


# Base schema with common fields
class SubscriptionBase(BaseModel):
    """Base subscription schema with shared fields."""
    student_id: int = Field(..., gt=0)
    package_name: str = Field(..., min_length=1, max_length=255)
    start_date: date
    end_date: date
    total_sessions: int = Field(..., ge=1)


# Schema for subscription creation
class SubscriptionCreate(SubscriptionBase):
    """Schema for creating a new subscription."""
    
    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, end_date: date | None, info: ValidationInfo) -> date | None:
        """Validate that end_date is after start_date."""
        if end_date and info.data.get("start_date"):
            if end_date < info.data["start_date"]:
                raise ValueError("end_date must be after start_date")
        return end_date


# Schema for subscription update
class SubscriptionUpdate(BaseModel):
    """Schema for updating subscription information."""
    package_name: str | None = Field(None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    total_sessions: int | None = Field(None, ge=1)
    used_sessions: int | None = Field(None, ge=0)


# Schema for using a session
class UseSessionRequest(BaseModel):
    """Schema for marking a session as used."""
    sessions_to_use: int = Field(1, ge=1)


# Schema for subscription response
class SubscriptionResponse(SubscriptionBase):
    """Schema for subscription in API responses."""
    id: int
    used_sessions: int
    remaining_sessions: int
    is_active: bool
    student: StudentResponse  # Include full student information

    model_config = {"from_attributes": True}


# Schema for subscription with student details
class SubscriptionDetailResponse(SubscriptionResponse):
    """Schema for subscription with student information."""
    student_name: str
    student_grade: str | None = None
