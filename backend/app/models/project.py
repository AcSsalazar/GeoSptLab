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
    project_code = Column(String, unique=True, nullable=False, index=True)
    number_of_boreholes = Column(Integer, nullable=False)
    number_of_strata = Column(Integer, nullable=False)
    formulation = Column(Enum(FormulationType), nullable=False, default=FormulationType.KISHIDA)
    field_energy_percent = Column(Float, nullable=False, default=45.0)  # Default 45% energy
    borehole_diameter = Column(Float, nullable=True)  # mm
    rod_length = Column(Float, nullable=True)  # m
    water_table_depth = Column(Float, nullable=True)  # m, depth to water table
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    strata = relationship("SoilStratum", back_populates="project", cascade="all, delete-orphan")
    boreholes = relationship("Borehole", back_populates="project", cascade="all, delete-orphan")