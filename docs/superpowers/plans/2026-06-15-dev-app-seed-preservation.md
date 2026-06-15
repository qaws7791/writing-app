# 개발 앱 seed 보존 구조 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `bun dev:app` 재시작이 학습자의 레슨 완료 기록과 답변 기록을 삭제하지 않도록 개발 DB 시작/seed/초기화 책임을 분리한다.

**Architecture:** 서버 시작 명령은 비파괴 실행만 담당하고, DB 준비와 DB 초기화는 명시적인 별도 명령으로 분리한다. 개발 seed는 콘텐츠 stable id 기준 upsert로 동작하게 하며, seed에서 사라진 콘텐츠는 삭제하지 않고 `archived` 처리해 학습 기록 FK cascade 삭제를 막는다.

**Tech Stack:** Bun 1.3.10, Node 24, TypeScript, Drizzle ORM, Bun SQLite, Vitest, Turbo

---

## 파일 구조

- Modify: `package.json`
  - `dev:app`을 서버 실행 전용 명령으로 변경한다.
  - 명시적 준비/초기화 명령을 추가한다.
- Modify: `packages/db/src/seeds/seed.ts`
  - `clearContentRows` 삭제 흐름을 제거한다.
  - 콘텐츠 seed를 upsert/archive 방식으로 변경한다.
- Modify: `packages/db/src/seeds/seed.test.ts`
  - seed 재실행 시 기존 학습 진행/답변 기록이 보존되는 회귀 테스트를 추가한다.
  - seed에서 빠진 콘텐츠가 삭제되지 않고 archived 처리되는 테스트를 추가한다.
- Modify: `docs/development-tooling.md`
  - `dev:app`, `dev:app:setup`, `dev:app:fresh`, `db:seed`의 의미와 부작용을 문서화한다.
- Optional Modify: `README.md`
  - 개발 서버 시작 명령이 README에 설명되어 있으면 새 명령 구조로 갱신한다.

---

### Task 1: 현재 회귀를 테스트로 고정한다

**Files:**

- Modify: `packages/db/src/seeds/seed.test.ts`

- [ ] **Step 1: failing test 추가**

`packages/db/src/seeds/seed.test.ts`의 import 목록에 학습 기록 테이블과 콘텐츠 테이블을 추가한다.

```ts
import {
  authUsers,
  courses,
  courseUnits,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerProfiles,
  lessons,
  lessonSteps,
} from "@/schema"
```

기존 `describe("개발 DB seed 실행", () => { ... })` 안에 아래 테스트를 추가한다.

