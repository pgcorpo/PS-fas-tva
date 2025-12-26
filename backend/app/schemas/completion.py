from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class CompletionCreate(BaseModel):
    habit_id: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    text: Optional[str] = None
    client_timezone: Optional[str] = None
    client_tz_offset_minutes: Optional[int] = None


class CompletionResponse(BaseModel):
    id: str
    habit_id: str
    date: date
    text: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
