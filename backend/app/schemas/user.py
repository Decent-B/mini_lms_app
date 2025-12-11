"""
Pydantic schemas for User model.

Defines request/response structures for user authentication
and user management operations.
"""

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


# Base schema with common fields
class UserBase(BaseModel):
    """Base user schema with shared fields."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr


# Schema for user creation
class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole


# Schema for user response (excludes password)
class UserResponse(UserBase):
    """Schema for user in API responses."""
    id: int
    role: UserRole

    model_config = {"from_attributes": True}


# Schema for login request
class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


# Schema for login response
class LoginResponse(BaseModel):
    """Schema for login response with access token."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
