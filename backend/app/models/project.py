"""
Project model for SPT Parameters Calculator.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class FormulationType(str, enum.Enum):
    """Enumeration for formulation types."""
    KISHIDA = "kishida"
    JRB = "jrb"


class Project(Base):
    """
    Project model representing a geotechnical project.
    """
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, nullable=False)
    project_code = Column(String, unique=True, nullable=False, index=True)
    number_of_boreholes = Column(Integer, nullable=False)
    number_of_strata = Column(Integer, nullable=False)
    formulation = Column(Enum(FormulationType), nullable=False, default=FormulationType.KISHIDA)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    strata = relationship("SoilStratum", back_populates="project", cascade="all, delete-orphan")
    boreholes = relationship("Borehole", back_populates="project", cascade="all, delete-orphan")