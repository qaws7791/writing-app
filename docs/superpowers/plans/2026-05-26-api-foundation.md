# API Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first backend foundation with an unversioned Hono API, Drizzle SQLite seed data, OpenAPI JSON, and separated `core`, `db`, and `logger` packages.

**Architecture:** `apps/api` is the composition root. `packages/core` owns content DTOs, branded IDs, repository ports, result variants, and read services. `packages/db` owns SQLite schema, migration SQL, seed data, and Drizzle repository implementations. `packages/logger` owns Pino configuration and request logging helpers.

**Tech Stack:** Bun 1.3.10, TypeScript 5.9, Hono, `hono-openapi`, Zod, Drizzle ORM with Bun SQLite, Pino, Vitest, Turbo.

---

## File Structure

- Create `docs/api-foundation.md` as the required task log under `/docs`.
- Modify `BACKEND.md` with stable backend architecture after implementation.
- Modify `vitest.workspace.ts` to include new package and API test configs.
- Create `packages/core` for pure content contracts and services.
- Create `packages/logger` for Pino logger creation and request logging.
- Create `packages/db` for Drizzle SQLite schema, migration, seed, and repository implementation.
- Create `apps/api` for the Hono app, route registration, OpenAPI endpoint, runtime env parsing, and Bun entrypoint.
- Keep `apps/web` unchanged in this implementation.

## External Documentation Notes

- Hono current docs show Bun apps can export a Hono app or `{ port, fetch: app.fetch }`, and tests can call `app.request("/path")` or `app.fetch(new Request(...))`.
- Drizzle current docs show Bun SQLite setup with `drizzle({ client: sqlite })` using `bun:sqlite`, and SQLite tables from `drizzle-orm/sqlite-core`.
- `hono-openapi` current docs show `describeRoute`, `resolver`, `validator`, and `openAPIRouteHandler(app, { documentation })`.

## Task 1: Workspace Scaffolding And Start Docs

**Files:**

- Create: `docs/api-foundation.md`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/eslint.config.js`
- Create: `packages/logger/package.json`
- Create: `packages/logger/tsconfig.json`
- Create: `packages/logger/vitest.config.ts`
- Create: `packages/logger/eslint.config.js`
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/vitest.config.ts`
- Create: `packages/db/eslint.config.js`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/eslint.config.mjs`
- Modify: `vitest.workspace.ts`

- [ ] **Step 1: Add the task start document**

Create `docs/api-foundation.md`:

```markdown
# API Foundation

## 2026-05-26 Start

- Building the first backend foundation in `apps/api`.
- The API app will use Hono and expose unversioned routes: `/health`, `/openapi.json`, `/courses`, `/courses/:courseId`, and `/lessons/:lessonId`.
- Backend responsibilities will be split into `packages/core`, `packages/db`, and `packages/logger`.
- Course and lesson reads will come from Drizzle SQLite seed data.
- `apps/web` remains unchanged for this task.
- Out of scope: auth, progress tracking, answer persistence, AI feedback, file uploads, admin flows, generated API client, and API route versioning.
- Validation target: package tests, API tests, typecheck, lint, formatting check, `git diff --check`, and Lefthook pre-commit when possible.
```

- [ ] **Step 2: Add package manifests and configs**

Create these package manifests.

`packages/core/package.json`:

```json
{
  "name": "@workspace/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./content": "./src/content/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.2.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "@workspace/config": "workspace:*",
    "eslint": "^9",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  }
}
```

`packages/logger/package.json`:

```json
{
  "name": "@workspace/logger",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "pino": "^10.2.0",
    "pino-pretty": "^13.1.2"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "@workspace/config": "workspace:*",
    "eslint": "^9",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  }
}
```

`packages/db/package.json`:

```json
{
  "name": "@workspace/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./seed": "./src/seeds/index.ts"
  },
  "scripts": {
    "db:seed": "bun src/seeds/seed.ts",
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/core": "workspace:*",
    "drizzle-orm": "^0.45.0",
    "zod": "^4.2.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "@workspace/config": "workspace:*",
    "drizzle-kit": "^0.31.0",
    "eslint": "^9",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  }
}
```

`apps/api/package.json`:

```json
{
  "name": "@workspace/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/main.ts",
    "start": "bun src/main.ts",
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/core": "workspace:*",
    "@workspace/db": "workspace:*",
    "@workspace/logger": "workspace:*",
    "hono": "^4.10.0",
    "hono-openapi": "^1.1.0",
    "zod": "^4.2.0",
    "zod-openapi": "^5.4.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "@workspace/config": "workspace:*",
    "eslint": "^9",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  }
}
```

Each package `tsconfig.json` uses:

```json
{
  "extends": "@workspace/config/typescript/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["bun"]
  },
  "include": ["src/**/*.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Each package `vitest.config.ts` uses:

```ts
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
```

`apps/api/eslint.config.mjs`, `packages/core/eslint.config.js`, `packages/db/eslint.config.js`, and `packages/logger/eslint.config.js` use:

```js
import { config } from "@workspace/config/eslint/base"

/** @type {import("eslint").Linter.Config} */
export default config
```

- [ ] **Step 3: Update Vitest workspace**

Replace `vitest.workspace.ts` with:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      "packages/ui/vitest.config.ts",
      "packages/core/vitest.config.ts",
      "packages/logger/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "apps/api/vitest.config.ts",
    ],
  },
})
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
bun install
```

Expected: lockfile updates and workspace packages resolve.

- [ ] **Step 5: Verify scaffolding**

Run:

```bash
bun --filter @workspace/core typecheck
bun --filter @workspace/logger typecheck
bun --filter @workspace/db typecheck
bun --filter @workspace/api typecheck
```

Expected: each command exits 0 after empty `src/index.ts` exports are created in later tasks. Before source files exist, TypeScript can report that no inputs were found; continue to Task 2 before treating typecheck as final.

- [ ] **Step 6: Commit scaffolding**

Run:

```bash
git add docs/api-foundation.md packages/core packages/logger packages/db apps/api vitest.workspace.ts bun.lock
git commit -m "백엔드 작업 공간 구성"
```

## Task 2: Core Content Contracts And Read Service

**Files:**

- Create: `packages/core/src/content/content.ids.ts`
- Create: `packages/core/src/content/content.dto.ts`
- Create: `packages/core/src/content/content.errors.ts`
- Create: `packages/core/src/content/content.repository.ts`
- Create: `packages/core/src/content/content.service.ts`
- Create: `packages/core/src/content/content.service.test.ts`
- Create: `packages/core/src/content/index.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing service test**

