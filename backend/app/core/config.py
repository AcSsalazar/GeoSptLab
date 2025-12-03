"""
Core configuration settings for the FastAPI application.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "GeoSptLab 0.1.0"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # API settings
    api_v1_str: str = "/api/v1"
    
    # Database settings
    database_url: str = "postgresql://localhost:5432/spt_calculator"
    
    @property
    def database_url_fixed(self) -> str:
        """Fix Render's postgres:// URL to postgresql:// for SQLAlchemy."""
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
    
    # CORS settings
    allowed_origins: List[str] = ["*"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


# Global settings instance
settings = Settings()
