# API Foundation

## 2026-05-26 Start

- Building the first backend foundation in `apps/api`.
- The API app will use Hono and expose unversioned routes: `/health`, `/openapi.json`, `/courses`, `/courses/:courseId`, and `/lessons/:lessonId`.
- Backend responsibilities will be split into `packages/core`, `packages/db`, and `packages/logger`.
- Course and lesson reads will come from Drizzle SQLite seed data.
- `apps/web` remains unchanged for this task.
- Out of scope: auth, progress tracking, answer persistence, AI feedback, file uploads, admin flows, generated API client, and API route versioning.
- Validation target: package tests, API tests, typecheck, lint, formatting check, `git diff --check`, and Lefthook pre-commit when possible.
