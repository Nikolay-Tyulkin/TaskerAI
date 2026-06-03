from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.ai import AiSettings, AiSuggestion
from app.schemas.ai import AiSuggestionRead


class AiRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_settings(self) -> AiSettings | None:
        return self.db.get(AiSettings, 1)

    def get_suggestion(self, suggestion_id: int) -> AiSuggestion | None:
        return self.db.get(AiSuggestion, suggestion_id)

    def save_settings(self, api_key: str | None, selected_model: str) -> AiSettings:
        settings = self.get_settings() or AiSettings(id=1)
        settings.api_key = api_key
        settings.selected_model = selected_model
        settings.is_configured = True
        self.db.merge(settings)
        self.db.commit()
        return settings

    def add_suggestion(self, suggestion_type: str, request_text: str, response_payload: BaseModel, model: str) -> AiSuggestion:
        suggestion = AiSuggestion(
            type=suggestion_type,
            request_text=request_text,
            response_payload=response_payload.model_dump_json(),
            model=model,
            status="pending",
        )
        self.db.add(suggestion)
        self.db.commit()
        self.db.refresh(suggestion)
        return suggestion

    def list_suggestions(self) -> list[AiSuggestionRead]:
        suggestions = self.db.query(AiSuggestion).order_by(AiSuggestion.created_at.desc()).all()
        return [self._to_read_model(item) for item in suggestions]

    def save_suggestion(self, suggestion: AiSuggestion) -> AiSuggestion:
        self.db.commit()
        self.db.refresh(suggestion)
        return suggestion

    def _to_read_model(self, suggestion: AiSuggestion) -> AiSuggestionRead:
        return AiSuggestionRead(
            id=suggestion.id,
            type=suggestion.type,
            request_text=suggestion.request_text,
            response_payload=json.loads(suggestion.response_payload),
            model=suggestion.model,
            status=suggestion.status,
            created_at=suggestion.created_at,
        )