Create `packages/core/src/content/content.service.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createContentService } from "@/content/content.service"
import type { ContentRepository } from "@/content/content.repository"

const repository: ContentRepository = {
  async listCourseCategories() {
    return {
      categories: [
        {
          id: "beginner",
          title: "입문자를 위한 코스",
          courses: [
            {
              id: "sentence-structure",
              title: "문장 구조의 기본",
              description: "문장의 뼈대를 이해합니다.",
              lessonCount: 12,
              thumbnail: "/course-thumbnails/sentence-structure.png",
            },
          ],
        },
      ],
    }
  },
  async findCourseDetail(courseId) {
    if (courseId !== "sentence-structure") {
      return undefined
    }

    return {
      id: "sentence-structure",
      title: "문장 구조의 기본",
      description: "문장의 뼈대를 이해합니다.",
      thumbnail: "/course-thumbnails/sentence-structure.png",
      lessonCount: 1,
      firstLessonId: "sentence-structure-01",
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          label: "1단원",
          title: "문장의 뼈대",
          lessons: [
            {
              id: "sentence-structure-01",
              lessonId: "sentence-structure-01",
              title: "주어와 서술어 찾기",
              description: "중심 성분을 구분합니다.",
              order: 1,
            },
          ],
        },
      ],
    }
  },
  async findLesson(lessonId) {
    if (lessonId !== "sentence-structure-01") {
      return undefined
    }

    return {
      id: "sentence-structure-01",
      title: "주어와 서술어 찾기",
      categoryId: "beginner",
      courseId: "sentence-structure",
      unitNumber: 1,
      nextLessonId: "sentence-structure-02",
      steps: [
        {
          id: "sentence-structure-01-step-1",
          type: "INTRO",
          order: 1,
          points: 10,
          required: true,
          content: {
            title: "주어와 서술어 찾기",
            category: "문장 구조",
            tagTone: "info",
            bullets: ["문장의 중심 성분을 구분합니다."],
            estimatedMinutes: 8,
            totalSteps: 1,
            xpAvailable: 10,
          },
        },
      ],
    }
  },
}

describe("createContentService", () => {
  it("returns course categories from the repository", async () => {
    const service = createContentService({ repository })

    const result = await service.listCourseCategories()

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.value.categories[0]?.id).toBe("beginner")
      expect(result.value.categories[0]?.courses[0]?.id).toBe(
        "sentence-structure"
      )
    }
  })

  it("returns an explicit course-not-found result", async () => {
    const service = createContentService({ repository })

    const result = await service.getCourseDetail("not-real")

    expect(result).toEqual({
      status: "not-found",
      error: {
        code: "course-not-found",
        message: "코스를 찾을 수 없습니다.",
        courseId: "not-real",
      },
    })
  })

  it("returns an explicit lesson-not-found result", async () => {
    const service = createContentService({ repository })

    const result = await service.getLesson("not-real")

    expect(result).toEqual({
      status: "not-found",
      error: {
        code: "lesson-not-found",
        message: "레슨을 찾을 수 없습니다.",
        lessonId: "not-real",
      },
    })
  })

  it("rejects lesson steps with non-contiguous order", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson("sentence-structure-01")
          if (!result) {
            return undefined
          }

          return {
            ...result,
            steps: [{ ...result.steps[0], order: 2 }],
          }
        },
      },
    })

    const result = await service.getLesson("sentence-structure-01")

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "레슨 스텝 순서는 1부터 빈틈없이 이어져야 합니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
bun --filter @workspace/core test -- src/content/content.service.test.ts
```

Expected: FAIL because `@/content/content.service` and repository types do not exist.

- [ ] **Step 3: Implement branded IDs, DTOs, errors, repository port, and service**

Create `packages/core/src/content/content.ids.ts`:

```ts
export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}

export type CourseId = Brand<string, "course-id">
export type CourseCategoryId = Brand<string, "course-category-id">
export type CourseChapterId = Brand<string, "course-chapter-id">
export type LessonId = Brand<string, "lesson-id">
export type LessonStepId = Brand<string, "lesson-step-id">

export function courseId(value: string): CourseId {
  return value as CourseId
}

export function courseCategoryId(value: string): CourseCategoryId {
  return value as CourseCategoryId
}

export function courseChapterId(value: string): CourseChapterId {
  return value as CourseChapterId
}

export function lessonId(value: string): LessonId {
  return value as LessonId
}

export function lessonStepId(value: string): LessonStepId {
  return value as LessonStepId
}
```

Create `packages/core/src/content/content.errors.ts`:

```ts
export type CourseNotFoundErrorDto = {
  code: "course-not-found"
  message: "코스를 찾을 수 없습니다."
  courseId: string
}

export type LessonNotFoundErrorDto = {
  code: "lesson-not-found"
  message: "레슨을 찾을 수 없습니다."
  lessonId: string
}

export type DatabaseUnavailableErrorDto = {
  code: "database-unavailable"
  message: "데이터베이스를 사용할 수 없습니다."
}

export type InvalidContentSeedErrorDto = {
  code: "invalid-content-seed"
  message: string
  lessonId?: string
}

export type ContentErrorDto =
  | CourseNotFoundErrorDto
  | LessonNotFoundErrorDto
  | DatabaseUnavailableErrorDto
  | InvalidContentSeedErrorDto
```

