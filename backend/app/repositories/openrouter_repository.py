from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from app.core.errors import api_error


class OpenRouterRepository:
    def list_models(self, api_key: str | None) -> list[str]:
        if not api_key:
            return ["openrouter/auto"]

        request = urllib.request.Request(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            method="GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (UnicodeEncodeError, ValueError, urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            return ["openrouter/auto"]

        models = [item.get("id") for item in payload.get("data", []) if isinstance(item, dict) and item.get("id")]
        return models or ["openrouter/auto"]

    def chat_completion(self, api_key: str, model: str, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        request = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "Tasker",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            raise api_error(error.code, "ai_provider_error", "OpenRouter вернул ошибку") from error
        except (UnicodeEncodeError, ValueError) as error:
            raise api_error(400, "invalid_ai_api_key", "OpenRouter API key имеет неверный формат") from error
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            raise api_error(503, "ai_provider_unavailable", "OpenRouter временно недоступен") from error
