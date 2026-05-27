# 어드민 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 로그인, 왼쪽 사이드바 레이아웃, 콘텐츠 계층 조회, 사용자 목록 조회를 제공하는 읽기 전용 어드민 MVP를 만든다.

**Architecture:** `apps/admin` Next.js 앱과 `apps/admin-api` Hono API 서버를 새로 만들고, 기존 플랫폼 `apps/web`과 `apps/api`는 어드민 런타임을 참조하지 않는다. DB는 공유하지만 Better Auth 관리자 테이블은 `admin_user`, `admin_session`, `admin_account`, `admin_verification`으로 분리한다. 어드민 UI는 `packages/ui`의 shadcn Sidebar 컴포넌트를 사용하고 `sidebar-07` 블록의 구조만 참고한다.

**Tech Stack:** Bun 1.3.10, Node 20, TypeScript 5.9, Next.js 16 App Router, Hono, hono-openapi, Better Auth, Drizzle SQLite, Vitest, Testing Library, shadcn/ui.

---

## 구현 전 확인

- 설계 문서: `docs/superpowers/specs/2026-05-27-admin-site-design.md`
- 일반 문서: `docs/admin-site.md`
- Next.js 작업 전 `apps/web/AGENTS.md`와 동일하게 `node_modules/next/dist/docs/`의 관련 문서를 확인한다.
- shadcn 작업 전 `packages/ui/components.json`와 `packages/ui/src/components/ui/sidebar.tsx`를 확인한다.
- Better Auth Drizzle adapter는 설치된 `better-auth@1.6.11` 기준으로 `user.modelName`, `session.modelName`, `account.modelName`, `verification.modelName`을 지원한다.

## 파일 구조

### 새 앱

- Create: `apps/admin/package.json` — 어드민 Next.js 앱 스크립트와 의존성
- Create: `apps/admin/tsconfig.json` — Next.js 앱 TypeScript 설정
- Create: `apps/admin/eslint.config.mjs` — monorepo Next lint 설정
- Create: `apps/admin/next.config.ts` — Next.js 설정
- Create: `apps/admin/postcss.config.mjs` — Tailwind v4 postcss 설정
- Create: `apps/admin/components.json` — shadcn 경로 설정
- Create: `apps/admin/src/app/globals.css` — UI 패키지 스타일 import
- Create: `apps/admin/src/app/layout.tsx` — root layout
- Create: `apps/admin/src/app/page.tsx` — `/courses` 리다이렉트
- Create: `apps/admin/src/app/login/page.tsx` — 관리자 로그인 route
- Create: `apps/admin/src/app/(admin)/layout.tsx` — 보호된 어드민 layout
- Create: `apps/admin/src/app/(admin)/courses/page.tsx` — 콘텐츠 계층 조회 화면
- Create: `apps/admin/src/app/(admin)/users/page.tsx` — 사용자 목록 화면
- Create: `apps/admin/src/app/api/auth/[...path]/route.ts` — same-origin Better Auth proxy
- Create: `apps/admin/src/components/admin-sidebar.tsx` — sidebar-07 기반 사이드바
- Create: `apps/admin/src/components/admin-shell.tsx` — SidebarProvider와 SidebarInset 조립
- Create: `apps/admin/src/features/auth/admin-auth-page.tsx` — 관리자 로그인 폼
- Create: `apps/admin/src/features/courses/admin-courses-page.tsx` — 콘텐츠 트리 UI
- Create: `apps/admin/src/features/users/admin-users-page.tsx` — 사용자 테이블 UI
- Create: `apps/admin/src/lib/api/admin-api.ts` — admin API 포트
- Create: `apps/admin/src/lib/api/http-admin-api.ts` — fetch 기반 HTTP 어댑터
- Create: `apps/admin/src/lib/api/get-server-admin-api.ts` — 서버 컴포넌트용 API factory
- Create: `apps/admin/src/lib/auth/admin-auth-client.ts` — 로그인 요청 helper
- Create: `apps/admin/src/lib/auth/admin-auth-navigation.ts` — 안전한 next 경로 보정
- Create: `apps/admin/src/lib/auth/admin-auth-proxy.ts` — backend auth proxy helper
- Create: `apps/admin/vitest.config.ts` — jsdom 테스트 설정

### 새 API

- Create: `apps/admin-api/package.json` — Hono API 스크립트와 의존성
- Create: `apps/admin-api/tsconfig.json` — API TypeScript 설정
- Create: `apps/admin-api/eslint.config.mjs` — monorepo lint 설정
- Create: `apps/admin-api/vitest.config.ts` — API 테스트 설정
- Create: `apps/admin-api/.env.example` — 로컬 환경 변수 예시
- Create: `apps/admin-api/src/app.ts` — Hono 앱 조립
- Create: `apps/admin-api/src/main.ts` — 서버 시작점
- Create: `apps/admin-api/src/env.ts` — 환경 변수 파싱
- Create: `apps/admin-api/src/auth/admin-auth.ts` — Better Auth runtime
- Create: `apps/admin-api/src/auth/admin-session.ts` — 세션 타입과 guard
- Create: `apps/admin-api/src/routes/auth.route.ts` — `/api/auth/*`
- Create: `apps/admin-api/src/routes/courses.route.ts` — `GET /courses?include=chapters,lessons`
- Create: `apps/admin-api/src/routes/users.route.ts` — `GET /users`
- Create: `apps/admin-api/src/routes/health.route.ts` — `GET /health`
- Create: `apps/admin-api/src/routes/openapi.route.ts` — `GET /openapi.json`
- Create: `apps/admin-api/src/routes/error-response.ts` — 공통 JSON 오류 응답 schema
- Create: `apps/admin-api/src/scripts/seed-admin.ts` — 최초 관리자 seed 명령

### 공유 패키지

- Create: `packages/core/src/admin/admin.dto.ts` — 어드민 응답 DTO와 Zod schema
- Create: `packages/core/src/admin/admin.errors.ts` — 어드민 오류 DTO
- Create: `packages/core/src/admin/admin.repository.ts` — 어드민 조회 repository port
- Create: `packages/core/src/admin/admin.service.ts` — 어드민 조회 service
- Create: `packages/core/src/admin/admin.service.test.ts` — service 테스트
- Create: `packages/core/src/admin/index.ts` — admin public export
- Modify: `packages/core/src/index.ts` — admin export 추가
- Create: `packages/db/src/schema/admin-auth.schema.ts` — 관리자 Better Auth 테이블
- Modify: `packages/db/src/schema/index.ts` — admin auth schema export
- Create: `packages/db/src/migrations/0002-admin-auth.sql` — 관리자 auth 테이블 migration
- Modify: `packages/db/src/migrations/run-content-migration.ts` — admin migration 실행
- Create: `packages/db/src/repositories/drizzle-admin.repository.ts` — 콘텐츠/사용자 읽기 repository
- Create: `packages/db/src/repositories/drizzle-admin.repository.test.ts` — repository 테스트
- Modify: `packages/db/src/index.ts` — admin repository export
- Modify: `package.json` — `dev:admin` 스크립트 추가
- Modify: `turbo.json` — 새 앱 task가 기존 pipeline에 맞게 동작하는지 확인
- Modify: `vitest.workspace.ts` — admin과 admin-api 테스트 포함
- Modify: `ARCHITECTURE.md` — 실제 앱 구조와 포트 반영
- Modify: `BACKEND.md` — 어드민 API 범위 반영
- Modify: `FRONTEND.md` — 어드민 레이아웃과 API 클라이언트 원칙 반영
- Modify: `docs/admin-site.md` — 구현 시작/완료 기록

---

### Task 1: 문서 시작 기록과 workspace 설정

**Files:**

- Modify: `docs/admin-site.md`
- Modify: `package.json`
- Modify: `vitest.workspace.ts`
- Modify: `turbo.json`

- [ ] **Step 1: 문서에 구현 시작 기록 추가**

`docs/admin-site.md` 끝에 다음을 추가한다.

```md
## 2026-05-27 구현 시작

- `apps/admin`과 `apps/admin-api`를 추가해 어드민을 플랫폼과 별도 런타임으로 구현한다.
- 구현 순서는 `docs/superpowers/plans/2026-05-27-admin-site.md`의 Task 1부터 Task 10까지 따른다.
- 1차 구현 범위는 관리자 로그인, 보호된 사이드바 레이아웃, 콘텐츠 계층 조회, 사용자 기본 목록 조회다.
```

- [ ] **Step 2: root script 추가**

`package.json`의 `scripts`에 다음 항목을 추가한다.

```json
{
  "dev:admin": "turbo dev --filter=@workspace/admin --filter=@workspace/admin-api"
}
```

기존 script는 유지하고 새 key만 추가한다.

