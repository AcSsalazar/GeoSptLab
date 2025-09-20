"""
Project API endpoints.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.project import ProjectRepository
from app.repositories.borehole import BoreholeRepository
from app.repositories.stratum import StratumRepository
from app.repositories.spt_interval import SPTIntervalRepository
from app.repositories.calculated_result import CalculatedResultRepository
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithDetails
)

router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project."""
    repo = ProjectRepository(db)
    
    # Check if project code already exists
    if repo.exists_by_code(project_data.project_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with code '{project_data.project_code}' already exists"
        )
    
    return repo.create(project_data)


@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all projects with pagination."""
    repo = ProjectRepository(db)
    return repo.get_all(skip=skip, limit=limit)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project by ID."""
    repo = ProjectRepository(db)
    project = repo.get_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return project


@router.get("/{project_id}/details", response_model=ProjectWithDetails)
def get_project_with_details(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project with strata and boreholes."""
    repo = ProjectRepository(db)
    project = repo.get_with_details(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update project."""
    repo = ProjectRepository(db)
    
    # Check if project code already exists (if being updated)
    if project_data.project_code and repo.exists_by_code(
        project_data.project_code, exclude_id=project_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with code '{project_data.project_code}' already exists"
        )
    
    project = repo.update(project_id, project_data)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete project."""
    repo = ProjectRepository(db)
    
    if not repo.delete(project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )


@router.get("/code/{project_code}", response_model=ProjectResponse)
def get_project_by_code(
    project_code: str,
    db: Session = Depends(get_db)
):
    """Get project by project code."""
    repo = ProjectRepository(db)
    project = repo.get_by_code(project_code)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with code '{project_code}' not found"
        )
    
    return project


@router.get("/{project_id}/summary", response_model=Dict[str, Any])
def get_project_summary(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive project summary with all data matching manual JSON format.
    Returns complete project data including boreholes, strata, intervals, and calculated results.
    """
    # Initialize repositories
    project_repo = ProjectRepository(db)
    borehole_repo = BoreholeRepository(db)
    stratum_repo = StratumRepository(db)
    interval_repo = SPTIntervalRepository(db)
    result_repo = CalculatedResultRepository(db)
    
    # Get project
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    # Get all related data
    boreholes = borehole_repo.get_by_project_id(project_id)
    strata = stratum_repo.get_by_project_id(project_id)
    
    # Build comprehensive response matching manual format
    summary = {
        "project": {
            "id": project.project_code,
            "name": f"Project {project.project_code}",  # Basic name, can be enhanced
            "date": project.created_at.strftime("%Y-%m-%d") if project.created_at else None,
            "number_of_boreholes": project.number_of_boreholes,
            "number_of_strata": project.number_of_strata,
            "water_table_depth": project.water_table_depth,
            "formulation": project.formulation
        },
        "boreholes": []
    }
    
    # Process each borehole
    for borehole in boreholes:
        # Get intervals for this borehole
        intervals = interval_repo.get_by_borehole_id(borehole.id)
        
        borehole_data = {
            "id": borehole.borehole_name,
            "depth_final_m": borehole.final_depth,
            "nf_m": borehole.water_table_depth or project.water_table_depth,
            "formulation": borehole.formulation or project.formulation,
            "energy_field_pct": borehole.field_energy_percent,
            "diameter_mm": borehole.diameter_mm,
            "num_strata": len(strata),
            "strata": [],
            "intervals": []
        }
        
        # Add strata information
        for stratum in strata:
            stratum_data = {
                "code": stratum.stratum_code,
                "name": stratum.description,
                "depth_from_m": stratum.initial_depth,
                "depth_to_m": stratum.final_depth,
                "gamma_h_kN_m3": stratum.gamma_humid,
                "gamma_sat_kN_m3": stratum.gamma_saturated,
                "behavior_type": stratum.behavior_type
            }
            borehole_data["strata"].append(stratum_data)
        
        # Add intervals with calculations
        for interval in intervals:
            # Get calculated results for this interval
            result = result_repo.get_by_spt_interval_id(interval.id)
            
            interval_data = {
                "stratum_code": interval.stratum.stratum_code,
                "depth_from_m": interval.depth_from,
                "depth_to_m": interval.depth_to,
                "midpoint_m": interval.midpoint_depth,
                "nspt_raw": interval.nspt_field,
                "description": interval.description
            }
            
            # Add calculated values if available
            if result:
                interval_data.update({
                    "sigma_eff_kPa": round(result.sigma_prime, 2),
                    "cb": round(result.cb_factor, 2),
                    "cs": round(result.cs_factor, 2),
                    "cr": round(result.cr_factor, 2),
                    "cn": round(result.cn_factor, 2),
                    "n45": round(result.n45, 1),
                    "n60": round(result.n60, 1),
                    "n145": round(result.n145, 1),
                    "phi_deg_eq": round(result.phi_prime_eq, 2),
                    "tau_kPa": round(result.tau_resistance, 2) if result.tau_resistance else None,
                    "su_kPa": round(result.su_undrained, 2) if result.su_undrained else None,
                    "E_kPa": round(result.elastic_modulus, 0) if result.elastic_modulus else None,
                    "formula": borehole.formulation or project.formulation
                })
            
            borehole_data["intervals"].append(interval_data)
        
        summary["boreholes"].append(borehole_data)
    
    return summary