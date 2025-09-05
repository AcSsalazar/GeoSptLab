"""
API routes for the FastAPI application.
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from models.schemas import (
    UserCreate, 
    UserResponse, 
    UserUpdate,
    ItemCreate, 
    ItemResponse, 
    ItemUpdate,
    MessageResponse,
    HealthResponse
)
from backend.core.config import settings

# Create router instance
router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="API is running successfully",
        version=settings.app_version
    )


@router.get("/", response_model=MessageResponse, tags=["Root"])
async def root():
    """Root endpoint."""
    return MessageResponse(
        message=f"Welcome to {settings.app_name}!",
        status="success"
    )


# User endpoints
@router.get("/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def get_user(user_id: int):
    """Get a user by ID."""
    # This is a mock response - replace with actual database logic
    if user_id == 1:
        return UserResponse(
            id=user_id,
            email="user@example.com",
            name="John Doe",
            is_active=True
        )
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(user: UserCreate):
    """Create a new user."""
    # This is a mock response - replace with actual database logic
    return UserResponse(
        id=1,
        email=user.email,
        name=user.name,
        is_active=user.is_active
    )


@router.put("/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def update_user(user_id: int, user_update: UserUpdate):
    """Update a user."""
    # This is a mock response - replace with actual database logic
    if user_id == 1:
        return UserResponse(
            id=user_id,
            email=user_update.email or "user@example.com",
            name=user_update.name or "John Doe",
            is_active=user_update.is_active if user_update.is_active is not None else True
        )
    raise HTTPException(status_code=404, detail="User not found")


@router.delete("/users/{user_id}", response_model=MessageResponse, tags=["Users"])
async def delete_user(user_id: int):
    """Delete a user."""
    # This is a mock response - replace with actual database logic
    if user_id == 1:
        return MessageResponse(message="User deleted successfully")
    raise HTTPException(status_code=404, detail="User not found")


# Item endpoints
@router.get("/items/", response_model=List[ItemResponse], tags=["Items"])
async def get_items(skip: int = 0, limit: int = 100):
    """Get all items with pagination."""
    # This is a mock response - replace with actual database logic
    return [
        ItemResponse(
            id=1,
            title="Sample Item",
            description="This is a sample item",
            owner_id=1
        )
    ]


@router.post("/items/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED, tags=["Items"])
async def create_item(item: ItemCreate):
    """Create a new item."""
    # This is a mock response - replace with actual database logic
    return ItemResponse(
        id=1,
        title=item.title,
        description=item.description,
        owner_id=1
    )


@router.get("/items/{item_id}", response_model=ItemResponse, tags=["Items"])
async def get_item(item_id: int):
    """Get an item by ID."""
    # This is a mock response - replace with actual database logic
    if item_id == 1:
        return ItemResponse(
            id=item_id,
            title="Sample Item",
            description="This is a sample item",
            owner_id=1
        )
    raise HTTPException(status_code=404, detail="Item not found")


@router.put("/items/{item_id}", response_model=ItemResponse, tags=["Items"])
async def update_item(item_id: int, item_update: ItemUpdate):
    """Update an item."""
    # This is a mock response - replace with actual database logic
    if item_id == 1:
        return ItemResponse(
            id=item_id,
            title=item_update.title or "Sample Item",
            description=item_update.description or "This is a sample item",
            owner_id=1
        )
    raise HTTPException(status_code=404, detail="Item not found")


@router.delete("/items/{item_id}", response_model=MessageResponse, tags=["Items"])
async def delete_item(item_id: int):
    """Delete an item."""
    # This is a mock response - replace with actual database logic
    if item_id == 1:
        return MessageResponse(message="Item deleted successfully")
    raise HTTPException(status_code=404, detail="Item not found")
