"""
Repository for Stratum Definition CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.stratum import StratumDefinition
from app.schemas.stratum import StratumDefinitionCreate, StratumDefinitionUpdate


class StratumDefinitionRepository:
    """Repository class for Stratum Definition CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, stratum_data: StratumDefinitionCreate) -> StratumDefinition:
        """Create a new stratum definition."""
        db_stratum = StratumDefinition(**stratum_data.dict())
        self.db.add(db_stratum)
        self.db.commit()
        self.db.refresh(db_stratum)
        return db_stratum

    def get_by_id(self, stratum_id: int) -> Optional[StratumDefinition]:
        """Get stratum definition by ID."""
        return self.db.query(StratumDefinition).filter(StratumDefinition.id == stratum_id).first()

    def get_by_project(self, project_id: int) -> List[StratumDefinition]:
        """Get all stratum definitions for a project."""
        return (
            self.db.query(StratumDefinition)
            .filter(StratumDefinition.project_id == project_id)
            .order_by(StratumDefinition.stratum_code)
            .all()
        )

    def get_by_code_and_project(self, project_id: int, stratum_code: int) -> Optional[StratumDefinition]:
        """Get stratum definition by code within a project."""
        return (
            self.db.query(StratumDefinition)
            .filter(
                and_(
                    StratumDefinition.project_id == project_id,
                    StratumDefinition.stratum_code == stratum_code
                )
            )
            .first()
        )

    def update(self, stratum_id: int, stratum_data: StratumDefinitionUpdate) -> Optional[StratumDefinition]:
        """Update stratum definition."""
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
        """Delete stratum definition."""
        db_stratum = self.get_by_id(stratum_id)
        if not db_stratum:
            return False

        self.db.delete(db_stratum)
        self.db.commit()
        return True

    def create_multiple(self, strata_data: List[StratumDefinitionCreate]) -> List[StratumDefinition]:
        """Create multiple stratum definitions."""
        db_strata = []
        for stratum_data in strata_data:
            db_stratum = StratumDefinition(**stratum_data.dict())
            self.db.add(db_stratum)
            db_strata.append(db_stratum)
        
        self.db.commit()
        for stratum in db_strata:
            self.db.refresh(stratum)
        return db_strata