"""
Calculated Result repository with specialized operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.calculated_result import CalculatedResult
from app.schemas.calculated_result import CalculatedResultCreate, CalculatedResultUpdate
from .base import BaseRepository


class CalculatedResultRepository(BaseRepository[CalculatedResult, CalculatedResultCreate, CalculatedResultUpdate]):
    """Calculated Result repository with specialized queries."""
    
    def get_by_interval(self, db: Session, spt_interval_id: int) -> Optional[CalculatedResult]:
        """Get calculated result for an SPT interval."""
        return (
            db.query(self.model)
            .filter(self.model.spt_interval_id == spt_interval_id)
            .first()
        )
    
    def get_by_project(self, db: Session, project_id: int) -> List[CalculatedResult]:
        """Get all calculated results for a project."""
        return (
            db.query(self.model)
            .join(self.model.spt_interval)
            .join(self.model.spt_interval.borehole)
            .filter(self.model.spt_interval.borehole.has(project_id=project_id))
            .all()
        )
    
    def get_with_interval_data(self, db: Session, result_id: int) -> Optional[CalculatedResult]:
        """Get calculated result with related SPT interval data."""
        return (
            db.query(self.model)
            .options(
                joinedload(self.model.spt_interval).joinedload(self.model.spt_interval.stratum),
                joinedload(self.model.spt_interval).joinedload(self.model.spt_interval.borehole)
            )
            .filter(self.model.id == result_id)
            .first()
        )
    
    def create_or_update(self, db: Session, spt_interval_id: int, 
                        calculations: dict) -> CalculatedResult:
        """Create new or update existing calculated result."""
        existing = self.get_by_interval(db, spt_interval_id)
        
        if existing:
            # Update existing result
            for field, value in calculations.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new result
            result_data = {"spt_interval_id": spt_interval_id, **calculations}
            db_result = self.model(**result_data)
            db.add(db_result)
            db.commit()
            db.refresh(db_result)
            return db_result


# Create repository instance
calculated_result_repo = CalculatedResultRepository(CalculatedResult)