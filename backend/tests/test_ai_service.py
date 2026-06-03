from app.schemas.ai import SplitTaskResult
from app.services.ai_service import AiService


def test_normalizes_split_task_ai_response() -> None:
    content = """```json
    {"tasks":[{"title":"Step 1","priority":"high"}]}
    ```"""
    payload = AiService()._normalize_ai_payload(content, SplitTaskResult)
    result = SplitTaskResult.model_validate(payload)

    assert len(result.subtasks) == 1
    assert result.subtasks[0].title == "Step 1"
    assert result.subtasks[0].priority == "Высокий"
    assert result.subtasks[0].tags == []
