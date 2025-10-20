"""
Repository for Calculated Result CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload

from app.models.calculated_result import CalculatedResult
from app.schemas.calculated_result import CalculatedResultCreate, CalculatedResultUpdate


class CalculatedResultRepository:
    """Repository class for Calculated Result CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, result_data: CalculatedResultCreate) -> CalculatedResult:
        """Create a new calculated result."""
        db_result = CalculatedResult(**result_data.dict())
        self.db.add(db_result)
        self.db.commit()
        self.db.refresh(db_result)
        return db_result

    def get_by_id(self, result_id: int) -> Optional[CalculatedResult]:
        """Get calculated result by ID."""
        return (
            self.db.query(CalculatedResult)
            .options(selectinload(CalculatedResult.spt_interval))
            .filter(CalculatedResult.id == result_id)
            .first()
        )

    def get_by_spt_interval(self, spt_interval_id: int) -> Optional[CalculatedResult]:
        """Get calculated result by SPT interval ID."""
        return (
            self.db.query(CalculatedResult)
            .filter(CalculatedResult.spt_interval_id == spt_interval_id)
            .first()
        )

    def get_by_project(self, project_id: int) -> List[CalculatedResult]:
        """Get all calculated results for a project with nested relationships."""
        from app.models.spt_interval import SPTInterval
        from app.models.borehole import Borehole
        from app.models.borehole_stratum import BoreholeStratum
        from app.models.stratum import StratumDefinition
        
        return (
            self.db.query(CalculatedResult)
            .join(CalculatedResult.spt_interval)
            .join(SPTInterval.borehole)
            .options(
                selectinload(CalculatedResult.spt_interval)
                .selectinload(SPTInterval.borehole_stratum)
                .selectinload(BoreholeStratum.stratum_definition)
            )
            .filter(Borehole.project_id == project_id)
            .order_by(CalculatedResult.spt_interval_id)
            .all()
        )

    def update(self, result_id: int, result_data: CalculatedResultUpdate) -> Optional[CalculatedResult]:
        """Update calculated result."""
        db_result = self.get_by_id(result_id)
        if not db_result:
            return None

        update_data = result_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_result, field, value)

        self.db.commit()
        self.db.refresh(db_result)
        return db_result

    def upsert(self, result_data: CalculatedResultCreate) -> CalculatedResult:
        """Create or update calculated result for an SPT interval."""
        existing_result = self.get_by_spt_interval(result_data.spt_interval_id)
        
        if existing_result:
            # Update existing result
            update_data = result_data.dict()
            for field, value in update_data.items():
                if field != "spt_interval_id":  # Don't update the foreign key
                    setattr(existing_result, field, value)
            
            self.db.commit()
            self.db.refresh(existing_result)
            return existing_result
        else:
            # Create new result
            return self.create(result_data)

    def delete(self, result_id: int) -> bool:
        """Delete calculated result."""
        db_result = self.get_by_id(result_id)
        if not db_result:
            return False

        self.db.delete(db_result)
        self.db.commit()
        return True

    def delete_by_spt_interval(self, spt_interval_id: int) -> bool:
        """Delete calculated result by SPT interval ID."""
        db_result = self.get_by_spt_interval(spt_interval_id)
        if not db_result:
            return False

        self.db.delete(db_result)
        self.db.commit()
        return True

    def bulk_delete_by_project(self, project_id: int) -> int:
        """Delete all calculated results for a project."""
        results = self.get_by_project(project_id)
        count = len(results)
        
        for result in results:
            self.db.delete(result)
        
        self.db.commit()
        return count