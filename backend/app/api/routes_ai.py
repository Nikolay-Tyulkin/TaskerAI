from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.repositories.ai_repository import AiRepository
from app.repositories.openrouter_repository import OpenRouterRepository
from app.repositories.tag_repository import TagRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.ai import (
    ApplySuggestionRequest,
    AiSettingsRead,
    AiSettingsUpdate,
    AiSuggestionRead,
    AiSuggestionResponse,
    GenerateTasksRequest,
    ImproveTaskRequest,
    SplitTaskRequest,
)
from app.schemas.task import TaskRead
from app.services.ai_application_service import AiApplicationService
from app.services.ai_service import AiService
from app.services.task_service import TaskService


router = APIRouter(prefix="/api/ai", tags=["ai"])
DbSession = Annotated[Session, Depends(get_db)]


def get_ai_service(db: DbSession) -> AiService:
    return AiService(AiRepository(db), OpenRouterRepository())


def get_ai_application_service(db: DbSession) -> AiApplicationService:
    tags = TagRepository(db)
    return AiApplicationService(
        AiService(AiRepository(db), OpenRouterRepository()),
        TaskService(TaskRepository(db), tags),
        tags,
    )


@router.get("/settings", response_model=AiSettingsRead)
def get_settings(service: Annotated[AiService, Depends(get_ai_service)]) -> AiSettingsRead:
    return service.get_settings()


@router.post("/validate-key")
def validate_key(payload: AiSettingsUpdate, service: Annotated[AiService, Depends(get_ai_service)]) -> dict[str, bool]:
    return service.validate_key(payload)


@router.get("/models")
def list_models(service: Annotated[AiService, Depends(get_ai_service)]) -> dict[str, list[str]]:
    return {"models": service.list_models()}


@router.put("/settings", response_model=AiSettingsRead)
def update_settings(payload: AiSettingsUpdate, service: Annotated[AiService, Depends(get_ai_service)]) -> AiSettingsRead:
    return service.update_settings(payload)


@router.post("/generate-tasks", response_model=AiSuggestionResponse)
def generate_tasks(payload: GenerateTasksRequest, service: Annotated[AiService, Depends(get_ai_service)]) -> AiSuggestionResponse:
    return service.generate_tasks(payload)


@router.post("/split-task", response_model=AiSuggestionResponse)
def split_task(payload: SplitTaskRequest, service: Annotated[AiService, Depends(get_ai_service)]) -> AiSuggestionResponse:
    return service.split_task(payload)


@router.post("/improve-task", response_model=AiSuggestionResponse)
def improve_task(payload: ImproveTaskRequest, service: Annotated[AiService, Depends(get_ai_service)]) -> AiSuggestionResponse:
    return service.improve_task(payload)


@router.get("/suggestions", response_model=list[AiSuggestionRead])
def list_suggestions(service: Annotated[AiService, Depends(get_ai_service)]) -> list[AiSuggestionRead]:
    return service.list_suggestions()


@router.post("/apply-generated-tasks", response_model=list[TaskRead])
def apply_generated_tasks(payload: ApplySuggestionRequest, service: Annotated[AiApplicationService, Depends(get_ai_application_service)]) -> list:
    return service.apply_generated_tasks(payload)


@router.post("/suggestions/{suggestion_id}/cancel", response_model=AiSuggestionRead)
def cancel_suggestion(suggestion_id: int, service: Annotated[AiApplicationService, Depends(get_ai_application_service)]) -> AiSuggestionRead:
    return service.cancel_suggestion(suggestion_id)
