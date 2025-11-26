"""
Calculated Result model.
"""
from sqlalchemy import Column, Integer, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class CalculatedResult(Base):
    """
    Calculated Result model storing computed SPT parameters.
    """
    __tablename__ = "calculated_results"

    id = Column(Integer, primary_key=True, index=True)
    spt_interval_id = Column(Integer, ForeignKey("spt_intervals.id"), nullable=False, unique=True)
    
    # Nuevas tablas para mejorar la visualizacion de los datos del proyecto
    project_id=Column(Integer, ForeignKey("projects.id"), nullable=True)
    borehole_id=Column(Integer, ForeignKey("boreholes.id" ), nullable=True)
    borehole_name=Column(String, nullable=True, index=True)
    stratum_code =Column(String, nullable=True, index=True)
     
    # Stress calculations
    sigma_prime = Column(Numeric(10, 4), nullable=False)  # kN/m², effective stress
    
    # Correction factors
    cb_factor = Column(Numeric(6, 3), nullable=False)  # Borehole diameter correction
    cs_factor = Column(Numeric(6, 3), nullable=False)  # Sampling method correction
    cr_factor = Column(Numeric(6, 3), nullable=False)  # Rod length correction
    cn_factor = Column(Numeric(6, 3), nullable=False)  # Overburden pressure correction
    
    # Normalized N values
    n45 = Column(Numeric(10, 2), nullable=False)  # N corrected to 45% energy
    n55 = Column(Numeric(10, 2), nullable=False)  # N corrected to 55% energy
    n60 = Column(Numeric(10, 2), nullable=False)  # N corrected to 60% energy (N60)
    n145 = Column(Numeric(10, 2), nullable=False)  # N corrected for all factors (N1)45
    
    # Geotechnical parameters
    phi_prime_eq = Column(Numeric(5, 2), nullable=False)  # °, friction angle from correlation
    elastic_modulus = Column(Numeric(12, 2), nullable=True)  # kN/m², elastic modulus
    tau_resistance = Column(Numeric(10, 2), nullable=True)  # kN/m², shear resistance
    su_undrained = Column(Numeric(10, 2), nullable=True)  # kN/m², undrained shear strength
    
    # Relationships
    spt_interval = relationship("SPTInterval", back_populates="calculated_result")
    project = relationship("Project")
    borehole = relationship("Borehole")
