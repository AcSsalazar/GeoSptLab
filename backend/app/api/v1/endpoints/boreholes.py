"""
Borehole API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.borehole import BoreholeRepository
from app.repositories.project import ProjectRepository
from app.repositories.stratum import StratumDefinitionRepository
from app.schemas.borehole import (
    BoreholeCreate, BoreholeUpdate, BoreholeResponse, generate_borehole_name,
    BoreholeBulkCreate, BoreholeWithStrata
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
    
    # Auto-generate borehole name if not provided
    if not borehole_data.borehole_name:
        # Get current borehole count for this project
        existing_boreholes = borehole_repo.get_by_project_id(borehole_data.project_id)
        next_sequence = len(existing_boreholes) + 1
        borehole_data.borehole_name = generate_borehole_name(borehole_data.project_id, next_sequence)
    
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


@router.post("/bulk", response_model=List[BoreholeResponse], status_code=status.HTTP_201_CREATED)
def create_boreholes_with_strata(
    bulk_data: BoreholeBulkCreate,
    db: Session = Depends(get_db)
):
    """Create multiple boreholes with their strata assignments in bulk."""
    project_repo = ProjectRepository(db)
    borehole_repo = BoreholeRepository(db)
    stratum_repo = StratumDefinitionRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(bulk_data.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {bulk_data.project_id} not found"
        )
    
    created_boreholes = []
    
    try:
        # Process each borehole
        for idx, borehole_data in enumerate(bulk_data.boreholes):
            # Auto-generate borehole name if not provided
            if not borehole_data.borehole_name:
                existing_count = len(created_boreholes) + len(borehole_repo.get_by_project_id(bulk_data.project_id))
                borehole_data.borehole_name = generate_borehole_name(bulk_data.project_id, existing_count + 1)
            
            # Check for duplicate names
            existing_borehole = borehole_repo.get_by_name_and_project(
                bulk_data.project_id, 
                borehole_data.borehole_name
            )
            if existing_borehole:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Borehole with name '{borehole_data.borehole_name}' already exists in project"
                )
            
            # Validate that referenced strata exist
            for assignment in borehole_data.strata_assignments:
                stratum = stratum_repo.get_by_code_and_project(
                    bulk_data.project_id, 
                    assignment.stratum_code
                )
                if not stratum:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Stratum with code {assignment.stratum_code} not found in project {bulk_data.project_id}"
                    )
            
            # Create the borehole (without strata assignments for now)
            borehole_create_data = BoreholeCreate(
                project_id=bulk_data.project_id,
                borehole_name=borehole_data.borehole_name,
                final_depth=borehole_data.final_depth,
                diameter_mm=borehole_data.diameter_mm,
                field_energy_percent=borehole_data.field_energy_percent,
                rod_length=borehole_data.rod_length,
                water_table_depth=borehole_data.water_table_depth,
                formulation=borehole_data.formulation
            )
            
            created_borehole = borehole_repo.create(borehole_create_data)
            created_boreholes.append(created_borehole)
            
            # Note: Strata assignments will be handled when creating SPT intervals
            # The frontend should create SPTIntervals that reference both borehole_id and stratum_id
            # This maintains the existing database structure
    
    except Exception as e:
        # Cleanup any created boreholes if there's an error
        for borehole in created_boreholes:
            borehole_repo.delete(borehole.id)
        db.rollback()
        raise e
    
    db.commit()
    return created_boreholes
    
    return borehole