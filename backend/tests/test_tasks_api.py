from uuid import uuid4

from fastapi.testclient import TestClient


def test_task_crud_api(api: TestClient) -> None:
    title = f"CRUD task {uuid4().hex}"

    created = api.post(
        "/api/tasks",
        json={
            "title": title,
            "description": "Initial description",
            "status": "К выполнению",
            "priority": "Средний",
            "deadline": "2026-06-15",
        },
    )
    assert created.status_code == 201
    task_id = created.json()["id"]
    assert created.json()["title"] == title

    fetched = api.get(f"/api/tasks/{task_id}")
    assert fetched.status_code == 200
    assert fetched.json()["description"] == "Initial description"

    listed = api.get(f"/api/tasks?search={title}")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [task_id]

    updated = api.patch(
        f"/api/tasks/{task_id}",
        json={"title": f"{title} updated", "status": "В работе", "priority": "Высокий"},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == f"{title} updated"
    assert updated.json()["status"] == "В работе"
    assert updated.json()["priority"] == "Высокий"

    deleted = api.delete(f"/api/tasks/{task_id}")
    assert deleted.status_code == 204

    missing_after_delete = api.get(f"/api/tasks/{task_id}")
    assert missing_after_delete.status_code == 404
    assert missing_after_delete.json()["code"] == "task_not_found"


def test_filters_tasks_by_status_priority_and_search(api: TestClient) -> None:
    suffix = uuid4().hex
    matching_title = f"Filter target {suffix}"
    other_title = f"Filter other {suffix}"

    matching = api.post(
        "/api/tasks",
        json={"title": matching_title, "description": "Find this unique needle", "status": "В работе", "priority": "Высокий"},
    )
    assert matching.status_code == 201
    matching_id = matching.json()["id"]
    other = api.post(
        "/api/tasks",
        json={"title": other_title, "description": "Same suffix", "status": "К выполнению", "priority": "Низкий"},
    )
    assert other.status_code == 201

    filtered = api.get(f"/api/tasks?status=В работе&priority=Высокий&search={suffix}")

    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [matching_id]


def test_unknown_task_returns_404(api: TestClient) -> None:
    response = api.get("/api/tasks/999999999")

    assert response.status_code == 404
    assert response.json()["code"] == "task_not_found"


def test_rejects_empty_task_title(api: TestClient) -> None:
    response = api.post("/api/tasks", json={"title": "   "})

    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"


def test_task_crud_and_subtasks(api: TestClient) -> None:
    task = api.post("/api/tasks", json={"title": "Parent"})
    assert task.status_code == 201
    task_id = task.json()["id"]

    subtask = api.post(f"/api/tasks/{task_id}/subtasks", json={"title": "Child"})
    assert subtask.status_code == 201
    assert subtask.json()["parent_task_id"] == task_id

    delete_without_strategy = api.delete(f"/api/tasks/{task_id}")
    assert delete_without_strategy.status_code == 400

    delete_with_unlink = api.delete(f"/api/tasks/{task_id}?delete_strategy=unlink")
    assert delete_with_unlink.status_code == 204


def test_rejects_second_level_subtask(api: TestClient) -> None:
    parent = api.post("/api/tasks", json={"title": "Parent depth"})
    assert parent.status_code == 201
    child = api.post(f"/api/tasks/{parent.json()['id']}/subtasks", json={"title": "Child depth"})
    assert child.status_code == 201

    second_level = api.post(f"/api/tasks/{child.json()['id']}/subtasks", json={"title": "Too deep"})

    assert second_level.status_code == 400
    assert second_level.json()["code"] == "subtask_depth_exceeded"


def test_task_tags_filters_sorting_and_status_counts(api: TestClient) -> None:
    tag = api.post("/api/tags", json={"name": "review-tag"})
    assert tag.status_code in (201, 400)
    tag_id = tag.json()["id"] if tag.status_code == 201 else api.get("/api/tags").json()[0]["id"]

    task = api.post(
        "/api/tasks",
        json={"title": "Tagged task", "deadline": "2026-06-10", "priority": "Высокий", "tag_ids": [tag_id]},
    )
    assert task.status_code == 201
    assert task.json()["tags"][0]["id"] == tag_id

    filtered = api.get(f"/api/tasks?tag={tag_id}&deadline_from=2026-06-01&deadline_to=2026-06-30&sort_by=deadline&sort_order=asc")
    assert filtered.status_code == 200
    assert any(item["title"] == "Tagged task" for item in filtered.json())

    counts = api.get("/api/tasks/status-counts")
    assert counts.status_code == 200
    assert counts.json()["К выполнению"] >= 1
