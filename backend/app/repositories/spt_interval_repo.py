"""
SPT Interval repository with specialized operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.spt_interval import SPTInterval
from app.schemas.spt_interval import SPTIntervalCreate, SPTIntervalUpdate
from .base import BaseRepository


class SPTIntervalRepository(BaseRepository[SPTInterval, SPTIntervalCreate, SPTIntervalUpdate]):
    """SPT Interval repository with specialized queries."""
    
    def get_by_borehole(self, db: Session, borehole_id: int) -> List[SPTInterval]:
        """Get all SPT intervals for a borehole."""
        return (
            db.query(self.model)
            .filter(self.model.borehole_id == borehole_id)
            .order_by(self.model.depth_from)
            .all()
        )
    
    def get_by_project(self, db: Session, project_id: int) -> List[SPTInterval]:
        """Get all SPT intervals for a project."""
        return (
            db.query(self.model)
            .join(self.model.borehole)
            .filter(self.model.borehole.has(project_id=project_id))
            .order_by(self.model.depth_from)
            .all()
        )
    
    def get_with_calculations(self, db: Session, interval_id: int) -> Optional[SPTInterval]:
        """Get SPT interval with its calculated results."""
        return (
            db.query(self.model)
            .options(
                joinedload(self.model.calculated_result),
                joinedload(self.model.stratum),
                joinedload(self.model.borehole)
            )
            .filter(self.model.id == interval_id)
            .first()
        )
    
    def get_uncalculated(self, db: Session, project_id: int) -> List[SPTInterval]:
        """Get SPT intervals without calculated results for a project."""
        return (
            db.query(self.model)
            .join(self.model.borehole)
            .filter(
                self.model.borehole.has(project_id=project_id),
                ~self.model.calculated_result.has()
            )
            .all()
        )


# Create repository instance
spt_interval_repo = SPTIntervalRepository(SPTInterval)