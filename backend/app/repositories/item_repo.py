"""
Item repository for database operations.
"""
from typing import List
from sqlalchemy.orm import Session

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate
from .base import BaseRepository


class ItemRepository(BaseRepository[Item, ItemCreate, ItemUpdate]):
    """Repository for Item model operations."""
    
    def __init__(self):
        super().__init__(Item)
    
    def get_by_owner(self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get items by owner ID."""
        return (
            db.query(Item)
            .filter(Item.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create_with_owner(self, db: Session, *, obj_in: ItemCreate, owner_id: int) -> Item:
        """Create a new item with owner."""
        db_obj = Item(**obj_in.dict(), owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Global instance
item_repo = ItemRepository()
