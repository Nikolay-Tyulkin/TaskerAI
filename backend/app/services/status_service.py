from __future__ import annotations

from app.core.errors import api_error
from app.models.status import Status
from app.repositories.status_repository import StatusRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.status import StatusCreate, StatusUpdate


class StatusService:
    def __init__(self, statuses: StatusRepository, tasks: TaskRepository) -> None:
        self.statuses = statuses
        self.tasks = tasks

    def list_statuses(self) -> list[Status]:
        return self.statuses.list()

    def create_status(self, payload: StatusCreate) -> Status:
        name = payload.name.strip()
        if self.statuses.get_by_name(name):
            raise api_error(400, "status_exists", "Статус уже существует")
        return self.statuses.add(Status(name=name, is_system=False))

    def update_status(self, status_id: int, payload: StatusUpdate) -> Status:
        status_item = self._get_status(status_id)
        if status_item.is_system:
            raise api_error(400, "system_status_readonly", "Системный статус нельзя изменять")
        old_name = status_item.name
        status_item.name = payload.name.strip()
        self.tasks.update_status_by_name(old_name, status_item.name)
        return self.statuses.save(status_item)

    def delete_status(self, status_id: int) -> None:
        status_item = self._get_status(status_id)
        if status_item.is_system:
            raise api_error(400, "system_status_readonly", "Системный статус нельзя удалить")
        self.tasks.update_status_by_name(status_item.name, "Удален статус")
        self.statuses.delete(status_item)

    def _get_status(self, status_id: int) -> Status:
        status_item = self.statuses.get(status_id)
        if status_item is None:
            raise api_error(404, "status_not_found", "Статус не найден")
        return status_item
