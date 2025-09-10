"""
Stratum model for soil strata information.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel


class Stratum(BaseModel):
    """Soil stratum model."""
    __tablename__ = "strata"
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    stratum_code = Column(String, nullable=False)
    description = Column(String)
    initial_depth = Column(Float, nullable=False)  # meters
    final_depth = Column(Float, nullable=False)    # meters
    gamma_humid = Column(Float, nullable=False)    # kN/m³
    gamma_saturated = Column(Float, nullable=False)  # kN/m³
    behavior_type = Column(String, nullable=False)  # 'cohesive' or 'granular'
    plasticity_index = Column(Float)  # Can be null for granular soils
    
    # Relationships
    project = relationship("Project", back_populates="strata")
    spt_intervals = relationship("SPTInterval", back_populates="stratum")