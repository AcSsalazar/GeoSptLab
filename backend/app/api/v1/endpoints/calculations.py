"""
SPT calculation API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.spt_calculations import SPTCalculator
from app.repositories import (
    project_repo, spt_interval_repo, calculated_result_repo, 
    stratum_repo, borehole_repo
)
from app.schemas.calculated_result import (
    CalculatedResult, CalculationRequest, CalculationResponse
)

router = APIRouter()


@router.post("/calculate", response_model=CalculationResponse)
def calculate_spt_parameters(
    calculation_request: CalculationRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate SPT parameters for all intervals in a project.
    """
    project_id = calculation_request.project_id
    
    # Verify project exists
    project = project_repo.get(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all SPT intervals for the project
    spt_intervals = spt_interval_repo.get_by_project(db, project_id)
    
    if not spt_intervals:
        return CalculationResponse(
            project_id=project_id,
            calculated_intervals=0,
            success=True,
            message="No SPT intervals found for calculation"
        )
    
    calculated_count = 0
    errors = []
    
    # Convert project data to dict for calculations
    project_data = {
        'formulation': project.formulation,
        'field_energy_percent': project.field_energy_percent,
        'borehole_diameter': project.borehole_diameter,
        'rod_length': project.rod_length,
        'water_table_depth': project.water_table_depth
    }
    
    for interval in spt_intervals:
        try:
            # Get stratum data for this interval
            stratum = stratum_repo.get(db, interval.stratum_id)
            if not stratum:
                errors.append(f"Stratum not found for interval {interval.id}")
                continue
            
            # Get borehole data
            borehole = borehole_repo.get(db, interval.borehole_id)
            if not borehole:
                errors.append(f"Borehole not found for interval {interval.id}")
                continue
            
            # Convert to dict format for calculations
            spt_data = {
                'midpoint_depth': interval.midpoint_depth,
                'nspt_field': interval.nspt_field,
                'diameter_mm': borehole.diameter_mm,
                'field_energy_percent': borehole.field_energy_percent,
                'rod_length': borehole.rod_length
            }
            
            stratum_data = {
                'gamma_humid': stratum.gamma_humid,
                'gamma_saturated': stratum.gamma_saturated,
                'behavior_type': stratum.behavior_type
            }
            
            # Calculate parameters
            calculations = SPTCalculator.calculate_all_parameters(
                spt_data, stratum_data, project_data
            )
            
            # Save or update calculated results
            calculated_result_repo.create_or_update(
                db, interval.id, calculations
            )
            
            calculated_count += 1
            
        except Exception as e:
            errors.append(f"Error calculating interval {interval.id}: {str(e)}")
    
    success = len(errors) == 0
    message = f"Successfully calculated {calculated_count} intervals"
    if errors:
        message += f". Errors: {'; '.join(errors[:3])}"  # Limit error messages
    
    return CalculationResponse(
        project_id=project_id,
        calculated_intervals=calculated_count,
        success=success,
        message=message
    )


@router.get("/project/{project_id}/results", response_model=List[CalculatedResult])
def get_project_results(project_id: int, db: Session = Depends(get_db)):
    """Get all calculated results for a project."""
    # Verify project exists
    project = project_repo.get(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    results = calculated_result_repo.get_by_project(db, project_id)
    return results


@router.get("/interval/{interval_id}/result", response_model=CalculatedResult)
def get_interval_result(interval_id: int, db: Session = Depends(get_db)):
    """Get calculated result for a specific SPT interval."""
    result = calculated_result_repo.get_by_interval(db, interval_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculated result not found for this interval"
        )
    return result


@router.delete("/interval/{interval_id}/result")
def delete_interval_result(interval_id: int, db: Session = Depends(get_db)):
    """Delete calculated result for a specific SPT interval."""
    result = calculated_result_repo.get_by_interval(db, interval_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculated result not found for this interval"
        )
    
    calculated_result_repo.delete(db, id=result.id)
    return {"message": "Calculated result deleted successfully"}