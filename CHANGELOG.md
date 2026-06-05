# Changelog

All notable changes to TaskerAI are documented in this file.

The project follows Semantic Versioning.

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

- `npm run test:e2e` depends on `python -m uvicorn` from `frontend/playwright.config.ts`; on this machine the default `python` points to an environment without `uvicorn`, so E2E requires a Python PATH/environment where backend dependencies are installed or prestarted servers.
- Docker CLI and Compose are installed, but Docker daemon was not running during release checks, so Docker build and Docker runtime smoke were not verified.
- Frontend production build emits a Vite warning because the main JavaScript chunk is larger than 500 kB after minification.
- Vitest logs Ant Design `Modal.destroyOnClose` deprecation warnings and a jsdom `window.getComputedStyle(elt, pseudoElt)` not-implemented warning, while tests still pass.
- E2E coverage is still limited to smoke and core task flows; several AI, dictionary, subtask, and error scenarios remain documented as future coverage in `TESTING_PLAN.md`.
