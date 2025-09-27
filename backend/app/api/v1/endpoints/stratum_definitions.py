"""
Stratum Definition API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.stratum import StratumDefinitionRepository
from app.repositories.project import ProjectRepository
from app.schemas.stratum import (
    StratumDefinitionCreate, StratumDefinitionUpdate, StratumDefinitionResponse, 
    StratumDefinitionBulkCreate
)

router = APIRouter()


@router.post("/", response_model=StratumDefinitionResponse, status_code=status.HTTP_201_CREATED)
def create_stratum_definition(
    stratum_data: StratumDefinitionCreate,
    db: Session = Depends(get_db)
):
    """Create a new stratum definition."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumDefinitionRepository(db)
    
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


@router.post("/bulk", response_model=List[StratumDefinitionResponse], status_code=status.HTTP_201_CREATED)
def create_stratum_definitions_bulk(
    bulk_data: StratumDefinitionBulkCreate,
    db: Session = Depends(get_db)
):
    """Create multiple stratum definitions from Excel base sheet data."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumDefinitionRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(bulk_data.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {bulk_data.project_id} not found"
        )
    
    # Check for duplicate stratum codes within the request
    codes = [s.stratum_code for s in bulk_data.strata]
    if len(codes) != len(set(codes)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate stratum codes found in request"
        )
    
    # Check if any stratum codes already exist in project
    for stratum_data in bulk_data.strata:
        existing = stratum_repo.get_by_code_and_project(
            bulk_data.project_id, 
            stratum_data.stratum_code
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stratum code {stratum_data.stratum_code} already exists in project"
            )
    
    # Create all stratum definitions
    create_data = []
    for stratum_data in bulk_data.strata:
        create_item = StratumDefinitionCreate(
            project_id=bulk_data.project_id,
            **stratum_data.dict()
        )
        create_data.append(create_item)
    
    return stratum_repo.create_multiple(create_data)


@router.get("/project/{project_id}", response_model=List[StratumDefinitionResponse])
def get_project_stratum_definitions(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all stratum definitions for a project."""
    project_repo = ProjectRepository(db)
    stratum_repo = StratumDefinitionRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return stratum_repo.get_by_project(project_id)


@router.get("/{stratum_id}", response_model=StratumDefinitionResponse)
def get_stratum_definition(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific stratum definition."""
    stratum_repo = StratumDefinitionRepository(db)
    
    stratum = stratum_repo.get_by_id(stratum_id)
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum definition with ID {stratum_id} not found"
        )
    
    return stratum


@router.put("/{stratum_id}", response_model=StratumDefinitionResponse)
def update_stratum_definition(
    stratum_id: int,
    stratum_data: StratumDefinitionUpdate,
    db: Session = Depends(get_db)
):
    """Update a stratum definition."""
    stratum_repo = StratumDefinitionRepository(db)
    
    updated_stratum = stratum_repo.update(stratum_id, stratum_data)
    if not updated_stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum definition with ID {stratum_id} not found"
        )
    
    return updated_stratum


@router.delete("/{stratum_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stratum_definition(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Delete a stratum definition."""
    stratum_repo = StratumDefinitionRepository(db)
    
    if not stratum_repo.delete(stratum_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum definition with ID {stratum_id} not found"
        )