"""
Calculated results model for SPT parameters.
"""
from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel


class CalculatedResult(BaseModel):
    """Calculated results model for SPT parameter calculations."""
    __tablename__ = "calculated_results"
    
    spt_interval_id = Column(Integer, ForeignKey("spt_intervals.id"), nullable=False, unique=True)
    
    # Stress calculations
    sigma_prime = Column(Float)  # Effective stress (kPa)
    
    # Correction factors
    cb_factor = Column(Float)    # Borehole diameter correction
    cs_factor = Column(Float)    # Sampler correction  
    cr_factor = Column(Float)    # Rod length correction
    cn_factor = Column(Float)    # Overburden correction
    
    # Normalized N values
    n45 = Column(Float)          # N corrected to 45% energy
    n55 = Column(Float)          # N corrected to 55% energy
    n60 = Column(Float)          # N corrected to 60% energy
    n145 = Column(Float)         # N1 corrected to 45% energy
    
    # Geotechnical parameters
    phi_prime_eq = Column(Float)      # Friction angle (degrees)
    elastic_modulus = Column(Float)   # Elastic modulus (kPa)
    tau_resistance = Column(Float)    # Shear resistance (kPa)
    su_undrained = Column(Float)      # Undrained shear strength (kPa)
    
    # Relationships
    spt_interval = relationship("SPTInterval", back_populates="calculated_result")