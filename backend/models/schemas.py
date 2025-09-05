"""
Pydantic models for request/response schemas.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr
    name: str
    is_active: bool = True


class UserCreate(UserBase):
    """User creation model."""
    password: str


class UserUpdate(BaseModel):
    """User update model with optional fields."""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """User response model."""
    id: int
    
    class Config:
        from_attributes = True


class ItemBase(BaseModel):
    """Base item model."""
    title: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    """Item creation model."""
    pass


class ItemUpdate(BaseModel):
    """Item update model with optional fields."""
    title: Optional[str] = None
    description: Optional[str] = None


class ItemResponse(ItemBase):
    """Item response model."""
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Generic message response model."""
    message: str
    status: str = "success"


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    message: str
    version: str