Create `packages/core/src/content/content.dto.ts` with Zod schemas and inferred DTOs for:

```ts
import { z } from "zod"

export const lessonToneSchema = z.enum([
  "primary",
  "success",
  "info",
  "warning",
  "danger",
  "neutral",
])

export const courseSummaryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  thumbnail: z.string().min(1),
})

export const courseCategoryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  courses: z.array(courseSummaryDtoSchema),
})

export const courseCategoryListDtoSchema = z.object({
  categories: z.array(courseCategoryDtoSchema),
})

export const courseLessonDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
})

export const courseChapterDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(courseLessonDtoSchema),
})

export const courseDetailDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnail: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  firstLessonId: z.string().min(1).optional(),
  chapters: z.array(courseChapterDtoSchema),
})
```

The same file defines concrete lesson step content schemas for the current seed:

```ts
const introContentSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  tagTone: lessonToneSchema,
  bullets: z.array(z.string().min(1)),
  estimatedMinutes: z.number().int().positive(),
  totalSteps: z.number().int().positive(),
  xpAvailable: z.number().int().nonnegative(),
})

const summaryContentSchema = z.object({
  points: z.array(
    z.object({
      number: z.number().int().positive(),
      text: z.string().min(1),
      icon: z.string().min(1).optional(),
    })
  ),
  nextLesson: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1).optional(),
    })
    .optional(),
  shareableQuote: z.string().min(1).optional(),
})

const completeContentSchema = z.object({
  celebrationStyle: z.literal("confetti"),
  xpEarned: z.number().int().nonnegative(),
  showStreak: z.boolean(),
  lessonStats: z.object({
    correctRate: z.number().int().min(0).max(100).optional(),
    writingCount: z.number().int().nonnegative().optional(),
    aiFeedbackCount: z.number().int().nonnegative().optional(),
  }),
  nextAction: z.literal("next-lesson"),
})
```

Then export:

```ts
export const lessonStepDtoSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("INTRO"),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: introContentSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("SUMMARY"),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: summaryContentSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("COMPLETE"),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: completeContentSchema,
  }),
])

export const lessonDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  categoryId: z.string().min(1),
  courseId: z.string().min(1),
  unitNumber: z.number().int().positive(),
  nextLessonId: z.string().min(1).optional(),
  steps: z.array(lessonStepDtoSchema),
})

export type CourseSummaryDto = z.infer<typeof courseSummaryDtoSchema>
export type CourseCategoryDto = z.infer<typeof courseCategoryDtoSchema>
export type CourseCategoryListDto = z.infer<typeof courseCategoryListDtoSchema>
export type CourseLessonDto = z.infer<typeof courseLessonDtoSchema>
export type CourseChapterDto = z.infer<typeof courseChapterDtoSchema>
export type CourseDetailDto = z.infer<typeof courseDetailDtoSchema>
export type LessonStepDto = z.infer<typeof lessonStepDtoSchema>
export type LessonDto = z.infer<typeof lessonDtoSchema>
```

Create `packages/core/src/content/content.repository.ts`:

```ts
import type {
  CourseCategoryListDto,
  CourseDetailDto,
  LessonDto,
} from "@/content/content.dto"

export interface ContentRepository {
  listCourseCategories(): Promise<CourseCategoryListDto>
  findCourseDetail(courseId: string): Promise<CourseDetailDto | undefined>
  findLesson(lessonId: string): Promise<LessonDto | undefined>
}
```

Create `packages/core/src/content/content.service.ts`:

```ts
import {
  courseCategoryListDtoSchema,
  courseDetailDtoSchema,
  lessonDtoSchema,
  type CourseCategoryListDto,
  type CourseDetailDto,
  type LessonDto,
} from "@/content/content.dto"
import type {
  ContentErrorDto,
  CourseNotFoundErrorDto,
  LessonNotFoundErrorDto,
} from "@/content/content.errors"
import type { ContentRepository } from "@/content/content.repository"

type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

type NotFoundResult<
  TError extends CourseNotFoundErrorDto | LessonNotFoundErrorDto,
> = {
  status: "not-found"
  error: TError
}

type InvalidContentResult = {
  status: "invalid-content"
  error: Extract<ContentErrorDto, { code: "invalid-content-seed" }>
}

export type ContentServiceResult<TValue> =
  | OkResult<TValue>
  | NotFoundResult<CourseNotFoundErrorDto | LessonNotFoundErrorDto>
  | InvalidContentResult

export interface ContentService {
  listCourseCategories(): Promise<ContentServiceResult<CourseCategoryListDto>>
  getCourseDetail(
    courseId: string
  ): Promise<ContentServiceResult<CourseDetailDto>>
  getLesson(lessonId: string): Promise<ContentServiceResult<LessonDto>>
}

interface ContentServiceDependencies {
  repository: ContentRepository
}

export function createContentService({
  repository,
}: ContentServiceDependencies): ContentService {
  return {
    async listCourseCategories() {
      const categories = await repository.listCourseCategories()
      return {
        status: "ok",
        value: courseCategoryListDtoSchema.parse(categories),
      }
    },
    async getCourseDetail(courseId) {
      const course = await repository.findCourseDetail(courseId)
      if (!course) {
        return {
          status: "not-found",
          error: {
            code: "course-not-found",
            message: "코스를 찾을 수 없습니다.",
            courseId,
          },
        }
      }

      return { status: "ok", value: courseDetailDtoSchema.parse(course) }
    },
    async getLesson(lessonId) {
      const lesson = await repository.findLesson(lessonId)
      if (!lesson) {
        return {
          status: "not-found",
          error: {
            code: "lesson-not-found",
            message: "레슨을 찾을 수 없습니다.",
            lessonId,
          },
        }
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const invalidOrder = parsedLesson.steps.some(
        (step, index) => step.order !== index + 1
      )

      if (invalidOrder) {
        return {
          status: "invalid-content",
          error: {
            code: "invalid-content-seed",
            message: "레슨 스텝 순서는 1부터 빈틈없이 이어져야 합니다.",
            lessonId,
          },
        }
      }

      return { status: "ok", value: parsedLesson }
    },
  }
}
```

