# API Foundation Design

## Context

The frontend prototype in `apps/web` currently serves course and lesson screens
from local static data. The first backend slice will add a standalone API app in
`apps/api` and shared backend packages without changing the web app yet.

The repository already documents the intended backend stack as Hono with
OpenAPI, Drizzle with SQLite, Pino logging, and a modular monolith structure.
This design implements only the read-oriented content foundation. Auth,
progress tracking, learner answers, AI feedback, storage uploads, admin flows,
and generated frontend clients stay out of scope for this slice.

## Goals

- Add `apps/api` as the backend composition root.
- Add backend packages with narrow responsibilities:
  - `packages/core` for content domain types, DTOs, repository ports, and
    read services.
  - `packages/db` for Drizzle SQLite schema, database client creation,
    repository implementations, migrations, and seed data.
  - `packages/logger` for the Pino logger factory and request logger helpers.
- Serve seeded course and lesson content from SQLite through Hono routes.
- Publish an OpenAPI 3.1 document for the first read endpoints.
- Keep API routes unversioned. The first public paths are root-level paths such
  as `/courses`, not paths under a version prefix.
- Preserve `apps/web` behavior. The frontend keeps using its existing local data
  until a later integration task.

## Non-Goals

- No authentication or session management.
- No learner-specific progress, completion, answer, or draft persistence.
- No real AI evaluation or OpenAI integration.
- No file upload, RustFS, or presigned URL endpoints.
- No admin content editor.
- No generated OpenAPI client or web app migration to remote data.
- No public API version prefix.

## Architecture

The backend follows a modular monolith shape. `apps/api` owns process startup
and dependency composition, while packages own reusable boundaries.

```txt
apps/
  api/
    src/
      main.ts              # Bun process entrypoint
      app.ts               # Hono app factory
      env.ts               # runtime config parsing
      routes/
        health.route.ts
        openapi.route.ts
        courses.route.ts
        lessons.route.ts

packages/
  core/
    src/
      content/
        content.ids.ts
        content.dto.ts
        content.errors.ts
        content.repository.ts
        content.service.ts
      index.ts

  db/
    src/
      client.ts
      schema/
        content.schema.ts
      repositories/
        drizzle-content.repository.ts
      seeds/
        content-seed.ts
        seed.ts
      index.ts

  logger/
    src/
      logger.ts
      request-logger.ts
      index.ts
```

Dependency direction is one way:

```txt
apps/api -> packages/core
apps/api -> packages/db
apps/api -> packages/logger
packages/db -> packages/core
packages/logger -> external libraries only
packages/core -> external validation libraries only
```

`packages/core` does not import from `packages/db`, Hono, or Pino. It defines
the domain contract and use cases that the API app composes with a repository
implementation.

## Runtime Composition

`apps/api` creates a logger, reads environment configuration, opens the SQLite
database, creates the Drizzle-backed content repository, creates the content
service, and registers routes.

The API app exposes a Hono `fetch` handler. The Bun entrypoint starts the server
with that handler and a configured port. The default local port is `4000`.

Required runtime config:

- `PORT`: optional, defaults to `4000`.
- `DATABASE_URL`: optional, defaults to a local SQLite file under `data/`.
- `LOG_LEVEL`: optional, defaults to `info`.
- `CORS_ORIGIN`: optional, defaults to local development origins.

## Data Model

The first schema stores authored content and lesson step payloads. It does not
store user state.

Tables:

- `course_categories`
  - `id`
  - `title`
  - `sort_order`
- `courses`
  - `id`
  - `category_id`
  - `title`
  - `description`
  - `thumbnail_path`
  - `sort_order`
- `course_chapters`
  - `id`
  - `course_id`
  - `label`
  - `title`
  - `sort_order`
- `course_lessons`
  - `id`
  - `chapter_id`
  - `lesson_id`
  - `title`
  - `description`
  - `sort_order`
- `lessons`
  - `id`
  - `course_id`
  - `title`
  - `category_id`
  - `unit_number`
  - `next_lesson_id`
- `lesson_steps`
  - `id`
  - `lesson_id`
  - `type`
  - `sort_order`
  - `points`
  - `required`
  - `content_json`

Lesson step content stays in `content_json` because the prototype has many
heterogeneous step shapes. `packages/core` validates and maps that JSON into a
discriminated `LessonStepDto` union before the value leaves the service layer.
This avoids a premature table-per-step design while still keeping the API
contract typed.

Seed data lives in `packages/db/src/seeds`. The seed inserts the same first
catalog that the prototype exposes: course categories, course details,
curriculum lessons, and playable lesson steps.

## API Contract

All routes are unversioned.

### `GET /health`

Returns process and database readiness.

```json
{
  "status": "ok",
  "database": "ok"
}
```

If the database cannot be reached, the route returns `503`.

### `GET /openapi.json`

Returns the OpenAPI 3.1 document generated from route schemas.

