from fastapi import APIRouter
from app.api.v1.endpoints import health, users, goals, habits, completions

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(users.router, prefix="/me", tags=["users"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])
api_router.include_router(completions.router, prefix="/completions", tags=["completions"])
