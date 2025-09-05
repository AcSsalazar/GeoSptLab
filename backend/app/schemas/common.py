"""
Common schemas used across the application.
"""
from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response schema."""
    message: str


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str
    message: str
    version: str
