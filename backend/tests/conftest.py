from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.db.database import init_db
from app.main import app


@pytest.fixture()
def api() -> Generator[TestClient, None, None]:
    init_db()
    with TestClient(app) as client:
        yield client
