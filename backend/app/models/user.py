"""
User model for authentication and authorization.

Represents all system users (staff, parents, students) with
role-based access control.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.parent import Parent
    from app.models.student import Student


class UserRole(str, enum.Enum):
    """User role enumeration for access control."""
    STAFF = "staff"
    PARENT = "parent"
    STUDENT = "student"


class User(Base):
    """
    User model for authentication.
    
    All system users authenticate through this table.
    Role determines access permissions:
    - staff: Can manage all data
    - parent: Can view their children's data
    - student: Can view their own data
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)

    # Relationships
    parent: Mapped["Parent | None"] = relationship(back_populates="user", uselist=False)
    student: Mapped["Student | None"] = relationship(back_populates="user", uselist=False)

    @override
    def __repr__(self) -> str:
        return f"<User(id={self.id}, name={self.name}, role={self.role})>"
