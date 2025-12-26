from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.core.errors import GoalNotFoundError, GoalDeletedError, ValidationError
from app.utils.validators import validate_goal_exists_and_owned

router = APIRouter()


@router.get("", response_model=List[GoalResponse])
async def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all non-deleted goals for the current user"""
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.is_deleted == False,
    ).order_by(Goal.year.desc(), Goal.created_at.desc()).all()
    
    return goals


@router.post("", response_model=dict, status_code=201)
async def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new goal"""
    goal = Goal(
        user_id=current_user.id,
        title=goal_data.title,
        year=goal_data.year,
        description=goal_data.description,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    return {"id": goal.id}


@router.put("/{goal_id}", response_model=dict)
async def update_goal(
    goal_id: str,
    goal_data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing goal"""
    is_valid, goal = validate_goal_exists_and_owned(db, goal_id, current_user.id)
    
    if not is_valid:
        goal_obj = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal_obj:
            raise GoalNotFoundError()
        if goal_obj.is_deleted:
            raise GoalDeletedError()
        raise GoalNotFoundError("Goal not found or access denied")
    
    goal.title = goal_data.title
    goal.year = goal_data.year
    goal.description = goal_data.description
    
    db.commit()
    
    return {"ok": True}


@router.delete("/{goal_id}", response_model=dict)
async def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a goal"""
    is_valid, goal = validate_goal_exists_and_owned(db, goal_id, current_user.id)
    
    if not is_valid:
        goal_obj = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal_obj:
            raise GoalNotFoundError()
        if goal_obj.is_deleted:
            raise GoalDeletedError()
        raise GoalNotFoundError("Goal not found or access denied")
    
    goal.is_deleted = True
    db.commit()
    
    return {"ok": True}
