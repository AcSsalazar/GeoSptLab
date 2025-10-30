"""
Borehole Stratum schemas for API requests and responses.
"""
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.stratum import StratumDefinitionResponse


class BoreholeStratumBase(BaseModel):
    """Base schema for borehole stratum."""
    stratum_definition_id: int = Field(..., description="ID of the stratum definition")
    stratum_code: str = Field(..., description="Code of the stratum (1, 2, 3, etc.)")
    initial_depth: float = Field(..., description="Initial depth of stratum in this borehole (m)")
    final_depth: float = Field(..., description="Final depth of stratum in this borehole (m)")


class BoreholeStratumCreate(BoreholeStratumBase):
    """Schema for creating a borehole stratum."""
    borehole_id: int = Field(..., description="ID of the borehole")


class BoreholeStratumUpdate(BaseModel):
    """Schema for updating a borehole stratum."""
    initial_depth: Optional[float] = Field(None, description="Initial depth of stratum in this borehole (m)")
    final_depth: Optional[float] = Field(None, description="Final depth of stratum in this borehole (m)")


class BoreholeStratumResponse(BoreholeStratumBase):
    """Schema for borehole stratum response."""
    id: int
    borehole_id: int
    stratum_definition: Optional[StratumDefinitionResponse] = None

    class Config:
        from_attributes = True


class BoreholeStratumBulkCreate(BaseModel):
    """Schema for creating multiple borehole strata for a single borehole."""
    borehole_id: int = Field(..., description="ID of the borehole")
    strata: list[BoreholeStratumBase] = Field(..., description="List of strata for this borehole")