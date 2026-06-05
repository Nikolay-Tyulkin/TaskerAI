# Testing Plan

План тестирования для текущего учебного MVP TaskerAI: FastAPI backend, SQLite, React/Vite frontend, Vitest/Testing Library и Playwright.

## Цели

- Быстро находить регрессии в CRUD задач, фильтрах, подзадачах, справочниках и AI mock-flow.
- Держать backend API предсказуемым: статус-коды, коды ошибок, формат ответов, бизнес-правила.
- Проверять основной пользовательский путь через браузер без избыточного E2E-покрытия.
- Не превращать учебный MVP в тяжелую production QA-инфраструктуру.

## 1. Быстрые Frontend-Тесты

Текущие быстрые frontend-тесты находятся в `frontend/src/pages/TasksPage.test.tsx` и запускаются через Vitest в jsdom.

Уже покрыто:

- Пустое состояние списка задач: отображается текст `Задач пока нет`.
- Создание задачи через UI с мокированным API: открытие формы, ввод названия, отправка.
- Ошибка загрузки backend: отображается сообщение ошибки пользователю.
- Отображение подзадачи: описание, приоритет, дедлайн, действие открытия и выбор стратегии удаления.
- Переход на страницу настроек: отображаются блоки статусов и тегов.
- Канбан-доска: переключение со списка, группировка задач по статусам, смена статуса той же Task, возврат в список.

Что поддерживать в этих тестах:

- Мокировать API-зависимости на уровне `src/api/*`, чтобы тесты оставались быстрыми и не требовали backend.
- Проверять пользовательски видимый результат, а не внутренние состояния React-компонентов.
- Не смешивать Vitest и Playwright: Vitest должен искать только unit/component tests в `frontend/src`.

Следующие быстрые frontend-тесты, которые полезно добавить:

- Валидация формы задачи: пустое название не отправляется.
- Применение и сброс фильтров.
- Отображение AI loading/error states в модальных окнах.
- Страница `AI история`: пустое состояние и список записей.

## 2. Backend API-Тесты Для Задач

Текущие tests находятся в `backend/tests/test_tasks_api.py`, `backend/tests/test_statuses_api.py`, `backend/tests/test_tags_api.py`.

Уже покрыто:

- Создание родительской задачи.
- Создание подзадачи первого уровня.
- Запрет удаления родительской задачи с подзадачами без стратегии удаления.
- Удаление родительской задачи со стратегией `unlink`.
- Запрет подзадач второго уровня с кодом ошибки `subtask_depth_exceeded`.
- Назначение тегов задаче.
- Фильтрация по тегу и диапазону дедлайна.
- Сортировка по дедлайну.
- Счетчики задач по статусам.
- Создание и список статусов.
- Запрет удаления системного статуса с кодом `system_status_readonly`.
- Переименование статуса с обновлением связанных задач.
- Создание и список тегов.
- Удаление несуществующего тега с кодом `tag_not_found`.

Что должно быть покрыто для задач в MVP:

- `POST /api/tasks`: успешное создание с минимальным payload и с полями `description`, `status`, `priority`, `deadline`, `tag_ids`.
- `POST /api/tasks`: валидация пустого `title`, неверного `deadline`, неверного `priority`, несуществующих `tag_ids`.
- `GET /api/tasks`: список задач, фильтры по `status`, `priority`, `search`, `tag`, `deadline_from`, `deadline_to`.
- `GET /api/tasks`: сортировка по `created_at`, `deadline`, `priority`, `status`, а также `asc`/`desc`.
- `GET /api/tasks/{id}`: успешное получение и `404` для отсутствующей задачи.
- `PATCH /api/tasks/{id}`: обновление названия, описания, статуса, приоритета, дедлайна, тегов.
- `PATCH /api/tasks/{id}`: `404` для отсутствующей задачи и валидация некорректных полей.
- `DELETE /api/tasks/{id}`: удаление обычной задачи без подзадач.
- `DELETE /api/tasks/{id}`: удаление родителя со стратегиями `cascade` и `unlink`.
- `POST /api/tasks/{id}/subtasks`: успешное создание подзадачи, `404` для отсутствующего родителя, запрет второго уровня.
- `GET /api/tasks/status-counts`: счетчики после создания, обновления статуса и удаления задач.
- API справочников: создание, переименование, удаление пользовательских статусов и тегов, защита системных статусов.

Приоритет на следующий шаг:

- Добавить тесты на `PATCH /api/tasks/{id}`.
- Добавить тест на `DELETE` со стратегией `cascade`.
- Добавить негативные проверки валидации payload задач.

## 3. Backend API-Тесты Для AI Endpoint-ов

Текущие tests находятся в `backend/tests/test_ai_api.py` и `backend/tests/test_ai_service.py`.

Уже покрыто:

- Mock-режим AI через `AI_MOCK_MODE=true`.
- `POST /api/ai/generate-tasks`: создание pending suggestion.
- `GET /api/ai/suggestions`: история AI-предложений.
- `PUT /api/ai/settings`: отклонение non-ASCII OpenRouter key с кодом `invalid_ai_api_key`.
- `POST /api/ai/apply-generated-tasks`: применение выбранных AI-задач.
- Запрет повторного применения suggestion с кодом `ai_suggestion_not_pending`.
- `POST /api/ai/split-task`: создание suggestion для разбиения задачи.
- `POST /api/ai/suggestions/{id}/cancel`: отмена pending suggestion.
- `POST /api/ai/improve-task`: mock-улучшение сохраняет исходный title и добавляет детали в description.
- Нормализация AI JSON-ответа в service layer.

Что должно быть покрыто для AI endpoint-ов в MVP:

