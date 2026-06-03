from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.tag import TagRead


Priority = Literal["Низкий", "Средний", "Высокий"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)
    status: str = Field(default="К выполнению", min_length=1, max_length=80)
    priority: Priority | None = None
    deadline: date | None = None
    parent_task_id: int | None = None
    tag_ids: list[int] = Field(default_factory=list)

    @field_validator("title", "status")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Поле не должно быть пустым")
        return value


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)
    status: str | None = Field(default=None, min_length=1, max_length=80)
    priority: Priority | None = None
    deadline: date | None = None
    parent_task_id: int | None = None
    tag_ids: list[int] | None = None

    @field_validator("title", "status")
    @classmethod
    def validate_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Поле не должно быть пустым")
        return value


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: str
    priority: Priority | None
    deadline: date | None
    parent_task_id: int | None
    tags: list[TagRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
