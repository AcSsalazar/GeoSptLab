"""
Pydantic schemas for SPT Interval models.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional


class SPTIntervalBase(BaseModel):
    """Base schema for SPT Interval."""
    depth_from: float = Field(..., ge=0, le=500, description="Start depth of interval in meters")
    depth_to: float = Field(..., ge=0, le=500, description="End depth of interval in meters")
    nspt_field: int = Field(..., ge=0, le=200, description="Field N value (blows/30cm)")
    description: Optional[str] = Field(None, max_length=500, description="Additional description")

    @validator("depth_to")
    def validate_depth_order(cls, v, values):
        """Ensure depth_to is greater than depth_from."""
        if "depth_from" in values and v <= values["depth_from"]:
            raise ValueError("End depth must be greater than start depth")
        return v

    @validator("nspt_field")
    def validate_nspt_field(cls, v):
        """Validate SPT N value."""
        if v < 0:
            raise ValueError("SPT N value must be non-negative")
        if v > 200:
            raise ValueError("SPT N value seems unusually high (>200)")
        return v


class SPTIntervalCreate(SPTIntervalBase):
    """Schema for creating a new SPT Interval."""
    borehole_id: int = Field(..., gt=0, description="Borehole ID")
    stratum_id: int = Field(..., gt=0, description="Stratum ID")

    def calculate_midpoint_depth(self) -> float:
        """Calculate midpoint depth of the interval."""
        return (self.depth_from + self.depth_to) / 2.0


class SPTIntervalUpdate(BaseModel):
    """Schema for updating an SPT Interval."""
    depth_from: Optional[float] = Field(None, ge=0, le=500)
    depth_to: Optional[float] = Field(None, ge=0, le=500)
    nspt_field: Optional[int] = Field(None, ge=0, le=200)
    description: Optional[str] = Field(None, max_length=500)
    stratum_id: Optional[int] = Field(None, gt=0)


class SPTIntervalResponse(SPTIntervalBase):
    """Schema for SPT Interval response."""
    id: int
    borehole_id: int
    stratum_id: int
    midpoint_depth: float

    class Config:
        from_attributes = True