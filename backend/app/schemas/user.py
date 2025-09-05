"""
User schemas for request/response serialization.
"""
from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, EmailStr

if TYPE_CHECKING:
    from .item import ItemResponse


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: str
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    """Schema for user as stored in database."""
    id: int
    hashed_password: str
    is_superuser: bool = False
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """Schema for user in API responses."""
    id: int
    is_superuser: bool = False
    
    class Config:
        from_attributes = True


class UserWithItems(UserResponse):
    """Schema for user with their items."""
    items: List["ItemResponse"] = []
    
    class Config:
        from_attributes = True


# Token schemas
class Token(BaseModel):
    """Access token schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    username: Optional[str] = None