- [ ] **Step 3: vitest workspace 형태 유지**

현재 `vitest.workspace.ts`는 root coverage script에서 `--config vitest.workspace.ts`로 로드되므로 plain array가 아니라 `defineConfig({ test: { projects } })` 형태를 유지한다. Task 1에서는 아직 `apps/admin-api/vitest.config.ts`와 `apps/admin/vitest.config.ts`가 존재하지 않으므로 새 프로젝트 경로를 추가하지 않는다. 해당 경로는 각 앱의 `vitest.config.ts`가 생성되는 Task 5와 Task 8에서 추가한다.

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      "packages/ui/vitest.config.ts",
      "packages/core/vitest.config.ts",
      "packages/logger/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/env/vitest.config.ts",
      "apps/api/vitest.config.ts",
      "apps/web/vitest.config.ts",
    ],
  },
})
```

- [ ] **Step 4: workspace 설정 검증**

Run:

```bash
bun install --frozen-lockfile
bunx prettier --check package.json vitest.workspace.ts docs/admin-site.md
```

Expected: 두 명령 모두 exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.workspace.ts docs/admin-site.md
git commit -m "어드민 구현 시작 설정 추가"
```

---

### Task 2: 관리자 인증 DB 테이블 추가

**Files:**

- Create: `packages/db/src/schema/admin-auth.schema.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/migrations/0002-admin-auth.sql`
- Modify: `packages/db/src/migrations/run-content-migration.ts`
- Test: `packages/db/src/client.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`packages/db/src/client.test.ts`에 다음 테스트를 추가한다.

```ts
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { adminUser } from "@/schema"

describe("admin auth schema", () => {
  it("creates isolated admin auth tables", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)

    await db.insert(adminUser).values({
      id: "admin-1",
      name: "운영자",
      email: "admin@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
    })

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table' order by name"
      )
      .all()
      .map((row) => row.name)

    expect(tables).toContain("admin_user")
    expect(tables).toContain("admin_session")
    expect(tables).toContain("admin_account")
    expect(tables).toContain("admin_verification")
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/db test -- client.test.ts
```

Expected: `adminUser` export 또는 `admin_user` table이 없어서 FAIL.

- [ ] **Step 3: 관리자 schema 작성**

`packages/db/src/schema/admin-auth.schema.ts`를 생성한다.

```ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const adminUser = sqliteTable("admin_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const adminSession = sqliteTable("admin_session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
})

export const adminAccount = sqliteTable("admin_account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const adminVerification = sqliteTable("admin_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
})
```

- [ ] **Step 4: schema export 추가**

`packages/db/src/schema/index.ts`를 다음 형태로 만든다.

```ts
export * from "@/schema/admin-auth.schema"
export * from "@/schema/auth.schema"
export * from "@/schema/content.schema"
export * from "@/schema/learning.schema"
```

- [ ] **Step 5: migration SQL 추가**

`packages/db/src/migrations/0002-admin-auth.sql`을 생성한다.

```sql
pragma foreign_keys = on;

create table if not exists admin_user (
  id text primary key,
  name text not null,
  email text not null unique,
  emailVerified integer not null,
  image text,
  createdAt integer not null,
  updatedAt integer not null
);

create table if not exists admin_session (
  id text primary key,
  expiresAt integer not null,
  token text not null unique,
  createdAt integer not null,
  updatedAt integer not null,
  ipAddress text,
  userAgent text,
  userId text not null references admin_user(id) on delete cascade
);

create table if not exists admin_account (
  id text primary key,
  accountId text not null,
  providerId text not null,
  userId text not null references admin_user(id) on delete cascade,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt integer,
  refreshTokenExpiresAt integer,
  scope text,
  password text,
  createdAt integer not null,
  updatedAt integer not null
);

create table if not exists admin_verification (
  id text primary key,
  identifier text not null,
  value text not null,
  expiresAt integer not null,
  createdAt integer,
  updatedAt integer
);
```

- [ ] **Step 6: migration runner 수정**

`packages/db/src/migrations/run-content-migration.ts`에 admin migration을 추가한다.

```ts
import { readFileSync } from "node:fs"
import type { Database } from "bun:sqlite"

const contentMigrationSql = readFileSync(
  new URL("./0000-initial-content.sql", import.meta.url),
  "utf8"
)
const platformBackendMigrationSql = readFileSync(
  new URL("./0001-platform-backend.sql", import.meta.url),
  "utf8"
)
const adminAuthMigrationSql = readFileSync(
  new URL("./0002-admin-auth.sql", import.meta.url),
  "utf8"
)

