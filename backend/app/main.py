"""
FastAPI application factory and configuration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        description="Backend service for the SPT application - ConsulCivil FastAPI",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=settings.allowed_methods,
        allow_headers=settings.allowed_headers,
    )

    # Include API routes
    app.include_router(api_router, prefix=settings.api_v1_str)

    @app.on_event("startup")
    async def startup_event():
        """Application startup event."""
        print(f"Starting {settings.app_name} v{settings.app_version}")
        print(f"Debug mode: {settings.debug}")
        print(f"API documentation available at: http://localhost:8000/docs")

    @app.on_event("shutdown")
    async def shutdown_event():
        """Application shutdown event."""
        print(f"Shutting down {settings.app_name}")

    return app


# Create the app instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
