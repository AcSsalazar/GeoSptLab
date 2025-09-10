"""
Repository for SPT Interval CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_

from app.models.spt_interval import SPTInterval
from app.schemas.spt_interval import SPTIntervalCreate, SPTIntervalUpdate


class SPTIntervalRepository:
    """Repository class for SPT Interval CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, interval_data: SPTIntervalCreate) -> SPTInterval:
        """Create a new SPT interval."""
        # Calculate midpoint depth
        midpoint_depth = (interval_data.depth_from + interval_data.depth_to) / 2.0
        
        db_interval = SPTInterval(
            **interval_data.dict(),
            midpoint_depth=midpoint_depth
        )
        self.db.add(db_interval)
        self.db.commit()
        self.db.refresh(db_interval)
        return db_interval

    def get_by_id(self, interval_id: int) -> Optional[SPTInterval]:
        """Get SPT interval by ID."""
        return (
            self.db.query(SPTInterval)
            .options(
                selectinload(SPTInterval.borehole),
                selectinload(SPTInterval.stratum),
                selectinload(SPTInterval.calculated_result)
            )
            .filter(SPTInterval.id == interval_id)
            .first()
        )

    def get_by_borehole(self, borehole_id: int) -> List[SPTInterval]:
        """Get all SPT intervals for a borehole."""
        return (
            self.db.query(SPTInterval)
            .filter(SPTInterval.borehole_id == borehole_id)
            .order_by(SPTInterval.depth_from)
            .all()
        )

    def get_by_project(self, project_id: int) -> List[SPTInterval]:
        """Get all SPT intervals for a project."""
        return (
            self.db.query(SPTInterval)
            .join(SPTInterval.borehole)
            .filter(SPTInterval.borehole.has(project_id=project_id))
            .order_by(SPTInterval.borehole_id, SPTInterval.depth_from)
            .all()
        )

    def get_by_stratum(self, stratum_id: int) -> List[SPTInterval]:
        """Get all SPT intervals for a stratum."""
        return (
            self.db.query(SPTInterval)
            .filter(SPTInterval.stratum_id == stratum_id)
            .order_by(SPTInterval.depth_from)
            .all()
        )

    def get_with_calculations(self, project_id: int) -> List[SPTInterval]:
        """Get all SPT intervals with calculated results for a project."""
        return (
            self.db.query(SPTInterval)
            .options(
                selectinload(SPTInterval.borehole),
                selectinload(SPTInterval.stratum),
                selectinload(SPTInterval.calculated_result)
            )
            .join(SPTInterval.borehole)
            .filter(SPTInterval.borehole.has(project_id=project_id))
            .order_by(SPTInterval.borehole_id, SPTInterval.depth_from)
            .all()
        )

    def update(self, interval_id: int, interval_data: SPTIntervalUpdate) -> Optional[SPTInterval]:
        """Update SPT interval."""
        db_interval = self.get_by_id(interval_id)
        if not db_interval:
            return None

        update_data = interval_data.dict(exclude_unset=True)
        
        # Recalculate midpoint if depths are updated
        if "depth_from" in update_data or "depth_to" in update_data:
            depth_from = update_data.get("depth_from", db_interval.depth_from)
            depth_to = update_data.get("depth_to", db_interval.depth_to)
            update_data["midpoint_depth"] = (depth_from + depth_to) / 2.0

        for field, value in update_data.items():
            setattr(db_interval, field, value)

        self.db.commit()
        self.db.refresh(db_interval)
        return db_interval

    def delete(self, interval_id: int) -> bool:
        """Delete SPT interval."""
        db_interval = self.get_by_id(interval_id)
        if not db_interval:
            return False

        self.db.delete(db_interval)
        self.db.commit()
        return True

    def check_depth_overlap(
        self, 
        borehole_id: int, 
        depth_from: float, 
        depth_to: float, 
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if depth range overlaps with existing intervals in the same borehole."""
        query = (
            self.db.query(SPTInterval)
            .filter(
                and_(
                    SPTInterval.borehole_id == borehole_id,
                    # Check for overlap: (start1 < end2) and (end1 > start2)
                    SPTInterval.depth_from < depth_to,
                    SPTInterval.depth_to > depth_from
                )
            )
        )
        
        if exclude_id:
            query = query.filter(SPTInterval.id != exclude_id)
        
        return query.first() is not None