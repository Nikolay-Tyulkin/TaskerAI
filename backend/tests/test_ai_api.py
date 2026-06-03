from fastapi.testclient import TestClient


def test_ai_mock_and_history(api: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("AI_MOCK_MODE", "true")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    settings = api.get("/api/ai/settings")
    assert settings.status_code == 200
    assert settings.json()["mock"] is True
    assert settings.json()["is_configured"] is True

    models = api.get("/api/ai/models")
    assert models.status_code == 200
    assert "mock/tasker-local" in models.json()["models"]

    response = api.post("/api/ai/generate-tasks", json={"goal": "Запустить MVP"})
    assert response.status_code == 200
    assert response.json()["status"] == "pending"
    assert response.json()["mock"] is True

    history = api.get("/api/ai/suggestions")
    assert history.status_code == 200
    assert len(history.json()) >= 1


def test_ai_mock_endpoints_validate_input_without_api_key(api: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("AI_MOCK_MODE", "true")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    generate = api.post("/api/ai/generate-tasks", json={"goal": ""})
    split = api.post("/api/ai/split-task", json={"text": ""})
    improve = api.post("/api/ai/improve-task", json={"title": "", "description": "test"})

    assert generate.status_code == 422
    assert generate.json()["code"] == "validation_error"
    assert split.status_code == 422
    assert split.json()["code"] == "validation_error"
    assert improve.status_code == 422
    assert improve.json()["code"] == "validation_error"


def test_rejects_non_ascii_openrouter_key(api: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("AI_MOCK_MODE", "false")
    response = api.put("/api/ai/settings", json={"api_key": "ключ", "selected_model": "openrouter/auto"})
    assert response.status_code == 400
    assert response.json()["code"] == "invalid_ai_api_key"


def test_applies_and_cancels_ai_suggestions(api: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("AI_MOCK_MODE", "true")
    generated = api.post("/api/ai/generate-tasks", json={"goal": "Запустить ревью"})
    assert generated.status_code == 200

    applied = api.post("/api/ai/apply-generated-tasks", json={"suggestion_id": generated.json()["id"], "selected_indexes": [0]})
    assert applied.status_code == 200
    assert len(applied.json()) == 1

    repeated = api.post("/api/ai/apply-generated-tasks", json={"suggestion_id": generated.json()["id"], "selected_indexes": [0]})
    assert repeated.status_code == 400
    assert repeated.json()["code"] == "ai_suggestion_not_pending"

    split = api.post("/api/ai/split-task", json={"text": "Большая задача"})
    assert split.status_code == 200
    cancelled = api.post(f"/api/ai/suggestions/{split.json()['id']}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"


def test_improve_task_keeps_title_and_details_description(api: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("AI_MOCK_MODE", "true")

    response = api.post("/api/ai/improve-task", json={"title": "Подготовить отчет", "description": "Собрать данные"})

    assert response.status_code == 200
    result = response.json()["result"]
    assert result["title"] == "Подготовить отчет"
    assert "Собрать данные" in result["description"]
    assert "Критерии готовности" in result["description"]