Create barrel exports:

```ts
export * from "@/content/content.dto"
export * from "@/content/content.errors"
export * from "@/content/content.ids"
export * from "@/content/content.repository"
export * from "@/content/content.service"
```

`packages/core/src/index.ts`:

```ts
export * from "@/content"
```

- [ ] **Step 4: Run the test to verify GREEN**

Run:

```bash
bun --filter @workspace/core test -- src/content/content.service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run package checks**

Run:

```bash
bun --filter @workspace/core typecheck
bun --filter @workspace/core lint
```

Expected: both exit 0.

- [ ] **Step 6: Commit core package**

Run:

```bash
git add packages/core
git commit -m "콘텐츠 코어 서비스 추가"
```

## Task 3: Logger Package

**Files:**

- Create: `packages/logger/src/logger.ts`
- Create: `packages/logger/src/logger.test.ts`
- Create: `packages/logger/src/request-logger.ts`
- Create: `packages/logger/src/index.ts`

- [ ] **Step 1: Write the failing logger tests**

Create `packages/logger/src/logger.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createLogger, createRequestLogFields } from "@/logger"

describe("createLogger", () => {
  it("creates a pino-compatible logger with the configured level", () => {
    const logger = createLogger({
      environment: "test",
      level: "debug",
      service: "api",
    })

    expect(logger.level).toBe("debug")
    expect(logger.bindings()).toMatchObject({
      environment: "test",
      service: "api",
    })
  })
})

