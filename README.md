# Tasker

Учебный MVP менеджера задач: backend на FastAPI + SQLite и frontend на Vite, React, TypeScript и Ant Design.

## Требования

- Python 3.12 или новее
- Node.js LTS и npm

## Настройка окружения

```powershell
Copy-Item .env.example .env
```

## Запуск backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
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
- Подзадачи одного уровня и удаление родительской задачи со стратегиями `cascade`/`unlink`.
- Справочники статусов и тегов, назначение тегов задачам.
- AI endpoint-ы для генерации задач, разбиения задачи и улучшения формулировки с apply/cancel статусами истории.
- AI-настройки и история AI-запросов на backend, страница `AI история` во frontend.

## Проверки

Backend:

```powershell
cd backend
python -m pytest
```

Frontend:

```powershell
cd frontend
npm test
npm run build
```

## Следующий этап

Следующий этап по плану: усилить интеграцию тегов и пользовательских статусов во frontend и расширить покрытие тестами AI UI.
