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


class StratumAssignment(BaseModel):
    """Schema for stratum assignment within a borehole."""
    stratum_code: int = Field(..., ge=1, le=20, description="Stratum code reference")
    depth_from: float = Field(..., ge=0, le=500, description="Depth where stratum starts in this borehole")
    depth_to: float = Field(..., ge=0, le=500, description="Depth where stratum ends in this borehole")
    
    @model_validator(mode='after')
    def validate_depth_range(self):
        if self.depth_to <= self.depth_from:
            raise ValueError('depth_to must be greater than depth_from')
        return self


class BoreholeWithStrata(BoreholeCreate):
    """Schema for creating a borehole with strata assignments."""
    strata_assignments: list[StratumAssignment] = Field(
        ..., 
        min_length=1,
        description="List of strata present in this borehole"
    )


class BoreholeBulkCreate(BaseModel):
    """Schema for bulk creating boreholes with strata assignments."""
    project_id: int = Field(..., gt=0, description="Project ID")
    boreholes: list[BoreholeWithStrata] = Field(
        ..., 
        min_length=1,
        description="List of boreholes with their strata assignments"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "project_id": 1,
                "boreholes": [
                    {
                        "borehole_name": "P1",
                        "final_depth": 10.0,
                        "diameter_mm": 150.0,
                        "field_energy_percent": 45.0,
                        "water_table_depth": 3.0,
                        "formulation": "kishida",
                        "strata_assignments": [
                            {
                                "stratum_code": 1,
                                "depth_from": 0.0,
                                "depth_to": 3.0
                            },
                            {
                                "stratum_code": 2,
                                "depth_from": 3.0,
                                "depth_to": 10.0
                            }
                        ]
                    }
                ]
            }
        }