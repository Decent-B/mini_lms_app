"""
Student model representing learners in the system.

Students are linked to parents, can register for classes,
and have subscriptions for managing their learning sessions.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import String, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.parent import Parent
    from app.models.subscription import Subscription
    from app.models.class_registration import ClassRegistration


class Student(Base):
    """
    Student model for managing learners.
    
    Many-to-one relationship with Parent.
    Many-to-many relationship with Classes via ClassRegistrations.
    One-to-many relationship with Subscriptions.
    Linked to User table for authentication.
    """
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False
    )
    dob: Mapped[str | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    current_grade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("parents.id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="student")
    parent: Mapped["Parent | None"] = relationship(back_populates="students")
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan"
    )
    class_registrations: Mapped[list["ClassRegistration"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan"
    )

    @override
    def __repr__(self) -> str:
        return f"<Student(id={self.id}, user_id={self.user_id}, parent_id={self.parent_id})>"
