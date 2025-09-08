"""
Base model class for all SQLAlchemy models.
"""
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class BaseModel(Base):
    """
    Abstract base model with common fields for all models.
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )

# Base models to create the main database tables, this is the equivalent of "hoja base" from the excel file

class Project(Base):
    __tablename__= "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullname=False)
    perforation_qty= Column(Integer, nullable=False)
    units = Column(String, default={})


