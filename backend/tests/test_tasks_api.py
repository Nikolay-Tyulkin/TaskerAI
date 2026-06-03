from fastapi.testclient import TestClient


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