export function runContentMigration(sqlite: Database) {
  sqlite.exec(contentMigrationSql)
  sqlite.exec(platformBackendMigrationSql)
  sqlite.exec(adminAuthMigrationSql)
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/db test -- client.test.ts
bun --filter @workspace/db typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/db/src/schema/admin-auth.schema.ts packages/db/src/schema/index.ts packages/db/src/migrations/0002-admin-auth.sql packages/db/src/migrations/run-content-migration.ts packages/db/src/client.test.ts
git commit -m "관리자 인증 테이블 추가"
```

---

### Task 3: 어드민 core DTO와 service 추가

**Files:**

- Create: `packages/core/src/admin/admin.dto.ts`
- Create: `packages/core/src/admin/admin.errors.ts`
- Create: `packages/core/src/admin/admin.repository.ts`
- Create: `packages/core/src/admin/admin.service.ts`
- Create: `packages/core/src/admin/admin.service.test.ts`
- Create: `packages/core/src/admin/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: service 실패 테스트 작성**

`packages/core/src/admin/admin.service.test.ts`를 생성한다.

```ts
import { describe, expect, it } from "vitest"

import { createAdminService } from "@/admin/admin.service"
import type { AdminRepository } from "@/admin/admin.repository"

const repository: AdminRepository = {
  async listCourseTree() {
    return {
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          sortOrder: 1,
          chapters: [
            {
              id: "sentence-structure-chapter-1",
              label: "1단원",
              title: "문장의 뼈대",
              sortOrder: 1,
              lessons: [
                {
                  id: "sentence-structure-lesson-1",
                  lessonId: "sentence-structure-01",
                  title: "주어와 서술어 찾기",
                  description: "중심 성분을 구분합니다.",
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    }
  },
  async listUsers() {
    return {
      users: [
        {
          id: "user-1",
          name: "학습자",
          email: "user@example.com",
          emailVerified: true,
          image: null,
          createdAt: "2026-05-27T00:00:00.000Z",
          updatedAt: "2026-05-27T00:00:00.000Z",
        },
      ],
    }
  },
}

describe("createAdminService", () => {
  it("returns a course tree", async () => {
    const service = createAdminService({ repository })

    await expect(service.listCourseTree()).resolves.toMatchObject({
      status: "ok",
      value: {
        courses: [
          {
            id: "sentence-structure",
            chapters: [
              {
                lessons: [{ lessonId: "sentence-structure-01" }],
              },
            ],
          },
        ],
      },
    })
  })

  it("returns basic users", async () => {
    const service = createAdminService({ repository })

    await expect(service.listUsers()).resolves.toMatchObject({
      status: "ok",
      value: {
        users: [{ email: "user@example.com" }],
      },
    })
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/core test -- admin.service.test.ts
```

Expected: `@/admin/admin.service`를 찾지 못해 FAIL.

- [ ] **Step 3: DTO 작성**

`packages/core/src/admin/admin.dto.ts`를 생성한다.

```ts
import { z } from "zod"

export const adminLessonSummaryDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().positive(),
})

export const adminChapterSummaryDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
  lessons: z.array(adminLessonSummaryDtoSchema),
})

export const adminCourseTreeItemDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().positive(),
  chapters: z.array(adminChapterSummaryDtoSchema),
})

export const adminCourseTreeDtoSchema = z.object({
  courses: z.array(adminCourseTreeItemDtoSchema),
})

export const adminUserListItemDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const adminUserListDtoSchema = z.object({
  users: z.array(adminUserListItemDtoSchema),
})

export type AdminCourseTreeDto = z.infer<typeof adminCourseTreeDtoSchema>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
```

- [ ] **Step 4: 오류 타입 작성**

`packages/core/src/admin/admin.errors.ts`를 생성한다.

```ts
import { z } from "zod"

export const adminDatabaseUnavailableErrorDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("Database is unavailable."),
})

export const adminInvalidRequestErrorDtoSchema = z.object({
  code: z.literal("invalid-request"),
  message: z.string().min(1),
})

export type AdminDatabaseUnavailableErrorDto = z.infer<
  typeof adminDatabaseUnavailableErrorDtoSchema
>
export type AdminInvalidRequestErrorDto = z.infer<
  typeof adminInvalidRequestErrorDtoSchema
>

export type AdminErrorDto =
  | AdminDatabaseUnavailableErrorDto
  | AdminInvalidRequestErrorDto
```

- [ ] **Step 5: repository port 작성**

`packages/core/src/admin/admin.repository.ts`를 생성한다.

```ts
import type { AdminCourseTreeDto, AdminUserListDto } from "@/admin/admin.dto"

export interface AdminRepository {
  listCourseTree(): Promise<AdminCourseTreeDto>
  listUsers(): Promise<AdminUserListDto>
}
```

- [ ] **Step 6: service 작성**

`packages/core/src/admin/admin.service.ts`를 생성한다.

```ts
import {
  adminCourseTreeDtoSchema,
  adminUserListDtoSchema,
  type AdminCourseTreeDto,
  type AdminUserListDto,
} from "@/admin/admin.dto"
import type { AdminDatabaseUnavailableErrorDto } from "@/admin/admin.errors"
import type { AdminRepository } from "@/admin/admin.repository"

type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

type UnavailableResult = {
  status: "unavailable"
  error: AdminDatabaseUnavailableErrorDto
}

export type AdminServiceResult<TValue> = OkResult<TValue> | UnavailableResult

export interface AdminService {
  listCourseTree(): Promise<AdminServiceResult<AdminCourseTreeDto>>
  listUsers(): Promise<AdminServiceResult<AdminUserListDto>>
}

interface AdminServiceDependencies {
  repository: AdminRepository
}

const unavailableResult: UnavailableResult = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "Database is unavailable.",
  },
}

export function createAdminService({
  repository,
}: AdminServiceDependencies): AdminService {
  return {
    async listCourseTree() {
      try {
        return {
          status: "ok",
          value: adminCourseTreeDtoSchema.parse(
            await repository.listCourseTree()
          ),
        }
      } catch {
        return unavailableResult
      }
    },
    async listUsers() {
      try {
        return {
          status: "ok",
          value: adminUserListDtoSchema.parse(await repository.listUsers()),
        }
      } catch {
        return unavailableResult
      }
    },
  }
}
```

- [ ] **Step 7: public export 추가**

`packages/core/src/admin/index.ts`를 생성한다.

```ts
export * from "@/admin/admin.dto"
export * from "@/admin/admin.errors"
export * from "@/admin/admin.repository"
export * from "@/admin/admin.service"
```

`packages/core/src/index.ts`를 수정한다.

```ts
export * from "@/admin"
export * from "@/ai-feedback"
export * from "@/content"
export * from "@/learning"
```

- [ ] **Step 8: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/core test -- admin.service.test.ts
bun --filter @workspace/core typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/admin packages/core/src/index.ts
git commit -m "어드민 조회 서비스 계약 추가"
```

---

### Task 4: DB 어드민 조회 repository 추가

**Files:**

- Create: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Create: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: repository 실패 테스트 작성**

`packages/db/src/repositories/drizzle-admin.repository.test.ts`를 생성한다.

```ts
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import {
  createDatabase,
  createDrizzleAdminRepository,
  runContentMigration,
  seedContent,
} from "@/index"
import { user } from "@/schema"

describe("createDrizzleAdminRepository", () => {
  it("lists courses with chapters and lessons", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    await seedContent(db)

    const repository = createDrizzleAdminRepository(db)
    const result = await repository.listCourseTree()

    expect(result.courses.length).toBeGreaterThan(0)
    expect(result.courses[0]?.chapters.length).toBeGreaterThan(0)
    expect(result.courses[0]?.chapters[0]?.lessons.length).toBeGreaterThan(0)
  })

  it("lists basic platform users", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    await db.insert(user).values({
      id: "user-1",
      name: "학습자",
      email: "learner@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
    })

    const repository = createDrizzleAdminRepository(db)
    const result = await repository.listUsers()

    expect(result.users).toEqual([
      {
        id: "user-1",
        name: "학습자",
        email: "learner@example.com",
        emailVerified: true,
        image: null,
        createdAt: "2026-05-27T00:00:00.000Z",
        updatedAt: "2026-05-27T00:00:00.000Z",
      },
    ])
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
```

Expected: `createDrizzleAdminRepository` export가 없어서 FAIL.

- [ ] **Step 3: repository 구현**

`packages/db/src/repositories/drizzle-admin.repository.ts`를 생성한다.

```ts
import { asc } from "drizzle-orm"

import type { AdminRepository } from "@workspace/core/admin"

import type { WritingAppDatabase } from "@/client"
import { courseChapters, courseLessons, courses, user } from "@/schema"

export function createDrizzleAdminRepository(
  db: WritingAppDatabase
): AdminRepository {
  return {
    async listCourseTree() {
      const [courseRows, chapterRows, lessonRows] = await Promise.all([
        db.select().from(courses).orderBy(asc(courses.sortOrder)),
        db.select().from(courseChapters).orderBy(asc(courseChapters.sortOrder)),
        db.select().from(courseLessons).orderBy(asc(courseLessons.sortOrder)),
      ])

      return {
        courses: courseRows.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          sortOrder: course.sortOrder,
          chapters: chapterRows
            .filter((chapter) => chapter.courseId === course.id)
            .map((chapter) => ({
              id: chapter.id,
              label: chapter.label,
              title: chapter.title,
              sortOrder: chapter.sortOrder,
              lessons: lessonRows
                .filter((lesson) => lesson.chapterId === chapter.id)
                .map((lesson) => ({
                  id: lesson.id,
                  lessonId: lesson.lessonId,
                  title: lesson.title,
                  description: lesson.description,
                  sortOrder: lesson.sortOrder,
                })),
            })),
        })),
      }
    },
    async listUsers() {
      const userRows = await db.select().from(user).orderBy(asc(user.createdAt))

      return {
        users: userRows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: row.emailVerified,
          image: row.image,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      }
    },
  }
}
```

- [ ] **Step 4: export 추가**

`packages/db/src/index.ts`에 admin repository export를 추가한다.

```ts
export * from "@/client"
export * from "@/migrations/run-content-migration"
export * from "@/repositories/drizzle-admin.repository"
export * from "@/repositories/drizzle-content.repository"
export * from "@/repositories/drizzle-feedback.repository"
export * from "@/repositories/drizzle-learning.repository"
export * from "@/schema"
export * from "@/seeds"
```

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
bun --filter @workspace/db typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts packages/db/src/index.ts
git commit -m "어드민 조회 저장소 추가"
```

---

### Task 5: admin-api 앱 뼈대와 인증 runtime 추가

**Files:**

- Create: `apps/admin-api/package.json`
- Create: `apps/admin-api/tsconfig.json`
- Create: `apps/admin-api/eslint.config.mjs`
- Create: `apps/admin-api/vitest.config.ts`
- Create: `apps/admin-api/.env.example`
- Create: `apps/admin-api/src/env.ts`
- Create: `apps/admin-api/src/auth/admin-session.ts`
- Create: `apps/admin-api/src/auth/admin-auth.ts`
- Create: `apps/admin-api/src/app.ts`
- Create: `apps/admin-api/src/main.ts`
- Create: `apps/admin-api/src/routes/auth.route.ts`
- Create: `apps/admin-api/src/routes/health.route.ts`
- Test: `apps/admin-api/src/env.test.ts`
- Test: `apps/admin-api/src/auth/admin-auth.test.ts`

- [ ] **Step 1: package와 config 생성**

`apps/admin-api/package.json`을 생성한다.

```json
{
  "name": "@workspace/admin-api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc --noEmit",
    "dev": "bun --watch src/main.ts",
    "lint": "eslint .",
    "start": "bun src/main.ts",
    "test": "vitest run --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/core": "workspace:*",
    "@workspace/db": "workspace:*",
    "@workspace/env": "workspace:*",
    "@workspace/logger": "workspace:*",
    "better-auth": "^1.6.0",
    "hono": "^4.10.0",
    "hono-openapi": "^1.1.0",
    "zod": "^4.2.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "@workspace/config": "workspace:*",
    "typescript": "5.9.3",
    "vitest": "^4.1.0"
  }
}
```

`apps/admin-api/tsconfig.json`을 생성한다.

```json
{
  "extends": "@workspace/config/typescript/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

`apps/admin-api/eslint.config.mjs`를 생성한다.

```js
import base from "@workspace/config/eslint/base"

export default [...base]
```

`apps/admin-api/vitest.config.ts`를 생성한다.

```ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
  },
})
```

- [ ] **Step 2: 환경 변수 테스트 작성**

`apps/admin-api/src/env.test.ts`를 생성한다.

```ts
import { describe, expect, it } from "vitest"

import { parseAdminApiEnv } from "@/env"

