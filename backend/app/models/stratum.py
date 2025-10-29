"""
Stratum Definition model for SPT Parameters Calculator.
Defines the material properties of different soil types (without specific depths).
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BehaviorType(str, enum.Enum):
    """Enumeration for soil behavior types."""
    COHESIVE = "cohesive"
    GRANULAR = "granular"


class StratumDefinition(Base):
    """
    Stratum Definition model representing soil material properties.
    This defines what a stratum IS (material properties) but not WHERE it is found (depths).
    The actual depths are defined per borehole in BoreholeStratum.
    """
    __tablename__ = "stratum_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    stratum_code = Column(String, nullable=False)  # e.g., 1, 2, 3
    name = Column(String, nullable=False)  # Name of the stratum (e.g., "Ceniza Volcánica")
    description = Column(String, nullable=False)  # Soil description
    gamma_humid = Column(Float, nullable=False)  # kN/m³, humid unit weight
    gamma_saturated = Column(Float, nullable=False)  # kN/m³, saturated unit weight
    behavior_type = Column(Enum(BehaviorType), nullable=False)
    plasticity_index = Column(Float, nullable=True)  # %, for cohesive soils
    
    # Relationships
    project = relationship("Project", back_populates="stratum_definitions")
    borehole_strata = relationship("BoreholeStratum", back_populates="stratum_definition", cascade="all, delete-orphan")