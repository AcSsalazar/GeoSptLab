"""
Project model for SPT parameters calculator.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel


class Project(BaseModel):
    """Project model containing SPT project information."""
    __tablename__ = "projects"
    
    project_code = Column(String, unique=True, nullable=False, index=True)
    number_of_boreholes = Column(Integer, nullable=False)
    number_of_strata = Column(Integer, nullable=False)
    formulation = Column(String, nullable=False)  # 'kishida' or 'jrb'
    field_energy_percent = Column(Float, nullable=False)
    borehole_diameter = Column(Float, nullable=False)  # mm
    rod_length = Column(Float, nullable=False)  # meters
    water_table_depth = Column(Float, nullable=False)  # meters
    
    # Relationships
    strata = relationship("Stratum", back_populates="project", cascade="all, delete-orphan")
    boreholes = relationship("Borehole", back_populates="project", cascade="all, delete-orphan")