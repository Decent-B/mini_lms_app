"""
ClassRegistration model for student-class enrollment.

Represents the many-to-many relationship between Students and Classes.
Ensures students cannot register for the same class twice.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.student import Student
    from app.models.class_model import ClassModel


class ClassRegistration(Base):
    """
    ClassRegistration model for managing student enrollments.
    
    Junction table for many-to-many relationship between Students and Classes.
    Ensures a student can only register for each class once.
    """
    __tablename__ = "class_registrations"
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_student_class"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="class_registrations")
    class_model: Mapped["ClassModel"] = relationship(back_populates="class_registrations")

    @override
    def __repr__(self) -> str:
        return f"<ClassRegistration(id={self.id}, student_id={self.student_id}, class_id={self.class_id})>"
