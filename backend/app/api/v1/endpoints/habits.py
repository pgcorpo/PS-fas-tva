from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.habit import Habit
from app.models.habit_version import HabitVersion
from app.models.goal import Goal
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse
from app.core.errors import (
    HabitNotFoundError,
    HabitDeletedError,
    GoalNotFoundError,
    GoalDeletedError,
    ValidationError,
)
from app.utils.validators import (
    validate_habit_exists_and_owned,
    validate_goal_exists_and_owned,
)
from app.utils.date_utils import get_week_start, get_next_monday

router = APIRouter()


@router.get("", response_model=List[HabitResponse])
async def list_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all non-deleted habits with their versions"""
    habits = db.query(Habit).filter(
        Habit.user_id == current_user.id,
        Habit.is_deleted == False,
    ).order_by(Habit.order_index.asc(), Habit.created_at.asc()).all()
    
    # Load versions for each habit
    result = []
    for habit in habits:
        versions = db.query(HabitVersion).filter(
            HabitVersion.habit_id == habit.id
        ).order_by(HabitVersion.effective_week_start.desc()).all()
        
        # Build response with linked_goal_id from latest version (for display)
        latest_version = versions[0] if versions else None
        linked_goal_id = latest_version.linked_goal_id if latest_version else None
        
        result.append({
            "id": habit.id,
            "name": habit.name,
            "order_index": habit.order_index,
            "linked_goal_id": linked_goal_id,
            "is_deleted": habit.is_deleted,
            "created_at": habit.created_at,
            "updated_at": habit.updated_at,
            "versions": versions,
        })
    
    return result


@router.post("", response_model=dict, status_code=201)
async def create_habit(
    habit_data: HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new habit (effective immediately)"""
    # Validate linked goal if provided
    if habit_data.linked_goal_id:
        is_valid, _ = validate_goal_exists_and_owned(
            db, habit_data.linked_goal_id, current_user.id
        )
        if not is_valid:
            goal = db.query(Goal).filter(Goal.id == habit_data.linked_goal_id).first()
            if not goal:
                raise GoalNotFoundError()
            if goal.is_deleted:
                raise GoalDeletedError()
            raise GoalNotFoundError()
    
    # Create habit
    habit = Habit(
        user_id=current_user.id,
        name=habit_data.name,
        order_index=habit_data.order_index,
    )
    db.add(habit)
    db.flush()  # Get habit.id
    
    # Calculate current week start (using today's date)
    today = date.today()
    current_week_start = get_week_start(today)
    
    # Create initial version effective immediately
    version = HabitVersion(
        habit_id=habit.id,
        weekly_target=habit_data.weekly_target,
        requires_text_on_completion=habit_data.requires_text_on_completion,
        linked_goal_id=habit_data.linked_goal_id,
        effective_week_start=current_week_start,
    )
    db.add(version)
    db.commit()
    db.refresh(habit)
    
    return {"id": habit.id}


@router.put("/{habit_id}", response_model=dict)
async def update_habit(
    habit_id: str,
    habit_data: HabitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a habit (creates new version effective next Monday)"""
    # Validate habit exists and is owned
    is_valid, habit = validate_habit_exists_and_owned(db, habit_id, current_user.id)
    if not is_valid:
        habit_obj = db.query(Habit).filter(Habit.id == habit_id).first()
        if not habit_obj:
            raise HabitNotFoundError()
        if habit_obj.is_deleted:
            raise HabitDeletedError()
        raise HabitNotFoundError()
    
    # Validate linked goal if provided
    if habit_data.linked_goal_id:
        is_valid, _ = validate_goal_exists_and_owned(
            db, habit_data.linked_goal_id, current_user.id
        )
        if not is_valid:
            goal = db.query(Goal).filter(Goal.id == habit_data.linked_goal_id).first()
            if not goal:
                raise GoalNotFoundError()
            if goal.is_deleted:
                raise GoalDeletedError()
            raise GoalNotFoundError()
    
    # Update base habit fields
    habit.name = habit_data.name
    habit.order_index = habit_data.order_index
    
    # Calculate next Monday
    today = date.today()
    next_monday = get_next_monday(today)
    
    # Create new version effective next Monday
    version = HabitVersion(
        habit_id=habit.id,
        weekly_target=habit_data.weekly_target,
        requires_text_on_completion=habit_data.requires_text_on_completion,
        linked_goal_id=habit_data.linked_goal_id,
        effective_week_start=next_monday,
    )
    db.add(version)
    db.commit()
    
    return {"ok": True}


@router.delete("/{habit_id}", response_model=dict)
async def delete_habit(
    habit_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a habit"""
    is_valid, habit = validate_habit_exists_and_owned(db, habit_id, current_user.id)
    if not is_valid:
        habit_obj = db.query(Habit).filter(Habit.id == habit_id).first()
        if not habit_obj:
            raise HabitNotFoundError()
        raise HabitNotFoundError()
    
    habit.is_deleted = True
    db.commit()
    
    return {"ok": True}
