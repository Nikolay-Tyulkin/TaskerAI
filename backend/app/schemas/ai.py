from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.task import Priority


AiSuggestionType = Literal["generate_tasks", "split_task", "improve_task"]


class SuggestedTask(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)
    priority: Priority | None = None
    tags: list[str] = Field(default_factory=list)


class GenerateTasksRequest(BaseModel):
    goal: str = Field(min_length=1, max_length=4000)


class GenerateTasksResult(BaseModel):
    tasks: list[SuggestedTask]


class SplitTaskRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SplitTaskResult(BaseModel):
    subtasks: list[SuggestedTask]


class ImproveTaskRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)


class ImproveTaskResult(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)


class AiSuggestionResponse(BaseModel):
    id: int | None = None
    type: AiSuggestionType
    status: Literal["pending"] = "pending"
    provider: Literal["openrouter"] = "openrouter"
    model: str
    mock: bool
    result: GenerateTasksResult | SplitTaskResult | ImproveTaskResult


class AiSettingsRead(BaseModel):
    provider: Literal["openrouter"] = "openrouter"
    selected_model: str | None = None
    is_configured: bool
    mock: bool
    masked_api_key: str | None = None


class AiSettingsUpdate(BaseModel):
    api_key: str = Field(min_length=1, max_length=4000)
    selected_model: str = Field(min_length=1, max_length=200)


class AiSuggestionRead(BaseModel):
    id: int
    type: AiSuggestionType
    request_text: str
    response_payload: dict[str, Any]
    model: str
    status: Literal["pending", "applied", "cancelled"]
    created_at: datetime


class ApplySuggestionRequest(BaseModel):
    suggestion_id: int
    selected_indexes: list[int] | None = None