describe("parseAdminApiEnv", () => {
  it("parses admin api environment", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_SECRET: "admin-secret",
        ADMIN_BETTER_AUTH_URL: "http://localhost:4001",
        ADMIN_CORS_ORIGIN: "http://localhost:3001",
        DATABASE_URL: "file:data/api.sqlite",
      })
    ).toEqual({
      betterAuthSecret: "admin-secret",
      betterAuthUrl: "http://localhost:4001",
      corsOrigins: ["http://localhost:3001"],
      databasePath: "data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4001,
    })
  })
})
```

- [ ] **Step 3: 실패 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- env.test.ts
```

Expected: `@/env`가 없어서 FAIL.

- [ ] **Step 4: env 구현**

`apps/admin-api/src/env.ts`를 생성한다.

```ts
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { parseEnv, type RawEnv } from "@workspace/env"
import { z } from "zod"

const localCorsOrigins = "http://localhost:3001"

const adminApiEnvSchema = z.object({
  ADMIN_BETTER_AUTH_SECRET: z.string().min(1),
  ADMIN_BETTER_AUTH_URL: z.string().url(),
  ADMIN_CORS_ORIGIN: z.string().default(localCorsOrigins),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
})

export type AdminApiEnv = ReturnType<typeof parseAdminApiEnv>

export function parseAdminApiEnv(rawEnv: RawEnv) {
  const env = parseEnv({
    schema: adminApiEnvSchema,
    runtimeEnv: rawEnv,
  })

  return {
    betterAuthSecret: env.ADMIN_BETTER_AUTH_SECRET,
    betterAuthUrl: env.ADMIN_BETTER_AUTH_URL,
    corsOrigins: env.ADMIN_CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    databasePath: env.DATABASE_URL.startsWith("file:")
      ? env.DATABASE_URL.slice("file:".length)
      : env.DATABASE_URL,
    environment: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    port: env.PORT,
  }
}

export function ensureDatabaseDirectory(databasePath: string) {
  const databaseDirectory = dirname(databasePath)

  if (databasePath === ":memory:" || databaseDirectory === ".") {
    return false
  }

  mkdirSync(databaseDirectory, { recursive: true })

  return true
}
```

- [ ] **Step 5: Better Auth runtime 작성**

`apps/admin-api/src/auth/admin-session.ts`를 생성한다.

```ts
import type { Context, Next } from "hono"

export interface AdminSessionUser {
  email: string
  id: string
  image: string | null
  name: string
}

export interface AdminSession {
  session: {
    id: string
  }
  user: AdminSessionUser
}

export interface AdminAuthRuntime {
  getSession(headers: Headers): Promise<AdminSession | null>
  handler(request: Request): Promise<Response>
}

export function requireAdminSession(auth: AdminAuthRuntime) {
  return async (context: Context, next: Next) => {
    const session = await auth.getSession(context.req.raw.headers)

    if (!session) {
      return context.json(
        {
          code: "unauthorized",
          message: "Admin authentication is required.",
        },
        401
      )
    }

    context.set("adminSession", session)
    await next()
  }
}
```

`apps/admin-api/src/auth/admin-auth.ts`를 생성한다.

```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import {
  adminAccount,
  adminSession,
  adminUser,
  adminVerification,
  type WritingAppDatabase,
} from "@workspace/db"

import type { AdminAuthRuntime } from "@/auth/admin-session"

interface CreateAdminAuthRuntimeInput {
  baseUrl: string
  db: WritingAppDatabase
  secret: string
  trustedOrigins?: string[]
}

export function createAdminAuthRuntime(
  input: CreateAdminAuthRuntimeInput
): AdminAuthRuntime {
  const auth = betterAuth({
    advanced: {
      cookiePrefix: "writing-app-admin",
      trustedProxyHeaders: true,
    },
    baseURL: input.baseUrl,
    database: drizzleAdapter(input.db, {
      provider: "sqlite",
      schema: {
        adminAccount,
        adminSession,
        adminUser,
        adminVerification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: input.secret,
    trustedOrigins: input.trustedOrigins,
    user: {
      modelName: "adminUser",
    },
    session: {
      modelName: "adminSession",
    },
    account: {
      modelName: "adminAccount",
    },
    verification: {
      modelName: "adminVerification",
    },
  })

  return {
    async getSession(headers) {
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

- [ ] **Step 6: route와 app 뼈대 구현**

`apps/admin-api/src/routes/auth.route.ts`를 생성한다.

```ts
import type { Hono } from "hono"

import type { AdminAuthRuntime } from "@/auth/admin-session"

export function registerAuthRoute(app: Hono, auth: AdminAuthRuntime) {
  app.on(["GET", "POST"], "/api/auth/*", (context) =>
    auth.handler(context.req.raw)
  )
}
```

`apps/admin-api/src/routes/health.route.ts`를 생성한다.

```ts
import type { Hono } from "hono"

export interface HealthDependencies {
  checkDatabase(): Promise<boolean>
}

export function registerHealthRoute(
  app: Hono,
  dependencies: HealthDependencies
) {
  app.get("/health", async (context) => {
    const database = await dependencies.checkDatabase()

    return context.json(
      {
        ok: database,
        service: "admin-api",
      },
      database ? 200 : 503
    )
  })
}
```

`apps/admin-api/src/app.ts`를 생성한다.

```ts
import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AdminService } from "@workspace/core/admin"
import { createRequestLogFields } from "@workspace/logger"

import type { AdminAuthRuntime } from "@/auth/admin-session"
import { registerAuthRoute } from "@/routes/auth.route"
import { registerHealthRoute } from "@/routes/health.route"

export interface AdminApiLogger {
  error(fields: object, message: string): void
  info(fields: object, message: string): void
}

export interface AdminApiAppDependencies {
  adminService: AdminService
  auth: AdminAuthRuntime
  checkDatabase(): Promise<boolean>
  corsOrigins?: string[]
  logger: AdminApiLogger
}

export function createAdminApiApp(dependencies: AdminApiAppDependencies) {
  const app = new Hono()

  app.use("*", async (context, next) => {
    const requestId = context.req.header("x-request-id") ?? crypto.randomUUID()
    const startedAt = performance.now()
    let status = 500

    context.header("x-request-id", requestId)

    try {
      await next()
      status = context.res.status
    } catch (error) {
      dependencies.logger.error(
        { error, requestId },
        "Admin API request failed"
      )
      throw error
    } finally {
      dependencies.logger.info(
        createRequestLogFields({
          durationMs: Math.round(performance.now() - startedAt),
          method: context.req.method,
          path: new URL(context.req.url).pathname,
          requestId,
          status,
        }),
        "Admin API request completed"
      )
    }
  })

  app.use(
    "*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: dependencies.corsOrigins ?? ["http://localhost:3001"],
    })
  )

  registerAuthRoute(app, dependencies.auth)
  registerHealthRoute(app, dependencies)

  return app
}
```

- [ ] **Step 7: main과 env example 작성**

`apps/admin-api/src/main.ts`를 생성한다.

```ts
import Database from "bun:sqlite"

import { createAdminService } from "@workspace/core/admin"
import {
  createDatabase,
  createDrizzleAdminRepository,
  runContentMigration,
} from "@workspace/db"
import { createLogger } from "@workspace/logger"

import { createAdminApiApp } from "@/app"
import { createAdminAuthRuntime } from "@/auth/admin-auth"
import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"

const env = parseAdminApiEnv(Bun.env)
const logger = createLogger({
  environment: env.environment,
  level: env.logLevel,
  service: "admin-api",
})

ensureDatabaseDirectory(env.databasePath)

const sqlite = new Database(env.databasePath, { create: true })
runContentMigration(sqlite)

const db = createDatabase(sqlite)
const adminService = createAdminService({
  repository: createDrizzleAdminRepository(db),
})
const auth = createAdminAuthRuntime({
  baseUrl: env.betterAuthUrl,
  db,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
})

const app = createAdminApiApp({
  adminService,
  auth,
  async checkDatabase() {
    try {
      sqlite.query("select 1").get()
      return true
    } catch (error) {
      logger.error({ error }, "Admin database health check failed")
      return false
    }
  },
  corsOrigins: env.corsOrigins,
  logger,
})

Bun.serve({
  fetch: app.fetch,
  port: env.port,
})

