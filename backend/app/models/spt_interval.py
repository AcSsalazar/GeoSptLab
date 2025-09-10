"""
SPT Interval model for test data.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel


class SPTInterval(BaseModel):
    """SPT interval model for test measurements."""
    __tablename__ = "spt_intervals"
    
    borehole_id = Column(Integer, ForeignKey("boreholes.id"), nullable=False)
    stratum_id = Column(Integer, ForeignKey("strata.id"), nullable=False)
    depth_from = Column(Float, nullable=False)      # meters
    depth_to = Column(Float, nullable=False)        # meters
    midpoint_depth = Column(Float, nullable=False)  # meters
    nspt_field = Column(Integer, nullable=False)    # Field N value
    description = Column(String)
    
    # Relationships
    borehole = relationship("Borehole", back_populates="spt_intervals")
    stratum = relationship("Stratum", back_populates="spt_intervals")
    calculated_result = relationship("CalculatedResult", back_populates="spt_interval", uselist=False, cascade="all, delete-orphan")