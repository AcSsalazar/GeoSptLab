"""
Borehole Stratum model for SPT Parameters Calculator.
Represents the specific strata found in each borehole with their particular depths.
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class BoreholeStratum(Base):
    """
    Borehole Stratum model representing specific soil layers found in each borehole.
    This allows each borehole to have the same stratum at different depths.
    """
    __tablename__ = "borehole_strata"
    
    id = Column(Integer, primary_key=True, index=True)
    borehole_id = Column(Integer, ForeignKey("boreholes.id"), nullable=False)
    stratum_definition_id = Column(Integer, ForeignKey("stratum_definitions.id"), nullable=False)
    stratum_code = Column(String, nullable=False)  # e.g., 1, 2, 3 (matches stratum definition)
    initial_depth = Column(Float, nullable=False)  # m, top depth of stratum in this borehole
    final_depth = Column(Float, nullable=False)  # m, bottom depth of stratum in this borehole
    
    # Relationships
    borehole = relationship("Borehole", back_populates="borehole_strata")
    stratum_definition = relationship("StratumDefinition", back_populates="borehole_strata")
    spt_intervals = relationship("SPTInterval", back_populates="borehole_stratum", cascade="all, delete-orphan")