"""
Pydantic schemas for SPT Interval model.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SPTIntervalBase(BaseModel):
    """Base SPT interval schema."""
    depth_from: float = Field(..., ge=0, le=200)
    depth_to: float = Field(..., ge=0, le=200)
    midpoint_depth: float = Field(..., ge=0, le=200)
    nspt_field: int = Field(..., ge=0, le=200)
    description: Optional[str] = Field(None, max_length=500)
    
    def validate_depths(self):
        """Validate depth consistency."""
        if self.depth_to <= self.depth_from:
            raise ValueError("depth_to must be greater than depth_from")
        
        expected_midpoint = (self.depth_from + self.depth_to) / 2
        if abs(self.midpoint_depth - expected_midpoint) > 0.01:
            raise ValueError("midpoint_depth must be the average of depth_from and depth_to")
        
        return self


class SPTIntervalCreate(SPTIntervalBase):
    """Schema for creating an SPT interval."""
    borehole_id: int
    stratum_id: int
    
    def validate_depths(self):
        """Validate depth consistency."""
        if self.depth_to <= self.depth_from:
            raise ValueError("depth_to must be greater than depth_from")
        
        expected_midpoint = (self.depth_from + self.depth_to) / 2
        if abs(self.midpoint_depth - expected_midpoint) > 0.01:
            raise ValueError("midpoint_depth must be the average of depth_from and depth_to")
        
        return self


class SPTIntervalUpdate(BaseModel):
    """Schema for updating an SPT interval."""
    depth_from: Optional[float] = Field(None, ge=0, le=200)
    depth_to: Optional[float] = Field(None, ge=0, le=200)
    midpoint_depth: Optional[float] = Field(None, ge=0, le=200)
    nspt_field: Optional[int] = Field(None, ge=0, le=200)
    description: Optional[str] = Field(None, max_length=500)


class SPTInterval(SPTIntervalBase):
    """Schema for SPT interval response."""
    id: int
    borehole_id: int
    stratum_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True