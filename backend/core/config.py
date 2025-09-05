"""
Core configuration settings for the FastAPI application.
"""
import sys
import os
from decouple import config
from typing import Optional
from pydantic_settings import BaseSettings

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
EMAIL_HOST = config('EMAIL_HOST', default='localhost')
EMAIL_PORT = config('EMAIL_PORT', default=25, cast=int)
DATABASE_URL = config('DATABASE_URL', default='sqlite:///./test.db')

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "FastAPI Application"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API settings
    api_v1_str: str = "/api/v1"
    
    # Database settings
    database_url = DATABASE_URL
    
    # Security settings
    secret_key: str = "your-secret-key-change-this-in-production"
    access_token_expire_minutes: int = 30
    
    # CORS settings
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:8080"]
    allowed_methods: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: list[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
