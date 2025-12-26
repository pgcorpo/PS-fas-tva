from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserResponse(BaseModel):
    id: str
    email: str
    google_user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