### `GET /courses`

Returns course categories and course summaries.

```json
{
  "categories": [
    {
      "id": "beginner",
      "title": "입문자를 위한 코스",
      "courses": [
        {
          "id": "sentence-structure",
          "title": "문장 구조의 기본",
          "description": "한국어 문장의 뼈대를 이해하고...",
          "lessonCount": 12,
          "thumbnail": "/course-thumbnails/sentence-structure.png"
        }
      ]
    }
  ]
}
```

### `GET /courses/:courseId`

Returns authored course detail and curriculum content. It does not return
learner progress.

```json
{
  "id": "sentence-structure",
  "title": "문장 구조의 기본",
  "description": "한국어 문장의 뼈대를 이해하고...",
  "thumbnail": "/course-thumbnails/sentence-structure.png",
  "lessonCount": 12,
  "firstLessonId": "sentence-structure-01",
  "chapters": [
    {
      "id": "sentence-structure-chapter-1",
      "label": "1단원",
      "title": "문장의 뼈대",
      "lessons": [
        {
          "id": "sentence-structure-01",
          "lessonId": "sentence-structure-01",
          "title": "주어와 서술어 찾기",
          "description": "문장의 중심 성분을 구분하고...",
          "order": 1
        }
      ]
    }
  ]
}
```

Unknown course IDs return `404` with:

```json
{
  "code": "course-not-found",
  "message": "코스를 찾을 수 없습니다.",
  "courseId": "not-real"
}
```

### `GET /lessons/:lessonId`

Returns playable lesson content.

```json
{
  "id": "sentence-structure-01",
  "title": "주어와 서술어 찾기",
  "categoryId": "beginner",
  "courseId": "sentence-structure",
  "unitNumber": 1,
  "nextLessonId": "sentence-structure-02",
  "steps": [
    {
      "id": "sentence-structure-01-step-1",
      "type": "INTRO",
      "order": 1,
      "points": 10,
      "required": true,
      "content": {
        "title": "주어와 서술어 찾기",
        "category": "문장 구조",
        "tagTone": "info",
        "bullets": [],
        "estimatedMinutes": 8,
        "totalSteps": 10,
        "xpAvailable": 100
      }
    }
  ]
}
```

Unknown lesson IDs return `404` with:

```json
{
  "code": "lesson-not-found",
  "message": "레슨을 찾을 수 없습니다.",
  "lessonId": "not-real"
}
```

## Error Handling

Routes return explicit error DTOs instead of a vague `success: false` shape.
The first error variants are:

- `course-not-found`
- `lesson-not-found`
- `database-unavailable`
- `invalid-content-seed`

The API maps domain errors to HTTP status codes at the route boundary.
Unexpected errors are logged with a request ID and returned as a minimal `500`
response without leaking internals.

## Logging

`packages/logger` creates a Pino logger with stable fields:

- `service`: `api`
- `environment`
- `requestId`
- `method`
- `path`
- `status`
- `durationMs`

Request logging is registered in `apps/api`. Domain and database packages can
accept a logger dependency only when they need it for diagnostics; they do not
create process-level loggers themselves.

## Testing Strategy

Implementation will follow TDD.

- `packages/core`
  - service returns category summaries from a repository port.
  - service returns course detail by ID.
  - service returns lesson by ID.
  - service returns explicit not-found variants.
  - service rejects invalid lesson step ordering and invalid step references.
- `packages/db`
  - migrations create the content tables.
  - seed inserts deterministic course and lesson rows.
  - repository maps relational rows to core DTOs.
  - repository returns no value for unknown IDs.
- `apps/api`
  - `GET /health` returns `200` when DB check passes.
  - `GET /courses` returns seeded category data.
  - `GET /courses/:courseId` returns `200` for known IDs and `404` for unknown
    IDs.
  - `GET /lessons/:lessonId` returns `200` for known IDs and `404` for unknown
    IDs.
  - `GET /openapi.json` includes the unversioned route paths.

Validation targets:

- `bun --filter @workspace/core test`
- `bun --filter @workspace/db test`
- `bun --filter @workspace/logger test`
- `bun --filter @workspace/api test`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/api lint`
- `bun run format:check`
- `git diff --check`
- `bun lefthook run pre-commit` when the implementation is ready to commit.

## Documentation Updates

At implementation start, add a start entry under `/docs` describing the backend
foundation task and scope. At implementation finish, update that same document
with the actual files, commands, and validation results.

`BACKEND.md` can summarize the stable architecture after the first
implementation pass, but the task log belongs under `/docs` per repository
instructions.

## Future Extensions

- Add Better Auth and session-aware routes.
- Add learner progress tables and overlay learner state onto course detail.
- Add answer, draft, and lesson completion persistence.
- Add real AI feedback through the OpenAI Responses API.
- Add RustFS upload flows for future content assets.
- Generate a typed web client from `/openapi.json`.
