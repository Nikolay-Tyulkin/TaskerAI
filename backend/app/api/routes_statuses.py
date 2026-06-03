from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.status import Status
from app.repositories.status_repository import StatusRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.status import StatusCreate, StatusRead, StatusUpdate
from app.services.status_service import StatusService


router = APIRouter(prefix="/api/statuses", tags=["statuses"])
DbSession = Annotated[Session, Depends(get_db)]


def get_status_service(db: DbSession) -> StatusService:
    return StatusService(StatusRepository(db), TaskRepository(db))


@router.get("", response_model=list[StatusRead])
def list_statuses(service: Annotated[StatusService, Depends(get_status_service)]) -> list[Status]:
    return service.list_statuses()


@router.post("", response_model=StatusRead, status_code=status.HTTP_201_CREATED)
def create_status(payload: StatusCreate, service: Annotated[StatusService, Depends(get_status_service)]) -> Status:
    return service.create_status(payload)


@router.patch("/{status_id}", response_model=StatusRead)
def update_status(status_id: int, payload: StatusUpdate, service: Annotated[StatusService, Depends(get_status_service)]) -> Status:
    return service.update_status(status_id, payload)


@router.delete("/{status_id}", status_code=204)
def delete_status(status_id: int, service: Annotated[StatusService, Depends(get_status_service)]) -> None:
    service.delete_status(status_id)
