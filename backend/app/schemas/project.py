"""
Pydantic schemas for Project models.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class FormulationType(str, Enum):
    """Enumeration for formulation types."""
    KISHIDA = "kishida"
    JRB = "jrb"


class ProjectBase(BaseModel):
    """Base schema for Project."""
    project_code: str = Field(..., min_length=1, max_length=50, description="Unique project identifier")
    number_of_boreholes: int = Field(..., ge=1, le=100, description="Number of boreholes in project")
    number_of_strata: int = Field(..., ge=1, le=50, description="Number of soil strata")
    formulation: FormulationType = Field(FormulationType.KISHIDA, description="Calculation formulation type")
    field_energy_percent: float = Field(45.0, ge=0, le=200, description="Field energy percentage")
    borehole_diameter: Optional[float] = Field(None, ge=50, le=1000, description="Borehole diameter in mm")
    rod_length: Optional[float] = Field(None, ge=1, le=100, description="Rod length in meters")
    water_table_depth: Optional[float] = Field(None, ge=0, le=500, description="Water table depth in meters")

    @validator("project_code")
    def validate_project_code(cls, v):
        """Validate project code format."""
        if not v or not v.strip():
            raise ValueError("Project code cannot be empty")
        return v.strip().upper()


class ProjectCreate(ProjectBase):
    """Schema for creating a new Project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a Project."""
    project_code: Optional[str] = Field(None, min_length=1, max_length=50)
    number_of_boreholes: Optional[int] = Field(None, ge=1, le=100)
    number_of_strata: Optional[int] = Field(None, ge=1, le=50)
    formulation: Optional[FormulationType] = None
    field_energy_percent: Optional[float] = Field(None, ge=0, le=200)
    borehole_diameter: Optional[float] = Field(None, ge=50, le=1000)
    rod_length: Optional[float] = Field(None, ge=1, le=100)
    water_table_depth: Optional[float] = Field(None, ge=0, le=500)


class ProjectResponse(ProjectBase):
    """Schema for Project response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectWithDetails(ProjectResponse):
    """Schema for Project response with related data."""
    strata: List["StratumResponse"] = []
    boreholes: List["BoreholeResponse"] = []

    class Config:
        from_attributes = True


# Forward references for relationships
from .stratum import StratumResponse
from .borehole import BoreholeResponse

ProjectWithDetails.model_rebuild()