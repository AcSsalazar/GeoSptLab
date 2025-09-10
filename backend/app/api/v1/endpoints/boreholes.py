"""
Borehole API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.borehole import BoreholeRepository
from app.repositories.project import ProjectRepository
from app.schemas.borehole import (
    BoreholeCreate, BoreholeUpdate, BoreholeResponse
)

router = APIRouter()


@router.post("/", response_model=BoreholeResponse, status_code=status.HTTP_201_CREATED)
def create_borehole(
    borehole_data: BoreholeCreate,
    db: Session = Depends(get_db)
):
    """Create a new borehole."""
    project_repo = ProjectRepository(db)
    borehole_repo = BoreholeRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(borehole_data.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {borehole_data.project_id} not found"
        )
    
    # Check if borehole name already exists in project
    if borehole_repo.exists_by_name(borehole_data.project_id, borehole_data.borehole_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Borehole with name '{borehole_data.borehole_name}' already exists in this project"
        )
    
    return borehole_repo.create(borehole_data)


@router.get("/project/{project_id}", response_model=List[BoreholeResponse])
def get_project_boreholes(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all boreholes for a project."""
    project_repo = ProjectRepository(db)
    borehole_repo = BoreholeRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return borehole_repo.get_by_project(project_id)


@router.get("/{borehole_id}", response_model=BoreholeResponse)
def get_borehole(
    borehole_id: int,
    db: Session = Depends(get_db)
):
    """Get borehole by ID."""
    borehole_repo = BoreholeRepository(db)
    borehole = borehole_repo.get_by_id(borehole_id)
    
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {borehole_id} not found"
        )
    
    return borehole


@router.put("/{borehole_id}", response_model=BoreholeResponse)
def update_borehole(
    borehole_id: int,
    borehole_data: BoreholeUpdate,
    db: Session = Depends(get_db)
):
    """Update borehole."""
    borehole_repo = BoreholeRepository(db)
    
    # Check if borehole name already exists (if being updated)
    if borehole_data.borehole_name:
        existing_borehole = borehole_repo.get_by_id(borehole_id)
        if existing_borehole and borehole_repo.exists_by_name(
            existing_borehole.project_id, 
            borehole_data.borehole_name, 
            exclude_id=borehole_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Borehole with name '{borehole_data.borehole_name}' already exists in this project"
            )
    
    borehole = borehole_repo.update(borehole_id, borehole_data)
    
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {borehole_id} not found"
        )
    
    return borehole


@router.delete("/{borehole_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_borehole(
    borehole_id: int,
    db: Session = Depends(get_db)
):
    """Delete borehole."""
    borehole_repo = BoreholeRepository(db)
    
    if not borehole_repo.delete(borehole_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {borehole_id} not found"
        )


@router.get("/project/{project_id}/name/{borehole_name}", response_model=BoreholeResponse)
def get_borehole_by_name(
    project_id: int,
    borehole_name: str,
    db: Session = Depends(get_db)
):
    """Get borehole by name within a project."""
    project_repo = ProjectRepository(db)
    borehole_repo = BoreholeRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    borehole = borehole_repo.get_by_name_and_project(project_id, borehole_name.upper())
    
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with name '{borehole_name}' not found in project {project_id}"
        )
    
    return borehole