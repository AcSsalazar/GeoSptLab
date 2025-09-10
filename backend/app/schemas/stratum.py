"""
Pydantic schemas for Stratum model.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StratumBase(BaseModel):
    """Base stratum schema."""
    stratum_code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    initial_depth: float = Field(..., ge=0, le=200)
    final_depth: float = Field(..., ge=0, le=200)
    gamma_humid: float = Field(..., ge=0, le=40)  # kN/m³
    gamma_saturated: float = Field(..., ge=0, le=40)  # kN/m³
    behavior_type: str = Field(..., pattern="^(cohesive|granular)$")
    plasticity_index: Optional[float] = Field(None, ge=0, le=100)
    
    def validate_depths(self):
        """Validate that final_depth > initial_depth."""
        if self.final_depth <= self.initial_depth:
            raise ValueError("final_depth must be greater than initial_depth")
        return self


class StratumCreate(StratumBase):
    """Schema for creating a stratum."""
    project_id: int
    
    def validate_depths(self):
        """Validate that final_depth > initial_depth."""
        if self.final_depth <= self.initial_depth:
            raise ValueError("final_depth must be greater than initial_depth")
        return self


class StratumUpdate(BaseModel):
    """Schema for updating a stratum."""
    stratum_code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    initial_depth: Optional[float] = Field(None, ge=0, le=200)
    final_depth: Optional[float] = Field(None, ge=0, le=200)
    gamma_humid: Optional[float] = Field(None, ge=0, le=40)
    gamma_saturated: Optional[float] = Field(None, ge=0, le=40)
    behavior_type: Optional[str] = Field(None, pattern="^(cohesive|granular)$")
    plasticity_index: Optional[float] = Field(None, ge=0, le=100)


class Stratum(StratumBase):
    """Schema for stratum response."""
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True