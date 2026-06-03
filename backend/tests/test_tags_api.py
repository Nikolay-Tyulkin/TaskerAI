from uuid import uuid4

from fastapi.testclient import TestClient


def test_lists_and_creates_tag(api: TestClient) -> None:
    assert api.get("/api/tags").status_code == 200

    response = api.post("/api/tags", json={"name": f"mvp-{uuid4().hex[:8]}"})


    assert response.status_code == 201
    assert response.json()["name"].startswith("mvp-")


def test_missing_tag_delete_returns_not_found(api: TestClient) -> None:
    response = api.delete("/api/tags/999999")

    assert response.status_code == 404
    assert response.json()["code"] == "tag_not_found"
