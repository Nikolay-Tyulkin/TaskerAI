from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.tag import Tag
from app.repositories.tag_repository import TagRepository
from app.schemas.tag import TagCreate, TagRead, TagUpdate
from app.services.tag_service import TagService


router = APIRouter(prefix="/api/tags", tags=["tags"])
DbSession = Annotated[Session, Depends(get_db)]


def get_tag_service(db: DbSession) -> TagService:
    return TagService(TagRepository(db))


@router.get("", response_model=list[TagRead])
def list_tags(service: Annotated[TagService, Depends(get_tag_service)]) -> list[Tag]:
    return service.list_tags()


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, service: Annotated[TagService, Depends(get_tag_service)]) -> Tag:
    return service.create_tag(payload)


@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(tag_id: int, payload: TagUpdate, service: Annotated[TagService, Depends(get_tag_service)]) -> Tag:
    return service.update_tag(tag_id, payload)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, service: Annotated[TagService, Depends(get_tag_service)]) -> None:
    service.delete_tag(tag_id)
