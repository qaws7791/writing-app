# 플랫폼 백엔드 API 구현 계획

> **에이전트 작업자 필수 하위 스킬:** 이 계획을 구현할 때는 `superpowers:subagent-driven-development`를 권장하며, 대안으로 `superpowers:executing-plans`를 사용할 수 있다. 각 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** `docs/platform-product-feature-spec.md`와 승인된 설계에 따라 어드민을 제외한 학습자용 백엔드 API를 실제 구현한다.

**아키텍처:** 기존 `apps/api` Hono 조립 루트와 `packages/core`, `packages/db`, `packages/logger` 경계를 유지한다. 콘텐츠 조회는 공개 API로 유지하고, Better Auth 세션이 필요한 프로필, 진행, 답변, AI 피드백만 인증 라우트로 보호한다.

**기술 스택:** Bun, Hono, Hono OpenAPI, Better Auth, Drizzle SQLite, Zod, OpenAI Responses API, Vitest, Pino

---

## 파일 구조

### 생성할 파일

- `packages/core/src/learning/learning.ids.ts`: `UserId`, 진행 상태, 브랜드 ID 생성 함수
- `packages/core/src/learning/learning.dto.ts`: 진행, 답변, 프로필 DTO와 Zod schema
- `packages/core/src/learning/learning.errors.ts`: 학습 도메인 오류 DTO
- `packages/core/src/learning/learning.repository.ts`: 학습 상태 저장소 포트
- `packages/core/src/learning/learning.service.ts`: 학습 진행, 답변, 완료 유스케이스
- `packages/core/src/learning/learning.service.test.ts`: 학습 서비스 단위 테스트
- `packages/core/src/learning/index.ts`: learning public export
- `packages/core/src/ai-feedback/ai-feedback.dto.ts`: AI 피드백 요청/응답 DTO
- `packages/core/src/ai-feedback/ai-feedback.errors.ts`: AI 피드백 오류 DTO
- `packages/core/src/ai-feedback/ai-feedback.provider.ts`: OpenAI provider 포트
- `packages/core/src/ai-feedback/ai-feedback.repository.ts`: 피드백 시도 저장소 포트
- `packages/core/src/ai-feedback/ai-feedback.service.ts`: 재시도 제한과 피드백 생성 유스케이스
- `packages/core/src/ai-feedback/ai-feedback.service.test.ts`: AI 피드백 서비스 단위 테스트
- `packages/core/src/ai-feedback/index.ts`: ai-feedback public export
- `packages/db/src/schema/auth.schema.ts`: Better Auth Drizzle schema
- `packages/db/src/schema/learning.schema.ts`: `course_progress`, `lesson_progress`, `lesson_answers`, `feedback_attempts`
- `packages/db/src/migrations/0001-platform-backend.sql`: 인증과 학습 상태 테이블 SQL
- `packages/db/src/repositories/drizzle-learning.repository.ts`: 학습 상태 Drizzle 저장소
- `packages/db/src/repositories/drizzle-learning.repository.test.ts`: 학습 상태 저장소 테스트
- `packages/db/src/repositories/drizzle-feedback.repository.ts`: AI 피드백 시도 Drizzle 저장소
- `packages/db/src/repositories/drizzle-feedback.repository.test.ts`: 피드백 시도 저장소 테스트
- `apps/api/src/auth/auth.ts`: Better Auth 인스턴스 팩토리
- `apps/api/src/auth/session.ts`: Hono 세션 헬퍼와 인증 오류 헬퍼
- `apps/api/src/routes/auth.route.ts`: `/api/auth/*` 마운트
- `apps/api/src/routes/me.route.ts`: `GET /me`
- `apps/api/src/routes/profile.route.ts`: `GET /profile`
- `apps/api/src/routes/progress.route.ts`: `GET /progress`
- `apps/api/src/routes/learning.route.ts`: 코스/레슨 진행, 답변, 완료 라우트
- `apps/api/src/routes/ai-feedback.route.ts`: `POST /ai-feedback`
- `apps/api/src/openai/openai-feedback-provider.ts`: OpenAI Responses API adapter
- `apps/api/src/openai/openai-feedback-provider.test.ts`: provider schema mapping 테스트

### 수정할 파일

- `packages/core/src/content/content.dto.ts`: 코스 검색 결과 DTO 추가
- `packages/core/src/content/content.repository.ts`: `searchCourses(query)` 포트 추가
- `packages/core/src/content/content.service.ts`: 코스 검색 서비스 추가
- `packages/core/src/content/content.service.test.ts`: 검색 테스트 추가
- `packages/core/src/content/index.ts`: 새 export 확인
- `packages/core/src/index.ts`: `learning`, `ai-feedback` export 추가
- `packages/core/package.json`: export 경로 추가
- `packages/db/src/schema/index.ts`: auth, learning schema export 추가
- `packages/db/src/repositories/drizzle-content.repository.ts`: 검색 구현 추가
- `packages/db/src/repositories/drizzle-content.repository.test.ts`: 검색 테스트 추가
- `packages/db/src/migrations/run-content-migration.ts`: 0001 마이그레이션 실행 추가, 기존 함수명 호환 유지
- `packages/db/src/index.ts`: 새 저장소 export 추가
- `apps/api/package.json`: `better-auth`, `openai` 의존성 추가
- `apps/api/src/env.ts`: 필수 환경 변수 빠른 실패 검증 추가
- `apps/api/src/env.test.ts`: 필수 환경 변수 검증 테스트 갱신
- `apps/api/src/app.ts`: auth/session/learning/ai 의존성 주입과 라우트 등록
- `apps/api/src/app.test.ts`: 공개/인증 API 테스트 추가
- `apps/api/src/main.ts`: Better Auth, learning service, feedback service, OpenAI provider 조립
- `apps/api/src/routes/courses.route.ts`: `/courses/search` 추가
- `apps/api/src/routes/openapi.route.ts`: 인증 API 문서 포함 확인
- `BACKEND.md`: 새 API, 환경 변수, 테이블, 인증 경계 문서화
- `docs/platform-backend-api.md`: 구현 완료 기록 추가

