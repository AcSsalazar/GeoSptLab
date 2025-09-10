"""
Base model class for all SQLAlchemy models.
"""

# Standard library imports
from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

# Entity base classes with common fields and methods:

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

# Base models to create the main database tables, this is the equivalent of "hoja base" from the excel file:

class Project(Base):
    __tablename__= "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullname=False)
    perforation_qty= Column(Integer, nullable=False)
    units = Column(String, default="m")
    params =   Column(JSON, default={})
    perforations = relationship("Perforation", back_populates="project", cascade="all, delete-orphan")


class Perforation(Base):
    __tablename__= "perforations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    index = Column(Integer, nullable=False)
    name = Column(String, unique=True, nullname=False)
    data = Column(JSON, default={})
    project = relationship("Project", back_populates="perforations")
    
class Record(Base):
    __tablename__= "records"
    id = Column(Integer, primary_key=True, index=True)
    perforation_id = Column(Integer, ForeignKey("perforations.id"))
    depth = Column(Integer )#nullable=False)
    blows = Column(Integer) #nullable=False)
    stratum = Column(String) #nullable=True)
    extras = Column(JSON, default={})
    perforation = relationship("Perforation", back_populates="records")

