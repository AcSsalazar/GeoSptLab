"""
SPT Calculations API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.spt_calculations import calculate_spt_parameters
from app.repositories.project import ProjectRepository
from app.repositories.spt_interval import SPTIntervalRepository
from app.repositories.calculated_result import CalculatedResultRepository
from app.schemas.calculated_result import (
    CalculatedResultResponse, SPTCalculationRequest, SPTCalculationResponse,
    CalculatedResultCreate
)

router = APIRouter()


@router.post("/calculate", response_model=SPTCalculationResponse)
def calculate_spt_parameters_for_project(
    calculation_request: SPTCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate SPT parameters for all intervals in a project."""
    project_repo = ProjectRepository(db)
    interval_repo = SPTIntervalRepository(db)
    result_repo = CalculatedResultRepository(db)
    
    # Verify project exists
    project = project_repo.get_with_details(calculation_request.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {calculation_request.project_id} not found"
        )
    
    # Get all SPT intervals for the project
    intervals = interval_repo.get_with_calculations(calculation_request.project_id)
    
    if not intervals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No SPT intervals found for this project"
        )
    
    calculated_count = 0
    updated_count = 0
    
    # Process each interval
    for interval in intervals:
        try:
            # Prepare data for calculation
            project_data = {
                "water_table_depth": project.water_table_depth,
                "field_energy_percent": project.field_energy_percent,
                "formulation": project.formulation.value
            }
            
            stratum_data = {
                "gamma_humid": interval.stratum.gamma_humid,
                "gamma_saturated": interval.stratum.gamma_saturated
            }
            
            borehole_data = {
                "diameter_mm": interval.borehole.diameter_mm,
                "rod_length": interval.borehole.rod_length
            }
            
            spt_data = {
                "midpoint_depth": interval.midpoint_depth,
                "nspt_field": interval.nspt_field
            }
            
            # Calculate parameters
            results = calculate_spt_parameters(
                spt_data=spt_data,
                project_data=project_data,
                stratum_data=stratum_data,
                borehole_data=borehole_data
            )
            
            # Create or update calculated result
            result_data = CalculatedResultCreate(
                spt_interval_id=interval.id,
                **results
            )
            
            # Check if result already exists
            existing_result = result_repo.get_by_spt_interval(interval.id)
            if existing_result and not calculation_request.recalculate_all:
                continue  # Skip if already calculated and not forcing recalculation
            
            result_repo.upsert(result_data)
            
            if existing_result:
                updated_count += 1
            else:
                calculated_count += 1
                
        except Exception as e:
            # Log the error and continue with other intervals
            print(f"Error calculating SPT parameters for interval {interval.id}: {str(e)}")
            continue
    
    return SPTCalculationResponse(
        project_id=calculation_request.project_id,
        calculated_intervals=calculated_count,
        updated_intervals=updated_count,
        message=f"Successfully processed {calculated_count + updated_count} SPT intervals"
    )


@router.get("/project/{project_id}/results", response_model=List[CalculatedResultResponse])
def get_project_results(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all calculated results for a project."""
    project_repo = ProjectRepository(db)
    result_repo = CalculatedResultRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return result_repo.get_by_project(project_id)


@router.get("/interval/{interval_id}/result", response_model=CalculatedResultResponse)
def get_interval_result(
    interval_id: int,
    db: Session = Depends(get_db)
):
    """Get calculated result for a specific SPT interval."""
    result_repo = CalculatedResultRepository(db)
    
    result = result_repo.get_by_spt_interval(interval_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No calculated result found for SPT interval {interval_id}"
        )
    
    return result


@router.post("/interval/{interval_id}/calculate", response_model=CalculatedResultResponse)
def calculate_single_interval(
    interval_id: int,
    db: Session = Depends(get_db)
):
    """Calculate SPT parameters for a single interval."""
    interval_repo = SPTIntervalRepository(db)
    result_repo = CalculatedResultRepository(db)
    
    # Get interval with related data
    interval = interval_repo.get_by_id(interval_id)
    if not interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SPT interval with ID {interval_id} not found"
        )
    
    try:
        # Prepare data for calculation
        project_data = {
            "water_table_depth": interval.borehole.project.water_table_depth,
            "field_energy_percent": interval.borehole.project.field_energy_percent,
            "formulation": interval.borehole.project.formulation.value
        }
        
        stratum_data = {
            "gamma_humid": interval.stratum.gamma_humid,
            "gamma_saturated": interval.stratum.gamma_saturated
        }
        
        borehole_data = {
            "diameter_mm": interval.borehole.diameter_mm,
            "rod_length": interval.borehole.rod_length
        }
        
        spt_data = {
            "midpoint_depth": interval.midpoint_depth,
            "nspt_field": interval.nspt_field
        }
        
        # Calculate parameters
        results = calculate_spt_parameters(
            spt_data=spt_data,
            project_data=project_data,
            stratum_data=stratum_data,
            borehole_data=borehole_data
        )
        
        # Create or update calculated result
        result_data = CalculatedResultCreate(
            spt_interval_id=interval.id,
            **results
        )
        
        calculated_result = result_repo.upsert(result_data)
        
        return calculated_result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating SPT parameters: {str(e)}"
        )


@router.delete("/project/{project_id}/results", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_results(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete all calculated results for a project."""
    project_repo = ProjectRepository(db)
    result_repo = CalculatedResultRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    result_repo.bulk_delete_by_project(project_id)