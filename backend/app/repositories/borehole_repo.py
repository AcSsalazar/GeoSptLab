"""
Borehole repository with specialized operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.borehole import Borehole
from app.schemas.borehole import BoreholeCreate, BoreholeUpdate
from .base import BaseRepository


class BoreholeRepository(BaseRepository[Borehole, BoreholeCreate, BoreholeUpdate]):
    """Borehole repository with specialized queries."""
    
    def get_by_project(self, db: Session, project_id: int) -> List[Borehole]:
        """Get all boreholes for a project."""
        return (
            db.query(self.model)
            .filter(self.model.project_id == project_id)
            .order_by(self.model.borehole_name)
            .all()
        )
    
    def get_by_name(self, db: Session, project_id: int, borehole_name: str) -> Optional[Borehole]:
        """Get borehole by name within a project."""
        return (
            db.query(self.model)
            .filter(
                self.model.project_id == project_id,
                self.model.borehole_name == borehole_name
            )
            .first()
        )
    
    def get_with_intervals(self, db: Session, borehole_id: int) -> Optional[Borehole]:
        """Get borehole with all its SPT intervals."""
        return (
            db.query(self.model)
            .options(joinedload(self.model.spt_intervals))
            .filter(self.model.id == borehole_id)
            .first()
        )


# Create repository instance
borehole_repo = BoreholeRepository(Borehole)