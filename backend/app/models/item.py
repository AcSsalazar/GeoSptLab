"""
Item model for database operations.
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship

from .base import BaseModel


class Item(BaseModel):
    """
    Item model representing items in the database.
    """
    __tablename__ = "items"
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign key to user
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationship with user
    owner = relationship("User", back_populates="items")
    
    def __repr__(self):
        return f"<Item(id={self.id}, title='{self.title}', owner_id={self.owner_id})>"
