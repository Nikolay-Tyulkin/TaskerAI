import time

from fastapi.testclient import TestClient


def unique_cyrillic_name(prefix: str) -> str:
    suffix = "".join(chr(ord("а") + int(d)) for d in str(time.time_ns()))
    return f"{prefix} {suffix}"[:80]


def test_lists_and_creates_status(api: TestClient) -> None:
    assert api.get("/api/statuses").status_code == 200

    response = api.post("/api/statuses", json={"name": unique_cyrillic_name("Проверка")})

    assert response.status_code == 201
    assert response.json()["is_system"] is False


def test_rejects_system_status_delete(api: TestClient) -> None:
    statuses = api.get("/api/statuses")
    assert statuses.status_code == 200
    system_status = next(item for item in statuses.json() if item["is_system"])

    response = api.delete(f"/api/statuses/{system_status['id']}")

    assert response.status_code == 400
    assert response.json()["code"] == "system_status_readonly"


def test_renames_status_on_related_tasks(api: TestClient) -> None:
    old_name = unique_cyrillic_name("Старый")
    new_name = unique_cyrillic_name("Новый")
    status_item = api.post("/api/statuses", json={"name": old_name})
    assert status_item.status_code == 201
    task = api.post("/api/tasks", json={"title": "Status rename", "status": old_name})
    assert task.status_code == 201

    renamed = api.patch(f"/api/statuses/{status_item.json()['id']}", json={"name": new_name})

    assert renamed.status_code == 200
    updated_task = api.get(f"/api/tasks/{task.json()['id']}")
    assert updated_task.json()["status"] == new_name