```ts
it("seed 재실행 시 기존 학습 진행과 답변 기록을 보존한다", async () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), "kwep-seed-preserve-"))
  const databaseUrl = join(tempDirectory, "api.sqlite")

  try {
    await seedDatabase(databaseUrl)

    const client = createKwepDatabase(databaseUrl)

    try {
      const now = new Date("2026-06-15T00:00:00.000Z")

      client.db
        .insert(learnerLessonProgress)
        .values({
          completedAt: now,
          currentStepIndex: 2,
          lessonId: "l1",
          startedAt: now,
          status: "completed",
          updatedAt: now,
          userId: "user-1",
        })
        .run()

      client.db
        .insert(learnerLessonAnswers)
        .values({
          answeredAt: now,
          answerJson: JSON.stringify({ kind: "test-answer" }),
          lessonId: "l1",
          stepId: "l1-s1",
          updatedAt: now,
          userId: "user-1",
        })
        .run()
    } finally {
      client.close()
    }

    await seedDatabase(databaseUrl)

    const reseededClient = createKwepDatabase(databaseUrl)

    try {
      expect(
        reseededClient.db.select().from(learnerLessonProgress).all()
      ).toEqual([
        expect.objectContaining({
          lessonId: "l1",
          status: "completed",
          userId: "user-1",
        }),
      ])
      expect(
        reseededClient.db.select().from(learnerLessonAnswers).all()
      ).toEqual([
        expect.objectContaining({
          answerJson: JSON.stringify({ kind: "test-answer" }),
          lessonId: "l1",
          stepId: "l1-s1",
          userId: "user-1",
        }),
      ])
    } finally {
      reseededClient.close()
    }
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true })
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run:

```bash
bun --filter @workspace/db test -- src/seeds/seed.test.ts
```

Expected: FAIL. 현재 `seedDatabase`가 콘텐츠 row를 삭제하고 FK cascade로 `learner_lesson_progress`, `learner_lesson_answers`를 삭제하기 때문에 두 expect 중 하나 이상이 빈 배열을 받는다.

- [ ] **Step 3: 커밋**

```bash
git add packages/db/src/seeds/seed.test.ts
git commit -m "seed 기록 보존 회귀 테스트 추가"
```

---

### Task 2: 콘텐츠 seed를 삭제형에서 보존형 upsert로 변경한다

**Files:**

- Modify: `packages/db/src/seeds/seed.ts`
- Test: `packages/db/src/seeds/seed.test.ts`

- [ ] **Step 1: seed 구현 변경**

`packages/db/src/seeds/seed.ts`에서 `seedDatabase`의 아래 흐름을 바꾼다.

Before:

```ts
runBaselineMigration(client.sqlite)
seedDefaultLearner(client)
clearContentRows(client)
await insertContentRows(client)
```

After:

```ts
runBaselineMigration(client.sqlite)
seedDefaultLearner(client)
await upsertContentRows(client)
```

`clearContentRows`와 `insertContentRows`를 제거하고 아래 함수들을 추가한다.

```ts
async function upsertContentRows(client: KwepDatabaseClient): Promise<void> {
  const rows = await createDefaultContentSeedRows()

  archiveMissingContentRows(client, rows)
  upsertCourses(client, rows.courses)
  upsertCourseUnits(client, rows.units)
  upsertLessons(client, rows.lessons)
  upsertLessonSteps(client, rows.steps)
}

function archiveMissingContentRows(
  client: KwepDatabaseClient,
  rows: Awaited<ReturnType<typeof createDefaultContentSeedRows>>
): void {
  const courseIds = rows.courses.map((row) => row.id)
  const unitIds = rows.units.map((row) => row.id)
  const lessonIds = rows.lessons.map((row) => row.id)
  const stepIds = rows.steps.map((row) => row.id)

  archiveRowsNotIn(client, "courses", courseIds)
  archiveRowsNotIn(client, "course_units", unitIds)
  archiveRowsNotIn(client, "lessons", lessonIds)
  archiveRowsNotIn(client, "lesson_steps", stepIds)
}

function archiveRowsNotIn(
  client: KwepDatabaseClient,
  tableName: "course_units" | "courses" | "lesson_steps" | "lessons",
  activeIds: readonly string[]
): void {
  if (activeIds.length === 0) {
    client.sqlite.query(`UPDATE ${tableName} SET status = 'archived'`).run()
    return
  }

  const placeholders = activeIds.map(() => "?").join(", ")

  client.sqlite
    .query(
      `UPDATE ${tableName} SET status = 'archived' WHERE id NOT IN (${placeholders})`
    )
    .run(...activeIds)
}
```

각 테이블 upsert 함수는 Drizzle의 `onConflictDoUpdate`를 사용한다.

```ts
function upsertCourses(
  client: KwepDatabaseClient,
  rows: readonly CourseSeedRow[]
): void {
  for (const row of rows) {
    client.db
      .insert(courses)
      .values(row)
      .onConflictDoUpdate({
        set: {
          category: row.category,
          curriculumRevision: row.curriculumRevision,
          description: row.description,
          sortOrder: row.sortOrder,
          status: row.status,
          title: row.title,
        },
        target: courses.id,
      })
      .run()
  }
}

function upsertCourseUnits(
  client: KwepDatabaseClient,
  rows: readonly CourseUnitSeedRow[]
): void {
  for (const row of rows) {
    client.db
      .insert(courseUnits)
      .values(row)
      .onConflictDoUpdate({
        set: {
          courseId: row.courseId,
          sortOrder: row.sortOrder,
          status: row.status,
          title: row.title,
        },
        target: courseUnits.id,
      })
      .run()
  }
}

