"""
Item schemas for request/response serialization.
"""
from typing import Optional
from pydantic import BaseModel


class ItemBase(BaseModel):
    """Base item schema with common fields."""
    title: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    """Schema for creating a new item."""
    pass


class ItemUpdate(BaseModel):
    """Schema for updating item information."""
    title: Optional[str] = None
    description: Optional[str] = None


class ItemInDB(ItemBase):
    """Schema for item as stored in database."""
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True


class ItemResponse(ItemBase):
    """Schema for item in API responses."""
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True
