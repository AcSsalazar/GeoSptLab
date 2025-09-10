"""
Project API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.project_repo import project_repo
from app.schemas.project import Project, ProjectCreate, ProjectUpdate, ProjectWithRelations
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[Project])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all projects with pagination."""
    projects = project_repo.get_multi(db, skip=skip, limit=limit)
    return projects


@router.get("/{project_id}", response_model=Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project by ID."""
    project = project_repo.get(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.get("/{project_id}/details", response_model=ProjectWithRelations)
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    """Get project with all related strata and boreholes."""
    project = project_repo.get_with_relations(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.get("/code/{project_code}", response_model=Project)
def get_project_by_code(project_code: str, db: Session = Depends(get_db)):
    """Get project by project code."""
    project = project_repo.get_by_code(db, project_code)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    # Check if project code already exists
    existing_project = project_repo.get_by_code(db, project.project_code)
    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project code already exists"
        )
    
    return project_repo.create(db, obj_in=project)


@router.put("/{project_id}", response_model=Project)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing project."""
    db_project = project_repo.get(db, project_id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if project code is being updated and already exists
    if project.project_code:
        existing_project = project_repo.get_by_code(db, project.project_code)
        if existing_project and existing_project.id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project code already exists"
            )
    
    return project_repo.update(db, db_obj=db_project, obj_in=project)


@router.delete("/{project_id}", response_model=MessageResponse)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project."""
    project = project_repo.get(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    project_repo.delete(db, id=project_id)
    return MessageResponse(message="Project deleted successfully")