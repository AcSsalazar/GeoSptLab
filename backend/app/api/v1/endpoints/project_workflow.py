"""
Project Workflow API endpoints for complete project creation.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.project_workflow import ProjectWorkflowHelper

router = APIRouter()


@router.post("/create-from-excel", status_code=status.HTTP_201_CREATED)
def create_project_from_excel_data(
    excel_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Create a complete SPT project from Excel-like data structure.
    
    This endpoint allows creating a project with all its components in a single call:
    - Project
    - Stratum definitions
    - Boreholes
    - Borehole-specific strata with their depths
    - SPT intervals
    
    Perfect for replicating the Excel workflow structure.
    """
    workflow_helper = ProjectWorkflowHelper(db)
    
    # Validate data structure
    workflow_helper.validate_excel_data_structure(excel_data)
    
    # Create complete project
    result = workflow_helper.create_complete_project_from_excel(excel_data)
    
    return {
        "message": "Complete project created successfully",
        "project_id": result["project"].id,
        "project_code": result["project"].project_code,
        "stratum_definitions_created": len(result["stratum_definitions"]),
        "boreholes_created": len(result["boreholes"]),
        "borehole_strata_created": len(result["borehole_strata"]),
        "spt_intervals_created": len(result["spt_intervals"])
    }


@router.post("/example-cp00633", status_code=status.HTTP_201_CREATED)
def create_cp00633_example_project(
    db: Session = Depends(get_db)
):
    """
    Create the CP-00633 Casa Las Palmas example project with all data.
    
    This creates the exact project from the Excel data you provided:
    - 3 boreholes (P1, P2, P3) with different water table depths
    - 3 stratum definitions with their material properties
    - Each borehole with its specific stratum depths
    - All SPT intervals with their N values
    """
    
    # CP-00633 Casa Las Palmas Excel data structure
    cp00633_data = {
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
            {
                "stratum_code": 2,
                "name": "H-VI Migmatita Puente P",
                "description": "Limos, suelos finogranulares",
                "gamma_humid": 19.5,
                "gamma_saturated": 20.0,
                "behavior_type": "granular"
            },
            {
                "stratum_code": 3,
                "name": "H-V Migmatita de Puente P",
                "description": "Limos, suelos finogranulares",
                "gamma_humid": 16.0,
                "gamma_saturated": 16.5,
                "behavior_type": "granular"
            }
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
                        "initial_depth": 1.00,
                        "final_depth": 2.00
                    },
                    {
                        "stratum_code": 2,
                        "initial_depth": 2.00,
                        "final_depth": 4.45
                    },
                    {
                        "stratum_code": 3,
                        "initial_depth": 4.45,
                        "final_depth": 6.45
                    }
                ],
                "spt_intervals": [
                    {
                        "depth_from": 1.00,
                        "depth_to": 1.45,
                        "nspt_field": 9,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 1
                    },
                    {
                        "depth_from": 3.00,
                        "depth_to": 3.45,
                        "nspt_field": 4,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 2
                    },
                    {
                        "depth_from": 4.00,
                        "depth_to": 4.45,
                        "nspt_field": 6,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 2
                    },
                    {
                        "depth_from": 5.00,
                        "depth_to": 5.45,
                        "nspt_field": 33,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 3
                    },
                    {
                        "depth_from": 6.00,
                        "depth_to": 6.45,
                        "nspt_field": 77,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 3
                    }
                ]
            },
            {
                "borehole_name": "P2",
                "final_depth": 6.45,
                "diameter_mm": 90.0,
                "field_energy_percent": 45.0,
                "water_table_depth": 20.0,
                "formulation": "kishida",
                "strata": [
                    {
                        "stratum_code": 1,
                        "initial_depth": 0.00,
                        "final_depth": 1.45
                    },
                    {
                        "stratum_code": 2,
                        "initial_depth": 1.45,
                        "final_depth": 2.45
                    },
                    {
                        "stratum_code": 3,
                        "initial_depth": 2.45,
                        "final_depth": 6.45
                    }
                ],
                "spt_intervals": [
                    {
                        "depth_from": 1.00,
                        "depth_to": 1.45,
                        "nspt_field": 11,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 1
                    },
                    {
                        "depth_from": 2.00,
                        "depth_to": 2.45,
                        "nspt_field": 12,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 2
                    },
                    {
                        "depth_from": 4.00,
                        "depth_to": 4.45,
                        "nspt_field": 30,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 3
                    },
                    {
                        "depth_from": 6.00,
                        "depth_to": 6.45,
                        "nspt_field": 41,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 3
                    }
                ]
            },
            {
                "borehole_name": "P3",
                "final_depth": 6.25,
                "diameter_mm": 90.0,
                "field_energy_percent": 45.0,
                "water_table_depth": 20.0,
                "formulation": "kishida",
                "strata": [
                    {
                        "stratum_code": 2,
                        "initial_depth": 1.45,
                        "final_depth": 4.45
                    },
                    {
                        "stratum_code": 3,
                        "initial_depth": 4.45,
                        "final_depth": 6.25
                    }
                ],
                "spt_intervals": [
                    {
                        "depth_from": 3.00,
                        "depth_to": 3.45,
                        "nspt_field": 10,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 2
                    },
                    {
                        "depth_from": 4.00,
                        "depth_to": 4.45,
                        "nspt_field": 16,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 2
                    },
                    {
                        "depth_from": 6.00,
                        "depth_to": 6.45,
                        "nspt_field": 53,
                        "description": "Limos, suelos finogranulares",
                        "stratum_code": 3
                    }
                ]
            }
        ]
    }
    
    workflow_helper = ProjectWorkflowHelper(db)
    result = workflow_helper.create_complete_project_from_excel(cp00633_data)
    
    return {
        "message": "CP-00633 Casa Las Palmas project created successfully",
        "project_id": result["project"].id,
        "project_code": result["project"].project_code,
        "stratum_definitions_created": len(result["stratum_definitions"]),
        "boreholes_created": len(result["boreholes"]),
        "borehole_strata_created": len(result["borehole_strata"]),
        "spt_intervals_created": len(result["spt_intervals"]),
        "details": {
            "boreholes": [
                {
                    "name": bh.borehole_name,
                    "depth": bh.final_depth,
                    "water_table": bh.water_table_depth
                } for bh in result["boreholes"]
            ],
            "ready_for_calculations": True
        }
    }