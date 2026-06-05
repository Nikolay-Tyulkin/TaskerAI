# TaskerAI

Учебный MVP TaskerAI: backend на FastAPI + SQLite и frontend на Vite, React, TypeScript и Ant Design.  
Приложение разработано как референс в рамках курса https://github.com/Nikolay-Tyulkin/ai_development_workshop_e2e

## Требования

- Python 3.12 или новее
- Node.js LTS и npm

## Настройка окружения

```powershell
Copy-Item .env.example .env
```

Заполните `.env` без реальных секретов в репозитории. Для локального Docker-запуска можно оставить значения из примера: frontend будет проксировать `/api` и `/health` во внутренний сервис `backend`, а SQLite будет храниться в named volume.

## Docker Compose

Сборка образов:

```powershell
docker compose build
```

Запуск:

```powershell
docker compose up
```

Остановка:

```powershell
docker compose down
```

После запуска:

- frontend: `http://localhost:5173`
- backend health: `http://localhost:8000/health`

Переменные в `.env`:

- `BACKEND_PORT` и `FRONTEND_PORT` управляют портами на хосте.
- `DATABASE_URL` по умолчанию указывает на `sqlite:////data/tasker.sqlite3` внутри контейнера backend.
- `VITE_API_BASE_URL` для Docker оставляйте пустым, чтобы frontend использовал nginx proxy до backend внутри сети Docker.
- `OPENROUTER_API_KEY` оставляйте пустым, если используете `AI_MOCK_MODE=true`.

## Запуск backend

```powershell
cd backend
if (-not (Test-Path .\.venv\Scripts\python.exe)) { py -3 -m venv .venv }
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend всегда запускается через `backend/.venv`, чтобы не зависеть от случайного системного `python` в `PATH`. Если `.venv` отсутствует, команда создает его и устанавливает зависимости из `backend/pyproject.toml`.

Для автоматической подготовки `.venv` и запуска backend в E2E используется:

```powershell
cd backend
.\scripts\run-e2e-backend.cmd
```

Проверка:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Запуск frontend

```powershell
cd frontend
npm install
npm run dev
```

Интерфейс будет доступен по адресу `http://localhost:5173`.

## Что реализовано

- CRUD задач, фильтры по статусу/приоритету/дедлайну/тегу/поиску, сортировка и счетчики по статусам.
- Канбан-доска как альтернативное представление тех же задач с переключением между списком и доской.
- Подзадачи одного уровня и удаление родительской задачи со стратегиями `cascade`/`unlink`.
- Справочники статусов и тегов, назначение тегов задачам.
- AI endpoint-ы для генерации задач, разбиения задачи и улучшения формулировки с apply/cancel статусами истории.
- AI-настройки и история AI-запросов на backend, страница `AI история` во frontend.

## Проверки

Backend:

```powershell
cd backend
.\scripts\run-tests.cmd
```

Backend-тесты покрывают API задач и AI mock-flow. Реальный AI API key для запуска тестов не требуется.

Frontend:

```powershell
cd frontend
npm test
npm run build
```

E2E:

```powershell
cd frontend
npm run test:e2e
```

Playwright автоматически поднимает backend через `backend\scripts\run-e2e-backend.cmd`, который использует `backend/.venv` и создает его при отсутствии.

## Лицензия

Проект распространяется под лицензией MIT. Подробности см. в файле `LICENSE`.
