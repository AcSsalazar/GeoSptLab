"""
Main API router that includes all SPT endpoint routers.
"""
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthResponse
from .endpoints import projects, strata, boreholes, spt_intervals, calculations

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

# Include all SPT endpoint routers
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(strata.router, prefix="/strata", tags=["Soil Strata"])
api_router.include_router(boreholes.router, prefix="/boreholes", tags=["Boreholes"])
api_router.include_router(spt_intervals.router, prefix="/spt-intervals", tags=["SPT Intervals"])
api_router.include_router(calculations.router, prefix="/calculations", tags=["SPT Calculations"])
