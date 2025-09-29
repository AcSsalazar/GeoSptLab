"""
Schemas module for the FastAPI application.
"""
from .project import (
    ProjectBase, ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithDetails, FormulationType
)
from .stratum import (
    StratumDefinitionBase, StratumDefinitionCreate, StratumDefinitionUpdate, StratumDefinitionResponse, BehaviorType
)
from .borehole import (
    BoreholeBase, BoreholeCreate, BoreholeUpdate, BoreholeResponse
)
from .spt_interval import (
    SPTIntervalBase, SPTIntervalCreate, SPTIntervalUpdate, SPTIntervalResponse
)
from .calculated_result import (
    CalculatedResultBase, CalculatedResultCreate, CalculatedResultUpdate, 
    CalculatedResultResponse, SPTCalculationRequest, SPTCalculationResponse
)

__all__ = [
    # Project schemas
    "ProjectBase", "ProjectCreate", "ProjectUpdate", "ProjectResponse", 
    "ProjectWithDetails", "FormulationType",
    # Stratum schemas
    "StratumDefinitionBase", "StratumDefinitionCreate", "StratumDefinitionUpdate", "StratumDefinitionResponse", "BehaviorType",
    # Borehole schemas
    "BoreholeBase", "BoreholeCreate", "BoreholeUpdate", "BoreholeResponse",
    # SPT Interval schemas
    "SPTIntervalBase", "SPTIntervalCreate", "SPTIntervalUpdate", "SPTIntervalResponse",
    # Calculated Result schemas
    "CalculatedResultBase", "CalculatedResultCreate", "CalculatedResultUpdate",
    "CalculatedResultResponse", "SPTCalculationRequest", "SPTCalculationResponse"
]