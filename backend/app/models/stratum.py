"""
Soil Stratum model for SPT Parameters Calculator.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BehaviorType(str, enum.Enum):
    """Enumeration for soil behavior types."""
    COHESIVE = "cohesive"
    GRANULAR = "granular"


class SoilStratum(Base):
    """
    Soil Stratum model representing different soil layers.
    """
    __tablename__ = "soil_strata"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    stratum_code = Column(Integer, nullable=False)  # e.g., "A", "B", "C"
    description = Column(String, nullable=False)  # Soil description
    initial_depth = Column(Float, nullable=False)  # m, top depth of stratum
    final_depth = Column(Float, nullable=False)  # m, bottom depth of stratum
    gamma_humid = Column(Float, nullable=False)  # kN/m³, humid unit weight
    gamma_saturated = Column(Float, nullable=False)  # kN/m³, saturated unit weight
    behavior_type = Column(Enum(BehaviorType), nullable=False)
    plasticity_index = Column(Float, nullable=True)  # %, for cohesive soils
    
    # Relationships
    project = relationship("Project", back_populates="strata")
    spt_intervals = relationship("SPTInterval", back_populates="stratum", cascade="all, delete-orphan")