from __future__ import annotations

from datetime import date

from app.core.errors import api_error
from app.models.task import Task
from app.models.tag import Tag
from app.repositories.tag_repository import TagRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import Priority, TaskCreate, TaskUpdate


class TaskService:
    def __init__(self, tasks: TaskRepository, tags: TagRepository) -> None:
        self.tasks = tasks
        self.tags = tags

    def list_tasks(
        self,
        status: str | None = None,
        priority: Priority | None = None,
        search: str | None = None,
        parent_task_id: int | None = None,
        deadline_from: date | None = None,
        deadline_to: date | None = None,
        tag: int | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> list[Task]:
        return self.tasks.list(
            status=status,
            priority=priority,
            search=search,
            parent_task_id=parent_task_id,
            deadline_from=deadline_from,
            deadline_to=deadline_to,
            tag_id=tag,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def status_counts(self) -> dict[str, int]:
        return self.tasks.status_counts()

    def create_task(self, payload: TaskCreate) -> Task:
        if payload.parent_task_id is not None:
            self.get_task(payload.parent_task_id)
        data = payload.model_dump(exclude={"tag_ids"})
        task = Task(**data)
        task.tags = self._get_tags_or_404(payload.tag_ids)
        return self.tasks.add(task)

    def get_task(self, task_id: int) -> Task:
        task = self.tasks.get(task_id)
        if task is None:
            raise api_error(404, "task_not_found", "Задача не найдена")
        return task

    def list_subtasks(self, task_id: int) -> list[Task]:
        self.get_task(task_id)
        return self.tasks.list_by_parent(task_id)

    def create_subtask(self, task_id: int, payload: TaskCreate) -> Task:
        parent_task = self.get_task(task_id)
        if parent_task.parent_task_id is not None:
            raise api_error(400, "subtask_depth_exceeded", "Нельзя создать подзадачу у подзадачи")

        task = Task(**payload.model_dump(exclude={"parent_task_id", "tag_ids"}), parent_task_id=task_id)
        task.tags = self._get_tags_or_404(payload.tag_ids)
        return self.tasks.add(task)

    def update_task(self, task_id: int, payload: TaskUpdate) -> Task:
        task = self.get_task(task_id)
        data = payload.model_dump(exclude_unset=True)
        tag_ids = data.pop("tag_ids", None)
        for field, value in data.items():
            setattr(task, field, value)
        if tag_ids is not None:
            task.tags = self._get_tags_or_404(tag_ids)
        return self.tasks.save(task)

    def delete_task(self, task_id: int, delete_strategy: str | None = None) -> None:
        task = self.get_task(task_id)
        subtasks = self.tasks.list_by_parent(task_id)
        if subtasks and delete_strategy is None:
            raise api_error(400, "delete_strategy_required", "Для удаления задачи с подзадачами выберите cascade или unlink")
        if delete_strategy == "cascade":
            for subtask in subtasks:
                self.tasks.delete(subtask)
        elif delete_strategy == "unlink":
            for subtask in subtasks:
                self.tasks.set_parent(subtask, None)
        self.tasks.delete(task)
        self.tasks.commit()

    def _get_tags_or_404(self, tag_ids: list[int]) -> list[Tag]:
        tags = self.tags.list_by_ids(tag_ids)
        if len(tags) != len(set(tag_ids)):
            raise api_error(404, "tag_not_found", "Один или несколько тегов не найдены")
        return tags
