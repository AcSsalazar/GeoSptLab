"""
FastAPI application factory and configuration.
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_tables
from app.core.config import settings
from app.api.v1.router import api_router
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    #create_tables()
    yield

def create_application():
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        description="Backend service for the SPT application - ConsulCivil FastAPI",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Add explicit OPTIONS handler for preflight requests
    @app.options("/{path:path}")
    async def options_handler(request: Request, path: str):
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )

    # Include API routes
    app.include_router(api_router, prefix=settings.api_v1_str)

    return app





app = create_application()

if __name__ == "__main__":
    create_tables()
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
