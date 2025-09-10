from pydantic import BaseModel
from typing import List, Dict, Optional

class RecordBase(BaseModel):
    depth: float
    blows: float
    stratum: Optional[str] = None
    extras: Dict = {}

class RecordCreate(RecordBase):
    pass

class RecordOut(RecordBase):
    id: int
    class Config:
        orm_mode = True

class PerforationBase(BaseModel):
    index: int
    name: str

class PerforationCreate(PerforationBase):
    pass

class PerforationOut(PerforationBase):
    id: int
    records: List[RecordOut] = []
    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    num_perforaciones: int
    params: Dict = {}

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    perforations: List[PerforationOut] = []
    class Config:
        orm_mode = True
