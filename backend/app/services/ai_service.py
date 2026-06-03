from __future__ import annotations

import json
import os
import re
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from app.core.errors import api_error
from app.repositories.ai_repository import AiRepository
from app.repositories.openrouter_repository import OpenRouterRepository
from app.schemas.ai import (
    AiSettingsRead,
    AiSettingsUpdate,
    AiSuggestionRead,
    AiSuggestionResponse,
    GenerateTasksRequest,
    GenerateTasksResult,
    ImproveTaskRequest,
    ImproveTaskResult,
    SplitTaskRequest,
    SplitTaskResult,
)


ResultModel = TypeVar("ResultModel", bound=BaseModel)
PRIORITY_MAP = {
    "low": "Низкий",
    "medium": "Средний",
    "normal": "Средний",
    "high": "Высокий",
    "низкий": "Низкий",
    "средний": "Средний",
    "высокий": "Высокий",
}


def normalize_api_key(api_key: str | None) -> str | None:
    if api_key is None:
        return None
    api_key = api_key.strip()
    if not api_key:
        return None
    try:
        api_key.encode("ascii")
    except UnicodeEncodeError as error:
        raise api_error(400, "invalid_ai_api_key", "OpenRouter API key должен содержать только ASCII-символы") from error
    return api_key


class AiService:
    def __init__(self, ai_repository: AiRepository | None = None, openrouter: OpenRouterRepository | None = None) -> None:
        self.ai_repository = ai_repository
        self.openrouter = openrouter or OpenRouterRepository()
        settings = ai_repository.get_settings() if ai_repository is not None else None
        mock_mode_env = os.getenv("AI_MOCK_MODE")
        forced_mock = mock_mode_env.lower() == "true" if mock_mode_env is not None else False
        raw_api_key = settings.api_key if settings and settings.api_key else os.getenv("OPENROUTER_API_KEY")
        self.api_key = None if forced_mock else normalize_api_key(raw_api_key)
        self.model = settings.selected_model if settings and settings.selected_model else os.getenv("OPENROUTER_MODEL", "openrouter/auto")
        self.mock_mode = forced_mock if mock_mode_env is not None else not bool(self.api_key)

    def get_settings(self) -> AiSettingsRead:
        settings = self.ai_repository.get_settings() if self.ai_repository is not None else None
        return AiSettingsRead(
            selected_model=settings.selected_model if settings else None,
            is_configured=self.mock_mode or bool(settings and settings.is_configured),
            mock=self.mock_mode,
            masked_api_key=self._mask_key(settings.api_key if settings else None),
        )

    def validate_key(self, payload: AiSettingsUpdate) -> dict[str, bool]:
        if self.mock_mode:
            return {"valid": True}
        normalize_api_key(payload.api_key)
        return {"valid": True}

    def update_settings(self, payload: AiSettingsUpdate) -> AiSettingsRead:
        if self.ai_repository is None:
            raise api_error(500, "ai_repository_missing", "AI repository не настроен")
        self.ai_repository.save_settings(normalize_api_key(payload.api_key), payload.selected_model.strip())
        return self.get_settings()

    def generate_tasks(self, payload: GenerateTasksRequest) -> AiSuggestionResponse:
        if self.mock_mode:
            result = GenerateTasksResult(
                tasks=[
                    {
                        "title": f"Уточнить цель: {payload.goal[:80]}",
                        "description": "Сформулировать ожидаемый результат и критерии готовности.",
                        "priority": "Средний",
                        "tags": ["ai-mock"],
                    },
                    {
                        "title": "Разбить цель на первые действия",
                        "description": "Определить 2-3 ближайших шага для начала работы.",
                        "priority": "Средний",
                        "tags": ["ai-mock"],
                    },
                ]
            )
        else:
            result = self._request_openrouter(
                "Верни только валидный JSON без markdown. Схема: {\"tasks\":[{\"title\":string,\"description\":string|null,\"priority\":\"Низкий\"|\"Средний\"|\"Высокий\"|null,\"tags\":[]}]}",
                payload.goal,
                GenerateTasksResult,
            )

        return self._response("generate_tasks", payload.goal, result)

    def split_task(self, payload: SplitTaskRequest) -> AiSuggestionResponse:
        if self.mock_mode:
            result = SplitTaskResult(
                subtasks=[
                    {
                        "title": "Подготовить исходные данные",
                        "description": f"Собрать контекст для задачи: {payload.text[:120]}",
                        "priority": "Средний",
                        "tags": ["ai-mock"],
                    },
                    {
                        "title": "Выполнить основной шаг",
                        "description": "Сделать минимальный результат и проверить его.",
                        "priority": "Высокий",
                        "tags": ["ai-mock"],
                    },
                    {
                        "title": "Проверить и зафиксировать результат",
                        "description": "Проверить критерии готовности и записать итоги.",
                        "priority": "Средний",
                        "tags": ["ai-mock"],
                    },
                ]
            )
        else:
            result = self._request_openrouter(
                "Верни только валидный JSON без markdown. Схема: {\"subtasks\":[{\"title\":string,\"description\":string|null,\"priority\":\"Низкий\"|\"Средний\"|\"Высокий\"|null,\"tags\":[]}]}",
                payload.text,
                SplitTaskResult,
            )

        return self._response("split_task", payload.text, result)

    def improve_task(self, payload: ImproveTaskRequest) -> AiSuggestionResponse:
        user_text = f"Название: {payload.title}\nОписание: {payload.description or ''}"
        if self.mock_mode:
            result = ImproveTaskResult(
                title=payload.title.strip(),
                description=self._mock_improved_description(payload),
            )
        else:
            result = self._request_openrouter(
                "Ты помогаешь качественно описывать задачи для последующего выполнения. Не меняй название задачи. Верни только валидный JSON без markdown. Схема: {\"title\":string,\"description\":string}. Поле title должно быть ровно исходным названием. Поле description должно быть подробным, практичным описанием задачи на русском языке: цель, ожидаемый результат, ключевые шаги, ограничения и критерии готовности. Не добавляй выдуманные факты, даты, людей или технологии, если их нет во входных данных.",
                user_text,
                ImproveTaskResult,
            )
            result.title = payload.title.strip()

        return self._response("improve_task", user_text, result)

    def _mock_improved_description(self, payload: ImproveTaskRequest) -> str:
        base = payload.description.strip() if payload.description else "Исходное описание не задано."
        return (
            f"{base}\n\n"
            "Цель: выполнить задачу так, чтобы результат был понятен и пригоден для проверки.\n"
            "Что сделать: уточнить ожидаемый результат, выполнить основные шаги, проверить результат и зафиксировать важные выводы.\n"
            "Критерии готовности: задача выполнена, результат можно показать или использовать дальше, ошибки и ограничения явно отмечены."
        )

    def list_models(self) -> list[str]:
        if self.mock_mode:
            return ["openrouter/auto", "mock/tasker-local"]
        return self.openrouter.list_models(self.api_key)

    def list_suggestions(self) -> list[AiSuggestionRead]:
        if self.ai_repository is None:
            return []
        return self.ai_repository.list_suggestions()

    def get_pending_suggestion_payload(self, suggestion_id: int, expected_type: str) -> dict[str, Any]:
        if self.ai_repository is None:
            raise api_error(500, "ai_repository_missing", "AI repository не настроен")
        suggestion = self.ai_repository.get_suggestion(suggestion_id)
        if suggestion is None:
            raise api_error(404, "ai_suggestion_not_found", "AI-предложение не найдено")
        if suggestion.type != expected_type:
            raise api_error(400, "ai_suggestion_type_mismatch", "AI-предложение имеет неподходящий тип")
        if suggestion.status != "pending":
            raise api_error(400, "ai_suggestion_not_pending", "AI-предложение уже применено или отменено")
        payload = json.loads(suggestion.response_payload)
        if not isinstance(payload, dict):
            raise api_error(502, "invalid_ai_response", "AI-предложение имеет неожиданный формат")
        return payload

    def mark_suggestion(self, suggestion_id: int, status: str) -> AiSuggestionRead:
        if self.ai_repository is None:
            raise api_error(500, "ai_repository_missing", "AI repository не настроен")
        suggestion = self.ai_repository.get_suggestion(suggestion_id)
        if suggestion is None:
            raise api_error(404, "ai_suggestion_not_found", "AI-предложение не найдено")
        if suggestion.status != "pending":
            raise api_error(400, "ai_suggestion_not_pending", "AI-предложение уже применено или отменено")
        suggestion.status = status
        saved = self.ai_repository.save_suggestion(suggestion)
        return self.ai_repository._to_read_model(saved)

    def cancel_suggestion(self, suggestion_id: int) -> AiSuggestionRead:
        return self.mark_suggestion(suggestion_id, "cancelled")

    def _response(self, suggestion_type: str, request_text: str, result: BaseModel) -> AiSuggestionResponse:
        suggestion_id = None
        if self.ai_repository is not None:
            suggestion = self.ai_repository.add_suggestion(suggestion_type, request_text, result, self.model)
            suggestion_id = suggestion.id
        return AiSuggestionResponse(id=suggestion_id, type=suggestion_type, model=self.model, mock=self.mock_mode, result=result)

    def _request_openrouter(self, system_prompt: str, user_prompt: str, result_model: type[ResultModel]) -> ResultModel:
        if not self.api_key:
            raise api_error(503, "ai_not_configured", "AI API key не настроен")

        payload = self.openrouter.chat_completion(self.api_key, self.model, system_prompt, user_prompt)
        content = self._extract_content(payload)
        try:
            normalized_payload = self._normalize_ai_payload(content, result_model)
            return result_model.model_validate(normalized_payload)
        except (ValueError, ValidationError) as error:
            raise api_error(502, "invalid_ai_response", "AI вернул ответ неожиданного формата") from error

    def _extract_content(self, payload: dict[str, Any]) -> str:
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as error:
            raise api_error(502, "invalid_ai_response", "AI вернул ответ неожиданного формата") from error

        if not isinstance(content, str):
            raise api_error(502, "invalid_ai_response", "AI вернул ответ неожиданного формата")
        return content

    def _normalize_ai_payload(self, content: str, result_model: type[ResultModel]) -> dict[str, Any]:
        content = self._strip_json_markdown(content)
        payload = json.loads(content)
        if not isinstance(payload, dict):
            raise ValueError("AI payload must be object")

        if result_model is SplitTaskResult and "subtasks" not in payload and "tasks" in payload:
            payload["subtasks"] = payload["tasks"]
        if result_model is GenerateTasksResult and "tasks" not in payload and "subtasks" in payload:
            payload["tasks"] = payload["subtasks"]

        for key in ("tasks", "subtasks"):
            items = payload.get(key)
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict):
                        priority = item.get("priority")
                        if isinstance(priority, str):
                            item["priority"] = PRIORITY_MAP.get(priority.strip().lower(), priority)
                        item.setdefault("description", None)
                        item.setdefault("tags", [])

        return payload

    def _strip_json_markdown(self, content: str) -> str:
        content = content.strip()
        match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return content

    def _mask_key(self, api_key: str | None) -> str | None:
        if not api_key:
            return None
        if len(api_key) <= 8:
            return "****"
        return f"{api_key[:4]}...{api_key[-4:]}"
