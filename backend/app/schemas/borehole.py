"""
Pydantic schemas for Borehole models.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional


class BoreholeBase(BaseModel):
    """Base schema for Borehole."""
    borehole_name: str = Field(..., min_length=1, max_length=50, description="Borehole identifier")
    final_depth: float = Field(..., ge=0.5, le=500, description="Total depth drilled in meters")
    diameter_mm: float = Field(150.0, ge=50, le=1000, description="Borehole diameter in mm")
    field_energy_percent: float = Field(45.0, ge=0, le=200, description="SPT energy percentage")
    rod_length: float = Field(15.0, ge=1, le=100, description="Rod length in meters")

    @validator("borehole_name")
    def validate_borehole_name(cls, v):
        """Validate borehole name format."""
        if not v or not v.strip():
            raise ValueError("Borehole name cannot be empty")
        return v.strip().upper()


class BoreholeCreate(BoreholeBase):
    """Schema for creating a new Borehole."""
    project_id: int = Field(..., gt=0, description="Project ID")


class BoreholeUpdate(BaseModel):
    """Schema for updating a Borehole."""
    borehole_name: Optional[str] = Field(None, min_length=1, max_length=50)
    final_depth: Optional[float] = Field(None, ge=0.5, le=500)
    diameter_mm: Optional[float] = Field(None, ge=50, le=1000)
    field_energy_percent: Optional[float] = Field(None, ge=0, le=200)
    rod_length: Optional[float] = Field(None, ge=1, le=100)


class BoreholeResponse(BoreholeBase):
    """Schema for Borehole response."""
    id: int
    project_id: int

    class Config:
        from_attributes = True