from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    year: int = Field(..., ge=2000, le=2100)
    description: Optional[str] = None


class GoalUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    year: int = Field(..., ge=2000, le=2100)
    description: Optional[str] = None


class GoalResponse(BaseModel):
    id: str
    title: str
    year: int
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
