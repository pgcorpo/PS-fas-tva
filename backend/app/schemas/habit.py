from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List


class HabitVersionResponse(BaseModel):
    id: str
    weekly_target: int
    requires_text_on_completion: bool
    linked_goal_id: Optional[str]
    description: Optional[str]
    effective_week_start: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HabitResponse(BaseModel):
    id: str
    name: str
    order_index: int
    linked_goal_id: Optional[str]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    versions: List[HabitVersionResponse]

    class Config:
        from_attributes = True


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    weekly_target: int = Field(..., ge=1)
    requires_text_on_completion: bool = False
    linked_goal_id: Optional[str] = None
    description: Optional[str] = None
    order_index: int = 0
    client_timezone: Optional[str] = None
    client_tz_offset_minutes: Optional[int] = None


class HabitUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    weekly_target: int = Field(..., ge=1)
    requires_text_on_completion: bool = False
    linked_goal_id: Optional[str] = None
    description: Optional[str] = None
    order_index: int = 0
    client_timezone: Optional[str] = None
    client_tz_offset_minutes: Optional[int] = None
