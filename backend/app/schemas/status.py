from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StatusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80, pattern=r"^[А-Яа-яЁё\s-]+$")


class StatusUpdate(StatusCreate):
    pass


class StatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_system: bool
    created_at: datetime
