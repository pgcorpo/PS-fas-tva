from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.habit_version import HabitVersion


def get_active_version(
    db: Session,
    habit_id: str,
    week_start: date,
) -> HabitVersion | None:
    """
    Get the active habit version for a given week start.
    
    Returns the version with the greatest effective_week_start such that
    effective_week_start <= week_start.
    
    Args:
        db: Database session
        habit_id: UUID of the habit
        week_start: Monday date of the week
    
    Returns:
        HabitVersion or None if no version exists
    """
    version = (
        db.query(HabitVersion)
        .filter(
            HabitVersion.habit_id == habit_id,
            HabitVersion.effective_week_start <= week_start,
        )
        .order_by(desc(HabitVersion.effective_week_start))
        .first()
    )
    
    return version
