"""
Soil Strata API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.stratum import StratumRepository
from app.repositories.project import ProjectRepository
from app.schemas.stratum import (
    StratumCreate, StratumUpdate, StratumResponse
)

router = APIRouter()


@router.post("/", response_model=StratumResponse, status_code=status.HTTP_201_CREATED)
def create_stratum(
    stratum_data: StratumCreate,
    db: Session = Depends(get_db)
):
    """Create a new soil stratum."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(stratum_data.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {stratum_data.project_id} not found"
        )
    
    # Check if stratum code already exists in project
    if stratum_repo.get_by_code_and_project(stratum_data.project_id, stratum_data.stratum_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stratum with code '{stratum_data.stratum_code}' already exists in this project"
        )
    
    return stratum_repo.create(stratum_data)


@router.get("/project/{project_id}", response_model=List[StratumResponse])
def get_project_strata(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all strata for a project."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return stratum_repo.get_by_project(project_id)


@router.get("/{stratum_id}", response_model=StratumResponse)
def get_stratum(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Get stratum by ID."""
    stratum_repo = StratumRepository(db)
    stratum = stratum_repo.get_by_id(stratum_id)
    
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum with ID {stratum_id} not found"
        )
    
    return stratum


@router.put("/{stratum_id}", response_model=StratumResponse)
def update_stratum(
    stratum_id: int,
    stratum_data: StratumUpdate,
    db: Session = Depends(get_db)
):
    """Update stratum."""
    stratum_repo = StratumRepository(db)
    
    stratum = stratum_repo.update(stratum_id, stratum_data)
    
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum with ID {stratum_id} not found"
        )
    
    return stratum


@router.delete("/{stratum_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stratum(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Delete stratum."""
    stratum_repo = StratumRepository(db)
    
    if not stratum_repo.delete(stratum_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum with ID {stratum_id} not found"
        )


@router.get("/project/{project_id}/depth/{depth}", response_model=StratumResponse)
def get_stratum_at_depth(
    project_id: int,
    depth: float,
    db: Session = Depends(get_db)
):
    """Get the stratum that contains a specific depth."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    stratum = stratum_repo.get_stratum_at_depth(project_id, depth)
    
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No stratum found at depth {depth}m in project {project_id}"
        )
    
    return stratum


@router.get("/project/{project_id}/validate", response_model=dict)
def validate_strata_coverage(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Validate that strata cover all depths without gaps or overlaps."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    is_valid = stratum_repo.validate_depth_coverage(project_id)
    
    return {
        "project_id": project_id,
        "valid_coverage": is_valid,
        "message": "Strata coverage is valid" if is_valid else "Strata have gaps or overlaps"
    }