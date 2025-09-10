"""
Project repository with specialized operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from .base import BaseRepository


class ProjectRepository(BaseRepository[Project, ProjectCreate, ProjectUpdate]):
    """Project repository with specialized queries."""
    
    def get_by_code(self, db: Session, project_code: str) -> Optional[Project]:
        """Get project by project code."""
        return db.query(self.model).filter(
            self.model.project_code == project_code
        ).first()
    
    def get_with_relations(self, db: Session, project_id: int) -> Optional[Project]:
        """Get project with all related strata and boreholes."""
        return (
            db.query(self.model)
            .options(
                joinedload(self.model.strata),
                joinedload(self.model.boreholes)
            )
            .filter(self.model.id == project_id)
            .first()
        )
    
    def search_by_code(self, db: Session, code_pattern: str) -> List[Project]:
        """Search projects by code pattern."""
        return (
            db.query(self.model)
            .filter(self.model.project_code.contains(code_pattern))
            .all()
        )


# Create repository instance
project_repo = ProjectRepository(Project)