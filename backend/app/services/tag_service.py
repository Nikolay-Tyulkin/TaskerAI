from __future__ import annotations

from app.core.errors import api_error
from app.models.tag import Tag
from app.repositories.tag_repository import TagRepository
from app.schemas.tag import TagCreate, TagUpdate


class TagService:
    def __init__(self, tags: TagRepository) -> None:
        self.tags = tags

    def list_tags(self) -> list[Tag]:
        return self.tags.list()

    def create_tag(self, payload: TagCreate) -> Tag:
        name = payload.name.strip()
        if self.tags.get_by_name(name):
            raise api_error(400, "tag_exists", "Тег уже существует")
        return self.tags.add(Tag(name=name))

    def update_tag(self, tag_id: int, payload: TagUpdate) -> Tag:
        tag = self._get_tag(tag_id)
        tag.name = payload.name.strip()
        return self.tags.save(tag)

    def delete_tag(self, tag_id: int) -> None:
        tag = self._get_tag(tag_id)
        self.tags.delete_task_links(tag_id)
        self.tags.delete(tag)

    def _get_tag(self, tag_id: int) -> Tag:
        tag = self.tags.get(tag_id)
        if tag is None:
            raise api_error(404, "tag_not_found", "Тег не найден")
        return tag
