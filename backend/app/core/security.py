"""
Security utilities for authentication and authorization.

Handles password hashing, JWT token creation and verification,
and current user dependency injection.
"""

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

# HTTP Bearer token security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The bcrypt hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Bcrypt hashed password as a string
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode in the token (typically user_id and role)
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Sign the token with SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Verify token signature using SECRET_KEY
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)] # pyright: ignore[reportUnusedParameter]
) -> dict[str, Any]: 
    """
    Dependency to get current authenticated user from JWT token.
    
    Extracts user information from the Authorization header and verifies the token.
    
    Args:
        credentials: HTTP Authorization credentials containing the Bearer token
        db: Database session
        
    Returns:
        Dictionary containing user_id and role
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    payload = decode_access_token(credentials.credentials)
    
    user_id: int | None = payload.get("sub")
    role: str | None = payload.get("role")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    return {"user_id": int(user_id), "role": role}


def require_role(allowed_roles: list[str]):
    """
    Dependency factory to restrict access to specific roles.
    
    Args:
        allowed_roles: List of roles that are allowed to access the endpoint
        
    Returns:
        Dependency function that checks user role
        
    Example:
        @router.get("/staff-only", dependencies=[Depends(require_role(["staff"]))])
    """
    async def role_checker(current_user: Annotated[dict[str, Any], Depends(get_current_user)]) -> dict[str, Any]:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    
    return role_checker
