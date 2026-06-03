from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.tag import Tag, TaskTag


class TagRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Tag]:
        return self.db.query(Tag).order_by(Tag.name.asc()).all()

    def get(self, tag_id: int) -> Tag | None:
        return self.db.get(Tag, tag_id)

    def get_by_name(self, name: str) -> Tag | None:
        return self.db.query(Tag).filter(Tag.name == name).first()

    def list_by_ids(self, tag_ids: list[int]) -> list[Tag]:
        if not tag_ids:
            return []
        return self.db.query(Tag).filter(Tag.id.in_(tag_ids)).all()

    def add(self, tag: Tag) -> Tag:
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def save(self, tag: Tag) -> Tag:
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def delete_task_links(self, tag_id: int) -> None:
        self.db.query(TaskTag).filter(TaskTag.tag_id == tag_id).delete()

    def delete(self, tag: Tag) -> None:
        self.db.delete(tag)
        self.db.commit()
