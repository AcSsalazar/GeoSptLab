"""
Repository for Borehole CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.borehole import Borehole
from app.schemas.borehole import BoreholeCreate, BoreholeUpdate


class BoreholeRepository:
    """Repository class for Borehole CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, borehole_data: BoreholeCreate) -> Borehole:
        """Create a new borehole."""
        db_borehole = Borehole(**borehole_data.dict())
        self.db.add(db_borehole)
        self.db.commit()
        self.db.refresh(db_borehole)
        return db_borehole

    def get_by_id(self, borehole_id: int) -> Optional[Borehole]:
        """Get borehole by ID."""
        return self.db.query(Borehole).filter(Borehole.id == borehole_id).first()

    def get_by_project(self, project_id: int) -> List[Borehole]:
        """Get all boreholes for a project."""
        return (
            self.db.query(Borehole)
            .filter(Borehole.project_id == project_id)
            .order_by(Borehole.borehole_name)
            .all()
        )

    def get_by_name_and_project(self, project_id: int, borehole_name: str) -> Optional[Borehole]:
        """Get borehole by name within a project."""
        return (
            self.db.query(Borehole)
            .filter(
                and_(
                    Borehole.project_id == project_id,
                    Borehole.borehole_name == borehole_name
                )
            )
            .first()
        )

    def update(self, borehole_id: int, borehole_data: BoreholeUpdate) -> Optional[Borehole]:
        """Update borehole."""
        db_borehole = self.get_by_id(borehole_id)
        if not db_borehole:
            return None

        update_data = borehole_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_borehole, field, value)

        self.db.commit()
        self.db.refresh(db_borehole)
        return db_borehole

    def delete(self, borehole_id: int) -> bool:
        """Delete borehole."""
        db_borehole = self.get_by_id(borehole_id)
        if not db_borehole:
            return False

        self.db.delete(db_borehole)
        self.db.commit()
        return True

    def exists_by_name(self, project_id: int, borehole_name: str, exclude_id: Optional[int] = None) -> bool:
        """Check if borehole name already exists in project."""
        query = (
            self.db.query(Borehole)
            .filter(
                and_(
                    Borehole.project_id == project_id,
                    Borehole.borehole_name == borehole_name
                )
            )
        )
        if exclude_id:
            query = query.filter(Borehole.id != exclude_id)
        return query.first() is not None