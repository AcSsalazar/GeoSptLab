"""
Repository for Borehole Stratum CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.borehole_stratum import BoreholeStratum
from app.schemas.borehole_stratum import BoreholeStratumCreate, BoreholeStratumUpdate


class BoreholeStratumRepository:
    """Repository class for Borehole Stratum CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, stratum_data: BoreholeStratumCreate) -> BoreholeStratum:
        """Create a new borehole stratum."""
        db_stratum = BoreholeStratum(**stratum_data.dict())
        self.db.add(db_stratum)
        self.db.commit()
        self.db.refresh(db_stratum)
        return db_stratum

    def create_multiple(self, strata_data: List[BoreholeStratumCreate]) -> List[BoreholeStratum]:
        """Create multiple borehole strata."""
        db_strata = []
        for stratum_data in strata_data:
            db_stratum = BoreholeStratum(**stratum_data.dict())
            self.db.add(db_stratum)
            db_strata.append(db_stratum)
        
        self.db.commit()
        for stratum in db_strata:
            self.db.refresh(stratum)
        return db_strata

    def get_by_id(self, stratum_id: int) -> Optional[BoreholeStratum]:
        """Get borehole stratum by ID."""
        return (
            self.db.query(BoreholeStratum)
            .options(joinedload(BoreholeStratum.stratum_definition))
            .filter(BoreholeStratum.id == stratum_id)
            .first()
        )

    def get_by_borehole(self, borehole_id: int) -> List[BoreholeStratum]:
        """Get all strata for a specific borehole."""
        return (
            self.db.query(BoreholeStratum)
            .options(joinedload(BoreholeStratum.stratum_definition))
            .filter(BoreholeStratum.borehole_id == borehole_id)
            .order_by(BoreholeStratum.initial_depth)
            .all()
        )

    def get_by_borehole_and_code(self, borehole_id: int, stratum_code: int) -> Optional[BoreholeStratum]:
        """Get stratum by borehole and stratum code."""
        return (
            self.db.query(BoreholeStratum)
            .options(joinedload(BoreholeStratum.stratum_definition))
            .filter(
                and_(
                    BoreholeStratum.borehole_id == borehole_id,
                    BoreholeStratum.stratum_code == stratum_code
                )
            )
            .first()
        )

    def find_stratum_for_depth(self, borehole_id: int, depth: float) -> Optional[BoreholeStratum]:
        """Find which stratum contains a specific depth in a borehole."""
        return (
            self.db.query(BoreholeStratum)
            .options(joinedload(BoreholeStratum.stratum_definition))
            .filter(
                and_(
                    BoreholeStratum.borehole_id == borehole_id,
                    BoreholeStratum.initial_depth <= depth,
                    BoreholeStratum.final_depth >= depth
                )
            )
            .first()
        )

    def get_by_project(self, project_id: int) -> List[BoreholeStratum]:
        """Get all borehole strata for a project."""
        return (
            self.db.query(BoreholeStratum)
            .options(joinedload(BoreholeStratum.stratum_definition))
            .options(joinedload(BoreholeStratum.borehole))
            .join(BoreholeStratum.borehole)
            .filter(BoreholeStratum.borehole.has(project_id=project_id))
            .order_by(BoreholeStratum.borehole_id, BoreholeStratum.initial_depth)
            .all()
        )

    def update(self, stratum_id: int, stratum_update: BoreholeStratumUpdate) -> Optional[BoreholeStratum]:
        """Update a borehole stratum."""
        db_stratum = self.get_by_id(stratum_id)
        if not db_stratum:
            return None
        
        update_data = stratum_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_stratum, field, value)
        
        self.db.commit()
        self.db.refresh(db_stratum)
        return db_stratum

    def delete(self, stratum_id: int) -> bool:
        """Delete a borehole stratum."""
        db_stratum = self.get_by_id(stratum_id)
        if not db_stratum:
            return False
        
        self.db.delete(db_stratum)
        self.db.commit()
        return True