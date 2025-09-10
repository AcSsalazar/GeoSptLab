"""
SPT calculation service for business logic.
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.core.spt_calculations import SPTCalculator
from app.repositories import (
    project_repo, spt_interval_repo, calculated_result_repo,
    stratum_repo, borehole_repo
)
from app.schemas.calculated_result import CalculationResponse


class SPTCalculationService:
    """Service for SPT calculations business logic."""
    
    @staticmethod
    def calculate_project_parameters(db: Session, project_id: int, 
                                   recalculate_all: bool = True) -> CalculationResponse:
        """
        Calculate SPT parameters for all intervals in a project.
        
        Args:
            db: Database session
            project_id: Project ID to calculate
            recalculate_all: Whether to recalculate existing results
            
        Returns:
            CalculationResponse with results summary
        """
        # Verify project exists
        project = project_repo.get(db, project_id)
        if not project:
            raise ValueError("Project not found")
        
        # Get SPT intervals
        if recalculate_all:
            spt_intervals = spt_interval_repo.get_by_project(db, project_id)
        else:
            spt_intervals = spt_interval_repo.get_uncalculated(db, project_id)
        
        if not spt_intervals:
            return CalculationResponse(
                project_id=project_id,
                calculated_intervals=0,
                success=True,
                message="No SPT intervals found for calculation"
            )
        
        calculated_count = 0
        errors = []
        
        # Project data for calculations
        project_data = {
            'formulation': project.formulation,
            'field_energy_percent': project.field_energy_percent,
            'borehole_diameter': project.borehole_diameter,
            'rod_length': project.rod_length,
            'water_table_depth': project.water_table_depth
        }
        
        for interval in spt_intervals:
            try:
                # Get related data
                stratum = stratum_repo.get(db, interval.stratum_id)
                borehole = borehole_repo.get(db, interval.borehole_id)
                
                if not stratum or not borehole:
                    errors.append(f"Missing data for interval {interval.id}")
                    continue
                
                # Prepare calculation data
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
                
                # Save results
                calculated_result_repo.create_or_update(
                    db, interval.id, calculations
                )
                
                calculated_count += 1
                
            except Exception as e:
                errors.append(f"Error calculating interval {interval.id}: {str(e)}")
        
        success = len(errors) == 0
        message = f"Successfully calculated {calculated_count} intervals"
        if errors:
            message += f". {len(errors)} errors occurred"
        
        return CalculationResponse(
            project_id=project_id,
            calculated_intervals=calculated_count,
            success=success,
            message=message
        )
    
    @staticmethod
    def get_calculation_summary(db: Session, project_id: int) -> Dict[str, Any]:
        """
        Get summary of calculations for a project.
        
        Returns:
            Dictionary with calculation statistics
        """
        # Get all intervals and results for the project
        intervals = spt_interval_repo.get_by_project(db, project_id)
        results = calculated_result_repo.get_by_project(db, project_id)
        
        total_intervals = len(intervals)
        calculated_intervals = len(results)
        pending_intervals = total_intervals - calculated_intervals
        
        # Calculate basic statistics from results
        statistics = {}
        if results:
            n60_values = [r.n60 for r in results if r.n60 is not None]
            phi_values = [r.phi_prime_eq for r in results if r.phi_prime_eq is not None]
            
            if n60_values:
                statistics['n60_avg'] = sum(n60_values) / len(n60_values)
                statistics['n60_min'] = min(n60_values)
                statistics['n60_max'] = max(n60_values)
            
            if phi_values:
                statistics['phi_avg'] = sum(phi_values) / len(phi_values)
                statistics['phi_min'] = min(phi_values)
                statistics['phi_max'] = max(phi_values)
        
        return {
            'project_id': project_id,
            'total_intervals': total_intervals,
            'calculated_intervals': calculated_intervals,
            'pending_intervals': pending_intervals,
            'calculation_complete': pending_intervals == 0,
            'statistics': statistics
        }


# Create service instance
spt_service = SPTCalculationService()