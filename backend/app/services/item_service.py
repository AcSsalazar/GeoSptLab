"""
Item service for business logic operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.repositories.item_repo import item_repo


class ItemService:
    """Service class for item business logic."""
    
    def __init__(self):
        self.item_repo = item_repo
    
    def create_item(self, db: Session, item_create: ItemCreate, owner_id: int) -> ItemResponse:
        """Create a new item for a user."""
        item = self.item_repo.create_with_owner(db, obj_in=item_create, owner_id=owner_id)
        return ItemResponse.from_orm(item)
    
    def get_item(self, db: Session, item_id: int) -> Optional[ItemResponse]:
        """Get item by ID."""
        item = self.item_repo.get(db, id=item_id)
        if not item:
            return None
        return ItemResponse.from_orm(item)
    
    def get_items(self, db: Session, skip: int = 0, limit: int = 100) -> List[ItemResponse]:
        """Get list of items."""
        items = self.item_repo.get_multi(db, skip=skip, limit=limit)
        return [ItemResponse.from_orm(item) for item in items]
    
    def get_user_items(self, db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[ItemResponse]:
        """Get items by user."""
        items = self.item_repo.get_by_owner(db, owner_id=owner_id, skip=skip, limit=limit)
        return [ItemResponse.from_orm(item) for item in items]
    
    def update_item(self, db: Session, item_id: int, item_update: ItemUpdate, owner_id: int) -> ItemResponse:
        """Update item information."""
        item = self.item_repo.get(db, id=item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Check if user owns the item
        if item.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        updated_item = self.item_repo.update(db, db_obj=item, obj_in=item_update)
        return ItemResponse.from_orm(updated_item)
    
    def delete_item(self, db: Session, item_id: int, owner_id: int) -> bool:
        """Delete item."""
        item = self.item_repo.get(db, id=item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Check if user owns the item
        if item.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        self.item_repo.delete(db, id=item_id)
        return True


# Global instance
item_service = ItemService()