function upsertLessons(
  client: KwepDatabaseClient,
  rows: readonly LessonSeedRow[]
): void {
  for (const row of rows) {
    client.db
      .insert(lessons)
      .values(row)
      .onConflictDoUpdate({
        set: {
          category: row.category,
          courseId: row.courseId,
          description: row.description,
          estimatedMinutes: row.estimatedMinutes,
          sortOrder: row.sortOrder,
          status: row.status,
          summaryJson: row.summaryJson,
          title: row.title,
          unitId: row.unitId,
        },
        target: lessons.id,
      })
      .run()
  }
}

function upsertLessonSteps(
  client: KwepDatabaseClient,
  rows: readonly LessonStepSeedRow[]
): void {
  for (const row of rows) {
    client.db
      .insert(lessonSteps)
      .values(row)
      .onConflictDoUpdate({
        set: {
          contentJson: row.contentJson,
          lessonId: row.lessonId,
          sortOrder: row.sortOrder,
          status: row.status,
          type: row.type,
        },
        target: lessonSteps.id,
      })
      .run()
  }
}
```

필요한 type import를 `@workspace/db/seeds/seed-content`에서 추가한다.

```ts
import {
  createDefaultContentSeedRows,
  type CourseSeedRow,
  type CourseUnitSeedRow,
  type LessonSeedRow,
  type LessonStepSeedRow,
} from "@workspace/db/seeds/seed-content"
```

- [ ] **Step 2: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/db test -- src/seeds/seed.test.ts
```

Expected: PASS. 기존 seed 삽입 테스트와 새 기록 보존 테스트가 모두 통과한다.

- [ ] **Step 3: 타입 확인**

Run:

```bash
bun --filter @workspace/db typecheck
```

Expected: PASS.

- [ ] **Step 4: 커밋**

```bash
git add packages/db/src/seeds/seed.ts packages/db/src/seeds/seed.test.ts
git commit -m "개발 seed를 보존형 upsert로 변경"
```

---

### Task 3: seed에서 제외된 콘텐츠를 archived 처리하는 동작을 검증한다

**Files:**

- Modify: `packages/db/src/seeds/seed.test.ts`

- [ ] **Step 1: archived 회귀 테스트 추가**

`packages/db/src/seeds/seed.test.ts`에 아래 테스트를 추가한다.

```ts
it("seed 데이터에 없는 기존 콘텐츠는 삭제하지 않고 archived 처리한다", async () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), "kwep-seed-archive-"))
  const databaseUrl = join(tempDirectory, "api.sqlite")

  try {
    await seedDatabase(databaseUrl)

    const client = createKwepDatabase(databaseUrl)

    try {
      client.db
        .insert(courses)
        .values({
          category: "legacy",
          curriculumRevision: 0,
          description: "이전 개발 콘텐츠",
          id: "legacy-course",
          sortOrder: 999,
          status: "active",
          title: "이전 코스",
        })
        .run()
      client.db
        .insert(courseUnits)
        .values({
          courseId: "legacy-course",
          id: "legacy-unit",
          sortOrder: 1,
          status: "active",
          title: "이전 유닛",
        })
        .run()
      client.db
        .insert(lessons)
        .values({
          category: null,
          courseId: "legacy-course",
          description: null,
          estimatedMinutes: 5,
          id: "legacy-lesson",
          sortOrder: 1,
          status: "active",
          summaryJson: "[]",
          title: "이전 레슨",
          unitId: "legacy-unit",
        })
        .run()
      client.db
        .insert(lessonSteps)
        .values({
          contentJson: "{}",
          id: "legacy-step",
          lessonId: "legacy-lesson",
          sortOrder: 1,
          status: "active",
          type: "READING",
        })
        .run()
    } finally {
      client.close()
    }

    await seedDatabase(databaseUrl)

    const reseededClient = createKwepDatabase(databaseUrl)

    try {
      expect(
        reseededClient.db
          .select()
          .from(courses)
          .all()
          .find((course) => course.id === "legacy-course")
      ).toEqual(expect.objectContaining({ status: "archived" }))
      expect(
        reseededClient.db
          .select()
          .from(lessons)
          .all()
          .find((lesson) => lesson.id === "legacy-lesson")
      ).toEqual(expect.objectContaining({ status: "archived" }))
      expect(
        reseededClient.db
          .select()
          .from(lessonSteps)
          .all()
          .find((step) => step.id === "legacy-step")
      ).toEqual(expect.objectContaining({ status: "archived" }))
    } finally {
      reseededClient.close()
    }
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true })
  }
})
```

