from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.habit import Habit
from app.models.habit_completion import HabitCompletion
from app.schemas.completion import CompletionCreate, CompletionResponse
from app.core.errors import (
    HabitNotFoundError,
    HabitDeletedError,
    HabitNotActiveForWeekError,
    WeeklyTargetAlreadyMetError,
    TextRequiredError,
    InvalidDateError,
    PastDateReadonlyError,
    CompletionNotFoundError,
    CompletionNotTodayError,
)
from app.utils.validators import (
    validate_habit_exists_and_owned,
    validate_habit_active_for_week,
    validate_weekly_target_not_met,
    validate_today_only,
    validate_text_required,
)
from app.utils.date_utils import get_week_range
from app.services.habit_service import get_active_version

router = APIRouter()


@router.get("", response_model=List[CompletionResponse])
async def list_completions(
    start: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List completions in a date range"""
    try:
        start_date = date.fromisoformat(start)
        end_date = date.fromisoformat(end)
    except ValueError:
        raise InvalidDateError("Invalid date format. Use YYYY-MM-DD")
    
    if start_date > end_date:
        raise InvalidDateError("Start date must be <= end date")
    
    completions = db.query(HabitCompletion).filter(
        HabitCompletion.user_id == current_user.id,
        HabitCompletion.date >= start_date,
        HabitCompletion.date <= end_date,
    ).order_by(HabitCompletion.date.desc(), HabitCompletion.created_at.desc()).all()

    return completions


@router.get("/habits/{habit_id}/completions", response_model=List[CompletionResponse])
async def get_habit_completions(
    habit_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get completions for a specific habit with pagination.
    Returns most recent completions first.
    """
    # Verify habit belongs to user
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Query completions with pagination
    completions = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.user_id == current_user.id,
    ).order_by(
        HabitCompletion.date.desc(),
        HabitCompletion.created_at.desc()
    ).limit(limit).offset(offset).all()

    return completions


@router.post("", response_model=dict, status_code=201)
async def create_completion(
    completion_data: CompletionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a completion instance (today only)"""
    # Validate date is today
    is_today = validate_today_only(
        completion_data.date,
        completion_data.client_timezone,
        completion_data.client_tz_offset_minutes,
    )
    if not is_today:
        raise PastDateReadonlyError("Completions can only be created for today")
    
    try:
        completion_date = date.fromisoformat(completion_data.date)
    except ValueError:
        raise InvalidDateError("Invalid date format")
    
    # Validate habit exists and is owned
    is_valid, habit = validate_habit_exists_and_owned(
        db, completion_data.habit_id, current_user.id
    )
    if not is_valid:
        habit_obj = db.query(Habit).filter(Habit.id == completion_data.habit_id).first()
        if not habit_obj:
            raise HabitNotFoundError()
        if habit_obj.is_deleted:
            raise HabitDeletedError()
        raise HabitNotFoundError()
    
    # Validate habit is active for the week
    is_active, version = validate_habit_active_for_week(
        db, completion_data.habit_id, completion_date
    )
    if not is_active:
        raise HabitNotActiveForWeekError()
    
    # Validate weekly target not met
    week_start, week_end = get_week_range(completion_date)
    can_create = validate_weekly_target_not_met(
        db, completion_data.habit_id, week_start, week_end, current_user.id
    )
    if not can_create:
        raise WeeklyTargetAlreadyMetError()
    
    # Validate text if required
    is_text_valid, error_msg = validate_text_required(version, completion_data.text)
    if not is_text_valid:
        raise TextRequiredError(error_msg or "Text is required")
    
    # Create completion
    completion = HabitCompletion(
        user_id=current_user.id,
        habit_id=completion_data.habit_id,
        date=completion_date,
        text=completion_data.text.strip() if completion_data.text else None,
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    
    return {"id": completion.id}


@router.delete("/{completion_id}", response_model=dict)
async def delete_completion(
    completion_id: str,
    client_timezone: str | None = None,
    client_tz_offset_minutes: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a completion (today only)"""
    completion = db.query(HabitCompletion).filter(
        HabitCompletion.id == completion_id,
        HabitCompletion.user_id == current_user.id,
    ).first()
    
    if not completion:
        raise CompletionNotFoundError()
    
    # Validate date is today
    completion_date_str = completion.date.isoformat()
    is_today = validate_today_only(
        completion_date_str,
        client_timezone,
        client_tz_offset_minutes,
    )
    if not is_today:
        raise CompletionNotTodayError()
    
    db.delete(completion)
    db.commit()
    
    return {"ok": True}
