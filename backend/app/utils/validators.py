from datetime import date
from sqlalchemy.orm import Session
from app.models.habit import Habit
from app.models.habit_version import HabitVersion
from app.models.goal import Goal
from app.services.habit_service import get_active_version
from app.services.completion_service import count_completions_in_week
from app.utils.date_utils import get_week_range, validate_today


def validate_habit_exists_and_owned(
    db: Session,
    habit_id: str,
    user_id: str,
) -> tuple[bool, Habit | None]:
    """
    Validate that a habit exists and belongs to the user.
    
    Returns:
        (is_valid, habit_object)
    """
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == user_id,
        Habit.is_deleted == False,
    ).first()
    
    if not habit:
        return (False, None)
    
    return (True, habit)


def validate_habit_active_for_week(
    db: Session,
    habit_id: str,
    target_date: date,
) -> tuple[bool, HabitVersion | None]:
    """
    Validate that a habit has an active version for the week containing target_date.
    
    Returns:
        (is_valid, version_object)
    """
    week_start, week_end = get_week_range(target_date)
    version = get_active_version(db, habit_id, week_start)
    
    if not version:
        return (False, None)
    
    return (True, version)


def validate_weekly_target_not_met(
    db: Session,
    habit_id: str,
    week_start: date,
    week_end: date,
    user_id: str,
) -> bool:
    """
    Validate that the weekly target has not been met.
    
    Returns:
        True if target not met (can create completion), False otherwise
    """
    version = get_active_version(db, habit_id, week_start)
    if not version:
        return False
    
    completed = count_completions_in_week(
        db, habit_id, week_start, week_end, user_id
    )
    
    return completed < version.weekly_target


def validate_today_only(
    claimed_date: str,
    client_timezone: str | None = None,
    client_tz_offset_minutes: int | None = None,
) -> bool:
    """
    Validate that the claimed date is "today" for the client.
    
    Returns:
        True if date is today, False otherwise
    """
    return validate_today(claimed_date, client_timezone, client_tz_offset_minutes)


def validate_text_required(
    version: HabitVersion,
    text: str | None,
) -> tuple[bool, str | None]:
    """
    Validate that text is provided if required.
    
    Returns:
        (is_valid, error_message)
    """
    if version.requires_text_on_completion:
        if not text or not text.strip():
            return (False, "Text is required for this habit")
    
    return (True, None)


def validate_goal_exists_and_owned(
    db: Session,
    goal_id: str | None,
    user_id: str,
) -> tuple[bool, Goal | None]:
    """
    Validate that a goal exists and belongs to the user (if goal_id provided).
    
    Returns:
        (is_valid, goal_object)
    """
    if goal_id is None:
        return (True, None)
    
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == user_id,
        Goal.is_deleted == False,
    ).first()
    
    if not goal:
        return (False, None)
    
    return (True, goal)
