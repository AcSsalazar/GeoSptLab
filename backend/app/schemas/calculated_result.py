"""
Pydantic schemas for Calculated Result models.
"""
from pydantic import BaseModel, Field
from typing import Optional


class CalculatedResultBase(BaseModel):
    """Base schema for Calculated Result."""
    sigma_prime: float = Field(..., ge=0, description="Effective stress in kN/m²")
    cb_factor: float = Field(..., gt=0, description="Borehole diameter correction factor")
    cs_factor: float = Field(..., gt=0, description="Sampling method correction factor")
    cr_factor: float = Field(..., gt=0, description="Rod length correction factor")
    cn_factor: float = Field(..., gt=0, le=2.0, description="Overburden pressure correction factor")
    n45: float = Field(..., ge=0, description="N corrected to 45% energy")
    n55: float = Field(..., ge=0, description="N corrected to 55% energy")
    n60: float = Field(..., ge=0, description="N corrected to 60% energy")
    n145: float = Field(..., ge=0, description="N corrected for all factors (N1)45")
    phi_prime_eq: float = Field(..., ge=0, le=90, description="Friction angle in degrees")
    elastic_modulus: Optional[float] = Field(None, ge=0, description="Elastic modulus in kN/m²")
    tau_resistance: Optional[float] = Field(None, ge=0, description="Shear resistance in kN/m²")
    su_undrained: Optional[float] = Field(None, ge=0, description="Undrained shear strength in kN/m²")


class CalculatedResultCreate(CalculatedResultBase):
    """Schema for creating a new Calculated Result."""
    spt_interval_id: int = Field(..., gt=0, description="SPT Interval ID")


class CalculatedResultUpdate(BaseModel):
    """Schema for updating a Calculated Result."""
    sigma_prime: Optional[float] = Field(None, ge=0)
    cb_factor: Optional[float] = Field(None, gt=0)
    cs_factor: Optional[float] = Field(None, gt=0)
    cr_factor: Optional[float] = Field(None, gt=0)
    cn_factor: Optional[float] = Field(None, gt=0, le=2.0)
    n45: Optional[float] = Field(None, ge=0)
    n55: Optional[float] = Field(None, ge=0)
    n60: Optional[float] = Field(None, ge=0)
    n145: Optional[float] = Field(None, ge=0)
    phi_prime_eq: Optional[float] = Field(None, ge=0, le=90)
    elastic_modulus: Optional[float] = Field(None, ge=0)
    tau_resistance: Optional[float] = Field(None, ge=0)
    su_undrained: Optional[float] = Field(None, ge=0)


class CalculatedResultResponse(CalculatedResultBase):
    """Schema for Calculated Result response."""
    id: int
    spt_interval_id: int

    class Config:
        from_attributes = True


class SPTCalculationRequest(BaseModel):
    """Schema for SPT calculation request."""
    project_id: int = Field(..., gt=0, description="Project ID")
    recalculate_all: bool = Field(False, description="Whether to recalculate all intervals")


class SPTCalculationResponse(BaseModel):
    """Schema for SPT calculation response."""
    project_id: int
    calculated_intervals: int
    updated_intervals: int
    message: str