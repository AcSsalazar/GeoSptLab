"""
Pydantic schemas for Borehole models.
"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from enum import Enum


def generate_borehole_name(project_id: int, sequence: int) -> str:
    """
    Generate a borehole name with format P1, P2, P3, etc.
    Args:
        project_id: Project identifier (not used in current format)
        sequence: Sequential number for the borehole
    """
    return f"P{sequence}"


class FormulationType(str, Enum):
    """Enumeration for formulation types."""
    KISHIDA = "kishida"
    JRB = "jrb"

class BoreholeBase(BaseModel):
    """Base schema for Borehole."""

    borehole_name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=50, 
        description="Borehole identifier (e.g., P1, BH-1) - auto-generated if not provided"
    )
    
    final_depth: float = Field(
        ..., 
        ge=0.5, 
        le=500, 
        description="Total depth drilled in meters"
    )
    
    diameter_mm: float = Field(
        150.0,
        ge=50, 
        le=1000, 
        description="Borehole diameter in mm"
    )
    
    field_energy_percent: float = Field(
        45.0, 
        ge=0, 
        le=200, 
        description="SPT energy percentage for this borehole"
    )
    
    water_table_depth: Optional[float] = Field(
        None,
        ge=0, 
        le=500,
        description="Water table depth in meters (NF - overrides project default)"
    )
    
    formulation: Optional[FormulationType] = Field(
        None,
        description="Calculation formulation type (overrides project default)"
    )    

    @field_validator("borehole_name")
    @classmethod
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
    water_table_depth: Optional[float] = Field(None, ge=0, le=500)
    formulation: Optional[FormulationType] = Field(None)


class BoreholeResponse(BoreholeBase):
    """Schema for Borehole response."""
    id: int
    project_id: int

    class Config:
        from_attributes = True