- [ ] **Step 2: 테스트 실행**

Run:

```bash
bun --filter @workspace/db test -- src/seeds/seed.test.ts
```

Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add packages/db/src/seeds/seed.test.ts
git commit -m "seed 누락 콘텐츠 보관 처리 검증"
```

---

### Task 4: 개발 명령의 책임을 분리한다

**Files:**

- Modify: `package.json`

- [ ] **Step 1: package script 변경**

`package.json` scripts를 아래 의미로 바꾼다.

```json
{
  "dev:app": "turbo dev --filter=@workspace/web --filter=@workspace/api",
  "dev:app:setup": "bun --filter @workspace/db db:migrate && bun --filter @workspace/db db:seed",
  "dev:app:fresh": "bun run db:reset && bun run dev:app:setup && bun run dev:app",
  "db:reset": "bun --filter @workspace/db db:reset"
}
```

기존 `dev:admin`은 별도 관리자 seed 요구가 있으므로 이 작업에서는 변경하지 않는다.

- [ ] **Step 2: DB reset 스크립트가 없어서 실패하는지 확인**

Run:

```bash
bun run db:reset
```

Expected: FAIL. `@workspace/db`에 `db:reset` script가 아직 없다는 오류가 난다.

- [ ] **Step 3: 커밋 보류**

이 Task는 `packages/db/package.json`의 reset 구현과 함께 커밋한다.

---

### Task 5: 명시적 DB reset 명령을 추가한다

**Files:**

- Modify: `packages/db/package.json`
- Create: `packages/db/src/scripts/reset-database.ts`

- [ ] **Step 1: reset script 파일 생성**

Create `packages/db/src/scripts/reset-database.ts`.

```ts
import { existsSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { getDefaultDatabaseUrl } from "@workspace/db/client"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const databasePath = getDatabaseFilePath(databaseUrl)

if (databasePath === null) {
  throw new Error("Cannot reset an in-memory database.")
}

for (const path of [
  databasePath,
  `${databasePath}-shm`,
  `${databasePath}-wal`,
]) {
  if (existsSync(path)) {
    rmSync(path, { force: true })
  }
}

function getDatabaseFilePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") {
    return null
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl)
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}
```

- [ ] **Step 2: package script 추가**

`packages/db/package.json` scripts에 추가한다.

```json
{
  "db:reset": "bun src/scripts/reset-database.ts"
}
```

- [ ] **Step 3: reset 명령 동작 확인**

주의: 이 명령은 현재 개발 DB를 삭제한다. 작업 중 실제 개발 데이터 보존이 필요하면 임시 DB URL로 검증한다.

Run:

```bash
$env:DATABASE_URL = "$env:TEMP\\kwep-reset-test.sqlite"; bun --filter @workspace/db db:seed; bun --filter @workspace/db db:reset
```

Expected: command exits 0 and `%TEMP%\kwep-reset-test.sqlite` no longer exists.

- [ ] **Step 4: root scripts 확인**

Run:

```bash
bun run dev:app:setup
```

Expected: migration과 seed가 성공한다. 기존 학습 기록이 있으면 seed 재실행 후에도 보존된다.

- [ ] **Step 5: 커밋**

```bash
git add package.json packages/db/package.json packages/db/src/scripts/reset-database.ts
git commit -m "개발 DB 초기화 명령 분리"
```

---

### Task 6: 문서에 개발 DB 명령 정책을 기록한다

**Files:**

- Modify: `docs/development-tooling.md`
- Optional Modify: `README.md`

- [ ] **Step 1: development-tooling 문서 갱신**

`docs/development-tooling.md`에 아래 섹션을 추가한다.

````md
## 개발 앱 실행과 DB seed 정책

`bun dev:app`은 웹 앱과 API 서버만 시작한다. 이 명령은 개발 DB를 seed하거나 초기화하지 않는다.

처음 개발 환경을 준비하거나 baseline migration과 기본 콘텐츠 seed를 적용해야 할 때는 아래 명령을 사용한다.

```bash
bun run dev:app:setup
```
````

`dev:app:setup`은 migration과 보존형 seed를 실행한다. 보존형 seed는 기본 콘텐츠를 stable id 기준으로 갱신하며, 기존 학습 진행 기록과 답변 기록을 삭제하지 않는다. seed 데이터에서 사라진 콘텐츠는 삭제하지 않고 `archived` 상태로 전환한다.

개발 DB를 완전히 초기화해야 할 때만 아래 명령을 명시적으로 사용한다.

```bash
bun run db:reset
```

깨끗한 DB로 앱을 시작해야 하면 아래 명령을 사용한다.

```bash
bun run dev:app:fresh
```

`db:reset`과 `dev:app:fresh`는 기존 개발 DB 파일을 삭제할 수 있으므로, 학습 진행 기록 보존이 필요한 상황에서는 사용하지 않는다.

````

- [ ] **Step 2: README 확인 후 필요 시 갱신**

Run:

```bash
rg -n "dev:app|db:seed|dev:app:setup" README.md docs
````

