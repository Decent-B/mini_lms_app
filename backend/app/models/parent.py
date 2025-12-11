"""
Parent model representing guardians of students.

Parents can have multiple students and can view their
children's subscriptions and class schedules.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.student import Student


class Parent(Base):
    """
    Parent model for managing guardians.
    
    One-to-many relationship with Students.
    Linked to User table for authentication.
    """
    __tablename__ = "parents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        index=True,
        nullable=False
    )
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="parent")
    students: Mapped[list["Student"]] = relationship(
        back_populates="parent", 
        cascade="all, delete-orphan"
    )

    @override
    def __repr__(self) -> str:
        return f"<Parent(id={self.id}, user_id={self.user_id})>"
