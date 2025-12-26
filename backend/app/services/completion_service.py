from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.habit_completion import HabitCompletion


def calculate_remaining(
    db: Session,
    habit_id: str,
    week_start: date,
    week_end: date,
    user_id: str,
) -> int:
    """
    Calculate remaining required instances for a habit in a given week.
    
    Args:
        db: Database session
        habit_id: UUID of the habit
        week_start: Monday date of the week
        week_end: Sunday date of the week
        user_id: UUID of the user
    
    Returns:
        Number of remaining instances (never negative, minimum 0)
    """
    from app.services.habit_service import get_active_version
    
    # Get active version for the week
    version = get_active_version(db, habit_id, week_start)
    if not version:
        return 0
    
    weekly_target = version.weekly_target
    
    # Count completions in the week
    completed_count = (
        db.query(func.count(HabitCompletion.id))
        .filter(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == user_id,
            HabitCompletion.date >= week_start,
            HabitCompletion.date <= week_end,
        )
        .scalar() or 0
    )
    
    remaining = weekly_target - completed_count
    return max(0, remaining)  # Never return negative


def count_completions_in_week(
    db: Session,
    habit_id: str,
    week_start: date,
    week_end: date,
    user_id: str,
) -> int:
    """
    Count completion instances for a habit in a given week.
    
    Args:
        db: Database session
        habit_id: UUID of the habit
        week_start: Monday date of the week
        week_end: Sunday date of the week
        user_id: UUID of the user
    
    Returns:
        Count of completion instances
    """
    count = (
        db.query(func.count(HabitCompletion.id))
        .filter(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == user_id,
            HabitCompletion.date >= week_start,
            HabitCompletion.date <= week_end,
        )
        .scalar() or 0
    )
    
    return count
