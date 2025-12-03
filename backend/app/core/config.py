"""
Core configuration settings for the FastAPI application.
"""
import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "GeoSptLab 0.1.0"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # API settings
    api_v1_str: str = "/api/v1"
    
    # Database settings
    database_url: str = "sqlite:///./spt_calculator.db"
    
    @property
    def get_database_url(self) -> str:
        """
        Get database URL with postgres:// to postgresql:// conversion.
        Some providers use postgres:// but SQLAlchemy 1.4+ requires postgresql://
        """
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    
    # Security settings
    secret_key: str = "your-secret-key-change-this-in-production"
    access_token_expire_minutes: int = 30
    
    # Email settings (optional)
    email_host: str = "localhost"
    email_port: int = 25
    
    # CORS settings - set ALLOWED_ORIGINS env var for production
    # Example: ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse allowed_origins string into list."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


# Global settings instance
settings = Settings()
