# Журнал изменений

В этом файле фиксируются значимые изменения TaskerAI.

Проект следует Semantic Versioning.

## [0.2.0] - 2026-06-05

### Добавлено

- Канбан-доска как альтернативное представление существующих задач `Task`.
- Переключение между списком задач и канбан-доской на экране задач.
- Распределение родительских задач по колонкам существующих статусов.
- Смена статуса задачи из карточки на канбан-доске без создания отдельной сущности `KanbanTask`.
- Прогресс подзадач на карточке родительской задачи в формате `выполнено/всего`.
- Модальное окно родительской задачи со списком подзадач при открытии карточки на доске.
- Артефакты фичи в `features/001-2026-06-05-kanban-board/`.
- Скрипты `backend/scripts/run-tests.cmd` и `backend/scripts/run-e2e-backend.cmd` для запуска backend-проверок через `backend/.venv`.
- E2E-покрытие канбан-доски для desktop и mobile viewport.

### Изменено

- Playwright поднимает backend через `backend/.venv`, а не через случайный системный `python` из `PATH`.
- Инструкции в `README.md` и `TESTING_PLAN.md` обновлены под автоматическое создание `backend/.venv` при необходимости.
- Frontend production build разделяет React и Ant Design chunks и не выводит прежнее предупреждение о большом основном JS chunk.
- Vitest setup обновлен для стабильной работы Ant Design компонентов в jsdom.

### Проверено

- Backend tests через `backend/scripts/run-tests.cmd`.
- Frontend unit/component tests через `npm test -- --run`.
- Frontend production build через `npm run build`.
- Playwright E2E через `npm run test:e2e`.
- Docker Compose config, build и runtime smoke.

## [0.1.0] - 2026-06-05

### Добавлено

- MVP backend на FastAPI с хранением данных в SQLite.
- Task CRUD API с валидацией, фильтрацией, сортировкой, счетчиками по статусам, подзадачами одного уровня и стратегиями удаления родительских задач.
- Справочники статусов и тегов с поддержкой назначения тегов задачам.
- AI endpoint-ы для генерации задач, разбиения задачи, улучшения формулировки, AI-настроек и истории AI-предложений.
- Mock AI mode для локальной разработки и автоматических тестов без реального OpenRouter API key.
- Frontend на Vite, React, TypeScript и Ant Design.
- UI задач с созданием, редактированием, удалением, фильтрами, счетчиками, подзадачами, справочниками, AI-действиями и историей AI.
- Backend pytest coverage для задач, статусов, тегов и AI-flow.
- Frontend Vitest component tests и Playwright E2E smoke/task-flow tests.
- Dockerfiles и Docker Compose конфигурация для backend, frontend и SQLite volume.
- Документация проекта: README, спецификация проекта, план реализации, план тестирования, agents, skills и tool notes.

### Известные ограничения

- E2E-покрытие остается сфокусированным на smoke и ключевых сценариях задач; дополнительные AI, dictionary, subtask и error-сценарии описаны как будущие проверки в `TESTING_PLAN.md`.
