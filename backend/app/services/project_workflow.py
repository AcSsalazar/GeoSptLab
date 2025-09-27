"""
Helper functions for creating complete SPT project workflows.
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.project import ProjectRepository
from app.repositories.stratum import StratumDefinitionRepository
from app.repositories.borehole import BoreholeRepository
from app.repositories.borehole_stratum import BoreholeStratumRepository
from app.repositories.spt_interval import SPTIntervalRepository

from app.schemas.project import ProjectCreate
from app.schemas.stratum import StratumDefinitionCreate
from app.schemas.borehole import BoreholeCreate
from app.schemas.borehole_stratum import BoreholeStratumCreate
from app.schemas.spt_interval import SPTIntervalCreate


class ProjectWorkflowHelper:
    """Helper class for complete project workflow creation."""
    
    def __init__(self, db: Session):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.stratum_def_repo = StratumDefinitionRepository(db)
        self.borehole_repo = BoreholeRepository(db)
        self.borehole_stratum_repo = BoreholeStratumRepository(db)
        self.spt_interval_repo = SPTIntervalRepository(db)

    def create_complete_project_from_excel(self, excel_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a complete SPT project from Excel-like data structure.
        
        Expected excel_data structure:
        {
            "project": {
                "project_name": "CP-00633 Casa Las Palmas",
                "number_of_boreholes": 3,
                "number_of_strata": 3,
                "formulation": "kishida"
            },
            "stratum_definitions": [
                {
                    "stratum_code": 1,
                    "name": "Ceniza Volcánica",
                    "description": "Limos, suelos finogranulares",
                    "gamma_humid": 18.5,
                    "gamma_saturated": 19.0,
                    "behavior_type": "granular"
                },
                ...
            ],
            "boreholes": [
                {
                    "borehole_name": "P1",
                    "final_depth": 6.45,
                    "diameter_mm": 90.0,
                    "field_energy_percent": 45.0,
                    "water_table_depth": 3.0,
                    "formulation": "kishida",
                    "strata": [
                        {
                            "stratum_code": 1,
                            "stratum_definition_id": 1,  # Will be filled automatically
                            "initial_depth": 1.00,
                            "final_depth": 2.00
                        },
                        ...
                    ],
                    "spt_intervals": [
                        {
                            "depth_from": 1.00,
                            "depth_to": 1.45,
                            "nspt_field": 9,
                            "description": "Limos, suelos finogranulares",
                            "stratum_code": 1  # Will be mapped to borehole_stratum_id
                        },
                        ...
                    ]
                },
                ...
            ]
        }
        """
        result = {}
        
        try:
            # 1. Create project
            project_data = ProjectCreate(**excel_data["project"])
            project = self.project_repo.create(project_data)
            result["project"] = project
            
            # 2. Create stratum definitions
            stratum_definitions = []
            for stratum_def_data in excel_data["stratum_definitions"]:
                stratum_def_create = StratumDefinitionCreate(
                    project_id=project.id,
                    **stratum_def_data
                )
                stratum_def = self.stratum_def_repo.create(stratum_def_create)
                stratum_definitions.append(stratum_def)
            
            result["stratum_definitions"] = stratum_definitions
            
            # Create mapping of stratum_code -> stratum_definition_id
            stratum_code_to_id = {sd.stratum_code: sd.id for sd in stratum_definitions}
            
            # 3. Create boreholes and their specific strata
            boreholes = []
            all_borehole_strata = []
            all_spt_intervals = []
            
            for borehole_data in excel_data["boreholes"]:
                # Create borehole
                borehole_create = BoreholeCreate(
                    project_id=project.id,
                    borehole_name=borehole_data["borehole_name"],
                    final_depth=borehole_data["final_depth"],
                    diameter_mm=borehole_data["diameter_mm"],
                    field_energy_percent=borehole_data["field_energy_percent"],
                    water_table_depth=borehole_data.get("water_table_depth"),
                    formulation=borehole_data.get("formulation")
                )
                borehole = self.borehole_repo.create(borehole_create)
                boreholes.append(borehole)
                
                # Create borehole strata
                borehole_strata = []
                for stratum_data in borehole_data["strata"]:
                    borehole_stratum_create = BoreholeStratumCreate(
                        borehole_id=borehole.id,
                        stratum_definition_id=stratum_code_to_id[stratum_data["stratum_code"]],
                        stratum_code=stratum_data["stratum_code"],
                        initial_depth=stratum_data["initial_depth"],
                        final_depth=stratum_data["final_depth"]
                    )
                    borehole_stratum = self.borehole_stratum_repo.create(borehole_stratum_create)
                    borehole_strata.append(borehole_stratum)
                
                all_borehole_strata.extend(borehole_strata)
                
                # Create mapping of stratum_code -> borehole_stratum_id for this borehole
                borehole_stratum_code_to_id = {bs.stratum_code: bs.id for bs in borehole_strata}
                
                # Create SPT intervals
                spt_intervals = []
                for interval_data in borehole_data["spt_intervals"]:
                    spt_interval_create = SPTIntervalCreate(
                        borehole_id=borehole.id,
                        borehole_stratum_id=borehole_stratum_code_to_id[interval_data["stratum_code"]],
                        depth_from=interval_data["depth_from"],
                        depth_to=interval_data["depth_to"],
                        nspt_field=interval_data["nspt_field"],
                        description=interval_data.get("description")
                    )
                    spt_interval = self.spt_interval_repo.create(spt_interval_create)
                    spt_intervals.append(spt_interval)
                
                all_spt_intervals.extend(spt_intervals)
            
            result["boreholes"] = boreholes
            result["borehole_strata"] = all_borehole_strata
            result["spt_intervals"] = all_spt_intervals
            
            return result
            
        except Exception as e:
            # Rollback would happen automatically due to session management
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create complete project: {str(e)}"
            )

    def validate_excel_data_structure(self, excel_data: Dict[str, Any]) -> None:
        """Validate that the excel data has the required structure."""
        required_keys = ["project", "stratum_definitions", "boreholes"]
        for key in required_keys:
            if key not in excel_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required key: {key}"
                )
        
        # Validate project data
        project_required = ["project_name", "number_of_boreholes", "number_of_strata", "formulation"]
        for key in project_required:
            if key not in excel_data["project"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required project key: {key}"
                )
        
        # Validate stratum definitions
        if not excel_data["stratum_definitions"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one stratum definition is required"
            )
        
        # Validate boreholes
        if not excel_data["boreholes"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one borehole is required"
            )
        
        # Check that number of boreholes matches
        if len(excel_data["boreholes"]) != excel_data["project"]["number_of_boreholes"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Number of boreholes doesn't match project specification"
            )
        
        # Check that number of stratum definitions matches
        if len(excel_data["stratum_definitions"]) != excel_data["project"]["number_of_strata"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Number of stratum definitions doesn't match project specification"
            )