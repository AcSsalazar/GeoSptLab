"""
SPT Interval API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.spt_interval import SPTIntervalRepository
from app.repositories.borehole import BoreholeRepository
from app.repositories.borehole_stratum import BoreholeStratumRepository
from app.schemas.spt_interval import (
    SPTIntervalCreate, SPTIntervalUpdate, SPTIntervalResponse
)

router = APIRouter()


@router.post("/", response_model=SPTIntervalResponse, status_code=status.HTTP_201_CREATED)
def create_spt_interval(
    interval_data: SPTIntervalCreate,
    db: Session = Depends(get_db)
):
    """Create a new SPT interval."""
    borehole_repo = BoreholeRepository(db)
    borehole_stratum_repo = BoreholeStratumRepository(db)
    interval_repo = SPTIntervalRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(interval_data.borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {interval_data.borehole_id} not found"
        )
    
    # Verify borehole stratum exists
    borehole_stratum = borehole_stratum_repo.get_by_id(interval_data.borehole_stratum_id)
    if not borehole_stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole stratum with ID {interval_data.borehole_stratum_id} not found"
        )
    
    # Verify borehole stratum belongs to the correct borehole
    if borehole_stratum.borehole_id != interval_data.borehole_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Borehole stratum {interval_data.borehole_stratum_id} does not belong to borehole {interval_data.borehole_id}"
        )
    
    # Check for depth overlaps within the same borehole
    if interval_repo.check_depth_overlap(
        interval_data.borehole_id,
        interval_data.depth_from,
        interval_data.depth_to
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SPT interval depth range overlaps with existing interval in the same borehole"
        )
    
    # Verify depths are within borehole range
    if interval_data.depth_to > borehole.final_depth:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Interval end depth ({interval_data.depth_to}m) exceeds borehole depth ({borehole.final_depth}m)"
        )
    
    # Verify depths are within borehole stratum range
    midpoint_depth = (interval_data.depth_from + interval_data.depth_to) / 2.0
    if not (borehole_stratum.initial_depth <= midpoint_depth <= borehole_stratum.final_depth):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Interval midpoint ({midpoint_depth}m) is not within borehole stratum range ({borehole_stratum.initial_depth}m - {borehole_stratum.final_depth}m)"
        )
    
    return interval_repo.create(interval_data)


@router.get("/borehole/{borehole_id}", response_model=List[SPTIntervalResponse])
def get_borehole_intervals(
    borehole_id: int,
    db: Session = Depends(get_db)
):
    """Get all SPT intervals for a borehole."""
    borehole_repo = BoreholeRepository(db)
    interval_repo = SPTIntervalRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {borehole_id} not found"
        )
    
    return interval_repo.get_by_borehole(borehole_id)


@router.get("/project/{project_id}", response_model=List[SPTIntervalResponse])
def get_project_intervals(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all SPT intervals for a project."""
    interval_repo = SPTIntervalRepository(db)
    return interval_repo.get_by_project(project_id)


@router.get("/borehole-stratum/{borehole_stratum_id}", response_model=List[SPTIntervalResponse])
def get_borehole_stratum_intervals(
    borehole_stratum_id: int,
    db: Session = Depends(get_db)
):
    """Get all SPT intervals for a borehole stratum."""
    borehole_stratum_repo = BoreholeStratumRepository(db)
    interval_repo = SPTIntervalRepository(db)
    
    # Verify borehole stratum exists
    borehole_stratum = borehole_stratum_repo.get_by_id(borehole_stratum_id)
    if not borehole_stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole stratum with ID {borehole_stratum_id} not found"
        )
    
    return interval_repo.get_by_borehole_stratum(borehole_stratum_id)


@router.get("/{interval_id}", response_model=SPTIntervalResponse)
def get_spt_interval(
    interval_id: int,
    db: Session = Depends(get_db)
):
    """Get SPT interval by ID."""
    interval_repo = SPTIntervalRepository(db)
    interval = interval_repo.get_by_id(interval_id)
    
    if not interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SPT interval with ID {interval_id} not found"
        )
    
    return interval


@router.put("/{interval_id}", response_model=SPTIntervalResponse)
def update_spt_interval(
    interval_id: int,
    interval_data: SPTIntervalUpdate,
    db: Session = Depends(get_db)
):
    """Update SPT interval."""
    interval_repo = SPTIntervalRepository(db)
    
    # Get existing interval to check constraints
    existing_interval = interval_repo.get_by_id(interval_id)
    if not existing_interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SPT interval with ID {interval_id} not found"
        )
    
    # Check for depth overlaps if depths are being updated
    if interval_data.depth_from is not None or interval_data.depth_to is not None:
        depth_from = interval_data.depth_from if interval_data.depth_from is not None else existing_interval.depth_from
        depth_to = interval_data.depth_to if interval_data.depth_to is not None else existing_interval.depth_to
        
        if interval_repo.check_depth_overlap(
            existing_interval.borehole_id,
            depth_from,
            depth_to,
            exclude_id=interval_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Updated interval depth range overlaps with existing interval in the same borehole"
            )
    
    interval = interval_repo.update(interval_id, interval_data)
    
    if not interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SPT interval with ID {interval_id} not found"
        )
    
    return interval


@router.delete("/{interval_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_spt_interval(
    interval_id: int,
    db: Session = Depends(get_db)
):
    """Delete SPT interval."""
    interval_repo = SPTIntervalRepository(db)
    
    if not interval_repo.delete(interval_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SPT interval with ID {interval_id} not found"
        )