"""
SPT Calculations API endpoints.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.spt_calculations import (
    calculate_spt_parameters,
    calculate_mohr_coulomb_regression_by_stratum,
    calculate_statistical_summary_by_stratum
)
from app.repositories.project import ProjectRepository
from app.repositories.spt_interval import SPTIntervalRepository
from app.repositories.borehole_stratum import BoreholeStratumRepository
from app.repositories.calculated_result import CalculatedResultRepository
from app.schemas.calculated_result import (
    CalculatedResultResponse, SPTCalculationRequest, SPTCalculationResponse,
    CalculatedResultCreate
)

router = APIRouter()


@router.post("/project/{project_id}/calculate", response_model=SPTCalculationResponse)
def calculate_spt_parameters_for_project(
    project_id: int,
    calculation_request: SPTCalculationRequest = None,
    db: Session = Depends(get_db)
):
    """Calculate SPT parameters for all intervals in a project."""
    project_repo = ProjectRepository(db)
    interval_repo = SPTIntervalRepository(db)
    result_repo = CalculatedResultRepository(db)
    
    # Use recalculate_all from request body or default to False
    recalculate_all = calculation_request.recalculate_all if calculation_request else False
    
    # Verify project exists
    project = project_repo.get_with_details(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    # Get all SPT intervals for the project
    intervals = interval_repo.get_with_calculations(project_id)
    
    if not intervals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No SPT intervals found for this project"
        )
    
    calculated_count = 0
    updated_count = 0
    
    print(f"\n🔍 DEBUG: Starting calculations for project {project_id}")
    print(f"📊 Total intervals found: {len(intervals)}")
    
    # Process each interval
    for i, interval in enumerate(intervals, 1):
        try:
            print(f"\n--- Processing Interval {i}/{len(intervals)} ---")
            print(f"SPT Interval ID: {interval.id}")
            print(f"Borehole: {interval.borehole.borehole_name} (ID: {interval.borehole_id})")
            print(f"Depth: {interval.depth_from}m - {interval.depth_to}m (midpoint: {interval.midpoint_depth}m)")
            print(f"N-SPT Field: {interval.nspt_field}")
            print(f"Stratum: {interval.borehole_stratum.stratum_definition.name}")
            
            # Prepare data for calculation
            # Use borehole's water_table_depth exclusively
            water_table_depth = interval.borehole.water_table_depth
            
            # Use borehole's formulation if available, otherwise use project default  
            formulation = interval.borehole.formulation or project.formulation
            
            print(f"Water Table Depth: {water_table_depth}m")
            print(f"Field Energy: {interval.borehole.field_energy_percent}%")
            print(f"Formulation: {formulation.value}")
            print(f"γ_humid: {interval.borehole_stratum.stratum_definition.gamma_humid} kN/m³")
            print(f"γ_saturated: {interval.borehole_stratum.stratum_definition.gamma_saturated} kN/m³")
            
            project_data = {
                "field_energy_percent": interval.borehole.field_energy_percent,  # Now from borehole
                "formulation": formulation.value
            }
            
            stratum_data = {
                "gamma_humid": interval.borehole_stratum.stratum_definition.gamma_humid,
                "gamma_saturated": interval.borehole_stratum.stratum_definition.gamma_saturated
            }
            
            borehole_data = {
                "diameter_mm": interval.borehole.diameter_mm,
                "water_table_depth": water_table_depth
            }
            
            spt_data = {
                "midpoint_depth": interval.midpoint_depth,
                "nspt_field": interval.nspt_field
            }
            
            # Calculate parameters
            print(f"🧮 Calling calculate_spt_parameters...")
            results = calculate_spt_parameters(
                spt_data=spt_data,
                project_data=project_data,
                stratum_data=stratum_data,
                borehole_data=borehole_data
            )
            print(f"✅ Results: N45={results.get('n45', 'N/A'):.2f}, σ'={results.get('sigma_prime', 'N/A'):.2f} kPa, φ'eq={results.get('phi_prime_eq', 'N/A'):.2f}°")
            
            # Create or update calculated result
            result_data = CalculatedResultCreate(
                spt_interval_id=interval.id,
                **results
            )
            
            # Check if result already exists
            existing_result = result_repo.get_by_spt_interval(interval.id)
            if existing_result and not recalculate_all:
                print(f"⏭️  Skipping - result already exists (recalculate_all={recalculate_all})")
                continue  # Skip if already calculated and not forcing recalculation
            
            result_repo.upsert(result_data)
            print(f"💾 Result saved to database")
            
            if existing_result:
                updated_count += 1
                print(f"🔄 Updated existing result")
            else:
                calculated_count += 1
                print(f"✨ Created new result")
                
        except Exception as e:
            # Log the error and continue with other intervals
            print(f"❌ Error calculating SPT parameters for interval {interval.id}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"\n📋 Final Summary:")
    print(f"   Calculated: {calculated_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Total processed: {calculated_count + updated_count}")
    print(f"   Total intervals: {len(intervals)}")
    print(f"   Skipped: {len(intervals) - calculated_count - updated_count}")
    
    return SPTCalculationResponse(
        project_id=project_id,
        calculated_intervals=calculated_count,
        updated_intervals=updated_count,
        message=f"Successfully processed {calculated_count + updated_count} SPT intervals"
    )


@router.get("/project/{project_id}/results")
def get_project_results(
    project_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get all calculated results for a project with regression analysis."""
    project_repo = ProjectRepository(db)
    result_repo = CalculatedResultRepository(db)
    interval_repo = SPTIntervalRepository(db)
    
    # Verify project exists
    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    # Get calculated results
    results = result_repo.get_by_project(project_id)
    
    # Convert SQLAlchemy models to dicts and build stratum mapping
    results_dicts = []
    stratum_mapping = {}
    
    for result in results:
        result_dict = {
            "id": result.id,
            "spt_interval_id": result.spt_interval_id,
            "sigma_prime": result.sigma_prime,
            "tau_resistance": result.tau_resistance,
            "phi_prime_eq": result.phi_prime_eq,
            "elastic_modulus": result.elastic_modulus,
            "su_undrained": result.su_undrained,
            "n45": result.n45,
            "cb_factor": result.cb_factor,
            "cs_factor": result.cs_factor,
            "cr_factor": result.cr_factor,
            "cn_factor": result.cn_factor,
            "n55": result.n55,
            "n60": result.n60,
            "n145": result.n145
        }
        results_dicts.append(result_dict)
        
        # Get stratum code for this result - use the interval's relationship
        interval = result.spt_interval
        if interval and interval.borehole_stratum:
            borehole_stratum = interval.borehole_stratum
            if borehole_stratum.stratum_definition:
                stratum_mapping[result.id] = borehole_stratum.stratum_definition.stratum_code
    
    # Calculate regression analysis by stratum
    regression_by_stratum = {}
    statistical_summary_by_stratum = {}
    
    if results_dicts and stratum_mapping:
        print(f"\n📊 Calculating Mohr-Coulomb regression for {len(results_dicts)} results...")
        regression_by_stratum = calculate_mohr_coulomb_regression_by_stratum(
            results_dicts, stratum_mapping
        )
        print(f"✅ Regression calculated for {len(regression_by_stratum)} strata")
        
        print(f"\n📈 Calculating statistical summary...")
        statistical_summary_by_stratum = calculate_statistical_summary_by_stratum(
            results_dicts, stratum_mapping
        )
        print(f"✅ Statistical summary calculated for {len(statistical_summary_by_stratum)} strata")
    
    return {
        "results": results_dicts,
        "regression_by_stratum": regression_by_stratum,
        "statistical_summary_by_stratum": statistical_summary_by_stratum
    }


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
        # Use borehole's water_table_depth exclusively
        water_table_depth = interval.borehole.water_table_depth
        
        # Use borehole's formulation if available, otherwise use project default
        formulation = interval.borehole.formulation or interval.borehole.project.formulation
        
        project_data = {
            "field_energy_percent": interval.borehole.field_energy_percent,  # Now from borehole
            "formulation": formulation.value
        }
        
        stratum_data = {
            "gamma_humid": interval.borehole_stratum.stratum_definition.gamma_humid,
            "gamma_saturated": interval.borehole_stratum.stratum_definition.gamma_saturated
        }
        
        borehole_data = {
            "diameter_mm": interval.borehole.diameter_mm,
            "water_table_depth": water_table_depth
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