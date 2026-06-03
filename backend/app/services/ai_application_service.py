from __future__ import annotations

from app.core.errors import api_error
from app.models.tag import Tag
from app.models.task import Task
from app.repositories.tag_repository import TagRepository
from app.schemas.ai import ApplySuggestionRequest, AiSuggestionRead
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.ai_service import AiService
from app.services.task_service import TaskService


class AiApplicationService:
    def __init__(self, ai: AiService, tasks: TaskService, tags: TagRepository) -> None:
        self.ai = ai
        self.tasks = tasks
        self.tags = tags

    def apply_generated_tasks(self, payload: ApplySuggestionRequest) -> list[Task]:
        suggestion_payload = self.ai.get_pending_suggestion_payload(payload.suggestion_id, "generate_tasks")
        created = [self.tasks.create_task(self._task_create(item)) for item in self._selected_items(suggestion_payload, "tasks", payload.selected_indexes)]
        self.ai.mark_suggestion(payload.suggestion_id, "applied")
        return created

    def apply_subtasks(self, task_id: int, payload: ApplySuggestionRequest) -> list[Task]:
        suggestion_payload = self.ai.get_pending_suggestion_payload(payload.suggestion_id, "split_task")
        created = [self.tasks.create_subtask(task_id, self._task_create(item)) for item in self._selected_items(suggestion_payload, "subtasks", payload.selected_indexes)]
        self.ai.mark_suggestion(payload.suggestion_id, "applied")
        return created

    def apply_improvement(self, task_id: int, payload: ApplySuggestionRequest) -> Task:
        suggestion_payload = self.ai.get_pending_suggestion_payload(payload.suggestion_id, "improve_task")
        task = self.tasks.update_task(
            task_id,
            TaskUpdate(
                title=suggestion_payload.get("title"),
                description=suggestion_payload.get("description"),
            ),
        )
        self.ai.mark_suggestion(payload.suggestion_id, "applied")
        return task

    def cancel_suggestion(self, suggestion_id: int) -> AiSuggestionRead:
        return self.ai.cancel_suggestion(suggestion_id)

    def _selected_items(self, payload: dict, key: str, selected_indexes: list[int] | None) -> list[dict]:
        items = payload.get(key)
        if not isinstance(items, list):
            raise api_error(502, "invalid_ai_response", "AI-предложение имеет неожиданный формат")
        if selected_indexes is None:
            return [item for item in items if isinstance(item, dict)]
        selected: list[dict] = []
        for index in selected_indexes:
            if index < 0 or index >= len(items) or not isinstance(items[index], dict):
                raise api_error(400, "invalid_ai_selection", "Выбрано несуществующее AI-предложение")
            selected.append(items[index])
        return selected

    def _task_create(self, item: dict) -> TaskCreate:
        return TaskCreate(
            title=item.get("title"),
            description=item.get("description"),
            priority=item.get("priority"),
            status="К выполнению",
            tag_ids=self._tag_ids(item.get("tags")),
        )

    def _tag_ids(self, names: object) -> list[int]:
        if not isinstance(names, list):
            return []
        tag_ids: list[int] = []
        for raw_name in names:
            if not isinstance(raw_name, str):
                continue
            name = raw_name.strip()[:40]
            if not name:
                continue
            tag = self.tags.get_by_name(name)
            if tag is None:
                tag = self.tags.add(Tag(name=name))
            tag_ids.append(tag.id)
        return tag_ids