- `GET /api/ai/settings`: возвращает текущие настройки без раскрытия полного API-ключа.
- `PUT /api/ai/settings`: сохраняет валидный ключ и модель, маскирует ключ в ответе.
- `GET /api/ai/models`: работает в mock-mode и не требует реального OpenRouter key.
- `POST /api/ai/generate-tasks`: валидирует пустую цель и слишком длинный ввод.
- `POST /api/ai/split-task`: валидирует пустой текст и слишком длинный ввод.
- `POST /api/ai/improve-task`: валидирует пустой title и слишком длинные поля.
- `POST /api/ai/apply-generated-tasks`: проверяет несуществующий `suggestion_id`, неверные индексы, непредназначенный тип suggestion.
- `POST /api/tasks/{id}/ai-subtasks`: применяет AI-подзадачи к существующей задаче и возвращает `404` для отсутствующей задачи.
- `POST /api/tasks/{id}/ai-improvement`: применяет AI-улучшение к существующей задаче и возвращает `404` для отсутствующей задачи.
- Ошибки AI provider/repository не ломают приложение и возвращают понятный API error.

Приоритет на следующий шаг:

- Расширить negative tests для AI input validation.
- Добавить tests для apply AI subtasks/improvement через task endpoints.
- Добавить проверку, что секреты не возвращаются в открытом виде.

## 4. E2E-Сценарии Playwright

Текущий smoke E2E-тест находится в `frontend/e2e/app-smoke.spec.ts`.

Уже покрыто:

- Открытие приложения в Chromium.
- Проверка title `TaskerAI`.
- Проверка видимости заголовка `Задачи`.

Минимальный E2E-набор для MVP:

- Smoke: приложение открывается, виден список задач или пустое состояние.
- CRUD задачи: создать задачу, увидеть ее в списке, отредактировать, сменить статус, удалить.
- Фильтры: создать несколько задач и проверить поиск, статус, приоритет, тег, дедлайн, сброс фильтров.
- Подзадачи: создать родительскую задачу и подзадачу, отметить подзадачу выполненной, проверить стратегию удаления родителя.
- Справочники: создать пользовательский тег и статус, назначить их задаче, переименовать, удалить.
- AI mock-flow: открыть AI-генерацию, получить предложения, применить выбранные задачи, проверить историю.
- AI task actions: разбить задачу на подзадачи, применить выбранные; улучшить формулировку задачи, применить результат.
- Error state: backend/API возвращает ошибку, frontend показывает понятное сообщение и кнопку повторной попытки там, где она есть.
- Kanban board: открыть доску, проверить колонки, сменить статус карточки, вернуться в список и увидеть обновленный статус; сценарий проверяется на desktop и mobile viewport.

Требования к будущим E2E:

- Использовать изолированную тестовую SQLite-базу или сброс данных перед каждым E2E-сценарием.
- Запускать backend и frontend как web servers в Playwright config или внешним test script.
- Не проверять каждый edge case через браузер: граничные случаи оставлять backend API-тестам и frontend unit-тестам.

## 5. Ручные Проверки

Пока не автоматизируем:

- Визуальная проверка адаптивности на desktop и mobile ширинах.
- Удобство Ant Design modal/dropdown/select interactions, особенно с русскими текстами.
- Ручной запуск реального OpenRouter key вне mock-mode, без фиксации ключа в репозитории.
- Проверка поведения при долгом ответе AI provider и временной сетевой ошибке.
- Проверка читаемости AI history и UX статусов `pending`, `applied`, `cancelled`.
- Проверка того, что `.env` не попадает в Git и секреты не логируются.
- Проверка производительности больших списков задач вручную, если появятся заметные задержки.

## 6. Команды Запуска Проверок

Backend API tests:

```powershell
cd backend
.\scripts\run-tests.cmd
```

Frontend unit/component tests:

```powershell
cd frontend
npm test
```

Frontend build:

```powershell
cd frontend
npm run build
```

Playwright E2E tests:

```powershell
cd frontend
npm run test:e2e
```

E2E webServer поднимает backend через `backend\scripts\run-e2e-backend.cmd`, поэтому backend-зависимости устанавливаются в `backend/.venv` автоматически при первом запуске.

Установка Playwright browsers после первого `npm install` или после обновления Playwright:

```powershell
cd frontend
npx playwright install
```

Smoke-запуск backend вручную:

```powershell
cd backend
.\scripts\run-e2e-backend.cmd
Invoke-RestMethod http://127.0.0.1:8000/health
```

Smoke-запуск frontend вручную:

```powershell
cd frontend
npm run dev
```

## 7. Что Не Нужно Тестировать В Учебном MVP

- Полную матрицу браузеров и устройств; достаточно Chromium E2E smoke/critical flows.
- Нагрузочное тестирование, стресс-тесты и long-running reliability tests.
- Pixel-perfect visual regression screenshots.
- Полную безопасность production-уровня: pentest, SAST/DAST, rate limiting, WAF-сценарии.
- Миграции сложных схем БД и backward compatibility старых production-версий.
- Реальные платные AI-запросы в автоматических тестах.
- Все варианты ошибок внешнего OpenRouter API; достаточно mock-mode и нескольких repository/service error scenarios.
- Все внутренние implementation details React-компонентов.
- Все комбинации фильтров через E2E; комбинации лучше проверять API-тестами, а через браузер оставить 1-2 критических сценария.

## Quality Gate Для MVP

Перед завершением задачи или этапа разработки запускать минимум:

- `.\scripts\run-tests.cmd` в `backend`, чтобы создать `.venv` при необходимости, установить зависимости и запустить pytest через venv.
- `npm test` в `frontend`.
- `npm run build` в `frontend`.
- `npm run test:e2e` в `frontend`, если изменения затрагивают пользовательский сценарий или frontend shell.

Если проверка не запущена, в итоговом отчете указать причину и риск.
