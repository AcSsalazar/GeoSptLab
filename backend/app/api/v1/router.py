"""
Main API router that includes all endpoint routers.
"""
from fastapi import APIRouter

from app.core.config import settings
from app.schemas.common import HealthResponse
from .endpoints import auth, users, items

api_router = APIRouter()

# Health check endpoint
@api_router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="API is running successfully",
        version=settings.app_version
    )

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
