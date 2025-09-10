"""
Stratum repository with specialized operations.
"""
from typing import List
from sqlalchemy.orm import Session
from app.models.stratum import Stratum
from app.schemas.stratum import StratumCreate, StratumUpdate
from .base import BaseRepository


class StratumRepository(BaseRepository[Stratum, StratumCreate, StratumUpdate]):
    """Stratum repository with specialized queries."""
    
    def get_by_project(self, db: Session, project_id: int) -> List[Stratum]:
        """Get all strata for a project."""
        return (
            db.query(self.model)
            .filter(self.model.project_id == project_id)
            .order_by(self.model.initial_depth)
            .all()
        )
    
    def get_by_depth(self, db: Session, project_id: int, depth: float) -> Stratum:
        """Get stratum containing a specific depth."""
        return (
            db.query(self.model)
            .filter(
                self.model.project_id == project_id,
                self.model.initial_depth <= depth,
                self.model.final_depth > depth
            )
            .first()
        )
    
    def get_by_code(self, db: Session, project_id: int, stratum_code: str) -> Stratum:
        """Get stratum by code within a project."""
        return (
            db.query(self.model)
            .filter(
                self.model.project_id == project_id,
                self.model.stratum_code == stratum_code
            )
            .first()
        )


# Create repository instance
stratum_repo = StratumRepository(Stratum)