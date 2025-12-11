"""
Subscription model for managing student learning packages.

Tracks subscription packages with session limits and usage,
allowing staff to monitor and manage student attendance.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import String, ForeignKey, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.student import Student


class Subscription(Base):
    """
    Subscription model for managing learning packages.
    
    Each subscription belongs to a student and tracks:
    - Package details and duration
    - Total sessions available
    - Sessions already used
    """
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    package_name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    total_sessions: Mapped[int] = mapped_column(Integer, nullable=False)
    used_sessions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="subscriptions")

    @override
    def __repr__(self) -> str:
        return f"<Subscription(id={self.id}, student_id={self.student_id}, package={self.package_name})>"
    
    @property
    def remaining_sessions(self) -> int:
        """Calculate remaining sessions."""
        return self.total_sessions - self.used_sessions
    
    @property
    def is_active(self) -> bool:
        """Check if subscription has remaining sessions."""
        return self.remaining_sessions > 0
