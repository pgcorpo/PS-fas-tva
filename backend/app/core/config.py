from pydantic_settings import BaseSettings
from typing import List
import os


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
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Allow CORS_ORIGINS to be set via environment variable (comma-separated)
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            self.CORS_ORIGINS = [origin.strip() for origin in cors_env.split(",")]


settings = Settings()
