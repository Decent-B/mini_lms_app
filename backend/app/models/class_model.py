"""
Class model representing courses offered in the LMS.

Classes have schedules, capacity limits, and can have
multiple students registered through ClassRegistrations.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.class_registration import ClassRegistration


class ClassModel(Base):
    """
    Class model for managing courses/classes.
    
    Many-to-many relationship with Students via ClassRegistrations.
    """
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    day_of_week: Mapped[str | None] = mapped_column(String(20), nullable=True)
    time_slot: Mapped[str | None] = mapped_column(String(50), nullable=True)
    teacher_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    max_students: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    class_registrations: Mapped[list["ClassRegistration"]] = relationship(
        back_populates="class_model",
        cascade="all, delete-orphan"
    )

    @override
    def __repr__(self) -> str:
        return f"<ClassModel(id={self.id}, name={self.name}, subject={self.subject})>"
