from __future__ import annotations

from datetime import date

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.models.tag import TaskTag
from app.models.task import Task
from app.schemas.task import Priority


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        status: str | None = None,
        priority: Priority | None = None,
        search: str | None = None,
        parent_task_id: int | None = None,
        deadline_from: date | None = None,
        deadline_to: date | None = None,
        tag_id: int | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> list[Task]:
        query = select(Task).options(selectinload(Task.tags))

        if status:
            query = query.where(Task.status == status)
        if priority:
            query = query.where(Task.priority == priority)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(or_(Task.title.ilike(search_pattern), Task.description.ilike(search_pattern)))
        if parent_task_id is not None:
            query = query.where(Task.parent_task_id == parent_task_id)
        if deadline_from is not None:
            query = query.where(Task.deadline >= deadline_from)
        if deadline_to is not None:
            query = query.where(Task.deadline <= deadline_to)
        if tag_id is not None:
            query = query.join(TaskTag, TaskTag.task_id == Task.id).where(TaskTag.tag_id == tag_id)

        sort_columns = {
            "created_at": Task.created_at,
            "deadline": Task.deadline,
            "priority": Task.priority,
            "status": Task.status,
        }
        sort_column = sort_columns.get(sort_by, Task.created_at)
        direction = asc if sort_order == "asc" else desc
        query = query.order_by(direction(sort_column), Task.id.desc())

        return list(self.db.scalars(query).all())

    def get(self, task_id: int) -> Task | None:
        return self.db.get(Task, task_id)

    def list_by_parent(self, parent_task_id: int) -> list[Task]:
        query = select(Task).options(selectinload(Task.tags)).where(Task.parent_task_id == parent_task_id).order_by(Task.created_at.desc(), Task.id.desc())
        return list(self.db.scalars(query).all())

    def status_counts(self) -> dict[str, int]:
        rows = self.db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
        return {status: count for status, count in rows}

    def add(self, task: Task) -> Task:
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def save(self, task: Task) -> Task:
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        self.db.delete(task)

    def commit(self) -> None:
        self.db.commit()

    def set_parent(self, task: Task, parent_task_id: int | None) -> None:
        task.parent_task_id = parent_task_id

    def update_status_by_name(self, old_status: str, new_status: str) -> None:
        self.db.query(Task).filter(Task.status == old_status).update({"status": new_status})
