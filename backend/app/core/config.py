"""
Core configuration settings for the FastAPI application.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "SPT Parameters Calculator API Beta"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # API settings
    api_v1_str: str = "/api/v1"
    
    # Database settings
    database_url: str = "sqlite:///./spt_calculator.db"
    
    # Security settings
    secret_key: str = "your-secret-key-change-this-in-production"
    access_token_expire_minutes: int = 30
    
    # Email settings (optional)
    email_host: str = "localhost"
    email_port: int = 25
    
    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


# Global settings instance
settings = Settings()
