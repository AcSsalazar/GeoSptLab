"""
Item endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.schemas.common import MessageResponse
from app.services.item_service import item_service

router = APIRouter()


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED, tags=["Items"])
def create_item(
    *,
    db: Session = Depends(get_db),
    item_in: ItemCreate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new item for the current user.
    """
    return item_service.create_item(db, item_create=item_in, owner_id=current_user.id)


@router.get("/", response_model=List[ItemResponse], tags=["Items"])
def read_items(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve items for the current user.
    """
    return item_service.get_user_items(db, owner_id=current_user.id, skip=skip, limit=limit)


@router.get("/{item_id}", response_model=ItemResponse, tags=["Items"])
def read_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get item by ID. Users can only access their own items.
    """
    item = item_service.get_item(db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check if user owns the item (this is also checked in the service)
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return item


@router.put("/{item_id}", response_model=ItemResponse, tags=["Items"])
def update_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    item_in: ItemUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Update item. Users can only update their own items.
    """
    return item_service.update_item(
        db, item_id=item_id, item_update=item_in, owner_id=current_user.id
    )


@router.delete("/{item_id}", response_model=MessageResponse, tags=["Items"])
def delete_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete item. Users can only delete their own items.
    """
    item_service.delete_item(db, item_id=item_id, owner_id=current_user.id)
    return MessageResponse(message="Item deleted successfully")
