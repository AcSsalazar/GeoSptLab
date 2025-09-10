"""
Borehole model for SPT Parameters Calculator.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Borehole(Base):
    """
    Borehole model representing drilling locations.
    """
    __tablename__ = "boreholes"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    borehole_name = Column(String, nullable=False)  # e.g., "BH-1", "PZ-2"
    final_depth = Column(Float, nullable=False)  # m, total depth drilled
    diameter_mm = Column(Float, nullable=False, default=150.0)  # mm, borehole diameter
    field_energy_percent = Column(Float, nullable=False, default=45.0)  # % SPT energy
    rod_length = Column(Float, nullable=False, default=15.0)  # m, rod length used
    
    # Relationships
    project = relationship("Project", back_populates="boreholes")
    spt_intervals = relationship("SPTInterval", back_populates="borehole", cascade="all, delete-orphan")