from datetime import date
from typing import Annotated
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.task import Task
from app.repositories.tag_repository import TagRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.ai_repository import AiRepository
from app.repositories.openrouter_repository import OpenRouterRepository
from app.schemas.ai import ApplySuggestionRequest
from app.schemas.task import Priority, TaskCreate, TaskRead, TaskUpdate
from app.services.ai_application_service import AiApplicationService
from app.services.ai_service import AiService
from app.services.task_service import TaskService


router = APIRouter(prefix="/api/tasks", tags=["tasks"])


DbSession = Annotated[Session, Depends(get_db)]


def get_task_service(db: DbSession) -> TaskService:
    return TaskService(TaskRepository(db), TagRepository(db))


def get_ai_application_service(db: DbSession) -> AiApplicationService:
    tags = TagRepository(db)
    return AiApplicationService(
        AiService(AiRepository(db), OpenRouterRepository()),
        TaskService(TaskRepository(db), tags),
        tags,
    )


@router.get("/status-counts", response_model=dict[str, int])
def status_counts(service: Annotated[TaskService, Depends(get_task_service)]) -> dict[str, int]:
    return service.status_counts()


@router.get("", response_model=list[TaskRead])
def list_tasks(
    service: Annotated[TaskService, Depends(get_task_service)],
    status: str | None = None,
    priority: Priority | None = None,
    search: str | None = None,
    parent_task_id: int | None = None,
    deadline_from: date | None = None,
    deadline_to: date | None = None,
    tag: int | None = None,
    sort_by: Literal["created_at", "deadline", "priority", "status"] = "created_at",
    sort_order: Literal["asc", "desc"] = "desc",
) -> list[Task]:
    return service.list_tasks(
        status=status,
        priority=priority,
        search=search,
        parent_task_id=parent_task_id,
        deadline_from=deadline_from,
        deadline_to=deadline_to,
        tag=tag,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, service: Annotated[TaskService, Depends(get_task_service)]) -> Task:
    return service.create_task(payload)


@router.get("/{task_id}", response_model=TaskRead)
def read_task(task_id: int, service: Annotated[TaskService, Depends(get_task_service)]) -> Task:
    return service.get_task(task_id)


@router.get("/{task_id}/subtasks", response_model=list[TaskRead])
def list_subtasks(task_id: int, service: Annotated[TaskService, Depends(get_task_service)]) -> list[Task]:
    return service.list_subtasks(task_id)


@router.post("/{task_id}/apply-ai-subtasks", response_model=list[TaskRead])
def apply_ai_subtasks(task_id: int, payload: ApplySuggestionRequest, service: Annotated[AiApplicationService, Depends(get_ai_application_service)]) -> list[Task]:
    return service.apply_subtasks(task_id, payload)


@router.patch("/{task_id}/apply-ai-improvement", response_model=TaskRead)
def apply_ai_improvement(task_id: int, payload: ApplySuggestionRequest, service: Annotated[AiApplicationService, Depends(get_ai_application_service)]) -> Task:
    return service.apply_improvement(task_id, payload)


@router.post("/{task_id}/subtasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_subtask(task_id: int, payload: TaskCreate, service: Annotated[TaskService, Depends(get_task_service)]) -> Task:
    return service.create_subtask(task_id, payload)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, service: Annotated[TaskService, Depends(get_task_service)]) -> Task:
    return service.update_task(task_id, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    service: Annotated[TaskService, Depends(get_task_service)],
    delete_strategy: str | None = Query(default=None, pattern="^(cascade|unlink)$"),
) -> Response:
    service.delete_task(task_id, delete_strategy)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
