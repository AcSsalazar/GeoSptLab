"""
Calculated Result model for SPT Parameters Calculator.
"""
from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class CalculatedResult(Base):
    """
    Calculated Result model storing computed SPT parameters.
    """
    __tablename__ = "calculated_results"
    
    id = Column(Integer, primary_key=True, index=True)
    spt_interval_id = Column(Integer, ForeignKey("spt_intervals.id"), nullable=False, unique=True)
    
    # Stress calculations
    sigma_prime = Column(Float, nullable=False)  # kN/m², effective stress
    
    # Correction factors
    cb_factor = Column(Float, nullable=False)  # Borehole diameter correction
    cs_factor = Column(Float, nullable=False)  # Sampling method correction
    cr_factor = Column(Float, nullable=False)  # Rod length correction
    cn_factor = Column(Float, nullable=False)  # Overburden pressure correction
    
    # Normalized N values
    n45 = Column(Float, nullable=False)  # N corrected to 45% energy
    n55 = Column(Float, nullable=False)  # N corrected to 55% energy
    n60 = Column(Float, nullable=False)  # N corrected to 60% energy (N60)
    n145 = Column(Float, nullable=False)  # N corrected for all factors (N1)45
    
    # Geotechnical parameters
    phi_prime_eq = Column(Float, nullable=False)  # °, friction angle from correlation
    elastic_modulus = Column(Float, nullable=True)  # kN/m², elastic modulus
    tau_resistance = Column(Float, nullable=True)  # kN/m², shear resistance
    su_undrained = Column(Float, nullable=True)  # kN/m², undrained shear strength
    
    # Relationships
    spt_interval = relationship("SPTInterval", back_populates="calculated_result")