"""
Repository for Project CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    """Repository class for Project CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, project_data: ProjectCreate) -> Project:
        """Create a new project."""
        db_project = Project(**project_data.dict())
        self.db.add(db_project)
        self.db.commit()
        self.db.refresh(db_project)
        return db_project

    def get_by_id(self, project_id: int) -> Optional[Project]:
        """Get project by ID."""
        return self.db.query(Project).filter(Project.id == project_id).first()

    def get_by_code(self, project_code: str) -> Optional[Project]:
        """Get project by project code."""
        return self.db.query(Project).filter(Project.project_code == project_code).first()

    def get_with_details(self, project_id: int) -> Optional[Project]:
        """Get project with strata and boreholes."""
        return (
            self.db.query(Project)
            .options(
                selectinload(Project.strata),
                selectinload(Project.boreholes)
            )
            .filter(Project.id == project_id)
            .first()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects with pagination."""
        return (
            self.db.query(Project)
            .order_by(desc(Project.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, project_id: int, project_data: ProjectUpdate) -> Optional[Project]:
        """Update project."""
        db_project = self.get_by_id(project_id)
        if not db_project:
            return None

        update_data = project_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)

        self.db.commit()
        self.db.refresh(db_project)
        return db_project

    def delete(self, project_id: int) -> bool:
        """Delete project."""
        db_project = self.get_by_id(project_id)
        if not db_project:
            return False

        self.db.delete(db_project)
        self.db.commit()
        return True

    def exists_by_code(self, project_code: str, exclude_id: Optional[int] = None) -> bool:
        """Check if project code already exists."""
        query = self.db.query(Project).filter(Project.project_code == project_code)
        if exclude_id:
            query = query.filter(Project.id != exclude_id)
        return query.first() is not None