logger.info({ port: env.port }, "Admin API server started")
```

`apps/admin-api/.env.example`을 생성한다.

```dotenv
ADMIN_BETTER_AUTH_SECRET=replace-with-local-admin-auth-secret
ADMIN_BETTER_AUTH_URL=http://localhost:4001
ADMIN_CORS_ORIGIN=http://localhost:3001
DATABASE_URL=file:data/api.sqlite
LOG_LEVEL=info
NODE_ENV=development
PORT=4001
```

- [ ] **Step 8: 테스트와 타입체크**

Run:

```bash
bun --filter @workspace/admin-api test -- env.test.ts
bun --filter @workspace/admin-api typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/admin-api
git commit -m "어드민 API 기본 구조 추가"
```

---

### Task 6: admin-api REST 조회 route와 OpenAPI 추가

**Files:**

- Create: `apps/admin-api/src/routes/error-response.ts`
- Create: `apps/admin-api/src/routes/courses.route.ts`
- Create: `apps/admin-api/src/routes/users.route.ts`
- Create: `apps/admin-api/src/routes/openapi.route.ts`
- Modify: `apps/admin-api/src/app.ts`
- Test: `apps/admin-api/src/app.test.ts`

- [ ] **Step 1: route 실패 테스트 작성**

`apps/admin-api/src/app.test.ts`를 생성한다.

```ts
import { describe, expect, it, vi } from "vitest"

import type { AdminService } from "@workspace/core/admin"

import { createAdminApiApp } from "@/app"
import type { AdminAuthRuntime } from "@/auth/admin-session"

const auth: AdminAuthRuntime = {
  async getSession() {
    return {
      session: { id: "session-1" },
      user: {
        email: "admin@example.com",
        id: "admin-1",
        image: null,
        name: "운영자",
      },
    }
  },
  async handler() {
    return new Response(null, { status: 204 })
  },
}

const adminService: AdminService = {
  async listCourseTree() {
    return {
      status: "ok",
      value: {
        courses: [
          {
            id: "sentence-structure",
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            sortOrder: 1,
            chapters: [],
          },
        ],
      },
    }
  },
  async listUsers() {
    return {
      status: "ok",
      value: {
        users: [
          {
            id: "user-1",
            name: "학습자",
            email: "learner@example.com",
            emailVerified: true,
            image: null,
            createdAt: "2026-05-27T00:00:00.000Z",
            updatedAt: "2026-05-27T00:00:00.000Z",
          },
        ],
      },
    }
  },
}

function createTestApp(input?: Partial<{ auth: AdminAuthRuntime }>) {
  return createAdminApiApp({
    adminService,
    auth: input?.auth ?? auth,
    async checkDatabase() {
      return true
    },
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
  })
}

describe("admin api app", () => {
  it("returns a protected course tree", async () => {
    const response = await createTestApp().request(
      "/courses?include=chapters,lessons"
    )

    await expect(response.json()).resolves.toMatchObject({
      courses: [{ id: "sentence-structure" }],
    })
  })

  it("returns protected users", async () => {
    const response = await createTestApp().request("/users")

    await expect(response.json()).resolves.toMatchObject({
      users: [{ email: "learner@example.com" }],
    })
  })

  it("rejects unauthenticated admin route access", async () => {
    const response = await createTestApp({
      auth: {
        ...auth,
        async getSession() {
          return null
        },
      },
    }).request("/users")

    expect(response.status).toBe(401)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- app.test.ts
```

Expected: `/courses` 또는 `/users`가 404로 FAIL.

- [ ] **Step 3: 오류 응답 helper 작성**

`apps/admin-api/src/routes/error-response.ts`를 생성한다.

```ts
import { resolver } from "hono-openapi"
import type { ZodType } from "zod"

export function jsonErrorResponse(schema: ZodType) {
  return {
    "application/json": {
      schema: resolver(schema),
    },
  }
}
```

- [ ] **Step 4: courses route 작성**

`apps/admin-api/src/routes/courses.route.ts`를 생성한다.

```ts
import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCourseTreeDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerCoursesRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/courses",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin course tree.",
          content: {
            "application/json": {
              schema: resolver(adminCourseTreeDtoSchema),
            },
          },
        },
        401: {
          description: "Admin authentication is required.",
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const include = context.req.query("include")

      if (include !== "chapters,lessons") {
        return context.json(
          {
            code: "invalid-request",
            message: "include must be chapters,lessons.",
          },
          400
        )
      }

      const result = await adminService.listCourseTree()

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}
```

- [ ] **Step 5: users route 작성**

`apps/admin-api/src/routes/users.route.ts`를 생성한다.

```ts
import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminDatabaseUnavailableErrorDtoSchema,
  adminUserListDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerUsersRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/users",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin user list.",
          content: {
            "application/json": {
              schema: resolver(adminUserListDtoSchema),
            },
          },
        },
        401: {
          description: "Admin authentication is required.",
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.listUsers()

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}
```

- [ ] **Step 6: OpenAPI route 작성**

`apps/admin-api/src/routes/openapi.route.ts`를 생성한다.

```ts
import type { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"

export function registerOpenApiRoute(app: Hono) {
  app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Writing App Admin API",
          version: "0.0.1",
        },
        openapi: "3.1.0",
      },
    })
  )
}
```

- [ ] **Step 7: app에 route 등록**

`apps/admin-api/src/app.ts`에 imports와 route 등록을 추가한다.

```ts
import { registerCoursesRoute } from "@/routes/courses.route"
import { registerOpenApiRoute } from "@/routes/openapi.route"
import { registerUsersRoute } from "@/routes/users.route"
```

`registerHealthRoute(app, dependencies)` 아래에 추가한다.

```ts
registerCoursesRoute(app, dependencies)
registerUsersRoute(app, dependencies)
registerOpenApiRoute(app)
```

- [ ] **Step 8: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- app.test.ts
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin-api lint
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/admin-api/src
git commit -m "어드민 API 조회 라우트 추가"
```

---

### Task 7: 최초 관리자 seed 명령 추가

**Files:**

- Create: `apps/admin-api/src/scripts/seed-admin.ts`
- Modify: `apps/admin-api/package.json`
- Test: `apps/admin-api/src/scripts/seed-admin.test.ts`

- [ ] **Step 1: seed helper 실패 테스트 작성**

`apps/admin-api/src/scripts/seed-admin.test.ts`를 생성한다.

```ts
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createDatabase, runContentMigration, adminUser } from "@workspace/db"

import { seedAdminUser } from "@/scripts/seed-admin"

describe("seedAdminUser", () => {
  it("creates the first admin once", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)

    const first = await seedAdminUser({
      db,
      email: "admin@example.com",
      name: "운영자",
      password: "password-1234",
    })
    const second = await seedAdminUser({
      db,
      email: "admin@example.com",
      name: "운영자",
      password: "password-1234",
    })
    const rows = await db.select().from(adminUser)

    expect(first.status).toBe("created")
    expect(second.status).toBe("already-exists")
    expect(rows).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- seed-admin.test.ts
```

Expected: `@/scripts/seed-admin`가 없어서 FAIL.

- [ ] **Step 3: seed script 구현**

`apps/admin-api/src/scripts/seed-admin.ts`를 생성한다.

```ts
import Database from "bun:sqlite"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"

import {
  adminAccount,
  adminUser,
  createDatabase,
  runContentMigration,
  type WritingAppDatabase,
} from "@workspace/db"

import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"

interface SeedAdminUserInput {
  db: WritingAppDatabase
  email: string
  name: string
  password: string
}

export type SeedAdminUserResult =
  | { status: "created"; adminId: string }
  | { status: "already-exists"; adminId: string }

export async function seedAdminUser({
  db,
  email,
  name,
  password,
}: SeedAdminUserInput): Promise<SeedAdminUserResult> {
  const [existingAdmin] = await db
    .select()
    .from(adminUser)
    .where(eq(adminUser.email, email))
    .limit(1)

  if (existingAdmin) {
    return {
      status: "already-exists",
      adminId: existingAdmin.id,
    }
  }

  const now = new Date()
  const adminId = crypto.randomUUID()
  const accountId = crypto.randomUUID()
  const passwordHash = await hashPassword(password)

  await db.insert(adminUser).values({
    id: adminId,
    name,
    email,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(adminAccount).values({
    id: accountId,
    accountId: adminId,
    providerId: "credential",
    userId: adminId,
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  })

  return {
    status: "created",
    adminId,
  }
}

if (import.meta.main) {
  const env = parseAdminApiEnv(Bun.env)
  const email = Bun.env["ADMIN_SEED_EMAIL"]
  const name = Bun.env["ADMIN_SEED_NAME"] ?? "관리자"
  const password = Bun.env["ADMIN_SEED_PASSWORD"]

  if (!email || !password) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required.")
  }

  ensureDatabaseDirectory(env.databasePath)
  const sqlite = new Database(env.databasePath, { create: true })
  runContentMigration(sqlite)
  const db = createDatabase(sqlite)
  const result = await seedAdminUser({ db, email, name, password })

  console.info(JSON.stringify(result))
}
```

- [ ] **Step 4: package script 추가**

