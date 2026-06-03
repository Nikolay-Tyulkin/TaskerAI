from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.api.routes_ai import router as ai_router
from app.api.routes_statuses import router as statuses_router
from app.api.routes_tags import router as tags_router
from app.api.routes_tasks import router as tasks_router
from app.core.errors import http_exception_handler, validation_exception_handler
from app.db.database import init_db
from app.models import ai as _ai
from app.models import status as _status
from app.models import tag as _tag
from app.models import task as _task


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Tasker API", lifespan=lifespan)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.include_router(ai_router)
app.include_router(statuses_router)
app.include_router(tags_router)
app.include_router(tasks_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
