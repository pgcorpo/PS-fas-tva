from pydantic_settings import BaseSettings
from typing import List
import os

from pydantic import field_validator

class Settings(BaseSettings):
    APP_ENV: str = "local"
    APP_BASE_URL: str = "http://localhost:8000"
    DATABASE_URL: str = "postgresql://habits_user:habits_password@localhost:5432/habits_db"
    AUTH_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    LOG_LEVEL: str = "info"
    RATE_LIMIT_ENABLED: bool = False
    MAX_REQUESTS_PER_MINUTE: int = 60
    CORS_ORIGINS: str | List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            raw_orig = v.strip()
            if raw_orig.startswith("[") and raw_orig.endswith("]"):
                try:
                    return json.loads(raw_orig)
                except json.JSONDecodeError:
                    raw_orig = raw_orig[1:-1].strip()
            return [
                origin.strip().strip("'").strip('"').strip() 
                for origin in raw_orig.split(",") 
                if origin.strip()
            ]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
settings = Settings()
