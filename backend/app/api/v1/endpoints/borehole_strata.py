"""
Borehole Stratum API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.borehole_stratum import BoreholeStratumRepository
from app.repositories.borehole import BoreholeRepository
from app.repositories.stratum import StratumDefinitionRepository
from app.schemas.borehole_stratum import (
    BoreholeStratumCreate, BoreholeStratumUpdate, BoreholeStratumResponse, 
    BoreholeStratumBulkCreate
)

router = APIRouter()


@router.post("/", response_model=BoreholeStratumResponse, status_code=status.HTTP_201_CREATED)
def create_borehole_stratum(
    stratum_data: BoreholeStratumCreate,
    db: Session = Depends(get_db)
):
    """Create a new borehole stratum."""
    borehole_repo = BoreholeRepository(db)
    stratum_def_repo = StratumDefinitionRepository(db)
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(stratum_data.borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {stratum_data.borehole_id} not found"
        )
    
    # Verify stratum definition exists
    stratum_def = stratum_def_repo.get_by_id(stratum_data.stratum_definition_id)
    if not stratum_def:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum definition with ID {stratum_data.stratum_definition_id} not found"
        )
    
    # Check if this stratum code already exists for this borehole
    existing = borehole_stratum_repo.get_by_borehole_and_code(
        stratum_data.borehole_id, 
        stratum_data.stratum_code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stratum code {stratum_data.stratum_code} already exists for this borehole"
        )
    
    return borehole_stratum_repo.create(stratum_data)


@router.post("/bulk", response_model=List[BoreholeStratumResponse], status_code=status.HTTP_201_CREATED)
def create_borehole_strata_bulk(
    bulk_data: BoreholeStratumBulkCreate,
    db: Session = Depends(get_db)
):
    """Create multiple borehole strata for a single borehole."""
    borehole_repo = BoreholeRepository(db)
    stratum_def_repo = StratumDefinitionRepository(db)
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(bulk_data.borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {bulk_data.borehole_id} not found"
        )
    
    # Verify all stratum definitions exist
    for stratum_data in bulk_data.strata:
        stratum_def = stratum_def_repo.get_by_id(stratum_data.stratum_definition_id)
        if not stratum_def:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stratum definition with ID {stratum_data.stratum_definition_id} not found"
            )
    
    # Create all strata
    create_data = []
    for stratum_data in bulk_data.strata:
        create_item = BoreholeStratumCreate(
            borehole_id=bulk_data.borehole_id,
            **stratum_data.dict()
        )
        create_data.append(create_item)
    
    return borehole_stratum_repo.create_multiple(create_data)


@router.get("/borehole/{borehole_id}", response_model=List[BoreholeStratumResponse])
def get_borehole_strata(
    borehole_id: int,
    db: Session = Depends(get_db)
):
    """Get all strata for a specific borehole."""
    borehole_repo = BoreholeRepository(db)
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {borehole_id} not found"
        )
    
    return borehole_stratum_repo.get_by_borehole(borehole_id)


@router.get("/depth/{borehole_id}/{depth}", response_model=BoreholeStratumResponse)
def find_stratum_at_depth(
    borehole_id: int,
    depth: float,
    db: Session = Depends(get_db)
):
    """Find which stratum contains a specific depth in a borehole."""
    borehole_repo = BoreholeRepository(db)
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {borehole_id} not found"
        )
    
    stratum = borehole_stratum_repo.find_stratum_for_depth(borehole_id, depth)
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No stratum found at depth {depth}m in borehole {borehole_id}"
        )
    
    return stratum


@router.get("/{stratum_id}", response_model=BoreholeStratumResponse)
def get_borehole_stratum(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific borehole stratum."""
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    stratum = borehole_stratum_repo.get_by_id(stratum_id)
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole stratum with ID {stratum_id} not found"
        )
    
    return stratum


@router.put("/{stratum_id}", response_model=BoreholeStratumResponse)
def update_borehole_stratum(
    stratum_id: int,
    stratum_update: BoreholeStratumUpdate,
    db: Session = Depends(get_db)
):
    """Update a borehole stratum."""
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    updated_stratum = borehole_stratum_repo.update(stratum_id, stratum_update)
    if not updated_stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole stratum with ID {stratum_id} not found"
        )
    
    return updated_stratum


@router.delete("/{stratum_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_borehole_stratum(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Delete a borehole stratum."""
    borehole_stratum_repo = BoreholeStratumRepository(db)
    
    if not borehole_stratum_repo.delete(stratum_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole stratum with ID {stratum_id} not found"
        )