describe("createRequestLogFields", () => {
  it("keeps stable request logging fields", () => {
    const fields = createRequestLogFields({
      durationMs: 12,
      method: "GET",
      path: "/courses",
      requestId: "req-1",
      status: 200,
    })

    expect(fields).toEqual({
      durationMs: 12,
      method: "GET",
      path: "/courses",
      requestId: "req-1",
      status: 200,
    })
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
bun --filter @workspace/logger test -- src/logger.test.ts
```

Expected: FAIL because `@/logger` does not exist.

- [ ] **Step 3: Implement the logger package**

Create `packages/logger/src/logger.ts`:

```ts
import pino, { type Logger } from "pino"

export type LoggerLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"

export interface CreateLoggerInput {
  environment: string
  level: LoggerLevel
  service: string
}

export function createLogger({
  environment,
  level,
  service,
}: CreateLoggerInput): Logger {
  return pino({
    base: {
      environment,
      service,
    },
    level,
    transport:
      environment === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: {
              colorize: true,
              singleLine: true,
            },
          },
  })
}
```

Create `packages/logger/src/request-logger.ts`:

```ts
export interface RequestLogFieldsInput {
  durationMs: number
  method: string
  path: string
  requestId: string
  status: number
}

export function createRequestLogFields(input: RequestLogFieldsInput) {
  return {
    durationMs: input.durationMs,
    method: input.method,
    path: input.path,
    requestId: input.requestId,
    status: input.status,
  }
}
```

Create `packages/logger/src/index.ts`:

```ts
export * from "@/logger"
export * from "@/request-logger"
```

- [ ] **Step 4: Run the test to verify GREEN**

Run:

```bash
bun --filter @workspace/logger test -- src/logger.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run package checks**

Run:

```bash
bun --filter @workspace/logger typecheck
bun --filter @workspace/logger lint
```

Expected: both exit 0.

- [ ] **Step 6: Commit logger package**

Run:

```bash
git add packages/logger
git commit -m "API 로거 패키지 추가"
```

## Task 4: Database Schema, Migration, And Seed

**Files:**

- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/schema/content.schema.ts`
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/migrations/0000-initial-content.sql`
- Create: `packages/db/src/migrations/run-content-migration.ts`
- Create: `packages/db/src/seeds/content-seed.ts`
- Create: `packages/db/src/seeds/seed-content.ts`
- Create: `packages/db/src/seeds/seed.ts`
- Create: `packages/db/src/seeds/index.ts`
- Create: `packages/db/src/seeds/seed-content.test.ts`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Write the failing seed test**

Create `packages/db/src/seeds/seed-content.test.ts`:

```ts
import { Database } from "bun:sqlite"
import { afterEach, describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { courses, lessonSteps, lessons } from "@/schema"
import { seedContent } from "@/seeds/seed-content"

const sqlite = new Database(":memory:")
const db = createDatabase(sqlite)

afterEach(() => {
  sqlite.exec("delete from lesson_steps")
  sqlite.exec("delete from lessons")
  sqlite.exec("delete from course_lessons")
  sqlite.exec("delete from course_chapters")
  sqlite.exec("delete from courses")
  sqlite.exec("delete from course_categories")
})

describe("seedContent", () => {
  it("inserts deterministic course and lesson rows", async () => {
    runContentMigration(sqlite)

    await seedContent(db)

    const courseRows = await db.select().from(courses)
    const lessonRows = await db.select().from(lessons)
    const stepRows = await db.select().from(lessonSteps)

    expect(courseRows.map((course) => course.id)).toContain(
      "sentence-structure"
    )
    expect(lessonRows.map((lesson) => lesson.id)).toContain(
      "sentence-structure-01"
    )
    expect(
      stepRows.filter((step) => step.lessonId === "sentence-structure-01")
    ).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
bun --filter @workspace/db test -- src/seeds/seed-content.test.ts
```

Expected: FAIL because the database client, schema, migration, and seed modules do not exist.

- [ ] **Step 3: Implement Drizzle client and schema**

Create `packages/db/src/client.ts`:

```ts
import type { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import * as schema from "@/schema"

export type WritingAppDatabase = ReturnType<typeof createDatabase>

export function createDatabase(sqlite: Database) {
  return drizzle({
    client: sqlite,
    schema,
  })
}
```

Create `packages/db/src/schema/content.schema.ts`:

```ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const courseCategories = sqliteTable("course_categories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => courseCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailPath: text("thumbnail_path").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const courseChapters = sqliteTable("course_chapters", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  label: text("label").notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const courseLessons = sqliteTable("course_lessons", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id")
    .notNull()
    .references(() => courseChapters.id),
  lessonId: text("lesson_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  categoryId: text("category_id").notNull(),
  unitNumber: integer("unit_number").notNull(),
  nextLessonId: text("next_lesson_id"),
})

export const lessonSteps = sqliteTable("lesson_steps", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  type: text("type", { enum: ["INTRO", "SUMMARY", "COMPLETE"] }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  points: integer("points").notNull(),
  required: integer("required", { mode: "boolean" }).notNull(),
  contentJson: text("content_json").notNull(),
})
```

Create `packages/db/src/schema/index.ts`:

```ts
export * from "@/schema/content.schema"
```

- [ ] **Step 4: Implement migration and seed**

Create `packages/db/src/migrations/0000-initial-content.sql` with `create table if not exists` statements for the six tables in the schema. Use the same column names as the Drizzle schema and add foreign keys that match the references.

Create `packages/db/src/migrations/run-content-migration.ts`:

```ts
import type { Database } from "bun:sqlite"

export function runContentMigration(sqlite: Database) {
  sqlite.exec(`
    create table if not exists course_categories (
      id text primary key,
      title text not null,
      sort_order integer not null
    );

    create table if not exists courses (
      id text primary key,
      category_id text not null references course_categories(id),
      title text not null,
      description text not null,
      thumbnail_path text not null,
      sort_order integer not null
    );

    create table if not exists course_chapters (
      id text primary key,
      course_id text not null references courses(id),
      label text not null,
      title text not null,
      sort_order integer not null
    );

    create table if not exists course_lessons (
      id text primary key,
      chapter_id text not null references course_chapters(id),
      lesson_id text not null,
      title text not null,
      description text not null,
      sort_order integer not null
    );

    create table if not exists lessons (
      id text primary key,
      course_id text not null references courses(id),
      title text not null,
      category_id text not null,
      unit_number integer not null,
      next_lesson_id text
    );

    create table if not exists lesson_steps (
      id text primary key,
      lesson_id text not null references lessons(id),
      type text not null,
      sort_order integer not null,
      points integer not null,
      required integer not null,
      content_json text not null
    );
  `)
}
```

Create `packages/db/src/seeds/content-seed.ts` with deterministic seed objects for this first API catalog:

```ts
export const contentSeed = {
  categories: [
    {
      id: "beginner",
      title: "입문자를 위한 코스",
      sortOrder: 1,
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description:
            "한국어 문장의 뼈대를 이해하고 주어, 서술어, 목적어의 관계를 파악해 올바른 문장을 작성하는 방법을 배웁니다.",
          thumbnail: "/course-thumbnails/sentence-structure.png",
          sortOrder: 1,
          chapters: [
            {
              id: "sentence-structure-chapter-1",
              label: "1단원",
              title: "문장의 뼈대",
              sortOrder: 1,
              lessons: [
                {
                  id: "sentence-structure-01",
                  title: "주어와 서술어 찾기",
                  description:
                    "문장의 중심 성분을 구분하고 기본 의미 관계를 확인합니다.",
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
} as const
```

The same file exports `createSeedLessonSteps(lesson)` that returns exactly three steps for each lesson:

```ts
export function createSeedLessonSteps(input: {
  categoryTitle: string
  courseId: string
  lessonId: string
  lessonTitle: string
  lessonDescription: string
  nextLessonTitle?: string
}) {
  return [
    {
      id: `${input.lessonId}-step-1`,
      lessonId: input.lessonId,
      type: "INTRO",
      sortOrder: 1,
      points: 10,
      required: true,
      content: {
        title: input.lessonTitle,
        category: input.categoryTitle,
        tagTone: "info",
        bullets: [
          `${input.lessonTitle}의 핵심 기준을 확인합니다.`,
          input.lessonDescription,
          "마지막에는 오늘의 기준을 한 문장으로 정리합니다.",
        ],
        estimatedMinutes: 8,
        totalSteps: 3,
        xpAvailable: 20,
      },
    },
    {
      id: `${input.lessonId}-step-2`,
      lessonId: input.lessonId,
      type: "SUMMARY",
      sortOrder: 2,
      points: 10,
      required: true,
      content: {
        points: [
          {
            number: 1,
            text: `${input.lessonTitle}에서는 문장의 기준을 먼저 세웁니다.`,
            icon: "1",
          },
          {
            number: 2,
            text: input.lessonDescription,
            icon: "2",
          },
        ],
        nextLesson: input.nextLessonTitle
          ? {
              title: input.nextLessonTitle,
            }
          : undefined,
        shareableQuote: `${input.lessonTitle}: 기준을 알고 고친 문장이 좋은 글을 만듭니다.`,
      },
    },
    {
      id: `${input.lessonId}-step-3`,
      lessonId: input.lessonId,
      type: "COMPLETE",
      sortOrder: 3,
      points: 0,
      required: true,
      content: {
        celebrationStyle: "confetti",
        xpEarned: 20,
        showStreak: true,
        lessonStats: {
          correctRate: 90,
          writingCount: 1,
          aiFeedbackCount: 0,
        },
        nextAction: "next-lesson",
      },
    },
  ] as const
}
```

Create `packages/db/src/seeds/seed-content.ts` to insert categories, courses, chapters, lessons, lesson rows, and generated lesson step rows. Use `onConflictDoNothing()` for deterministic repeated seeds.

- [ ] **Step 5: Run the seed test to verify GREEN**

Run:

```bash
bun --filter @workspace/db test -- src/seeds/seed-content.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run package checks**

Run:

```bash
bun --filter @workspace/db typecheck
bun --filter @workspace/db lint
```

Expected: both exit 0.

- [ ] **Step 7: Commit database schema and seed**

Run:

```bash
git add packages/db
git commit -m "콘텐츠 데이터베이스 시드 추가"
```

## Task 5: Drizzle Content Repository

**Files:**

- Create: `packages/db/src/repositories/drizzle-content.repository.ts`
- Create: `packages/db/src/repositories/drizzle-content.repository.test.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write the failing repository tests**

Create `packages/db/src/repositories/drizzle-content.repository.test.ts`:

```ts
import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleContentRepository } from "@/repositories/drizzle-content.repository"
import { seedContent } from "@/seeds/seed-content"

describe("createDrizzleContentRepository", () => {
  let sqlite: Database

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    await seedContent(createDatabase(sqlite))
  })

  it("lists course categories with course summaries", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.listCourseCategories()

    expect(result.categories[0]?.id).toBe("beginner")
    expect(result.categories[0]?.courses[0]).toMatchObject({
      id: "sentence-structure",
      lessonCount: 1,
    })
  })

  it("finds course detail by ID", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findCourseDetail("sentence-structure")

    expect(result?.firstLessonId).toBe("sentence-structure-01")
    expect(result?.chapters[0]?.lessons[0]?.order).toBe(1)
  })

  it("returns undefined for an unknown course", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findCourseDetail("not-real")

    expect(result).toBeUndefined()
  })

  it("finds playable lesson content by ID", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findLesson("sentence-structure-01")

    expect(result?.id).toBe("sentence-structure-01")
    expect(result?.steps.map((step) => step.type)).toEqual([
      "INTRO",
      "SUMMARY",
      "COMPLETE",
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
bun --filter @workspace/db test -- src/repositories/drizzle-content.repository.test.ts
```

Expected: FAIL because `createDrizzleContentRepository` does not exist.

- [ ] **Step 3: Implement repository mapping**

Create `packages/db/src/repositories/drizzle-content.repository.ts`:

```ts
import { asc, eq } from "drizzle-orm"

import type { ContentRepository, LessonStepDto } from "@workspace/core/content"

import type { WritingAppDatabase } from "@/client"
import {
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
  lessons,
  lessonSteps,
} from "@/schema"

export function createDrizzleContentRepository(
  db: WritingAppDatabase
): ContentRepository {
  return {
    async listCourseCategories() {
      const categoryRows = await db
        .select()
        .from(courseCategories)
        .orderBy(asc(courseCategories.sortOrder))
      const courseRows = await db
        .select()
        .from(courses)
        .orderBy(asc(courses.sortOrder))
      const lessonRows = await db.select().from(courseLessons)

      return {
        categories: categoryRows.map((category) => ({
          id: category.id,
          title: category.title,
          courses: courseRows
            .filter((course) => course.categoryId === category.id)
            .map((course) => ({
              id: course.id,
              title: course.title,
              description: course.description,
              lessonCount: lessonRows.filter((lesson) =>
                lesson.id.startsWith(`${course.id}-`)
              ).length,
              thumbnail: course.thumbnailPath,
            })),
        })),
      }
    },
    async findCourseDetail(courseId) {
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
      })

      if (!course) {
        return undefined
      }

      const chapterRows = await db
        .select()
        .from(courseChapters)
        .where(eq(courseChapters.courseId, courseId))
        .orderBy(asc(courseChapters.sortOrder))
      const lessonRows = await db
        .select()
        .from(courseLessons)
        .orderBy(asc(courseLessons.sortOrder))
      const courseLessonRows = lessonRows.filter((lesson) =>
        chapterRows.some((chapter) => chapter.id === lesson.chapterId)
      )

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnailPath,
        lessonCount: courseLessonRows.length,
        firstLessonId: courseLessonRows[0]?.lessonId,
        chapters: chapterRows.map((chapter) => ({
          id: chapter.id,
          label: chapter.label,
          title: chapter.title,
          lessons: courseLessonRows
            .filter((lesson) => lesson.chapterId === chapter.id)
            .map((lesson) => ({
              id: lesson.id,
              lessonId: lesson.lessonId,
              title: lesson.title,
              description: lesson.description,
              order: lesson.sortOrder,
            })),
        })),
      }
    },
    async findLesson(lessonId) {
      const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
      })

      if (!lesson) {
        return undefined
      }

      const steps = await db
        .select()
        .from(lessonSteps)
        .where(eq(lessonSteps.lessonId, lessonId))
        .orderBy(asc(lessonSteps.sortOrder))

      return {
        id: lesson.id,
        title: lesson.title,
        categoryId: lesson.categoryId,
        courseId: lesson.courseId,
        unitNumber: lesson.unitNumber,
        nextLessonId: lesson.nextLessonId ?? undefined,
        steps: steps.map((step) => ({
          id: step.id,
          type: step.type,
          order: step.sortOrder,
          points: step.points,
          required: step.required,
          content: JSON.parse(step.contentJson),
        })) as LessonStepDto[],
      }
    },
  }
}
```

- [ ] **Step 4: Run the repository test to verify GREEN**

Run:

```bash
bun --filter @workspace/db test -- src/repositories/drizzle-content.repository.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run db checks**

Run:

```bash
bun --filter @workspace/db test
bun --filter @workspace/db typecheck
bun --filter @workspace/db lint
```

Expected: all exit 0.

- [ ] **Step 6: Commit repository**

Run:

```bash
git add packages/db
git commit -m "콘텐츠 저장소 구현"
```

## Task 6: API App Routes And OpenAPI

**Files:**

- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/app.test.ts`
- Create: `apps/api/src/routes/health.route.ts`
- Create: `apps/api/src/routes/openapi.route.ts`
- Create: `apps/api/src/routes/courses.route.ts`
- Create: `apps/api/src/routes/lessons.route.ts`

- [ ] **Step 1: Write the failing API tests**

Create `apps/api/src/app.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createApiApp } from "@/app"
import type { ContentService } from "@workspace/core/content"

const contentService: ContentService = {
  async listCourseCategories() {
    return {
      status: "ok",
      value: {
        categories: [
          {
            id: "beginner",
            title: "입문자를 위한 코스",
            courses: [
              {
                id: "sentence-structure",
                title: "문장 구조의 기본",
                description: "문장의 뼈대를 이해합니다.",
                lessonCount: 1,
                thumbnail: "/course-thumbnails/sentence-structure.png",
              },
            ],
          },
        ],
      },
    }
  },
  async getCourseDetail(courseId) {
    if (courseId !== "sentence-structure") {
      return {
        status: "not-found",
        error: {
          code: "course-not-found",
          message: "코스를 찾을 수 없습니다.",
          courseId,
        },
      }
    }

    return {
      status: "ok",
      value: {
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        thumbnail: "/course-thumbnails/sentence-structure.png",
        lessonCount: 1,
        firstLessonId: "sentence-structure-01",
        chapters: [],
      },
    }
  },
  async getLesson(lessonId) {
    if (lessonId !== "sentence-structure-01") {
      return {
        status: "not-found",
        error: {
          code: "lesson-not-found",
          message: "레슨을 찾을 수 없습니다.",
          lessonId,
        },
      }
    }

    return {
      status: "ok",
      value: {
        id: "sentence-structure-01",
        title: "주어와 서술어 찾기",
        categoryId: "beginner",
        courseId: "sentence-structure",
        unitNumber: 1,
        steps: [],
      },
    }
  },
}

describe("createApiApp", () => {
  const app = createApiApp({
    checkDatabase: async () => true,
    contentService,
  })

  it("returns health status", async () => {
    const response = await app.request("/health")

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      database: "ok",
      status: "ok",
    })
  })

  it("returns unversioned course categories", async () => {
    const response = await app.request("/courses")

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      categories: [{ id: "beginner" }],
    })
  })

  it("returns course not found", async () => {
    const response = await app.request("/courses/not-real")

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      code: "course-not-found",
      message: "코스를 찾을 수 없습니다.",
      courseId: "not-real",
    })
  })

  it("returns lesson not found", async () => {
    const response = await app.request("/lessons/not-real")

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      code: "lesson-not-found",
      message: "레슨을 찾을 수 없습니다.",
      lessonId: "not-real",
    })
  })

  it("exposes OpenAPI paths without a version prefix", async () => {
    const response = await app.request("/openapi.json")
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining(["/health", "/courses", "/courses/{courseId}"])
    )
    expect(Object.keys(body.paths).some((path) => path.startsWith("/v"))).toBe(
      false
    )
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
bun --filter @workspace/api test -- src/app.test.ts
```

Expected: FAIL because `@/app` does not exist.

- [ ] **Step 3: Implement app factory and routes**

Create `apps/api/src/app.ts`:

```ts
import { cors } from "hono/cors"
import { Hono } from "hono"

import type { ContentService } from "@workspace/core/content"

import { registerCoursesRoutes } from "@/routes/courses.route"
import { registerHealthRoute } from "@/routes/health.route"
import { registerLessonsRoutes } from "@/routes/lessons.route"
import { registerOpenApiRoute } from "@/routes/openapi.route"

export interface ApiAppDependencies {
  checkDatabase(): Promise<boolean>
  contentService: ContentService
}

export function createApiApp(dependencies: ApiAppDependencies) {
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: ["http://localhost:3000", "http://localhost:3001"],
    })
  )

  registerHealthRoute(app, dependencies)
  registerCoursesRoutes(app, dependencies)
  registerLessonsRoutes(app, dependencies)
  registerOpenApiRoute(app)

  return app
}
```

Create route modules using `describeRoute`, `resolver`, and core Zod schemas. `courses.route.ts` maps `not-found` to `404`, `invalid-content` to `500`, and `ok` to `200`. `lessons.route.ts` uses the same result mapping. `health.route.ts` returns `503` when `checkDatabase()` resolves false. `openapi.route.ts` registers:

```ts
import type { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"

export function registerOpenApiRoute(app: Hono) {
  app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Writing App API",
          version: "0.0.1",
        },
        openapi: "3.1.0",
      },
    })
  )
}
```

- [ ] **Step 4: Run API tests to verify GREEN**

Run:

```bash
bun --filter @workspace/api test -- src/app.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run API package checks**

Run:

```bash
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
```

Expected: both exit 0.

- [ ] **Step 6: Commit API routes**

Run:

```bash
git add apps/api
git commit -m "콘텐츠 API 라우트 추가"
```

## Task 7: Runtime Composition Root

**Files:**

- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/env.test.ts`
- Create: `apps/api/src/main.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write the failing env tests**

Create `apps/api/src/env.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { parseApiEnv } from "@/env"

describe("parseApiEnv", () => {
  it("uses stable local defaults", () => {
    const env = parseApiEnv({})

    expect(env).toEqual({
      corsOrigins: ["http://localhost:3000", "http://localhost:3001"],
      databasePath: "data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4000,
    })
  })

  it("parses file database URLs", () => {
    const env = parseApiEnv({
      DATABASE_URL: "file:data/test-api.sqlite",
      PORT: "4100",
    })

    expect(env.databasePath).toBe("data/test-api.sqlite")
    expect(env.port).toBe(4100)
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
bun --filter @workspace/api test -- src/env.test.ts
```

Expected: FAIL because `@/env` does not exist.

- [ ] **Step 3: Implement env parsing and runtime composition**

Create `apps/api/src/env.ts`:

```ts
import { z } from "zod"

const rawApiEnvSchema = z.object({
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional(),
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional(),
})

export function parseApiEnv(rawEnv: Record<string, string | undefined>) {
  const env = rawApiEnvSchema.parse(rawEnv)

  return {
    corsOrigins: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : ["http://localhost:3000", "http://localhost:3001"],
    databasePath: parseDatabasePath(env.DATABASE_URL),
    environment: env.NODE_ENV ?? "development",
    logLevel: env.LOG_LEVEL ?? "info",
    port: env.PORT ? Number.parseInt(env.PORT, 10) : 4000,
  }
}

function parseDatabasePath(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return "data/api.sqlite"
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}
```

Create `apps/api/src/main.ts`:

```ts
import { Database } from "bun:sqlite"

import { createContentService } from "@workspace/core/content"
import {
  createDatabase,
  createDrizzleContentRepository,
  runContentMigration,
  seedContent,
} from "@workspace/db"
import { createLogger } from "@workspace/logger"

import { createApiApp } from "@/app"
import { parseApiEnv } from "@/env"

const env = parseApiEnv(process.env)
const logger = createLogger({
  environment: env.environment,
  level: env.logLevel,
  service: "api",
})
const sqlite = new Database(env.databasePath, { create: true })
runContentMigration(sqlite)
const db = createDatabase(sqlite)
await seedContent(db)

const contentService = createContentService({
  repository: createDrizzleContentRepository(db),
})

const app = createApiApp({
  async checkDatabase() {
    try {
      sqlite.query("select 1").get()
      return true
    } catch (error) {
      logger.error({ error }, "database health check failed")
      return false
    }
  },
  contentService,
})

Bun.serve({
  fetch: app.fetch,
  port: env.port,
})

logger.info({ port: env.port }, "api server started")
```

- [ ] **Step 4: Run env tests to verify GREEN**

Run:

```bash
bun --filter @workspace/api test -- src/env.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run API integration smoke with the app factory**

Run:

```bash
bun --filter @workspace/api test
```

Expected: all API tests pass.

- [ ] **Step 6: Commit runtime composition**

Run:

```bash
git add apps/api packages/db
git commit -m "API 실행 루트 구성"
```

## Task 8: Documentation And Final Verification

**Files:**

- Modify: `docs/api-foundation.md`
- Modify: `BACKEND.md`

- [ ] **Step 1: Update backend documentation**

Update `BACKEND.md` with:

````markdown
# Backend Guide

## Architecture

The backend follows a modular monolith pattern.

- `apps/api` is the composition root. It owns Hono app creation, route registration, runtime environment parsing, database opening, service construction, and process startup.
- `packages/core` owns domain DTOs, branded IDs, repository ports, result variants, and read services.
- `packages/db` owns Drizzle SQLite schema, migration SQL, seed data, database client creation, and repository implementations.
- `packages/logger` owns Pino logger construction and request log field helpers.

## API Routes

Routes are unversioned.

- `GET /health`
- `GET /openapi.json`
- `GET /courses`
- `GET /courses/:courseId`
- `GET /lessons/:lessonId`

## Local Runtime

The API defaults to port `4000` and `data/api.sqlite`.

```bash
bun --filter @workspace/api dev
```
````

## Data

The first content catalog is seeded into SQLite from `packages/db/src/seeds`.
This slice stores authored content only. User auth, progress, answers, AI feedback, uploads, and admin editing are not part of the first backend foundation.

````

- [ ] **Step 2: Add finish entry to task log**

Append to `docs/api-foundation.md`:

```markdown
## 2026-05-26 Finish

- Added `apps/api` as the backend composition root with Hono routes for health, OpenAPI, courses, course detail, and lessons.
- Added `packages/core` for content DTOs, branded IDs, repository ports, result variants, and read services.
- Added `packages/db` with Drizzle SQLite schema, migration SQL, deterministic seed data, and content repository mapping.
- Added `packages/logger` with Pino logger creation and stable request log field helpers.
- Kept API routes unversioned.
- Kept `apps/web` unchanged.
- Validation results are recorded in the implementation final response.
````

- [ ] **Step 3: Run full target verification**

Run:

```bash
bun --filter @workspace/core test
bun --filter @workspace/logger test
bun --filter @workspace/db test
bun --filter @workspace/api test
bun --filter @workspace/core typecheck
bun --filter @workspace/logger typecheck
bun --filter @workspace/db typecheck
bun --filter @workspace/api typecheck
bun --filter @workspace/core lint
bun --filter @workspace/logger lint
bun --filter @workspace/db lint
bun --filter @workspace/api lint
bun run format:check
git diff --check
bun lefthook run pre-commit
```

Expected: all commands exit 0. If a repository-wide lint failure appears from pre-existing unrelated files, record the exact failing path and run the narrower package-level checks above.

- [ ] **Step 4: Optional local API smoke**

Run:

```bash
$env:PORT="4100"; bun --filter @workspace/api start
```

In another terminal, run:

```bash
Invoke-RestMethod http://localhost:4100/health
Invoke-RestMethod http://localhost:4100/courses
Invoke-RestMethod http://localhost:4100/courses/sentence-structure
Invoke-RestMethod http://localhost:4100/lessons/sentence-structure-01
Invoke-RestMethod http://localhost:4100/openapi.json
```

Expected: health is `ok`, content endpoints return JSON, and `/openapi.json` contains `/courses` without a version prefix. Stop the Bun process after the smoke test.

- [ ] **Step 5: Commit docs and final adjustments**

Run:

```bash
git add BACKEND.md docs/api-foundation.md apps/api packages/core packages/db packages/logger vitest.workspace.ts bun.lock
git commit -m "백엔드 기반 구현 완료"
```

## Self-Review

- Spec coverage: the plan creates `apps/api`, `packages/core`, `packages/db`, and `packages/logger`; uses SQLite seed data; exposes `/health`, `/openapi.json`, `/courses`, `/courses/:courseId`, and `/lessons/:lessonId`; leaves `apps/web` unchanged; and excludes auth, progress, answers, AI, uploads, admin, generated client, and route versioning.
- Placeholder scan: this plan intentionally avoids incomplete markers and vague future work instructions.
- Type consistency: `ContentRepository`, `ContentService`, `CourseCategoryListDto`, `CourseDetailDto`, and `LessonDto` names are consistent across core, db, and api tasks.