Expected: 기존 설명이 있으면 새 명령 의미와 일치하게 바꾼다. 설명이 없으면 README는 건드리지 않는다.

- [ ] **Step 3: 커밋**

```bash
git add docs/development-tooling.md README.md
git commit -m "개발 DB 명령 정책 문서화"
```

---

### Task 7: 전체 검증

**Files:**

- No code changes

- [ ] **Step 1: DB 패키지 테스트**

Run:

```bash
bun --filter @workspace/db test
```

Expected: PASS.

- [ ] **Step 2: DB 패키지 타입 검사**

Run:

```bash
bun --filter @workspace/db typecheck
```

Expected: PASS.

- [ ] **Step 3: API 진행 조회 관련 테스트**

Run:

```bash
bun --filter @workspace/api test -- src/routes/progress.route.test.ts src/routes/learning.route.test.ts
```

Expected: PASS.

- [ ] **Step 4: 전체 lint/typecheck 가능한 범위 실행**

Run:

```bash
bun run typecheck
bun run lint
```

Expected: PASS. 저장소의 기존 unrelated 실패가 있으면 실패 파일과 오류를 기록하고, 이번 변경으로 인한 실패인지 구분한다.

- [ ] **Step 5: pre-commit 검증**

Run:

```bash
bun lefthook run pre-commit
```

Expected: PASS.

- [ ] **Step 6: 최종 커밋 필요 여부 확인**

Run:

```bash
git status --short
```

Expected: 작업 트리가 clean이거나 의도한 변경만 남아 있다. 남은 변경이 있으면 한국어 커밋 메시지로 커밋한다.

---

## Self-Review

**Spec coverage:** 계획은 `bun dev:app`의 비파괴화, 명시적 초기화 명령, 보존형 seed, cascade 삭제 회귀 테스트, 문서화를 모두 포함한다.

**Placeholder scan:** `TBD`, `TODO`, “적절히 처리” 같은 빈 지시어를 사용하지 않았다.

**Type consistency:** 계획에서 사용하는 seed row type 이름은 `packages/db/src/seeds/seed-content.ts`의 `CourseSeedRow`, `CourseUnitSeedRow`, `LessonSeedRow`, `LessonStepSeedRow`와 일치한다.

**Risk:** `archiveRowsNotIn`은 table name을 제한된 union type으로 받고 seed 내부에서만 호출한다. SQL placeholder는 값에만 사용하며 table name은 고정 문자열 union으로 제한한다.
