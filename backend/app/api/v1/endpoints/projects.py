"""
Project API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.project import ProjectRepository
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithDetails
)

router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project."""
    repo = ProjectRepository(db)
    
    # Check if project code already exists
    if repo.exists_by_code(project_data.project_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with code '{project_data.project_code}' already exists"
        )
    
    return repo.create(project_data)


@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all projects with pagination."""
    repo = ProjectRepository(db)
    return repo.get_all(skip=skip, limit=limit)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project by ID."""
    repo = ProjectRepository(db)
    project = repo.get_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return project


@router.get("/{project_id}/details", response_model=ProjectWithDetails)
def get_project_with_details(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project with strata and boreholes."""
    repo = ProjectRepository(db)
    project = repo.get_with_details(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update project."""
    repo = ProjectRepository(db)
    
    # Check if project code already exists (if being updated)
    if project_data.project_code and repo.exists_by_code(
        project_data.project_code, exclude_id=project_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with code '{project_data.project_code}' already exists"
        )
    
    project = repo.update(project_id, project_data)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete project."""
    repo = ProjectRepository(db)
    
    if not repo.delete(project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )


@router.get("/code/{project_code}", response_model=ProjectResponse)
def get_project_by_code(
    project_code: str,
    db: Session = Depends(get_db)
):
    """Get project by project code."""
    repo = ProjectRepository(db)
    project = repo.get_by_code(project_code)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with code '{project_code}' not found"
        )
    
    return project