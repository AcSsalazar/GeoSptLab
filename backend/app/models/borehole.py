"""
Borehole model for SPT parameters calculator.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel


class Borehole(BaseModel):
    """Borehole model."""
    __tablename__ = "boreholes"
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    borehole_name = Column(String, nullable=False)
    final_depth = Column(Float, nullable=False)     # meters
    diameter_mm = Column(Float, nullable=False)     # millimeters
    field_energy_percent = Column(Float, nullable=False)  # percentage
    rod_length = Column(Float, nullable=False)      # meters
    
    # Relationships
    project = relationship("Project", back_populates="boreholes")
    spt_intervals = relationship("SPTInterval", back_populates="borehole", cascade="all, delete-orphan")