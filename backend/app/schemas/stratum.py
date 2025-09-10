"""
Pydantic schemas for Soil Stratum models.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from enum import Enum


class BehaviorType(str, Enum):
    """Enumeration for soil behavior types."""
    COHESIVE = "cohesive"
    GRANULAR = "granular"


class StratumBase(BaseModel):
    """Base schema for Soil Stratum."""
    stratum_code: str = Field(..., min_length=1, max_length=10, description="Stratum identifier")
    description: str = Field(..., min_length=1, max_length=500, description="Soil description")
    initial_depth: float = Field(..., ge=0, le=500, description="Top depth of stratum in meters")
    final_depth: float = Field(..., ge=0, le=500, description="Bottom depth of stratum in meters")
    gamma_humid: float = Field(..., ge=10, le=40, description="Humid unit weight in kN/m³")
    gamma_saturated: float = Field(..., ge=10, le=40, description="Saturated unit weight in kN/m³")
    behavior_type: BehaviorType = Field(..., description="Soil behavior type")
    plasticity_index: Optional[float] = Field(None, ge=0, le=100, description="Plasticity index percentage")

    @validator("final_depth")
    def validate_depth_order(cls, v, values):
        """Ensure final depth is greater than initial depth."""
        if "initial_depth" in values and v <= values["initial_depth"]:
            raise ValueError("Final depth must be greater than initial depth")
        return v

    @validator("gamma_saturated")
    def validate_gamma_saturated(cls, v, values):
        """Ensure saturated unit weight is greater than or equal to humid unit weight."""
        if "gamma_humid" in values and v < values["gamma_humid"]:
            raise ValueError("Saturated unit weight must be >= humid unit weight")
        return v

    @validator("plasticity_index")
    def validate_plasticity_index(cls, v, values):
        """Validate plasticity index for cohesive soils."""
        if values.get("behavior_type") == BehaviorType.COHESIVE and v is None:
            raise ValueError("Plasticity index is required for cohesive soils")
        return v


class StratumCreate(StratumBase):
    """Schema for creating a new Soil Stratum."""
    project_id: int = Field(..., gt=0, description="Project ID")


class StratumUpdate(BaseModel):
    """Schema for updating a Soil Stratum."""
    stratum_code: Optional[str] = Field(None, min_length=1, max_length=10)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    initial_depth: Optional[float] = Field(None, ge=0, le=500)
    final_depth: Optional[float] = Field(None, ge=0, le=500)
    gamma_humid: Optional[float] = Field(None, ge=10, le=40)
    gamma_saturated: Optional[float] = Field(None, ge=10, le=40)
    behavior_type: Optional[BehaviorType] = None
    plasticity_index: Optional[float] = Field(None, ge=0, le=100)


class StratumResponse(StratumBase):
    """Schema for Soil Stratum response."""
    id: int
    project_id: int

    class Config:
        from_attributes = True