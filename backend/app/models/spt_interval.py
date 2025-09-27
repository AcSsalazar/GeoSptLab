"""
SPT Interval model for SPT Parameters Calculator.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class SPTInterval(Base):
    """
    SPT Interval model representing SPT test data points.
    Now references BoreholeStratum instead of SoilStratum to get the correct
    stratum properties for the specific borehole.
    """
    __tablename__ = "spt_intervals"
    
    id = Column(Integer, primary_key=True, index=True)
    borehole_id = Column(Integer, ForeignKey("boreholes.id"), nullable=False)
    borehole_stratum_id = Column(Integer, ForeignKey("borehole_strata.id"), nullable=False)
    depth_from = Column(Float, nullable=False)  # m, start depth of interval
    depth_to = Column(Float, nullable=False)  # m, end depth of interval
    midpoint_depth = Column(Float, nullable=False)  # m, calculated midpoint depth
    nspt_field = Column(Integer, nullable=False)  # Field N value (blows/30cm)
    description = Column(String, nullable=True)  # Additional description
    
    # Relationships
    borehole = relationship("Borehole", back_populates="spt_intervals")
    borehole_stratum = relationship("BoreholeStratum", back_populates="spt_intervals")
    calculated_result = relationship(
        "CalculatedResult", 
        back_populates="spt_interval", 
        cascade="all, delete-orphan",
        uselist=False
    )