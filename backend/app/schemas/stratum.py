"""
Stratum Definition schemas for API requests and responses.
"""
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from enum import Enum


class BehaviorType(str, Enum):
    """Enumeration for soil behavior types."""
    COHESIVE = "cohesive"
    GRANULAR = "granular"


class StratumDefinitionBase(BaseModel):
    """Base schema for stratum definition."""
    stratum_code: int = Field(..., ge=1, le=10, description="Stratum identifier")
    name: str = Field(..., min_length=1, max_length=100, description="Name of the stratum")
    description: str = Field(..., min_length=1, max_length=500, description="Soil description")
    gamma_humid: float = Field(..., ge=10, le=40, description="Humid unit weight in kN/m³")
    gamma_saturated: float = Field(..., ge=10, le=40, description="Saturated unit weight in kN/m³")
    behavior_type: BehaviorType = Field(..., description="Soil behavior type")
    plasticity_index: Optional[float] = Field(None, ge=0, le=100, description="Plasticity index percentage")

    @validator("gamma_saturated")
    def validate_gamma_saturated(cls, v, values):
        """Ensure saturated unit weight is greater than or equal to humid unit weight."""
        gamma_humid = values.get("gamma_humid")
        if v is not None and gamma_humid is not None and v < gamma_humid:
            raise ValueError("Saturated unit weight must be >= humid unit weight")
        return v

    @validator("plasticity_index")
    def validate_plasticity_index(cls, v, values):
        """Validate plasticity index for cohesive soils."""
        if values.get("behavior_type") == BehaviorType.COHESIVE and v is None:
            raise ValueError("Plasticity index is required for cohesive soils")
        return v


class StratumDefinitionCreate(StratumDefinitionBase):
    """Schema for creating a stratum definition."""
    project_id: int = Field(..., description="Project ID")
class StratumDefinitionUpdate(BaseModel):
    """Schema for updating a stratum definition."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    gamma_humid: Optional[float] = Field(None, ge=10, le=40)
    gamma_saturated: Optional[float] = Field(None, ge=10, le=40)
    behavior_type: Optional[BehaviorType] = None
    plasticity_index: Optional[float] = Field(None, ge=0, le=100)


class StratumDefinitionResponse(StratumDefinitionBase):
    """Schema for stratum definition response."""
    id: int
    project_id: int

    class Config:
        from_attributes = True


class StratumDefinitionBulkCreate(BaseModel):
    """Schema for bulk creating stratum definitions from Excel base sheet."""
    project_id: int = Field(..., gt=0, description="Project ID")
    strata: List[StratumDefinitionBase] = Field(..., description="List of stratum definitions")
    
    class Config:
        schema_extra = {
            "example": {
                "project_id": 1,
                "strata": [
                    {
                        "stratum_code": 1,
                        "name": "Ceniza Volcánica",
                        "description": "Limos, suelos finogranulares",
                        "gamma_humid": 18.5,
                        "gamma_saturated": 19.0,
                        "behavior_type": "granular"
                    },
                    {
                        "stratum_code": 2,
                        "name": "H-VI Migmatita Puente P",
                        "description": "Limos, suelos finogranulares",
                        "gamma_humid": 19.5,
                        "gamma_saturated": 20.0,
                        "behavior_type": "granular"
                    }
                ]
            }
        }