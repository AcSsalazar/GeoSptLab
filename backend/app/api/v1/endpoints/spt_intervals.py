"""
SPT Interval API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.spt_interval import SPTIntervalRepository
from app.repositories.borehole import BoreholeRepository
from app.repositories.stratum import StratumRepository
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
    stratum_repo = StratumRepository(db)
    interval_repo = SPTIntervalRepository(db)
    
    # Verify borehole exists
    borehole = borehole_repo.get_by_id(interval_data.borehole_id)
    if not borehole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borehole with ID {interval_data.borehole_id} not found"
        )
    
    # Verify stratum exists
    stratum = stratum_repo.get_by_id(interval_data.stratum_id)
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum with ID {interval_data.stratum_id} not found"
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
    
    # Verify depths are within stratum range
    midpoint_depth = (interval_data.depth_from + interval_data.depth_to) / 2.0
    if not (stratum.initial_depth <= midpoint_depth <= stratum.final_depth):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Interval midpoint ({midpoint_depth}m) is not within stratum range ({stratum.initial_depth}m - {stratum.final_depth}m)"
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


@router.get("/stratum/{stratum_id}", response_model=List[SPTIntervalResponse])
def get_stratum_intervals(
    stratum_id: int,
    db: Session = Depends(get_db)
):
    """Get all SPT intervals for a stratum."""
    stratum_repo = StratumRepository(db)
    interval_repo = SPTIntervalRepository(db)
    
    # Verify stratum exists
    stratum = stratum_repo.get_by_id(stratum_id)
    if not stratum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stratum with ID {stratum_id} not found"
        )
    
    return interval_repo.get_by_stratum(stratum_id)


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