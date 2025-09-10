"""
Pydantic schemas for Project model.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Base project schema."""
    project_code: str = Field(..., min_length=1, max_length=50)
    number_of_boreholes: int = Field(..., ge=1, le=100)
    number_of_strata: int = Field(..., ge=1, le=50)
    formulation: str = Field(..., pattern="^(kishida|jrb)$")
    field_energy_percent: float = Field(..., ge=0, le=200)
    borehole_diameter: float = Field(..., ge=50, le=500)  # mm
    rod_length: float = Field(..., ge=0, le=100)  # meters
    water_table_depth: float = Field(..., ge=0, le=200)  # meters


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    project_code: Optional[str] = Field(None, min_length=1, max_length=50)
    number_of_boreholes: Optional[int] = Field(None, ge=1, le=100)
    number_of_strata: Optional[int] = Field(None, ge=1, le=50)
    formulation: Optional[str] = Field(None, pattern="^(kishida|jrb)$")
    field_energy_percent: Optional[float] = Field(None, ge=0, le=200)
    borehole_diameter: Optional[float] = Field(None, ge=50, le=500)
    rod_length: Optional[float] = Field(None, ge=0, le=100)
    water_table_depth: Optional[float] = Field(None, ge=0, le=200)


class Project(ProjectBase):
    """Schema for project response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectWithRelations(Project):
    """Project schema with related data."""
    strata: Optional[List["Stratum"]] = []
    boreholes: Optional[List["Borehole"]] = []
    
    class Config:
        from_attributes = True