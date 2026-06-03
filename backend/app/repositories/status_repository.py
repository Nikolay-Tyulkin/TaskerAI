from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.status import Status


class StatusRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Status]:
        return self.db.query(Status).order_by(Status.is_system.desc(), Status.id.asc()).all()

    def get(self, status_id: int) -> Status | None:
        return self.db.get(Status, status_id)

    def get_by_name(self, name: str) -> Status | None:
        return self.db.query(Status).filter(Status.name == name).first()

    def add(self, status_item: Status) -> Status:
        self.db.add(status_item)
        self.db.commit()
        self.db.refresh(status_item)
        return status_item

    def save(self, status_item: Status) -> Status:
        self.db.commit()
        self.db.refresh(status_item)
        return status_item

    def delete(self, status_item: Status) -> None:
        self.db.delete(status_item)
        self.db.commit()
