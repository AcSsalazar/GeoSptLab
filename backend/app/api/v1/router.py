"""
Main API router that includes all endpoint routers.
"""
from fastapi import APIRouter

from app.core.config import settings
from app.schemas.common import HealthResponse
from .endpoints import users, items, projects, calculations

api_router = APIRouter()

# Health check endpoint
@api_router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="SPT Parameters Calculator API is running successfully",
        version=settings.app_version
    )

# Include endpoint routers (removed auth router per requirements)
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])

# SPT-specific endpoints
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(calculations.router, prefix="/calculations", tags=["Calculations"])
