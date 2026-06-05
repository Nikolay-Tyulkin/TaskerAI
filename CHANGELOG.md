# Changelog

All notable changes to TaskerAI are documented in this file.

The project follows Semantic Versioning.

## [Unreleased]

### Added

- Kanban board view for existing Task items with list/board switching and status updates from board cards.
- Backend venv helper scripts for tests and Playwright backend startup.
- E2E coverage for kanban board on desktop and mobile viewport.

### Changed

- Playwright now starts backend through `backend/.venv` instead of relying on the default system `python`.
- Frontend production build splits React and Ant Design chunks and no longer emits the previous large main chunk warning.

## [0.1.0] - 2026-06-05

### Added

- MVP backend on FastAPI with SQLite persistence.
- Task CRUD API with validation, filtering, sorting, status counters, one-level subtasks, and delete strategies for parent tasks.
- Status and tag dictionaries with task assignment support.
- AI endpoints for task generation, task splitting, task text improvement, AI settings, and AI suggestion history.
- Mock AI mode for local development and automated tests without a real OpenRouter API key.
- Frontend on Vite, React, TypeScript, and Ant Design.
- Task UI with create/edit/delete flows, filters, counters, subtasks, dictionaries, AI actions, and AI history.
- Backend pytest coverage for task, status, tag, and AI flows.
- Frontend Vitest component tests and Playwright E2E smoke/task-flow tests.
- Dockerfiles and Docker Compose configuration for backend, frontend, and SQLite volume.
- Project documentation: README, project spec, implementation plan, testing plan, agents, skills, and tool notes.

### Known Issues

- E2E coverage is still limited to smoke and core task flows; several AI, dictionary, subtask, and error scenarios remain documented as future coverage in `TESTING_PLAN.md`.
