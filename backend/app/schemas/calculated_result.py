"""
Pydantic schemas for Calculated Result model.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CalculatedResultBase(BaseModel):
    """Base calculated result schema."""
    sigma_prime: Optional[float] = Field(None, ge=0)
    cb_factor: Optional[float] = Field(None, gt=0, le=2.0)
    cs_factor: Optional[float] = Field(None, gt=0, le=2.0)
    cr_factor: Optional[float] = Field(None, gt=0, le=2.0)
    cn_factor: Optional[float] = Field(None, gt=0, le=2.0)
    n45: Optional[float] = Field(None, ge=0)
    n55: Optional[float] = Field(None, ge=0)
    n60: Optional[float] = Field(None, ge=0)
    n145: Optional[float] = Field(None, ge=0)
    phi_prime_eq: Optional[float] = Field(None, ge=0, le=90)  # degrees
    elastic_modulus: Optional[float] = Field(None, ge=0)
    tau_resistance: Optional[float] = Field(None, ge=0)
    su_undrained: Optional[float] = Field(None, ge=0)


class CalculatedResultCreate(CalculatedResultBase):
    """Schema for creating a calculated result."""
    spt_interval_id: int


class CalculatedResultUpdate(CalculatedResultBase):
    """Schema for updating a calculated result."""
    pass


class CalculatedResult(CalculatedResultBase):
    """Schema for calculated result response."""
    id: int
    spt_interval_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CalculationRequest(BaseModel):
    """Schema for requesting SPT calculations."""
    project_id: int
    recalculate_all: bool = True


class CalculationResponse(BaseModel):
    """Schema for calculation response."""
    project_id: int
    calculated_intervals: int
    success: bool
    message: str