`apps/admin-api/package.json`의 scripts에 추가한다.

```json
{
  "seed:admin": "bun src/scripts/seed-admin.ts"
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- seed-admin.test.ts
bun --filter @workspace/admin-api typecheck
```

Expected: PASS.

- [ ] **Step 6: 실제 Better Auth 로그인 스모크 확인**

Run:

```bash
ADMIN_BETTER_AUTH_SECRET=admin-secret \
ADMIN_BETTER_AUTH_URL=http://localhost:4001 \
DATABASE_URL=file:data/admin-smoke.sqlite \
ADMIN_SEED_EMAIL=admin@example.com \
ADMIN_SEED_PASSWORD=password-1234 \
bun --filter @workspace/admin-api seed:admin
```

Expected: `{"status":"created",...}` 또는 두 번째 실행 시 `{"status":"already-exists",...}`.

- [ ] **Step 7: Commit**

```bash
git add apps/admin-api/src/scripts apps/admin-api/package.json
git commit -m "최초 관리자 seed 명령 추가"
```

---

### Task 8: admin Next.js 앱 뼈대와 API 클라이언트 추가

**Files:**

- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/eslint.config.mjs`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/postcss.config.mjs`
- Create: `apps/admin/components.json`
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/src/app/globals.css`
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/lib/api/admin-api.ts`
- Create: `apps/admin/src/lib/api/http-admin-api.ts`
- Create: `apps/admin/src/lib/api/get-server-admin-api.ts`
- Test: `apps/admin/src/lib/api/http-admin-api.test.ts`

- [ ] **Step 1: Next.js 문서 확인**

Run:

```bash
ls node_modules/next/dist/docs
rg -n "App Router|Route Handlers|cookies" node_modules/next/dist/docs | sed -n '1,80p'
```

Expected: Next 16 문서 파일이 존재한다. route handler와 cookies 관련 문서 위치를 확인한다.

- [ ] **Step 2: 앱 package와 config 생성**

`apps/admin/package.json`을 생성한다.

```json
{
  "name": "@workspace/admin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 3001",
    "lint": "eslint .",
    "start": "next start --port 3001",
    "test": "vitest run --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/ui": "workspace:*",
    "better-auth": "^1.6.0",
    "lucide-react": "^1.8.0",
    "next": "16.2.5",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/bun": "^1.3.10",
    "@types/node": "^25.9.1",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@workspace/config": "workspace:*",
    "eslint": "^9",
    "jsdom": "^29.1.1",
    "tailwindcss": "^4",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  }
}
```

`apps/admin/tsconfig.json`을 생성한다.

```json
{
  "extends": "@workspace/config/typescript/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["bun-types", "node"]
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "vitest.config.ts"
  ]
}
```

`apps/admin/eslint.config.mjs`를 생성한다.

```js
import next from "@workspace/config/eslint/next"

export default [...next]
```

`apps/admin/next.config.ts`를 생성한다.

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

export default nextConfig
```

`apps/admin/postcss.config.mjs`를 생성한다.

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
```

`apps/admin/components.json`은 `apps/web/components.json`과 같은 alias 구조로 생성한다.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-luma",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@workspace/ui/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

- [ ] **Step 3: root layout 작성**

`apps/admin/src/app/globals.css`를 생성한다.

```css
@import "@workspace/ui/styles/globals.css";
```

`apps/admin/src/app/layout.tsx`를 생성한다.

```tsx
import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "한글쓰기 어드민",
  description: "한글쓰기 플랫폼 운영 도구입니다.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: API 클라이언트 실패 테스트 작성**

`apps/admin/src/lib/api/http-admin-api.test.ts`를 생성한다.

```ts
import { describe, expect, it, vi } from "vitest"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"

describe("createHttpAdminApi", () => {
  it("requests course tree with credentials", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        courses: [],
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch,
    })

    await expect(api.listCourseTree()).resolves.toEqual({
      status: "ok",
      value: { courses: [] },
    })
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4001/courses?include=chapters%2Clessons",
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      })
    )
  })
})
```

- [ ] **Step 5: 실패 확인**

Run:

```bash
bun --filter @workspace/admin test -- http-admin-api.test.ts
```

Expected: `@/lib/api/http-admin-api`가 없어서 FAIL.

- [ ] **Step 6: API 포트와 HTTP 어댑터 작성**

`apps/admin/src/lib/api/admin-api.ts`를 생성한다.

```ts
export interface AdminLessonSummary {
  id: string
  lessonId: string
  title: string
  description: string
  sortOrder: number
}

export interface AdminChapterSummary {
  id: string
  label: string
  title: string
  sortOrder: number
  lessons: readonly AdminLessonSummary[]
}

export interface AdminCourseTreeItem {
  id: string
  title: string
  description: string
  sortOrder: number
  chapters: readonly AdminChapterSummary[]
}

export interface AdminUserListItem {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

export type AdminApiResult<TValue> =
  | { status: "ok"; value: TValue }
  | { status: "error"; message: string }

export interface AdminApi {
  listCourseTree(): Promise<
    AdminApiResult<{ courses: readonly AdminCourseTreeItem[] }>
  >
  listUsers(): Promise<AdminApiResult<{ users: readonly AdminUserListItem[] }>>
}
```

`apps/admin/src/lib/api/http-admin-api.ts`를 생성한다.

```ts
import type { AdminApi } from "@/lib/api/admin-api"

interface CreateHttpAdminApiInput {
  baseUrl: string
  fetch?: typeof globalThis.fetch
  headers?: HeadersInit
}

export function createHttpAdminApi({
  baseUrl,
  fetch = globalThis.fetch,
  headers,
}: CreateHttpAdminApiInput): AdminApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "")

  async function getJson<TValue>(path: string) {
    const response = await fetch(`${normalizedBaseUrl}${path}`, {
      credentials: "include",
      headers,
      method: "GET",
    })

    if (!response.ok) {
      return {
        status: "error" as const,
        message: `Admin API request failed with ${response.status}.`,
      }
    }

    return {
      status: "ok" as const,
      value: (await response.json()) as TValue,
    }
  }

  return {
    listCourseTree() {
      return getJson("/courses?include=chapters%2Clessons")
    },
    listUsers() {
      return getJson("/users")
    },
  }
}
```

`apps/admin/src/lib/api/get-server-admin-api.ts`를 생성한다.

```ts
import { cookies } from "next/headers"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"

export async function getServerAdminApi() {
  const cookieHeader = (await cookies()).toString()

  return createHttpAdminApi({
    baseUrl: process.env["ADMIN_API_BASE_URL"] ?? "http://localhost:4001",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/admin test -- http-admin-api.test.ts
bun --filter @workspace/admin typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/admin
git commit -m "어드민 웹 앱 기본 구조 추가"
```

---

### Task 9: 관리자 로그인과 보호된 sidebar shell 구현

**Files:**

- Create: `apps/admin/src/lib/auth/admin-auth-navigation.ts`
- Create: `apps/admin/src/lib/auth/admin-auth-client.ts`
- Create: `apps/admin/src/lib/auth/admin-auth-proxy.ts`
- Create: `apps/admin/src/app/api/auth/[...path]/route.ts`
- Create: `apps/admin/src/features/auth/admin-auth-page.tsx`
- Create: `apps/admin/src/app/login/page.tsx`
- Create: `apps/admin/src/app/(admin)/layout.tsx`
- Create: `apps/admin/src/app/page.tsx`
- Create: `apps/admin/src/components/admin-sidebar.tsx`
- Create: `apps/admin/src/components/admin-shell.tsx`
- Test: `apps/admin/src/lib/auth/admin-auth-navigation.test.ts`
- Test: `apps/admin/src/features/auth/admin-auth-page.test.tsx`

- [ ] **Step 1: auth navigation 실패 테스트 작성**

`apps/admin/src/lib/auth/admin-auth-navigation.test.ts`를 생성한다.

```ts
import { describe, expect, it } from "vitest"

import { getSafeAdminNextPath } from "@/lib/auth/admin-auth-navigation"

describe("getSafeAdminNextPath", () => {
  it("keeps internal admin paths", () => {
    expect(getSafeAdminNextPath("/users")).toBe("/users")
  })

  it("rejects external paths", () => {
    expect(getSafeAdminNextPath("https://example.com")).toBe("/courses")
  })
})
```

- [ ] **Step 2: auth navigation 구현**

`apps/admin/src/lib/auth/admin-auth-navigation.ts`를 생성한다.

```ts
const fallbackPath = "/courses"

export function getSafeAdminNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallbackPath
  }

  if (value.startsWith("/login") || value.startsWith("/api/")) {
    return fallbackPath
  }

  return value
}

export function getAdminLoginPath(nextPath = fallbackPath) {
  return `/login?next=${encodeURIComponent(getSafeAdminNextPath(nextPath))}`
}
```

- [ ] **Step 3: 로그인 client와 proxy 작성**

`apps/admin/src/lib/auth/admin-auth-client.ts`를 생성한다.

```ts
export type AdminAuthResult =
  | { status: "ok" }
  | { status: "error"; message: string }

interface RequestAdminEmailAuthInput {
  baseUrl?: string
  email: string
  password: string
}

export async function requestAdminEmailAuth({
  baseUrl = "",
  email,
  password,
}: RequestAdminEmailAuthInput): Promise<AdminAuthResult> {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    body: JSON.stringify({ email, password }),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    return {
      status: "error",
      message: "관리자 로그인에 실패했습니다.",
    }
  }

  return { status: "ok" }
}
```

`apps/admin/src/lib/auth/admin-auth-proxy.ts`를 생성한다.

```ts
export interface ProxyAdminAuthRequestInput {
  apiBaseUrl: string
  fetch?: typeof globalThis.fetch
  path: readonly string[]
  request: Request
}

