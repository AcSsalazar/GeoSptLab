"""
Repository for Soil Stratum CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.stratum import SoilStratum
from app.schemas.stratum import StratumCreate, StratumUpdate


class StratumRepository:
    """Repository class for Soil Stratum CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, stratum_data: StratumCreate) -> SoilStratum:
        """Create a new soil stratum."""
        db_stratum = SoilStratum(**stratum_data.dict())
        self.db.add(db_stratum)
        self.db.commit()
        self.db.refresh(db_stratum)
        return db_stratum

    def get_by_id(self, stratum_id: int) -> Optional[SoilStratum]:
        """Get stratum by ID."""
        return self.db.query(SoilStratum).filter(SoilStratum.id == stratum_id).first()

    def get_by_project(self, project_id: int) -> List[SoilStratum]:
        """Get all strata for a project."""
        return (
            self.db.query(SoilStratum)
            .filter(SoilStratum.project_id == project_id)
            .order_by(SoilStratum.initial_depth)
            .all()
        )

    def get_by_code_and_project(self, project_id: int, stratum_code: int) -> Optional[SoilStratum]:
        """Get stratum by code within a project."""
        return (
            self.db.query(SoilStratum)
            .filter(
                and_(
                    SoilStratum.project_id == project_id,
                    SoilStratum.stratum_code == stratum_code
                )
            )
            .first()
        )

    def get_stratum_at_depth(self, project_id: int, depth: float) -> Optional[SoilStratum]:
        """Get the stratum that contains a specific depth."""
        return (
            self.db.query(SoilStratum)
            .filter(
                and_(
                    SoilStratum.project_id == project_id,
                    SoilStratum.initial_depth <= depth,
                    SoilStratum.final_depth > depth
                )
            )
            .first()
        )

    def update(self, stratum_id: int, stratum_data: StratumUpdate) -> Optional[SoilStratum]:
        """Update stratum."""
        db_stratum = self.get_by_id(stratum_id)
        if not db_stratum:
            return None

        update_data = stratum_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_stratum, field, value)

        self.db.commit()
        self.db.refresh(db_stratum)
        return db_stratum

    def delete(self, stratum_id: int) -> bool:
        """Delete stratum."""
        db_stratum = self.get_by_id(stratum_id)
        if not db_stratum:
            return False

        self.db.delete(db_stratum)
        self.db.commit()
        return True

    def validate_depth_coverage(self, project_id: int) -> bool:
        """Validate that strata cover all depths without gaps or overlaps."""
        strata = self.get_by_project(project_id)
        if not strata:
            return False

        # Sort by initial depth
        strata.sort(key=lambda x: x.initial_depth)

        # Check for gaps and overlaps
        for i in range(len(strata) - 1):
            current_final = strata[i].final_depth
            next_initial = strata[i + 1].initial_depth
            
            # Check for gap or overlap
            if abs(current_final - next_initial) > 0.001:  # Allow small floating point differences
                return False

        return True