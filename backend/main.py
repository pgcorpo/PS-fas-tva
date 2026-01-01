from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title="Habit Tracker API",
    description="API for goal-linked habit tracking",
    version="1.0.0",
)

# CORS middleware (for development; adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gzip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Habit Tracker API"}
