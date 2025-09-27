"""
Borehole model for SPT Parameters Calculator.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class FormulationType(str, enum.Enum):
    """Enumeration for formulation types."""
    KISHIDA = "kishida"
    JRB = "jrb"


class Borehole(Base):
    """
    Borehole model representing drilling locations.
    """
    __tablename__ = "boreholes"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    borehole_name = Column(String, nullable=False)  # e.g., "P1", "BH-1", "PZ-2"
    final_depth = Column(Float, nullable=False)  # m, total depth drilled
    diameter_mm = Column(Float, nullable=False, default=150.0)  # mm, borehole diameter
    field_energy_percent = Column(Float, nullable=False, default=45.0)  # % SPT energy for this borehole
    water_table_depth = Column(Float, nullable=True)  # m, water table depth (can override project default)
    formulation = Column(Enum(FormulationType), nullable=True)  # Can override project default
    
    # Relationships
    project = relationship("Project", back_populates="boreholes")
    borehole_strata = relationship("BoreholeStratum", back_populates="borehole", cascade="all, delete-orphan")
    spt_intervals = relationship("SPTInterval", back_populates="borehole", cascade="all, delete-orphan")