---

## Task 1: 의존성과 환경 변수 빠른 실패

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/env.test.ts`

- [ ] **Step 1: 실패하는 환경 변수 테스트 작성**

`apps/api/src/env.test.ts`에 다음 테스트를 추가한다.

```ts
it("fails fast when required platform secrets are missing", () => {
  expect(() => parseApiEnv({})).toThrow()
})

it("parses required platform backend configuration", () => {
  const env = parseApiEnv({
    BETTER_AUTH_SECRET: "test-secret-with-enough-length",
    BETTER_AUTH_URL: "http://localhost:4000",
    DATABASE_URL: "file:data/test-api.sqlite",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
    OPENAI_API_KEY: "openai-api-key",
    OPENAI_MODEL: "gpt-5-mini",
  })

  expect(env).toMatchObject({
    betterAuthSecret: "test-secret-with-enough-length",
    betterAuthUrl: "http://localhost:4000",
    databasePath: "data/test-api.sqlite",
    googleClientId: "google-client-id",
    googleClientSecret: "google-client-secret",
    openAiApiKey: "openai-api-key",
    openAiModel: "gpt-5-mini",
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/api test -- env.test.ts`

Expected: `fails fast when required platform secrets are missing`는 기존 기본값 때문에 실패하거나, `parses required platform backend configuration`이 새 필드를 찾지 못해 실패한다.

- [ ] **Step 3: 의존성 추가**

`apps/api/package.json` dependencies에 다음 항목을 추가한다.

```json
{
  "better-auth": "^1.6.0",
  "openai": "^7.0.0"
}
```

설치 명령:

```bash
bun install
```

네트워크나 registry 접근 실패가 나면 같은 명령을 승인 요청과 함께 다시 실행한다.

- [ ] **Step 4: 환경 변수 파서 구현**

`apps/api/src/env.ts`의 schema를 다음 계약으로 바꾼다.

```ts
const apiEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGIN: z.string().default(localCorsOrigins),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
})
```

`parseApiEnv` 반환값에는 `betterAuthSecret`, `betterAuthUrl`, `googleClientId`, `googleClientSecret`, `openAiApiKey`, `openAiModel`을 포함한다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `bun --filter @workspace/api test -- env.test.ts`

Expected: env 테스트 통과.

---

## Task 2: 콘텐츠 검색 API

**Files:**

- Modify: `packages/core/src/content/content.dto.ts`
- Modify: `packages/core/src/content/content.repository.ts`
- Modify: `packages/core/src/content/content.service.ts`
- Modify: `packages/core/src/content/content.service.test.ts`
- Modify: `packages/db/src/repositories/drizzle-content.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-content.repository.test.ts`
- Modify: `apps/api/src/routes/courses.route.ts`
- Modify: `apps/api/src/app.test.ts`

- [ ] **Step 1: core 검색 테스트 작성**

`packages/core/src/content/content.service.test.ts`에 다음 테스트를 추가한다.

```ts
it("searches courses by query", async () => {
  const service = createContentService({
    repository: {
      ...repository,
      async searchCourses(query) {
        expect(query).toBe("문장")

        return {
          courses: [
            {
              id: "sentence-structure",
              title: "문장 구조의 기본",
              description: "문장의 뼈대를 이해합니다.",
              lessonCount: 12,
              thumbnail: "/course-thumbnails/sentence-structure.png",
            },
          ],
        }
      },
    },
  })

  const result = await service.searchCourses("문장")

  expect(result.status).toBe("ok")
  if (result.status === "ok") {
    expect(result.value.courses).toHaveLength(1)
  }
})

it("rejects blank course search queries", async () => {
  const service = createContentService({ repository })

  const result = await service.searchCourses("   ")

  expect(result).toEqual({
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message: "Search query is required.",
    },
  })
})
```

- [ ] **Step 2: core 테스트 실패 확인**

Run: `bun --filter @workspace/core test -- content.service.test.ts`

Expected: `searchCourses`가 없어서 실패.

- [ ] **Step 3: DTO와 repository 포트 추가**

`content.dto.ts`에 추가한다.

```ts
export const courseSearchResultDtoSchema = z.object({
  courses: z.array(courseSummaryDtoSchema),
})

export type CourseSearchResultDto = z.infer<
  typeof courseSearchResultDtoSchema
>
```

`content.repository.ts`에 추가한다.

```ts
searchCourses(query: string): Promise<CourseSearchResultDto>
```

- [ ] **Step 4: content service 구현**

`ContentService`에 `searchCourses(query: string)`를 추가한다. 빈 문자열은 `invalid-request`로 반환하고, 저장소 예외는 `database-unavailable`, DTO 파싱 실패는 `invalid-content-seed`로 반환한다.

- [ ] **Step 5: DB 검색 테스트 작성**

`packages/db/src/repositories/drizzle-content.repository.test.ts`에 추가한다.

```ts
it("searches courses by title and description", async () => {
  const repository = createDrizzleContentRepository(createDatabase(sqlite))

  const result = await repository.searchCourses("문장")

  expect(result.courses.map((course) => course.id)).toContain(
    "sentence-structure"
  )
})
```

- [ ] **Step 6: DB 검색 구현**

`drizzle-content.repository.ts`에서 `or`, `like`를 import하고 다음 쿼리를 구현한다.

```ts
const pattern = `%${query}%`
const rows = await db
  .select()
  .from(courses)
  .where(or(like(courses.title, pattern), like(courses.description, pattern)))
  .orderBy(asc(courses.sortOrder))
```

기존 lesson count 계산을 재사용해 `CourseSearchResultDto`로 매핑한다.

- [ ] **Step 7: API 라우트 테스트 작성**

`apps/api/src/app.test.ts`에 `GET /courses/search?q=문장` 테스트와 빈 검색어 `400` 테스트를 추가한다.

- [ ] **Step 8: API 라우트 구현**

`apps/api/src/routes/courses.route.ts`에서 `/courses/:courseId`보다 먼저 `/courses/search`를 등록한다.

```ts
app.get("/courses/search", describeRoute({
  responses: {
    200: { description: "Course search results." },
    400: { description: "Search query is required." },
    500: { description: "Content seed is invalid." },
    503: { description: "Database is unavailable." },
  },
}), async (context) => {
  const query = context.req.query("q") ?? ""
  const result = await contentService.searchCourses(query)
  // ok -> 200, invalid-request -> 400, unavailable -> 503, invalid-content -> 500
})
```

- [ ] **Step 9: 검색 관련 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/core test -- content.service.test.ts
bun --filter @workspace/db test -- drizzle-content.repository.test.ts
bun --filter @workspace/api test -- app.test.ts
```

Expected: 검색 관련 테스트 통과.

---

## Task 3: Better Auth 구성과 인증 경계

**Files:**

- Create: `apps/api/src/auth/auth.ts`
- Create: `apps/api/src/auth/session.ts`
- Create: `apps/api/src/routes/auth.route.ts`
- Create: `apps/api/src/routes/me.route.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/app.test.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: 인증 API 테스트 작성**

`apps/api/src/app.test.ts`의 테스트 앱 생성 헬퍼를 확장해 인증 세션을 주입할 수 있게 한 뒤 다음 테스트를 추가한다.

```ts
it("returns unauthorized for /me without a session", async () => {
  const app = createTestApp()

  const response = await app.request("/me")

  expect(response.status).toBe(401)
  await expect(response.json()).resolves.toEqual({
    code: "unauthorized",
    message: "Authentication is required.",
  })
})

it("returns the current user for /me with a session", async () => {
  const app = createTestApp(silentLogger, {
    user: {
      id: "user-1",
      email: "learner@example.com",
      name: "학습자",
      image: null,
    },
    session: {
      id: "session-1",
    },
  })

  const response = await app.request("/me")

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    id: "user-1",
    email: "learner@example.com",
    name: "학습자",
    image: null,
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/api test -- app.test.ts`

Expected: `/me` 라우트와 auth dependency가 없어 실패.

- [ ] **Step 3: 세션 타입과 헬퍼 작성**

`apps/api/src/auth/session.ts`를 만든다.

```ts
export interface AuthUser {
  email: string
  id: string
  image: string | null
  name: string
}

export interface AuthSession {
  id: string
}

export interface CurrentAuthSession {
  session: AuthSession
  user: AuthUser
}

export interface AuthRuntime {
  getSession(headers: Headers): Promise<CurrentAuthSession | null>
  handler(request: Request): Promise<Response>
}

export const unauthorizedError = {
  code: "unauthorized",
  message: "Authentication is required.",
} as const
```

- [ ] **Step 4: Better Auth 팩토리 작성**

`apps/api/src/auth/auth.ts`를 만든다.

```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import type { WritingAppDatabase } from "@workspace/db"

interface CreateAuthRuntimeInput {
  baseUrl: string
  db: WritingAppDatabase
  googleClientId: string
  googleClientSecret: string
  secret: string
}

export function createAuthRuntime(input: CreateAuthRuntimeInput) {
  const auth = betterAuth({
    baseURL: input.baseUrl,
    database: drizzleAdapter(input.db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: input.secret,
    socialProviders: {
      google: {
        clientId: input.googleClientId,
        clientSecret: input.googleClientSecret,
      },
    },
  })

  return {
    async getSession(headers: Headers) {
      const session = await auth.api.getSession({ headers })

      if (!session) {
        return null
      }

      return {
        session: {
          id: session.session.id,
        },
        user: {
          email: session.user.email,
          id: session.user.id,
          image: session.user.image ?? null,
          name: session.user.name,
        },
      }
    },
    handler: auth.handler,
  }
}
```

TypeScript가 `better-auth/adapters/drizzle` import를 찾지 못하면 Better Auth 설치 버전의 공식 문서에 맞춰 import만 조정한다. 기능과 public wrapper 계약은 바꾸지 않는다.

- [ ] **Step 5: auth route와 me route 구현**

`auth.route.ts`:

```ts
import type { Hono } from "hono"

import type { AuthRuntime } from "@/auth/session"

export function registerAuthRoute(app: Hono, auth: AuthRuntime) {
  app.on(["GET", "POST"], "/api/auth/*", (context) =>
    auth.handler(context.req.raw)
  )
}
```

`me.route.ts`:

```ts
import type { Hono } from "hono"
import type { AuthRuntime } from "@/auth/session"
import { unauthorizedError } from "@/auth/session"

export function registerMeRoute(app: Hono, auth: AuthRuntime) {
  app.get("/me", async (context) => {
    const session = await auth.getSession(context.req.raw.headers)

    if (!session) {
      return context.json(unauthorizedError, 401)
    }

    return context.json(session.user)
  })
}
```

- [ ] **Step 6: app 조립 수정**

`ApiAppDependencies`에 `auth: AuthRuntime`을 추가한다. CORS 설정에 `credentials: true`, `allowHeaders: ["Content-Type", "Authorization"]`, `allowMethods: ["GET", "POST", "PUT", "OPTIONS"]`를 추가한다. 라우트 등록 순서는 CORS 이후 `registerAuthRoute`, 공개 API, 인증 API 순서로 둔다.

- [ ] **Step 7: main 조립 수정**

`apps/api/src/main.ts`에서 `createAuthRuntime`을 호출해 `createApiApp`에 주입한다.

```ts
const auth = createAuthRuntime({
  baseUrl: env.betterAuthUrl,
  db,
  googleClientId: env.googleClientId,
  googleClientSecret: env.googleClientSecret,
  secret: env.betterAuthSecret,
})
```

- [ ] **Step 8: 인증 테스트 통과 확인**

Run: `bun --filter @workspace/api test -- app.test.ts`

Expected: `/me` 테스트 통과, 기존 공개 API 테스트 유지.

---

## Task 4: 인증과 학습 상태 DB schema 및 마이그레이션

**Files:**

- Create: `packages/db/src/schema/auth.schema.ts`
- Create: `packages/db/src/schema/learning.schema.ts`
- Create: `packages/db/src/migrations/0001-platform-backend.sql`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/migrations/run-content-migration.ts`
- Modify: `packages/db/src/client.ts`
- Create: `packages/db/src/repositories/drizzle-learning.repository.test.ts`

- [ ] **Step 1: 마이그레이션 테스트 작성**

`drizzle-learning.repository.test.ts`에 먼저 테이블 생성 확인 테스트를 작성한다.

```ts
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"

describe("platform backend migrations", () => {
  it("creates auth and learning tables", () => {
    const sqlite = new Database(":memory:")

    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table'"
      )
      .all()
      .map((table) => table.name)

    expect(tables).toContain("user")
    expect(tables).toContain("session")
    expect(tables).toContain("account")
    expect(tables).toContain("verification")
    expect(tables).toContain("course_progress")
    expect(tables).toContain("lesson_progress")
    expect(tables).toContain("lesson_answers")
    expect(tables).toContain("feedback_attempts")
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/db test -- drizzle-learning.repository.test.ts`

Expected: 새 테이블이 없어 실패.

- [ ] **Step 3: Better Auth schema 작성**

`auth.schema.ts`에 Better Auth 기본 SQLite schema를 작성한다. 실제 구현 시 `bun x @better-auth/cli@latest generate`로 생성되는 Drizzle schema와 비교하고, 생성 결과가 다르면 CLI 결과를 우선한다.

필수 테이블 이름은 `user`, `session`, `account`, `verification`으로 유지한다. Better Auth CLI가 생성한 Drizzle schema에서 이 이름이 다르면 `apps/api/src/auth/auth.ts`의 Better Auth 설정에도 같은 `modelName` 매핑을 명시해 런타임과 마이그레이션 이름이 일치하게 한다.

- [ ] **Step 4: 학습 schema 작성**

`learning.schema.ts`에 다음 테이블을 작성한다.

```ts
export const courseProgress = sqliteTable("course_progress", {
  userId: text("user_id").notNull(),
  courseId: text("course_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  lastLessonId: text("last_lesson_id"),
  completedCount: integer("completed_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const lessonProgress = sqliteTable("lesson_progress", {
  userId: text("user_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  courseId: text("course_id").notNull(),
  currentStepId: text("current_step_id").notNull(),
  stepOrder: integer("step_order").notNull(),
  status: text("status", {
    enum: ["not-started", "in-progress", "completed"],
  }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const lessonAnswers = sqliteTable("lesson_answers", {
  userId: text("user_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  stepId: text("step_id").notNull(),
  answer: text("answer").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const feedbackAttempts = sqliteTable("feedback_attempts", {
  userId: text("user_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  feedbackStepId: text("feedback_step_id").notNull(),
  sourceStepId: text("source_step_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  answerSnapshot: text("answer_snapshot").notNull(),
  resultJson: text("result_json").notNull(),
  status: text("status", { enum: ["completed"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})
```

각 테이블에는 설계서의 unique index를 추가한다.

- [ ] **Step 5: SQL 마이그레이션 작성**

`0001-platform-backend.sql`에 Better Auth 테이블과 학습 테이블을 생성한다. SQL은 `create table if not exists`와 `create unique index if not exists`를 사용해 테스트 재실행에 안전하게 만든다.

- [ ] **Step 6: 마이그레이션 runner 수정**

`run-content-migration.ts`가 `0000-initial-content.sql` 다음 `0001-platform-backend.sql`을 실행하게 한다. 기존 import 호환을 위해 함수명 `runContentMigration`은 유지한다.

- [ ] **Step 7: DB 테스트 통과 확인**

Run: `bun --filter @workspace/db test -- drizzle-learning.repository.test.ts`

Expected: 테이블 생성 테스트 통과.

---

## Task 5: 학습 도메인 서비스

**Files:**

- Create: `packages/core/src/learning/*`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`

- [ ] **Step 1: 학습 서비스 테스트 작성**

`learning.service.test.ts`에 다음 케이스를 작성한다. 각 테스트는 in-memory fake repository와 fake content reader를 사용한다. fake lesson은 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `COMPLETE` 스텝을 포함한다.

- `returns default lesson progress without writing when no progress exists`: 저장소의 `findLessonProgress`가 `undefined`를 반환할 때 첫 스텝 ID와 `stepOrder: 1`, 빈 `answers`를 반환하고 저장소 write spy가 호출되지 않았음을 검증한다.
- `saves current lesson progress`: `saveLessonProgress(user-1, sentence-structure-01, step-2)` 호출 후 저장소 `upsertLessonProgress`가 `status: "in-progress"`와 `stepOrder: 2`로 호출됐음을 검증한다.
- `upserts allowed lesson answers`: `SHORT_WRITE` 스텝 답변 저장 시 `upsertLessonAnswer`가 `answer: "문장을 고쳤습니다."`로 호출됐음을 검증한다.
- `rejects answers for non-writing step types`: `INTRO` 스텝 답변 저장 시 `invalid-request` 결과를 반환하고 `upsertLessonAnswer`가 호출되지 않았음을 검증한다.
- `completes a lesson idempotently`: 같은 레슨 완료를 두 번 호출해 두 번째 결과도 `completed`이고 repository의 완료 count 증가 branch가 한 번만 실행됐음을 검증한다.
- `returns course progress with completed count and next lesson`: 완료된 레슨 하나와 전체 레슨 두 개를 가진 코스에서 `completedCount: 1`, `progressPercent: 50`, `nextLessonId`가 두 번째 레슨인지 검증한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/core test -- learning.service.test.ts`

Expected: learning 모듈 없음으로 실패.

- [ ] **Step 3: ID와 DTO 작성**

`learning.ids.ts`:

```ts
export type UserId = Brand<string, "user-id">
export type LessonProgressStatus =
  | "not-started"
  | "in-progress"
  | "completed"

export function userId(value: string): UserId {
  return value as UserId
}
```

`learning.dto.ts`에는 `profileDtoSchema`, `progressCourseListDtoSchema`, `courseProgressDtoSchema`, `lessonProgressDtoSchema`, `saveLessonProgressRequestDtoSchema`, `saveLessonAnswerRequestDtoSchema`, `completeLessonDtoSchema`를 작성한다.

- [ ] **Step 4: 오류와 저장소 포트 작성**

`learning.errors.ts`에는 `unauthorized`, `invalid-request`, `course-not-found`, `lesson-not-found`, `database-unavailable`를 포함한다.

`learning.repository.ts`에는 다음 메서드를 둔다.

```ts
findCourseProgress(userId, courseId)
upsertCourseProgress(input)
findLessonProgress(userId, lessonId)
upsertLessonProgress(input)
listLessonProgressByCourse(userId, courseId)
listInProgressCourses(userId)
listLessonAnswers(userId, lessonId)
upsertLessonAnswer(input)
completeLesson(input)
```

- [ ] **Step 5: 학습 서비스 구현**

`createLearningService`는 `repository`와 `contentService`를 받는다.

핵심 규칙:

- 저장된 레슨 진행이 없으면 첫 스텝을 기본 진행으로 계산해 반환한다.
- 진행 저장은 레슨 존재와 스텝 존재를 검증한다.
- 답변 저장 허용 타입은 `SHORT_WRITE`, `LONG_WRITE`, `REVISION`, `CHECKLIST`, `REFLECTION`이다.
- 레슨 완료는 저장소 `completeLesson`을 호출하고, 저장소는 중복 완료 시 완료 수를 증가시키지 않는다.

- [ ] **Step 6: export 추가**

`packages/core/package.json`:

```json
"./learning": "./src/learning/index.ts"
```

`packages/core/src/index.ts`:

```ts
export * from "@/learning"
```

- [ ] **Step 7: core 테스트 통과 확인**

Run: `bun --filter @workspace/core test -- learning.service.test.ts`

Expected: 학습 서비스 테스트 통과.

---

## Task 6: 학습 Drizzle 저장소

**Files:**

- Create: `packages/db/src/repositories/drizzle-learning.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-learning.repository.test.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: 저장소 테스트 추가**

`drizzle-learning.repository.test.ts`에 다음 테스트를 추가한다.

- `upserts lesson progress`: 같은 `(user_id, lesson_id)`로 두 번 저장한 뒤 row가 하나이고 `current_step_id`가 두 번째 값으로 바뀌었는지 확인한다.
- `upserts lesson answers`: 같은 `(user_id, lesson_id, step_id)`로 두 번 저장한 뒤 row가 하나이고 `answer`가 두 번째 값으로 바뀌었는지 확인한다.
- `completes a lesson once when called twice`: 같은 레슨 완료를 두 번 호출한 뒤 `course_progress.completed_count`가 `1`인지 확인한다.
- `lists in-progress courses`: 두 코스 진행을 저장한 뒤 `updated_at` 내림차순으로 진행 코스가 반환되는지 확인한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/db test -- drizzle-learning.repository.test.ts`

Expected: 저장소 함수 없음으로 실패.

- [ ] **Step 3: 저장소 구현**

`createDrizzleLearningRepository(db)`를 작성한다.

구현 규칙:

- SQLite upsert는 Drizzle `onConflictDoUpdate`를 사용한다.
- `completeLesson`은 기존 `lesson_progress.status`를 먼저 조회한다.
- 기존 상태가 `completed`이면 `course_progress.completed_count`를 증가시키지 않는다.
- 기존 상태가 없거나 `in-progress`이면 lesson을 completed로 저장하고 course count를 1 증가시킨다.

- [ ] **Step 4: export 추가**

`packages/db/src/index.ts`에 추가한다.

```ts
export * from "@/repositories/drizzle-learning.repository"
```

- [ ] **Step 5: 저장소 테스트 통과 확인**

Run: `bun --filter @workspace/db test -- drizzle-learning.repository.test.ts`

Expected: 학습 저장소 테스트 통과.

---

## Task 7: 프로필과 진행 API

**Files:**

- Create: `apps/api/src/routes/profile.route.ts`
- Create: `apps/api/src/routes/progress.route.ts`
- Create: `apps/api/src/routes/learning.route.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/app.test.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: API 테스트 작성**

`apps/api/src/app.test.ts`에 다음 케이스를 추가한다. 테스트는 fake `learningService`를 `createApiApp`에 주입한다.

- `requires auth for /profile`: 세션 없는 요청이 `401 unauthorized`를 반환한다.
- `returns profile summary for an authenticated user`: 세션 있는 요청이 fake profile DTO를 `200`으로 반환한다.
- `returns overall progress for an authenticated user`: `GET /progress`가 fake 진행 코스 목록을 반환한다.
- `saves lesson progress for an authenticated user`: `PUT /lessons/sentence-structure-01/progress`가 body를 서비스에 전달하고 `200`을 반환한다.
- `saves lesson answers for an authenticated user`: `PUT /lessons/sentence-structure-01/answers`가 step 답변을 서비스에 전달하고 `200`을 반환한다.
- `completes lessons idempotently for an authenticated user`: `POST /lessons/sentence-structure-01/complete`가 완료 DTO를 반환한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/api test -- app.test.ts`

Expected: 새 라우트 없음으로 실패.

- [ ] **Step 3: app dependency 확장**

`ApiAppDependencies`에 추가한다.

```ts
auth: AuthRuntime
learningService: LearningService
```

- [ ] **Step 4: 라우트 구현**

각 라우트는 `auth.getSession(context.req.raw.headers)`를 먼저 호출한다. 세션이 없으면 `401 unauthorized`를 반환한다. 세션이 있으면 `userId(session.user.id)`를 서비스에 전달한다.

라우트와 서비스 메서드 매핑:

- `GET /profile` -> `learningService.getProfile(userId)`
- `GET /progress` -> `learningService.listProgress(userId)`
- `GET /courses/:courseId/progress` -> `learningService.getCourseProgress(userId, courseId)`
- `GET /lessons/:lessonId/progress` -> `learningService.getLessonProgress(userId, lessonId)`
- `PUT /lessons/:lessonId/progress` -> `learningService.saveLessonProgress(userId, lessonId, body)`
- `PUT /lessons/:lessonId/answers` -> `learningService.saveLessonAnswer(userId, lessonId, body)`
- `POST /lessons/:lessonId/complete` -> `learningService.completeLesson(userId, lessonId)`

- [ ] **Step 5: main 조립**

`main.ts`에서 `createLearningService`와 `createDrizzleLearningRepository`를 조립해 `createApiApp`에 넘긴다.

- [ ] **Step 6: API 테스트 통과 확인**

Run: `bun --filter @workspace/api test -- app.test.ts`

Expected: 프로필과 진행 API 테스트 통과.

---

## Task 8: AI 피드백 core와 DB 저장소

**Files:**

- Create: `packages/core/src/ai-feedback/*`
- Create: `packages/db/src/repositories/drizzle-feedback.repository.ts`
- Create: `packages/db/src/repositories/drizzle-feedback.repository.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: core AI 테스트 작성**

`ai-feedback.service.test.ts`에 다음 케이스를 작성한다.

- `creates feedback from a saved answer`: 요청 body에 answer가 없을 때 `lesson_answers`의 `sourceStepId` 답변으로 provider를 호출하고 저장소에 완료 시도를 만든다.
- `creates feedback from an explicit answer`: 요청 body의 answer가 있으면 저장 답변 조회 결과보다 body answer를 우선 사용한다.
- `returns answer-not-found when no answer is available`: body answer도 저장 답변도 없으면 provider와 저장소 create가 호출되지 않는다.
- `returns feedback-retry-limit-exceeded after three completed attempts`: count가 `3`이면 provider를 호출하지 않고 `429` 매핑용 결과를 반환한다.
- `returns ai-feedback-unavailable when the provider fails`: provider가 throw하면 저장소 create 없이 `ai-feedback-unavailable` 결과를 반환한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun --filter @workspace/core test -- ai-feedback.service.test.ts`

Expected: ai-feedback 모듈 없음으로 실패.

- [ ] **Step 3: DTO와 provider 포트 작성**

`ai-feedback.dto.ts`:

```ts
export const aiFeedbackRequestDtoSchema = z.object({
  answer: z.string().min(1).optional(),
  feedbackStepId: z.string().min(1),
  lessonId: z.string().min(1),
})

export const aiFeedbackResultDtoSchema = z.object({
  improvements: z.array(z.string().min(1)),
  nextAction: z.string().min(1),
  score: z.number().int().min(0),
  scoreRange: z.tuple([z.number().int(), z.number().int()]),
  strengths: z.array(z.string().min(1)),
  summary: z.string().min(1),
})
```

`ai-feedback.provider.ts`:

```ts
export interface AiFeedbackProvider {
  createFeedback(input: {
    answer: string
    criteria: string
    focusAreas: string[]
    prompt: string
    scoreRange: readonly [number, number]
  }): Promise<AiFeedbackResultDto>
}
```

- [ ] **Step 4: 피드백 서비스 구현**

`createAiFeedbackService`는 `contentService`, `learningRepository`, `feedbackRepository`, `provider`를 받는다.

규칙:

- 레슨과 피드백 스텝을 콘텐츠에서 찾는다.
- 피드백 스텝이 `AI_FEEDBACK`이 아니면 `feedback-step-not-found`.
- 요청 answer가 없으면 `lesson_answers`에서 `sourceStepId` 답변을 찾는다.
- 완료 시도 수가 3 이상이면 `feedback-retry-limit-exceeded`.
- provider 실패는 `ai-feedback-unavailable`.
- provider 성공 후 `feedback_attempts`에 저장한다.

- [ ] **Step 5: DB 피드백 저장소 테스트 작성**

`drizzle-feedback.repository.test.ts`에 다음 테스트를 작성한다.

- `counts completed feedback attempts`: 같은 사용자, 레슨, 피드백 스텝으로 완료 시도 두 개를 저장한 뒤 count가 `2`인지 확인한다.
- `stores completed feedback attempts with incrementing attempt numbers`: 두 번 저장한 row의 `attempt_number`가 `1`, `2`인지 확인한다.

- [ ] **Step 6: DB 피드백 저장소 구현**

`createDrizzleFeedbackRepository(db)`에 다음 메서드를 구현한다.

```ts
countCompletedAttempts(userId, lessonId, feedbackStepId)
createCompletedAttempt(input)
```

- [ ] **Step 7: export와 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/core test -- ai-feedback.service.test.ts
bun --filter @workspace/db test -- drizzle-feedback.repository.test.ts
```

Expected: AI core와 DB 테스트 통과.

---

## Task 9: OpenAI provider와 AI 피드백 API

**Files:**

- Create: `apps/api/src/openai/openai-feedback-provider.ts`
- Create: `apps/api/src/openai/openai-feedback-provider.test.ts`
- Create: `apps/api/src/routes/ai-feedback.route.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/app.test.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: provider 테스트 작성**

`openai-feedback-provider.test.ts`는 OpenAI client stub을 주입해 Responses API 호출 shape를 검증한다.

```ts
it("requests structured AI feedback from OpenAI", async () => {
  const parse = vi.fn().mockResolvedValue({
    output_parsed: {
      improvements: ["근거를 더 구체화하세요."],
      nextAction: "첫 문장에 기준을 추가하세요.",
      score: 4,
      scoreRange: [0, 5],
      strengths: ["핵심 문장이 분명합니다."],
      summary: "문장의 목적은 잘 드러납니다.",
    },
  })

  const provider = createOpenAiFeedbackProvider({
    client: { responses: { parse } },
    model: "gpt-5-mini",
  })

  const result = await provider.createFeedback({
    answer: "문장의 기준을 먼저 세운다.",
    criteria: "명확성",
    focusAreas: ["clarity"],
    prompt: "답변을 평가합니다.",
    scoreRange: [0, 5],
  })

  expect(result.score).toBe(4)
  expect(parse).toHaveBeenCalledWith(
    expect.objectContaining({
      model: "gpt-5-mini",
    })
  )
})
```

- [ ] **Step 2: provider 구현**

`openai-feedback-provider.ts`는 `openai` SDK의 `responses.parse`와 `zodTextFormat`을 사용한다.

```ts
import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

export function createOpenAiFeedbackProvider(input: {
  apiKey?: string
  client?: Pick<OpenAI, "responses">
  model: string
}): AiFeedbackProvider {
  const client = input.client ?? new OpenAI({ apiKey: input.apiKey })
  // createFeedback 구현
}
```

`output_parsed`가 없으면 오류를 던지고, 서비스 계층이 `ai-feedback-unavailable`로 매핑하게 한다.

- [ ] **Step 3: API 테스트 작성**

`apps/api/src/app.test.ts`에 다음 케이스를 추가한다.

- `requires auth for /ai-feedback`: 세션 없는 요청이 `401 unauthorized`를 반환한다.
- `creates AI feedback for an authenticated user`: 세션 있는 요청이 fake AI feedback DTO를 `200`으로 반환한다.
- `returns 429 when feedback retry limit is exceeded`: fake service가 retry limit 결과를 반환할 때 API가 `429`를 반환한다.

- [ ] **Step 4: API 라우트 구현**

`POST /ai-feedback`는 인증 후 body를 `aiFeedbackRequestDtoSchema`로 검증하고 `aiFeedbackService.createFeedback(userId, body)`를 호출한다.

상태 매핑:

- `ok` -> 200
- `invalid-request` -> 400
- `answer-not-found` -> 404
- `feedback-step-not-found` -> 404
- `feedback-retry-limit-exceeded` -> 429
- `ai-feedback-unavailable` -> 503
- `database-unavailable` -> 503

- [ ] **Step 5: main 조립**

`main.ts`에서 OpenAI provider, feedback repository, AI feedback service를 조립한다.

- [ ] **Step 6: API와 provider 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/api test -- openai-feedback-provider.test.ts
bun --filter @workspace/api test -- app.test.ts
```

Expected: AI 피드백 API 테스트 통과.

---

## Task 10: OpenAPI와 문서 최신화

**Files:**

- Modify: `apps/api/src/routes/*.route.ts`
- Modify: `apps/api/src/app.test.ts`
- Modify: `BACKEND.md`
- Modify: `docs/platform-backend-api.md`

- [ ] **Step 1: OpenAPI 테스트 작성**

`apps/api/src/app.test.ts`의 OpenAPI 테스트에 다음 경로 확인을 추가한다.

```ts
expect(document.paths).toHaveProperty("/courses/search")
expect(document.paths).toHaveProperty("/me")
expect(document.paths).toHaveProperty("/profile")
expect(document.paths).toHaveProperty("/progress")
expect(document.paths).toHaveProperty("/courses/{courseId}/progress")
expect(document.paths).toHaveProperty("/lessons/{lessonId}/progress")
expect(document.paths).toHaveProperty("/lessons/{lessonId}/answers")
expect(document.paths).toHaveProperty("/lessons/{lessonId}/complete")
expect(document.paths).toHaveProperty("/ai-feedback")
```

- [ ] **Step 2: 라우트 describeRoute 보강**

각 새 라우트에 `describeRoute`와 Zod schema resolver를 추가한다. 인증 라우트의 `401` 응답은 `unauthorized` schema를 공통으로 사용한다.

- [ ] **Step 3: BACKEND.md 갱신**

다음 내용을 한국어로 반영한다.

- Better Auth `/api/auth/*`
- 공개 API와 인증 API 목록
- 필수 환경 변수와 기본값 허용 환경 변수
- `course_progress`, `lesson_progress`, `lesson_answers`, `feedback_attempts`
- OpenAI Responses API와 Structured Outputs 경계
- 필수 환경 변수 누락 시 서버 시작 실패

- [ ] **Step 4: docs 작업 로그 완료 항목 추가**

`docs/platform-backend-api.md`에 구현 완료 항목을 추가한다. 실제 구현 파일, 검증 명령 결과, 알려진 제한 사항을 기록한다.

- [ ] **Step 5: 문서 테스트 확인**

Run:

```bash
git diff --check
```

Expected: whitespace error 없음.

---

## Task 11: 최종 검증

**Files:**

- No new files

- [ ] **Step 1: 패키지 테스트 실행**

Run:

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/logger test
bun --filter @workspace/api test
```

Expected: 모든 패키지 테스트 통과.

- [ ] **Step 2: 타입 검사 실행**

Run:

```bash
bun --filter @workspace/core typecheck
bun --filter @workspace/db typecheck
bun --filter @workspace/api typecheck
```

Expected: core, db, api typecheck 통과.

- [ ] **Step 3: 린트 실행**

Run:

```bash
bun --filter @workspace/core lint
bun --filter @workspace/db lint
bun --filter @workspace/api lint
```

Expected: core, db, api lint 통과.

- [ ] **Step 4: 루트 검증 실행**

Run:

```bash
bun run test
bun run lint
bun run typecheck
bun run format:check
git diff --check
bun lefthook run pre-commit
```

Expected: 가능한 모든 루트 검증 통과. 기존 `@workspace/ui` typecheck 실패나 기존 포맷 불일치가 남아 있으면, 변경 파일과 관련 패키지 검증 결과를 별도로 기록하고 완료 보고에 명시한다.

- [ ] **Step 5: API 스모크 테스트**

환경 변수를 명시하고 임시 포트에서 API를 실행한다.

```bash
DATABASE_URL=:memory: \
BETTER_AUTH_SECRET=test-secret-with-enough-length \
BETTER_AUTH_URL=http://localhost:4100 \
GOOGLE_CLIENT_ID=test-google-client-id \
GOOGLE_CLIENT_SECRET=test-google-client-secret \
OPENAI_API_KEY=test-openai-api-key \
OPENAI_MODEL=gpt-5-mini \
PORT=4100 \
bun --filter @workspace/api start
```

별도 터미널에서 확인한다.

```bash
curl -i http://localhost:4100/health
curl -i http://localhost:4100/courses
curl -i "http://localhost:4100/courses/search?q=문장"
curl -i http://localhost:4100/me
```

Expected:

- `/health`, `/courses`, `/courses/search`는 200
- `/me`는 세션 없이 401

스모크 테스트 후 실행한 API 프로세스를 종료한다.

---

## 자체 검토

- 설계 범위 반영: Better Auth 실제 인증, 공개 콘텐츠 API 유지, 사용자 상태 API 인증, 검색, 학습 진행, 답변 저장, AI 피드백, 3회 제한, 빠른 환경 변수 실패, 문서 갱신을 모두 태스크에 포함했다.
- 어드민, 결제, 알림, 저널, 하이라이트 저장, 프론트 API 전환은 제외했다.
- 스키마 이름은 승인된 짧은 이름 `course_progress`, `lesson_progress`, `lesson_answers`, `feedback_attempts`를 사용한다.
- OpenAI 실제 호출은 테스트에서 mock하고, provider 경계만 검증한다.
- Better Auth schema는 최신 CLI 산출물이 구현 기준이며, 도메인 코드는 Better Auth 내부 테이블에 직접 의존하지 않는다.