export async function proxyAdminAuthRequest({
  apiBaseUrl,
  fetch = globalThis.fetch,
  path,
  request,
}: ProxyAdminAuthRequestInput): Promise<Response> {
  const incomingUrl = new URL(request.url)
  const encodedPath = path.map(encodeURIComponent).join("/")
  const backendUrl = new URL(
    `/api/auth/${encodedPath}`,
    `${apiBaseUrl.replace(/\/$/, "")}/`
  )
  backendUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.set("x-forwarded-host", incomingUrl.host)
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(/:$/, ""))

  return fetch(
    new Request(backendUrl, {
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      duplex:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : "half",
      headers,
      method: request.method,
      redirect: "manual",
    } as RequestInit & { duplex?: "half" })
  )
}
```

`apps/admin/src/app/api/auth/[...path]/route.ts`를 생성한다.

```ts
import { proxyAdminAuthRequest } from "@/lib/auth/admin-auth-proxy"

type AuthRouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(request: Request, context: AuthRouteContext) {
  return proxy(request, context)
}

export async function POST(request: Request, context: AuthRouteContext) {
  return proxy(request, context)
}

async function proxy(request: Request, context: AuthRouteContext) {
  const { path } = await context.params

  return proxyAdminAuthRequest({
    apiBaseUrl: process.env["ADMIN_API_BASE_URL"] ?? "http://localhost:4001",
    path,
    request,
  })
}
```

- [ ] **Step 4: 로그인 page 작성**

`apps/admin/src/features/auth/admin-auth-page.tsx`를 생성한다.

```tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

import { requestAdminEmailAuth } from "@/lib/auth/admin-auth-client"
import { getSafeAdminNextPath } from "@/lib/auth/admin-auth-navigation"

interface AdminAuthPageProps {
  nextPath?: string
}

