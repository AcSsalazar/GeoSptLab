"""
Pydantic schemas for Borehole model.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BoreholeBase(BaseModel):
    """Base borehole schema."""
    borehole_name: str = Field(..., min_length=1, max_length=50)
    final_depth: float = Field(..., ge=0, le=200)
    diameter_mm: float = Field(..., ge=50, le=500)
    field_energy_percent: float = Field(..., ge=0, le=200)
    rod_length: float = Field(..., ge=0, le=100)


class BoreholeCreate(BoreholeBase):
    """Schema for creating a borehole."""
    project_id: int


class BoreholeUpdate(BaseModel):
    """Schema for updating a borehole."""
    borehole_name: Optional[str] = Field(None, min_length=1, max_length=50)
    final_depth: Optional[float] = Field(None, ge=0, le=200)
    diameter_mm: Optional[float] = Field(None, ge=50, le=500)
    field_energy_percent: Optional[float] = Field(None, ge=0, le=200)
    rod_length: Optional[float] = Field(None, ge=0, le=100)


class Borehole(BoreholeBase):
    """Schema for borehole response."""
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True