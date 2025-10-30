"""
Pydantic schemas for Project models.
"""
import random
import string
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.schemas.stratum import StratumDefinitionResponse
from app.schemas.borehole import BoreholeResponse


def generate_id() -> str:
    """
    Generate a random project code with format XX1111:
    - Two uppercase letters followed by four digits.
    """
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    digits = ''.join(random.choices(string.digits, k=4))
    return f"{letters}{digits}"


class FormulationType(str, Enum):
    """Enumeration for formulation types."""
    KISHIDA = "kishida"
    JRB = "jrb"


class ProjectBase(BaseModel):
    """Base schema for Project."""

    project_name: str = Field(..., min_length=1, max_length=100, description="Name of the project") # Nombre del proyecto
    project_code: str = Field(
        default_factory=generate_id,
        min_length=1,
        max_length=10,
        description="Unique project identifier (auto-generated if not provided)",) # Código del proyecto (generado automáticamente)
    
    number_of_boreholes: int = Field(
        ...,
        ge=1,
        le=40,
        description="Number of boreholes in project",) # Número de sondeos del proyecto
    
    number_of_strata: int = Field(
        ...,
        ge=1,
        le=50,
        description="Number of soil strata",)           # Número de estratos del suelo
    
    formulation: FormulationType = Field(
        FormulationType.KISHIDA,
        description="Default calculation formulation type",) # Tipo de formulación por defecto

    @field_validator("project_code")
    def validate_project_code(cls, v: str) -> str:
        """Ensure project code is not empty and is uppercase."""
        if not v or not v.strip():
            raise ValueError("Project code cannot be empty")
        return v.strip().upper()


class ProjectCreate(ProjectBase):
    """Schema for creating a new Project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a Project."""
    project_name: Optional[str] = Field(None, min_length=1, max_length=100)
    project_code: Optional[str] = Field(None, min_length=1, max_length=10)
    number_of_boreholes: Optional[int] = Field(None, ge=1, le=100)
    number_of_strata: Optional[int] = Field(None, ge=1, le=50)
    formulation: Optional[FormulationType] = Field(None)

class ProjectResponse(ProjectBase):
    """Schema for Project response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectWithDetails(ProjectResponse):
    """Schema for Project response with related data."""
    strata: List[StratumDefinitionResponse] = []
    boreholes: List[BoreholeResponse] = []

    class Config:
        from_attributes = True


# Resolve forward references
ProjectWithDetails.model_rebuild()