export function AdminAuthPage({ nextPath }: AdminAuthPageProps) {
  const router = useRouter()
  const safeNextPath = getSafeAdminNextPath(nextPath)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const result = await requestAdminEmailAuth({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    })

    setPending(false)

    if (result.status === "error") {
      setErrorMessage(result.message)
      return
    }

    router.replace(safeNextPath)
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
      <Card variant="outlined" className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl/8 font-bold tracking-normal">
            관리자 로그인
          </CardTitle>
          <CardDescription>
            한글쓰기 운영 도구에 접근하려면 관리자 계정으로 로그인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  name="email"
                  required
                  type="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  autoComplete="current-password"
                  id="password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </Field>
            </FieldGroup>
            {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
            <Button
              className="w-full"
              disabled={pending}
              size="lg"
              type="submit"
            >
              {pending ? "확인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
```

`apps/admin/src/app/login/page.tsx`를 생성한다.

```tsx
import type { Metadata } from "next"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"

export const metadata: Metadata = {
  title: "관리자 로그인 — 한글쓰기 어드민",
}

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function Page({ searchParams }: LoginPageProps) {
  const next = (await searchParams).next

  return <AdminAuthPage nextPath={Array.isArray(next) ? next[0] : next} />
}
```

- [ ] **Step 5: sidebar shell 작성**

`apps/admin/src/components/admin-sidebar.tsx`를 생성한다.

```tsx
"use client"

import Link from "next/link"
import { BookOpenIcon, UsersIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/ui/sidebar"

export function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/courses">
                <BookOpenIcon />
                <span>한글쓰기 어드민</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>운영</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="콘텐츠">
                <Link href="/courses">
                  <BookOpenIcon />
                  <span>콘텐츠</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="사용자">
                <Link href="/users">
                  <UsersIcon />
                  <span>사용자</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
```

`apps/admin/src/components/admin-shell.tsx`를 생성한다.

```tsx
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/ui/sidebar"
import { Separator } from "@workspace/ui/components/ui/separator"

import { AdminSidebar } from "@/components/admin-sidebar"

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <span className="text-sm font-medium">운영 콘솔</span>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Step 6: 보호 layout 작성**

`apps/admin/src/app/(admin)/layout.tsx`를 생성한다.

```tsx
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin-shell"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const api = await getServerAdminApi()
  const result = await api.listUsers()

  if (result.status === "error") {
    redirect(getAdminLoginPath())
  }

  return <AdminShell>{children}</AdminShell>
}
```

`apps/admin/src/app/page.tsx`를 생성한다.

```tsx
import { redirect } from "next/navigation"

export default function Page() {
  redirect("/courses")
}
```

- [ ] **Step 7: 테스트와 타입체크**

Run:

```bash
bun --filter @workspace/admin test -- admin-auth-navigation.test.ts
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src
git commit -m "어드민 로그인과 사이드바 레이아웃 추가"
```

---

### Task 10: 콘텐츠와 사용자 조회 화면 구현

**Files:**

- Create: `apps/admin/src/features/courses/admin-courses-page.tsx`
- Create: `apps/admin/src/features/users/admin-users-page.tsx`
- Create: `apps/admin/src/app/(admin)/courses/page.tsx`
- Create: `apps/admin/src/app/(admin)/users/page.tsx`
- Test: `apps/admin/src/features/courses/admin-courses-page.test.tsx`
- Test: `apps/admin/src/features/users/admin-users-page.test.tsx`

- [ ] **Step 1: 콘텐츠 화면 실패 테스트 작성**

`apps/admin/src/features/courses/admin-courses-page.test.tsx`를 생성한다.

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminCoursesPage } from "@/features/courses/admin-courses-page"

describe("AdminCoursesPage", () => {
  it("renders course hierarchy", () => {
    render(
      <AdminCoursesPage
        courses={[
          {
            id: "sentence-structure",
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            sortOrder: 1,
            chapters: [
              {
                id: "chapter-1",
                label: "1단원",
                title: "문장의 뼈대",
                sortOrder: 1,
                lessons: [
                  {
                    id: "course-lesson-1",
                    lessonId: "sentence-structure-01",
                    title: "주어와 서술어 찾기",
                    description: "중심 성분을 구분합니다.",
                    sortOrder: 1,
                  },
                ],
              },
            ],
          },
        ]}
      />
    )

    expect(screen.getByText("문장 구조의 기본")).toBeInTheDocument()
    expect(screen.getByText("주어와 서술어 찾기")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 사용자 화면 실패 테스트 작성**

`apps/admin/src/features/users/admin-users-page.test.tsx`를 생성한다.

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminUsersPage } from "@/features/users/admin-users-page"

describe("AdminUsersPage", () => {
  it("renders basic users", () => {
    render(
      <AdminUsersPage
        users={[
          {
            id: "user-1",
            name: "학습자",
            email: "learner@example.com",
            emailVerified: true,
            image: null,
            createdAt: "2026-05-27T00:00:00.000Z",
            updatedAt: "2026-05-27T00:00:00.000Z",
          },
        ]}
      />
    )

    expect(screen.getByText("학습자")).toBeInTheDocument()
    expect(screen.getByText("learner@example.com")).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: 실패 확인**

Run:

```bash
bun --filter @workspace/admin test -- admin-courses-page.test.tsx admin-users-page.test.tsx
```

Expected: feature components가 없어서 FAIL.

- [ ] **Step 4: 콘텐츠 화면 구현**

`apps/admin/src/features/courses/admin-courses-page.tsx`를 생성한다.

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible"

import type { AdminCourseTreeItem } from "@/lib/api/admin-api"

interface AdminCoursesPageProps {
  courses: readonly AdminCourseTreeItem[]
}

export function AdminCoursesPage({ courses }: AdminCoursesPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">콘텐츠</h1>
        <p className="text-sm text-muted-foreground">
          코스, 챕터, 레슨 구조를 조회합니다.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {courses.map((course) => (
          <Card key={course.id} variant="outlined" className="rounded-lg">
            <Collapsible defaultOpen>
              <CardHeader>
                <CollapsibleTrigger className="text-left">
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="flex flex-col gap-4">
                  {course.chapters.map((chapter) => (
                    <section className="flex flex-col gap-2" key={chapter.id}>
                      <h2 className="text-sm font-medium">
                        {chapter.label} {chapter.title}
                      </h2>
                      <ul className="flex flex-col gap-2">
                        {chapter.lessons.map((lesson) => (
                          <li
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            key={lesson.id}
                          >
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-muted-foreground">
                              {lesson.lessonId}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 사용자 화면 구현**

`apps/admin/src/features/users/admin-users-page.tsx`를 생성한다.

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"
import { Badge } from "@workspace/ui/components/ui/badge"

import type { AdminUserListItem } from "@/lib/api/admin-api"

interface AdminUsersPageProps {
  users: readonly AdminUserListItem[]
}

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">사용자</h1>
        <p className="text-sm text-muted-foreground">
          학습자 계정의 기본 정보를 조회합니다.
        </p>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>이메일 인증</TableHead>
              <TableHead>가입일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "인증됨" : "미인증"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat("ko-KR").format(
                    new Date(user.createdAt)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: route page 연결**

`apps/admin/src/app/(admin)/courses/page.tsx`를 생성한다.

```tsx
import { redirect } from "next/navigation"

import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function Page() {
  const api = await getServerAdminApi()
  const result = await api.listCourseTree()

  if (result.status === "error") {
    redirect(getAdminLoginPath("/courses"))
  }

  return <AdminCoursesPage courses={result.value.courses} />
}
```

`apps/admin/src/app/(admin)/users/page.tsx`를 생성한다.

```tsx
import { redirect } from "next/navigation"

import { AdminUsersPage } from "@/features/users/admin-users-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function Page() {
  const api = await getServerAdminApi()
  const result = await api.listUsers()

  if (result.status === "error") {
    redirect(getAdminLoginPath("/users"))
  }

  return <AdminUsersPage users={result.value.users} />
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/admin test -- admin-courses-page.test.tsx admin-users-page.test.tsx
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src
git commit -m "어드민 조회 화면 추가"
```

---

### Task 11: 문서 갱신과 전체 검증

**Files:**

- Modify: `ARCHITECTURE.md`
- Modify: `BACKEND.md`
- Modify: `FRONTEND.md`
- Modify: `docs/admin-site.md`

- [ ] **Step 1: `ARCHITECTURE.md` 갱신**

앱 목록과 포트를 실제 구조에 맞게 보정한다.

```md
### admin

관리자용 운영 대시보드다.

- port: `3001`
- auth: Better Auth 기반 ID/password
- backend: `apps/admin-api`
- layout: 왼쪽 사이드바 기반 대시보드
- 1차 기능:
  - 코스-챕터-레슨 계층형 조회
  - 사용자 기본 정보 조회
```

```md
### admin-api

관리자용 Hono API 서버다.

- port: `4001`
- auth: 관리자 전용 Better Auth 테이블
- database: 플랫폼과 같은 SQLite 파일을 사용하되 관리자 인증 테이블은 `admin_*`로 분리한다.
```

- [ ] **Step 2: `BACKEND.md` 갱신**

어드민 API 섹션을 추가한다.

```md
### `apps/admin-api`

`apps/admin-api`는 관리자용 백엔드 조립 루트다. 플랫폼 API와 별도 Hono 런타임으로 실행되며, 꺼져 있어도 학습자 플랫폼 API는 정상 동작해야 한다.

초기 라우트는 다음과 같다.

- `GET /health`
- `GET /openapi.json`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /courses?include=chapters,lessons`
- `GET /users`

관리자 인증은 Better Auth ID/password를 사용하고, 관리자 인증 테이블은 `admin_user`, `admin_session`, `admin_account`, `admin_verification`을 사용한다.
```

- [ ] **Step 3: `FRONTEND.md` 갱신**

어드민 프론트엔드 원칙을 추가한다.

```md
## 어드민 프론트엔드

`apps/admin`은 운영 도구이므로 전통적인 왼쪽 사이드바 대시보드 구조를 사용한다. `packages/ui`의 shadcn Sidebar 컴포넌트를 조합하고, shadcn `sidebar-07` 블록은 구조 참고용으로만 사용한다.

어드민 앱은 `apps/admin-api`만 호출하며 플랫폼 `apps/api`를 직접 호출하지 않는다. 어드민 API가 내려가면 어드민 화면은 오류 또는 로그인 필요 상태를 표시하지만, 학습자 플랫폼 기능에는 영향을 주지 않는다.
```

- [ ] **Step 4: `docs/admin-site.md` 완료 기록 추가**

`docs/admin-site.md` 끝에 추가한다.

```md
## 2026-05-27 구현 완료

- `apps/admin`과 `apps/admin-api`를 추가했다.
- 관리자 Better Auth 테이블은 `admin_*`로 분리했다.
- 최초 관리자 계정은 `bun --filter @workspace/admin-api seed:admin`으로 생성한다.
- 어드민 화면은 shadcn Sidebar 기반 왼쪽 사이드바 레이아웃을 사용한다.
- 콘텐츠 계층 조회와 사용자 기본 정보 조회를 읽기 전용으로 제공한다.
- 전체 검증은 admin, admin-api, platform API, platform web 테스트와 pre-commit으로 확인했다.
```

- [ ] **Step 5: 전체 검증 실행**

Run:

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/admin-api test
bun --filter @workspace/admin test
bun --filter @workspace/api test
bun --filter @workspace/web test
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin typecheck
bun --filter @workspace/api typecheck
bun --filter @workspace/web typecheck
bun --filter @workspace/admin-api lint
bun --filter @workspace/admin lint
bun --filter @workspace/api lint
bun --filter @workspace/web lint
bun lefthook run pre-commit
```

Expected: 모든 명령 exit code `0`. 기존 lint 경고가 exit code `0`을 유지하면 문서에 기록한다.

- [ ] **Step 6: 로컬 동작 검증**

Run:

```bash
ADMIN_BETTER_AUTH_SECRET=admin-secret \
ADMIN_BETTER_AUTH_URL=http://localhost:4001 \
ADMIN_CORS_ORIGIN=http://localhost:3001 \
DATABASE_URL=file:data/api.sqlite \
ADMIN_SEED_EMAIL=admin@example.com \
ADMIN_SEED_PASSWORD=password-1234 \
bun --filter @workspace/admin-api seed:admin
```

Run:

```bash
bun dev:admin
```

Expected:

- `apps/admin-api`는 `http://localhost:4001`에서 실행된다.
- `apps/admin`은 `http://localhost:3001`에서 실행된다.
- `/login`에서 seed 계정으로 로그인할 수 있다.
- `/courses`에서 콘텐츠 계층을 볼 수 있다.
- `/users`에서 사용자 목록을 볼 수 있다.

- [ ] **Step 7: 플랫폼 독립성 검증**

어드민 서버를 종료한 뒤 실행한다.

```bash
bun --filter @workspace/api test
bun --filter @workspace/web test
```

Expected: PASS. 어드민 런타임이 없어도 플랫폼 테스트가 통과한다.

- [ ] **Step 8: Commit**

```bash
git add ARCHITECTURE.md BACKEND.md FRONTEND.md docs/admin-site.md
git commit -m "어드민 구현 문서 갱신"
```

---

## 실행 순서 요약

1. Task 1로 workspace와 문서 시작 기록을 추가한다.
2. Task 2-4로 공유 DB와 core/admin 계약을 만든다.
3. Task 5-7로 `apps/admin-api` 인증, 조회 API, seed를 만든다.
4. Task 8-10으로 `apps/admin` 로그인, sidebar shell, 조회 화면을 만든다.
5. Task 11로 문서와 전체 검증을 마무리한다.

각 task는 커밋 단위로 끝낸다. 실패 테스트를 먼저 만들고, 실패를 확인한 뒤 최소 구현으로 통과시킨다.

## Self-Review

- Spec coverage: 별도 Next.js 앱, 별도 Hono API, 공유 DB, 관리자 auth 테이블 분리, Better Auth ID/password, seed 생성, RESTful 조회 API, shadcn sidebar-07 기반 layout, 플랫폼 독립성 검증이 모두 task에 포함되어 있다.
- Placeholder scan: `TBD`, `TODO`, `implement later`, `fill in details` 표현은 없다.
- Type consistency: `AdminRepository`, `AdminService`, `AdminApi`, `AdminCourseTreeDto`, `AdminUserListDto` 이름을 task 전반에서 일관되게 사용한다.
