from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Date, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class HabitVersion(Base):
    __tablename__ = "habit_versions"
    __table_args__ = (
        CheckConstraint("weekly_target >= 1", name="check_weekly_target_positive"),
    )

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    habit_id = Column(UUID(as_uuid=False), ForeignKey("habits.id"), nullable=False, index=True)
    weekly_target = Column(Integer, nullable=False)
    requires_text_on_completion = Column(Boolean, nullable=False, default=False)
    linked_goal_id = Column(UUID(as_uuid=False), ForeignKey("goals.id"), nullable=True)
    description = Column(String, nullable=True)
    effective_week_start = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    habit = relationship("Habit", back_populates="versions")
    linked_goal = relationship("Goal", foreign_keys=[linked_goal_id])
