# Admin Course Detail Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 코스 상세 페이지를 draft 기반 코스 스튜디오로 구현해 코스 기본 정보, 챕터, 레슨, 20개 스텝 타입을 명시적 저장 모델로 편집한다.

**Architecture:** 조회는 `courses/:courseId/curriculum` 하위 리소스로 나누고, 변경 작업은 draft 생성, 복원, content 저장, 발행, 폐기 command로 분리한다. 클라이언트는 서버 snapshot을 `workingCopy`로 복사해 URL 상태, dirty 상태, DnD 정렬, 전용 스텝 폼을 관리하고 상단 저장에서 전체 snapshot을 보낸다.

**Tech Stack:** Bun, TypeScript, Next.js App Router, Hono, Drizzle SQLite, Zod, Vitest, Testing Library, `@dnd-kit`.

---

## File Structure

- `docs/admin-site.md`: 구현 시작과 완료 기록.
- `packages/db/src/schema/content.schema.ts`: `curriculum_versions.revision`, `lesson_steps.status`, `curriculum_version_steps` 추가.
- `packages/db/src/migrations/0007-admin-course-editor.sql`: 기존 row backfill migration.
- `packages/core/src/admin/admin.dto.ts`: course detail, editor version detail, lesson detail, save snapshot, restore request DTO 추가.
- `packages/core/src/admin/admin.errors.ts`: conflict error DTO 추가.
- `packages/core/src/admin/admin.repository.ts`: editor read/write repository 계약 추가.
- `packages/core/src/admin/admin.service.ts`: DTO parsing과 repository result mapping.
- `packages/core/src/admin/admin.service.test.ts`: service 경계 테스트.
- `packages/db/src/repositories/drizzle-admin.repository.ts`: editor 조회, 저장, 복원, 폐기 구현.
- `packages/db/src/repositories/drizzle-admin.repository.test.ts`: DB 트랜잭션과 버전 정책 테스트.
- `apps/admin-api/src/routes/curriculum-editor.route.ts`: 새 editor route.
- `apps/admin-api/src/app.test.ts`: editor route 인증, 성공, 오류 매핑 테스트.
- `apps/admin-api/src/app.ts`: 새 route 등록.
- `apps/admin/src/lib/api/admin-api.ts`: admin client port 확장.
- `apps/admin/src/lib/api/http-admin-api.ts`: HTTP adapter 메서드 추가.
- `apps/admin/src/lib/api/http-admin-api.test.ts`: URL, method, body 테스트.
- `apps/admin/src/app/(admin)/courses/[id]/page.tsx`: query를 읽어 상세 페이지에 전달.
- `apps/admin/src/features/courses/admin-course-detail-page.tsx`: 서버 데이터 로딩과 editor shell 연결.
- `apps/admin/src/features/courses/course-editor/editor-state.ts`: working copy reducer와 dirty 계산 입력.
- `apps/admin/src/features/courses/course-editor/editor-url-state.ts`: query parse/build.
- `apps/admin/src/features/courses/course-editor/editor-change-kind.ts`: 변경 유형 계산.
- `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`: 전체 2컬럼 화면.
- `apps/admin/src/features/courses/course-editor/course-editor-header.tsx`: 저장, 버전 메뉴, 상태 표시.
- `apps/admin/src/features/courses/course-editor/course-summary-panel.tsx`: 코스 제작 요약과 기본 정보 편집.
- `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`: 챕터/레슨 트리와 DnD.
- `apps/admin/src/features/courses/course-editor/lesson-workspace.tsx`: 레슨 작업대와 learning sequence.
- `apps/admin/src/features/courses/course-editor/step-workspace.tsx`: 스텝 상세 작업대.
- `apps/admin/src/features/courses/course-editor/lesson-preview.tsx`: working copy 기반 미리보기.
- `apps/admin/src/features/courses/course-editor/step-forms/*.tsx`: 20개 스텝 타입 전용 폼.
- `apps/admin/src/features/courses/course-editor/*.test.tsx`: editor UI와 순수 로직 테스트.

---

### Task 1: 문서에 구현 시작 기록

**Files:**

- Modify: `docs/admin-site.md`

- [ ] **Step 1: Add implementation start entry**

Add this section directly below `# 어드민 사이트`.

```md
## 2026-05-28 어드민 코스 상세 에디터 구현 시작

- 설계 문서 `docs/superpowers/specs/2026-05-28-admin-course-detail-editor-design.md`를 기준으로 구현을 시작한다.
- 구현은 DB 스키마, core/admin 계약, admin-api route, admin UI 순서로 진행한다.
- 코스 상세 편집은 draft 커리큘럼 버전에만 적용하고, 상단 저장에서 전체 snapshot을 반영한다.
```

- [ ] **Step 2: Run formatting check**

Run: `bunx prettier --check docs/admin-site.md`

Expected: `All matched files use Prettier code style!`

- [ ] **Step 3: Commit**

```bash
git add docs/admin-site.md
git commit -m "어드민 코스 상세 에디터 구현 시작"
```

---

### Task 2: DB 스키마와 migration 추가

**Files:**

- Modify: `packages/db/src/schema/content.schema.ts`
- Create: `packages/db/src/migrations/0007-admin-course-editor.sql`
- Test: `packages/db/src/repositories/drizzle-admin.repository.test.ts`

- [ ] **Step 1: Write failing DB schema behavior test**

Append this test to `packages/db/src/repositories/drizzle-admin.repository.test.ts`.

```ts
it("tracks curriculum revision and active lesson step status", async () => {
  const repository = createDrizzleAdminRepository(db)
  const version = await repository.getCourseCurriculumVersionDetail(
    "sentence-structure",
    "sentence-structure-v1"
  )

  expect(version?.revision).toBe(1)

  const lesson = await repository.getCourseLessonDetail(
    "sentence-structure",
    "sentence-structure-01"
  )

  expect(lesson?.steps[0]?.status).toBe("active")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "tracks curriculum revision"`

Expected: FAIL because `getCourseCurriculumVersionDetail` and `getCourseLessonDetail` do not exist.

- [ ] **Step 3: Update schema**

In `packages/db/src/schema/content.schema.ts`, add `revision` to `curriculumVersions` and `status` to `lessonSteps`.

```ts
export const curriculumVersions = sqliteTable(
  "curriculum_versions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    versionNumber: integer("version_number").notNull(),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    }).notNull(),
    title: text("title").notNull(),
    changelog: text("changelog").notNull(),
    revision: integer("revision").notNull().default(1),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_versions_course_version_idx").on(
      table.courseId,
      table.versionNumber
    ),
  ]
)

export const lessonSteps = sqliteTable("lesson_steps", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  type: text("type", {
    enum: [
      "INTRO",
      "CONCEPT",
      "READING_PASSAGE",
      "EXAMPLE_REVEAL",
      "COMPARE",
      "MULTIPLE_CHOICE",
      "FILL_BLANK",
      "WORD_SELECT",
      "REORDER",
      "MATCH",
      "CLASSIFY",
      "SHORT_WRITE",
      "LONG_WRITE",
      "AI_FEEDBACK",
      "REVISION",
      "CHECKLIST",
      "REFLECTION",
      "SUMMARY",
      "TRANSCRIBE",
      "COMPLETE",
    ],
  }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  points: integer("points").notNull(),
  required: integer("required", { mode: "boolean" }).notNull(),
  status: text("status", {
    enum: ["active", "deprecated", "archived"],
  })
    .notNull()
    .default("active"),
  contentJson: text("content_json").notNull(),
})
```

- [ ] **Step 4: Create migration**

Create `packages/db/src/migrations/0007-admin-course-editor.sql`.

```sql
ALTER TABLE curriculum_versions
ADD COLUMN revision integer NOT NULL DEFAULT 1;

ALTER TABLE lesson_steps
ADD COLUMN status text NOT NULL DEFAULT 'active';
```

- [ ] **Step 5: Run focused DB test**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "tracks curriculum revision"`

Expected: FAIL because repository methods are still missing.

- [x] **Step 6: Commit**

```bash
git add packages/db/src/schema/content.schema.ts packages/db/src/migrations/0007-admin-course-editor.sql packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "코스 에디터 스키마 추가"
```

---

### Task 3: Core admin DTO와 repository 계약 추가

**Files:**

- Modify: `packages/core/src/admin/admin.dto.ts`
- Modify: `packages/core/src/admin/admin.errors.ts`
- Modify: `packages/core/src/admin/admin.repository.ts`
- Test: `packages/core/src/admin/admin.service.test.ts`

- [ ] **Step 1: Write failing service tests**

Append these tests to `packages/core/src/admin/admin.service.test.ts`.

```ts
it("returns course detail for the editor", async () => {
  const service = createAdminService({
    repository: {
      ...repository,
      getCourseDetail: async () => ({
        id: "sentence-structure",
        title: "기초 문장 만들기",
        description: "문장의 뼈대를 세웁니다.",
        thumbnailPath: "/course-thumbnails/sentence.png",
        sortOrder: 1,
      }),
    },
  })

  await expect(service.getCourseDetail("sentence-structure")).resolves.toEqual({
    status: "ok",
    value: {
      id: "sentence-structure",
      title: "기초 문장 만들기",
      description: "문장의 뼈대를 세웁니다.",
      thumbnailPath: "/course-thumbnails/sentence.png",
      sortOrder: 1,
    },
  })
})

it("maps save draft content conflicts", async () => {
  const service = createAdminService({
    repository: {
      ...repository,
      saveCurriculumVersionContent: async () => ({
        status: "conflict",
        error: {
          code: "conflict",
          message: "Curriculum version has changed.",
        },
      }),
    },
  })

  await expect(
    service.saveCurriculumVersionContent({
      courseId: "sentence-structure",
      versionId: "sentence-structure-v2",
      baseRevision: 1,
      course: {
        title: "기초 문장 만들기",
        description: "문장의 뼈대를 세웁니다.",
        thumbnailPath: "/course-thumbnails/sentence.png",
        sortOrder: 1,
      },
      chapters: [],
      lessons: [],
      steps: [],
    })
  ).resolves.toEqual({
    status: "conflict",
    error: {
      code: "conflict",
      message: "Curriculum version has changed.",
    },
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/core test -- admin.service.test.ts -t "editor|conflicts"`

Expected: FAIL because DTOs and service methods do not exist.

- [ ] **Step 3: Add conflict error schema**

In `packages/core/src/admin/admin.errors.ts`, add this schema and include it in exported `AdminErrorDto`.

```ts
export const adminConflictErrorDtoSchema = z.object({
  code: z.literal("conflict"),
  message: z.string().min(1),
})

export type AdminConflictErrorDto = z.infer<typeof adminConflictErrorDtoSchema>
```

- [ ] **Step 4: Add editor DTOs**

In `packages/core/src/admin/admin.dto.ts`, add these schemas after the existing course list schemas.

```ts
export const adminCourseDetailDtoSchema = adminCourseListItemDtoSchema

export const adminEditorStepTypeSchema = z.enum([
  "INTRO",
  "CONCEPT",
  "READING_PASSAGE",
  "EXAMPLE_REVEAL",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "WORD_SELECT",
  "REORDER",
  "MATCH",
  "CLASSIFY",
  "SHORT_WRITE",
  "LONG_WRITE",
  "AI_FEEDBACK",
  "REVISION",
  "CHECKLIST",
  "REFLECTION",
  "SUMMARY",
  "TRANSCRIBE",
  "COMPLETE",
])

export const adminEditorStepSummaryDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  type: adminEditorStepTypeSchema,
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
  points: z.number().int().nonnegative(),
  required: z.boolean(),
  status: adminCurriculumNodeStatusSchema,
})

export const adminEditorLessonDetailDtoSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  categoryId: z.string().min(1),
  unitNumber: z.number().int().positive(),
  nextLessonId: z.string().min(1).nullable(),
  steps: z.array(
    adminEditorStepSummaryDtoSchema.extend({
      content: z.unknown(),
    })
  ),
})

export const adminEditorCurriculumVersionDetailDtoSchema =
  adminCurriculumVersionDetailDtoSchema.extend({
    revision: z.number().int().positive(),
    steps: z.array(adminEditorStepSummaryDtoSchema),
  })

export const adminRestoreCurriculumDraftRequestDtoSchema = z.object({
  sourceVersionId: z.string().min(1),
  replaceDraft: z.boolean(),
})

export const adminSaveCurriculumVersionContentRequestDtoSchema = z.object({
  courseId: z.string().min(1),
  versionId: z.string().min(1),
  baseRevision: z.number().int().positive(),
  course: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    thumbnailPath: z.string().min(1),
    sortOrder: z.number().int().positive(),
  }),
  chapters: z.array(
    adminCurriculumVersionChapterDtoSchema.omit({ lessons: true })
  ),
  lessons: z.array(
    adminCurriculumVersionLessonDtoSchema.extend({
      chapterId: z.string().min(1),
    })
  ),
  steps: z.array(
    adminEditorStepSummaryDtoSchema.extend({
      content: z.unknown(),
    })
  ),
})
```

Export inferred types with names matching the schemas.

- [ ] **Step 5: Extend repository contract**

In `packages/core/src/admin/admin.repository.ts`, add result types and interface methods.

```ts
export type AdminSaveCurriculumVersionContentRepositoryResult =
  | {
      status: "saved"
      version: AdminEditorCurriculumVersionDetailDto
    }
  | {
      status: "conflict"
      error: AdminConflictErrorDto
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }

export type AdminDiscardCurriculumVersionRepositoryResult =
  | {
      status: "discarded"
      versionId: string
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }
```

Add methods:

```ts
getCourseDetail(courseId: string): Promise<AdminCourseDetailDto | undefined>
getCourseCurriculumVersionDetail(
  courseId: string,
  versionId: string
): Promise<AdminEditorCurriculumVersionDetailDto | undefined>
getCourseLessonDetail(
  courseId: string,
  lessonId: string
): Promise<AdminEditorLessonDetailDto | undefined>
restoreCurriculumDraft(
  courseId: string,
  input: AdminRestoreCurriculumDraftRequestDto
): Promise<AdminCreateCurriculumDraftRepositoryResult>
saveCurriculumVersionContent(
  input: AdminSaveCurriculumVersionContentRequestDto
): Promise<AdminSaveCurriculumVersionContentRepositoryResult>
discardCurriculumVersion(
  courseId: string,
  versionId: string
): Promise<AdminDiscardCurriculumVersionRepositoryResult>
```

- [ ] **Step 6: Run core tests**

Run: `bun --filter @workspace/core test -- admin.service.test.ts -t "editor|conflicts"`

Expected: FAIL because service methods are not implemented.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.errors.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.test.ts
git commit -m "어드민 코스 에디터 계약 추가"
```

---

### Task 4: Core admin service 구현

**Files:**

- Modify: `packages/core/src/admin/admin.service.ts`
- Test: `packages/core/src/admin/admin.service.test.ts`

- [ ] **Step 1: Extend service interface**

Add methods to `AdminService`.

```ts
getCourseDetail(
  courseId: string
): Promise<AdminCurriculumVersionServiceResult<AdminCourseDetailDto>>
getCourseCurriculumVersionDetail(
  courseId: string,
  versionId: string
): Promise<
  AdminCurriculumVersionServiceResult<AdminEditorCurriculumVersionDetailDto>
>
getCourseLessonDetail(
  courseId: string,
  lessonId: string
): Promise<AdminCurriculumVersionServiceResult<AdminEditorLessonDetailDto>>
restoreCurriculumDraft(
  courseId: string,
  input: AdminRestoreCurriculumDraftRequestDto
): Promise<
  AdminCurriculumVersionServiceResult<AdminCurriculumVersionSummaryDto>
>
saveCurriculumVersionContent(
  input: AdminSaveCurriculumVersionContentRequestDto
): Promise<
  | AdminCurriculumVersionServiceResult<AdminEditorCurriculumVersionDetailDto>
  | ConflictResult
>
discardCurriculumVersion(
  courseId: string,
  versionId: string
): Promise<AdminCurriculumVersionServiceResult<{ versionId: string }>>
```

Define `ConflictResult` near existing result types.

```ts
type ConflictResult = {
  status: "conflict"
  error: AdminConflictErrorDto
}
```

- [ ] **Step 2: Implement service methods**

Add methods to the object returned by `createAdminService`.

```ts
async getCourseDetail(courseId) {
  try {
    const course = await repository.getCourseDetail(courseId)

    if (!course) {
      return {
        status: "not-found",
        error: {
          code: "not-found",
          message: "Course was not found.",
        },
      }
    }

    return {
      status: "ok",
      value: adminCourseDetailDtoSchema.parse(course),
    }
  } catch {
    return unavailableResult
  }
}
```

Use the same pattern for `getCourseCurriculumVersionDetail`, `getCourseLessonDetail`, `restoreCurriculumDraft`, `saveCurriculumVersionContent`, and `discardCurriculumVersion`. For repository results, return `invalid-request`, `not-found`, and `conflict` unchanged. Parse successful values through their DTO schemas.

- [ ] **Step 3: Run focused core tests**

Run: `bun --filter @workspace/core test -- admin.service.test.ts -t "editor|conflicts"`

Expected: PASS.

- [ ] **Step 4: Run all core tests**

Run: `bun --filter @workspace/core test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts
git commit -m "어드민 코스 에디터 서비스 구현"
```

---

### Task 5: DB repository editor 조회 구현

**Files:**

- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Test: `packages/db/src/repositories/drizzle-admin.repository.test.ts`

- [ ] **Step 1: Write failing read tests**

Add these tests to `packages/db/src/repositories/drizzle-admin.repository.test.ts`.

```ts
it("returns course detail for a course", async () => {
  const repository = createDrizzleAdminRepository(db)

  await expect(
    repository.getCourseDetail("sentence-structure")
  ).resolves.toMatchObject({
    id: "sentence-structure",
    title: "기초 문장 만들기",
    thumbnailPath: expect.stringContaining("course-thumbnails"),
  })
})

it("returns curriculum version detail with step summaries", async () => {
  const repository = createDrizzleAdminRepository(db)
  const version = await repository.getCourseCurriculumVersionDetail(
    "sentence-structure",
    "sentence-structure-v1"
  )

  expect(version?.status).toBe("published")
  expect(version?.revision).toBe(1)
  expect(version?.chapters.length).toBeGreaterThan(0)
  expect(version?.steps.length).toBeGreaterThan(0)
  expect(version?.steps[0]).toMatchObject({
    status: "active",
    required: expect.any(Boolean),
  })
})

it("returns lesson detail with parsed step content", async () => {
  const repository = createDrizzleAdminRepository(db)
  const lesson = await repository.getCourseLessonDetail(
    "sentence-structure",
    "sentence-structure-01"
  )

  expect(lesson?.courseId).toBe("sentence-structure")
  expect(lesson?.steps[0]?.content).toEqual(expect.any(Object))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "returns course detail|returns curriculum version detail|returns lesson detail"`

Expected: FAIL because repository methods are missing.

- [ ] **Step 3: Implement read methods**

In `createDrizzleAdminRepository`, add `getCourseDetail`, `getCourseCurriculumVersionDetail`, and `getCourseLessonDetail`. Reuse existing `mapCurriculumVersionDetail` style, then extend it with `revision` and `steps`.

Step mapping must parse `contentJson`.

```ts
function mapEditorStep(step: LessonStepRow): AdminEditorStepSummaryDto & {
  content: unknown
} {
  return {
    id: step.id,
    lessonId: step.lessonId,
    type: step.type,
    title: step.type,
    sortOrder: step.sortOrder,
    points: step.points,
    required: step.required,
    status: step.status,
    content: JSON.parse(step.contentJson) as unknown,
  }
}
```

For summaries inside curriculum version detail, omit `content` and use the same rows from all lessons in the version. Query only lessons that belong to the requested course and version.

- [ ] **Step 4: Run focused DB tests**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "returns course detail|returns curriculum version detail|returns lesson detail|tracks curriculum revision"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "어드민 코스 에디터 조회 구현"
```

---

### Task 6: DB repository 저장, 복원, 폐기 구현

### Task 5.5: 버전별 스텝 snapshot 추가

**Files:**

- Modify: `packages/db/src/schema/content.schema.ts`
- Create: `packages/db/src/migrations/0008-curriculum-version-steps.sql`
- Modify: `packages/db/src/migrations/run-content-migration.ts`
- Modify: `packages/db/src/seeds/seed-content.ts`
- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-admin.repository.test.ts`

- [ ] **Step 1: Write failing snapshot isolation test**

Add a DB test that creates a draft, changes a draft step snapshot, and verifies the published version still reads the original step content.

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "keeps draft step changes isolated"`

Expected: FAIL because `curriculum_version_steps` does not exist yet.

- [ ] **Step 2: Add schema and migration**

Add `curriculumVersionSteps` with `curriculumVersionId`, `lessonId`, `sourceStepId`, step type, sort order, points, required, status, and `contentJson`. Use `0008-curriculum-version-steps.sql` to create the table and copy existing `lesson_steps` rows into every current curriculum version that includes the lesson.

- [ ] **Step 3: Populate seed snapshots**

Update `seedContent` so seeded `v1` rows include version step snapshots. Keep original `lesson_steps` as immutable source rows for backfill and compatibility.

- [ ] **Step 4: Read editor steps from version snapshots**

Update `getCourseCurriculumVersionDetail` and `getCourseLessonDetail` to read `curriculum_version_steps` for the requested version. `getCourseLessonDetail` must take the current editor version ID through the admin API route and service path before UI work starts.

- [ ] **Step 5: Clone step snapshots with drafts**

Update `createCurriculumDraft` and `restoreCurriculumDraft` so draft versions receive copied step snapshots from the source version.

- [ ] **Step 6: Run focused DB tests**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "step snapshot|returns curriculum version detail|returns lesson detail"`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/db/src/schema/content.schema.ts packages/db/src/migrations/0008-curriculum-version-steps.sql packages/db/src/migrations/run-content-migration.ts packages/db/src/seeds/seed-content.ts packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "커리큘럼 버전 스텝 스냅샷 추가"
```

**Files:**

- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Test: `packages/db/src/repositories/drizzle-admin.repository.test.ts`

- [ ] **Step 1: Write failing mutation tests**

Add tests covering save, conflict, published rejection, restore, and discard.

```ts
it("saves draft content snapshot and increments revision", async () => {
  const repository = createDrizzleAdminRepository(db)
  const draft = await repository.createCurriculumDraft("sentence-structure")

  expect(draft.status).toBe("created")
  if (draft.status !== "created") {
    throw new Error("Expected draft.")
  }

  const result = await repository.saveCurriculumVersionContent({
    courseId: "sentence-structure",
    versionId: draft.version.id,
    baseRevision: 1,
    course: {
      title: "기초 문장 만들기 수정",
      description: "수정된 설명",
      thumbnailPath: "/course-thumbnails/sentence.png",
      sortOrder: 1,
    },
    chapters: [],
    lessons: [],
    steps: [],
  })

  expect(result.status).toBe("saved")
  if (result.status === "saved") {
    expect(result.version.revision).toBe(2)
  }
})

it("rejects save when base revision is stale", async () => {
  const repository = createDrizzleAdminRepository(db)
  const result = await repository.saveCurriculumVersionContent({
    courseId: "sentence-structure",
    versionId: "sentence-structure-v1",
    baseRevision: 999,
    course: {
      title: "기초 문장 만들기",
      description: "설명",
      thumbnailPath: "/course-thumbnails/sentence.png",
      sortOrder: 1,
    },
    chapters: [],
    lessons: [],
    steps: [],
  })

  expect(result).toEqual({
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message: "Only draft curriculum versions can be saved.",
    },
  })
})

it("restores a published version into a new draft", async () => {
  const repository = createDrizzleAdminRepository(db)

  const result = await repository.restoreCurriculumDraft("sentence-structure", {
    sourceVersionId: "sentence-structure-v1",
    replaceDraft: false,
  })

  expect(result.status).toBe("created")
})

it("discards a draft curriculum version", async () => {
  const repository = createDrizzleAdminRepository(db)
  const draft = await repository.createCurriculumDraft("sentence-structure")

  if (draft.status !== "created") {
    throw new Error("Expected draft.")
  }

  await expect(
    repository.discardCurriculumVersion("sentence-structure", draft.version.id)
  ).resolves.toEqual({
    status: "discarded",
    versionId: draft.version.id,
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "saves draft|base revision|restores|discards"`

Expected: FAIL because mutation methods are missing.

- [ ] **Step 3: Implement mutations**

Implement `restoreCurriculumDraft` by reusing the existing draft clone logic from `createCurriculumDraft`. If `replaceDraft` is true, delete the current draft snapshot rows inside the same transaction before cloning source rows.

Implement `saveCurriculumVersionContent` in a transaction:

```ts
const version = await tx.query.curriculumVersions.findFirst({
  where: and(
    eq(curriculumVersions.id, input.versionId),
    eq(curriculumVersions.courseId, input.courseId)
  ),
})

if (!version) {
  return {
    status: "not-found",
    error: {
      code: "not-found",
      message: "Curriculum version was not found.",
    },
  }
}

if (version.status !== "draft") {
  return {
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message: "Only draft curriculum versions can be saved.",
    },
  }
}

if (version.revision !== input.baseRevision) {
  return {
    status: "conflict",
    error: {
      code: "conflict",
      message: "Curriculum version has changed.",
    },
  }
}
```

Then update `courses`, replace draft chapter and lesson snapshot rows, replace draft `curriculum_version_steps`, increment `curriculum_versions.revision`, and return the fresh editor version detail. Do not update original `lesson_steps` from the draft save path.

Implement `discardCurriculumVersion` so it only accepts draft versions for the course. Remove draft snapshot rows and the draft version row in one transaction.

- [ ] **Step 4: Run focused DB tests**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts -t "saves draft|base revision|restores|discards"`

Expected: PASS.

- [ ] **Step 5: Run all DB tests**

Run: `bun --filter @workspace/db test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "어드민 코스 에디터 저장 구현"
```

---

### Task 7: Admin API route 추가

**Files:**

- Create: `apps/admin-api/src/routes/curriculum-editor.route.ts`
- Modify: `apps/admin-api/src/app.ts`
- Modify: `apps/admin-api/src/app.test.ts`

- [x] **Step 1: Write failing route tests**

Append tests to `apps/admin-api/src/app.test.ts`, using the existing `createTestApp()` helper and the existing `adminService` fixture in that file.

```ts
it("returns protected course detail for the editor", async () => {
  const response = await createTestApp().request("/courses/sentence-structure")

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toMatchObject({
    id: "sentence-structure",
    title: "문장 구조의 기본",
  })
})

it("rejects unauthenticated course editor access", async () => {
  const response = await createTestApp({
    auth: {
      ...auth,
      async getSession() {
        return null
      },
    },
  }).request("/courses/sentence-structure")

  expect(response.status).toBe(401)
})

it("returns 400 for invalid restore body", async () => {
  const response = await createTestApp().request(
    "/courses/sentence-structure/curriculum/restores",
    {
      method: "POST",
      body: JSON.stringify({ sourceVersionId: "" }),
      headers: {
        "content-type": "application/json",
      },
    }
  )

  expect(response.status).toBe(400)
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/admin-api test -- app.test.ts -t "course editor|restore body"`

Expected: FAIL because the route file is not registered.

Actual: `app.test.ts`의 새 editor route 테스트가 404와 OpenAPI 경로 누락으로 실패하는 것을 확인했다.

- [x] **Step 3: Implement route file**

Create `apps/admin-api/src/routes/curriculum-editor.route.ts`.

```ts
import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCourseDetailDtoSchema,
  adminEditorCurriculumVersionDetailDtoSchema,
  adminEditorLessonDetailDtoSchema,
  adminRestoreCurriculumDraftRequestDtoSchema,
  adminSaveCurriculumVersionContentRequestDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"

export function registerCurriculumEditorRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get("/courses/:courseId", requireAdminSession(auth), async (context) => {
    const result = await adminService.getCourseDetail(
      context.req.param("courseId")
    )

    switch (result.status) {
      case "ok":
        return context.json(result.value)
      case "not-found":
        return context.json(result.error, 404)
      case "unavailable":
        return context.json(result.error, 503)
      case "invalid-request":
        return context.json(result.error, 400)
    }
  })
}
```

Add the other routes with the same switch pattern:

```text
GET /courses/:courseId/curriculum/versions/:versionId
GET /courses/:courseId/lessons/:lessonId
POST /courses/:courseId/curriculum/drafts
POST /courses/:courseId/curriculum/restores
PUT /courses/:courseId/curriculum/versions/:versionId/content
POST /courses/:courseId/curriculum/versions/:versionId/publish
POST /courses/:courseId/curriculum/versions/:versionId/discard
```

For `PUT .../content`, map service `conflict` to HTTP 409.

- [x] **Step 4: Register route**

In `apps/admin-api/src/app.ts`, import and call `registerCurriculumEditorRoute` after auth route and before broader course routes if path conflicts require precedence.

- [x] **Step 5: Run admin-api tests**

Run: `bun --filter @workspace/admin-api test -- app.test.ts -t "course editor|restore body"`

Expected: PASS.

Actual: focused editor route tests passed. `bun --filter @workspace/admin-api test` and `bun --filter @workspace/admin-api typecheck` also passed.

- [x] **Step 6: Commit**

```bash
git add apps/admin-api/src/routes/curriculum-editor.route.ts apps/admin-api/src/app.ts apps/admin-api/src/app.test.ts
git commit -m "어드민 코스 에디터 API 추가"
```

---

### Task 8: Admin HTTP client 확장

**Files:**

- Modify: `apps/admin/src/lib/api/admin-api.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.test.ts`

- [x] **Step 1: Write failing client tests**

Add tests to `apps/admin/src/lib/api/http-admin-api.test.ts`.

```ts
it("requests course detail", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    createJsonResponse({
      id: "sentence-structure",
      title: "기초 문장 만들기",
      description: "설명",
      thumbnailPath: "/course-thumbnails/sentence.png",
      sortOrder: 1,
    })
  )
  const api = createHttpAdminApi({
    baseUrl: "http://localhost:4001",
    fetch: fetchMock,
  })

  await api.getCourseDetail("sentence-structure")

  const request = getRequest(fetchMock)
  expect(request.url).toBe("http://localhost:4001/courses/sentence-structure")
  expect(request.method).toBe("GET")
})

it("saves curriculum content with PUT body", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    createJsonResponse({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "draft",
      title: "v2",
      changelog: "draft",
      publishedAt: null,
      createdAt: "2026-05-28T00:00:00.000Z",
      revision: 2,
      chapters: [],
      steps: [],
    })
  )
  const api = createHttpAdminApi({
    baseUrl: "http://localhost:4001",
    fetch: fetchMock,
  })

  await api.saveCurriculumVersionContent({
    courseId: "sentence-structure",
    versionId: "sentence-structure-v2",
    baseRevision: 1,
    course: {
      title: "기초 문장 만들기",
      description: "설명",
      thumbnailPath: "/course-thumbnails/sentence.png",
      sortOrder: 1,
    },
    chapters: [],
    lessons: [],
    steps: [],
  })

  const request = getRequest(fetchMock)
  expect(request.url).toBe(
    "http://localhost:4001/courses/sentence-structure/curriculum/versions/sentence-structure-v2/content"
  )
  expect(request.method).toBe("PUT")
  await expect(request.json()).resolves.toMatchObject({
    baseRevision: 1,
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/admin test -- http-admin-api.test.ts -t "course detail|saves curriculum"`

Expected: FAIL because client methods are missing.

Actual: 새 client 메서드 호출 테스트가 `api.getCourseDetail is not a function` 등으로 실패하는 것을 확인했다.

- [x] **Step 3: Extend AdminApi interface**

In `apps/admin/src/lib/api/admin-api.ts`, add methods for course detail, version detail, lesson detail, draft, restore, save, publish, discard.

- [x] **Step 4: Add requestJson method support**

Change `requestJson` to accept a method and body.

```ts
async function requestJson<TValue>(
  fetcher: AdminApiFetch,
  url: URL,
  headers: HeadersInit | undefined,
  init: { method?: string; body?: unknown } = {}
): Promise<AdminApiResult<TValue>> {
  const requestHeaders = new Headers(headers)

  if (init.body !== undefined) {
    requestHeaders.set("content-type", "application/json")
  }

  const response = await fetcher(
    new Request(url, {
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "include",
      headers: requestHeaders,
      method: init.method ?? "GET",
    })
  )
}
```

- [x] **Step 5: Implement client methods**

Add URL builders matching the API routes. Example:

```ts
getCourseDetail(courseId) {
  return requestJson(
    fetcher,
    createAdminApiUrl(baseUrl, `/courses/${courseId}`),
    headers
  )
},
saveCurriculumVersionContent(input) {
  return requestJson(
    fetcher,
    createAdminApiUrl(
      baseUrl,
      `/courses/${input.courseId}/curriculum/versions/${input.versionId}/content`
    ),
    headers,
    {
      method: "PUT",
      body: input,
    }
  )
},
```

- [x] **Step 6: Run admin client tests**

Run: `bun --filter @workspace/admin test -- http-admin-api.test.ts`

Expected: PASS.

Actual: focused client tests, `bun --filter @workspace/admin test`, and `bun --filter @workspace/admin typecheck` passed.

- [x] **Step 7: Commit**

```bash
git add apps/admin/src/lib/api/admin-api.ts apps/admin/src/lib/api/http-admin-api.ts apps/admin/src/lib/api/http-admin-api.test.ts
git commit -m "어드민 코스 에디터 클라이언트 추가"
```

---

### Task 9: Editor 순수 상태 로직 추가

**Files:**

- Create: `apps/admin/src/features/courses/course-editor/editor-url-state.ts`
- Create: `apps/admin/src/features/courses/course-editor/editor-change-kind.ts`
- Create: `apps/admin/src/features/courses/course-editor/editor-state.ts`
- Create: `apps/admin/src/features/courses/course-editor/editor-state.test.ts`

- [x] **Step 1: Write failing pure logic tests**

Create `apps/admin/src/features/courses/course-editor/editor-state.test.ts`.

```ts
import { describe, expect, it } from "vitest"

import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import { parseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"

describe("course editor state", () => {
  it("parses step view from search params", () => {
    expect(
      parseEditorUrlState(
        new URLSearchParams(
          "version=v2&view=step&lessonId=lesson-1&stepId=step-1"
        )
      )
    ).toEqual({
      versionId: "v2",
      view: "step",
      lessonId: "lesson-1",
      stepId: "step-1",
    })
  })

  it("classifies lesson reorder as structural", () => {
    expect(
      getEditorChangeKind({
        courseChanged: false,
        addedStepCount: 0,
        reorderedLessonCount: 1,
        archivedLessonCount: 0,
        archivedChapterCount: 0,
      })
    ).toBe("structural")
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/admin test -- editor-state.test.ts`

Expected: FAIL because files do not exist.

Actual: `editor-change-kind`, `editor-state`, `editor-url-state` import가 없어 테스트 suite가 실패하는 것을 확인했다.

- [x] **Step 3: Implement URL state**

Create `editor-url-state.ts`.

```ts
export type CourseEditorView = "lesson" | "step" | "preview" | "settings"

export type CourseEditorUrlState = {
  versionId: string | null
  view: CourseEditorView
  lessonId: string | null
  stepId: string | null
}

const editorViews = new Set<CourseEditorView>([
  "lesson",
  "step",
  "preview",
  "settings",
])

export function parseEditorUrlState(
  searchParams: URLSearchParams
): CourseEditorUrlState {
  const rawView = searchParams.get("view")
  const view =
    rawView && editorViews.has(rawView as CourseEditorView)
      ? (rawView as CourseEditorView)
      : "lesson"

  return {
    versionId: searchParams.get("version"),
    view,
    lessonId: searchParams.get("lessonId"),
    stepId: view === "step" ? searchParams.get("stepId") : null,
  }
}
```

- [x] **Step 4: Implement change kind**

Create `editor-change-kind.ts`.

```ts
export type EditorChangeKind =
  | "minor-edit"
  | "additive"
  | "structural"
  | "major-revision"

export type EditorChangeSummary = {
  courseChanged: boolean
  addedStepCount: number
  reorderedLessonCount: number
  archivedLessonCount: number
  archivedChapterCount: number
}

export function getEditorChangeKind(
  summary: EditorChangeSummary
): EditorChangeKind {
  if (summary.archivedLessonCount >= 3 || summary.reorderedLessonCount >= 3) {
    return "major-revision"
  }

  if (
    summary.reorderedLessonCount > 0 ||
    summary.archivedLessonCount > 0 ||
    summary.archivedChapterCount > 0
  ) {
    return "structural"
  }

  if (summary.addedStepCount > 0) {
    return "additive"
  }

  return "minor-edit"
}
```

- [x] **Step 5: Implement editor-state reducer**

Create `editor-state.ts` with a minimal reducer used by UI.

```ts
export type CourseEditorDirtyState = {
  hasChanges: boolean
  changedFields: string[]
}

export function getDirtyState(changedFields: string[]): CourseEditorDirtyState {
  return {
    hasChanges: changedFields.length > 0,
    changedFields,
  }
}

export function moveItem<TItem>(
  items: readonly TItem[],
  fromIndex: number,
  toIndex: number
): TItem[] {
  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)

  if (item === undefined) {
    return nextItems
  }

  nextItems.splice(toIndex, 0, item)
  return nextItems
}
```

- [x] **Step 6: Run tests**

Run: `bun --filter @workspace/admin test -- editor-state.test.ts`

Expected: PASS.

Actual: focused state logic tests passed.

- [x] **Step 7: Commit**

```bash
git add apps/admin/src/features/courses/course-editor/editor-url-state.ts apps/admin/src/features/courses/course-editor/editor-change-kind.ts apps/admin/src/features/courses/course-editor/editor-state.ts apps/admin/src/features/courses/course-editor/editor-state.test.ts
git commit -m "코스 에디터 상태 로직 추가"
```

---

### Task 10: Course editor shell UI 연결

**Files:**

- Modify: `apps/admin/src/app/(admin)/courses/[id]/page.tsx`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- Create: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- Create: `apps/admin/src/features/courses/course-editor/course-editor-header.tsx`
- Create: `apps/admin/src/features/courses/course-editor/course-summary-panel.tsx`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`

- [x] **Step 1: Write failing page test**

Replace the placeholder expectation in `admin-course-detail-page.test.tsx` with editor shell expectations.

```ts
it("renders course studio shell", () => {
  render(
    <AdminCourseDetailPage
      course={{
        id: "sentence-structure",
        title: "기초 문장 만들기",
        description: "문장의 뼈대를 세웁니다.",
        thumbnailPath: "/course-thumbnails/sentence.png",
        sortOrder: 1,
      }}
      selectedVersionId="sentence-structure-v2"
      urlState={{
        versionId: "sentence-structure-v2",
        view: "lesson",
        lessonId: "sentence-structure-01",
        stepId: null,
      }}
      version={{
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "draft",
        title: "v2",
        changelog: "draft",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 1,
        chapters: [],
        steps: [],
      }}
    />
  )

  expect(screen.getByText("Course Studio")).toBeTruthy()
  expect(screen.getByText("기초 문장 만들기")).toBeTruthy()
  expect(screen.getByRole("button", { name: "저장" })).toBeTruthy()
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `bun --filter @workspace/admin test -- admin-course-detail-page.test.tsx`

Expected: FAIL because props and shell do not exist.

Actual: 기존 placeholder가 렌더링되어 `Course Studio`를 찾지 못하는 실패를 확인했다.

- [x] **Step 3: Update route props**

In `apps/admin/src/app/(admin)/courses/[id]/page.tsx`, read `searchParams` and pass parsed URL state. Fetch course, versions, and selected version through `getServerAdminApi`. Redirect to login on API error.

- [x] **Step 4: Implement shell components**

Create `course-editor-shell.tsx` with the two-column layout. Use `@workspace/ui` primitives and lucide icons already available in the project. Keep cards to individual repeated items and avoid nested cards.

Create `course-editor-header.tsx` with:

```tsx
<button type="button">버전 메뉴</button>
<button type="button">저장</button>
```

Create `course-summary-panel.tsx` with compact thumbnail, title, description, and counts.

- [x] **Step 5: Run UI test**

Run: `bun --filter @workspace/admin test -- admin-course-detail-page.test.tsx`

Expected: PASS.

Actual: focused page test, `bun --filter @workspace/admin test`, and `bun --filter @workspace/admin typecheck` passed.

- [x] **Step 6: Commit**

```bash
git add 'apps/admin/src/app/(admin)/courses/[id]/page.tsx' apps/admin/src/features/courses/admin-course-detail-page.tsx apps/admin/src/features/courses/admin-course-detail-page.test.tsx apps/admin/src/features/courses/course-editor/course-editor-shell.tsx apps/admin/src/features/courses/course-editor/course-editor-header.tsx apps/admin/src/features/courses/course-editor/course-summary-panel.tsx
git commit -m "어드민 코스 스튜디오 셸 구현"
```

---

### Task 11: Curriculum Map과 Lesson Workspace 구현

**Files:**

- Create: `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
- Create: `apps/admin/src/features/courses/course-editor/lesson-workspace.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- Create: `apps/admin/src/features/courses/course-editor/curriculum-map.test.tsx`
- Create: `apps/admin/src/features/courses/course-editor/lesson-workspace.test.tsx`

- [x] **Step 1: Write failing component tests**

Create tests asserting active lesson, add buttons, and sequence rows.

```ts
it("renders chapters and selected lesson in the curriculum map", () => {
  render(
    <CurriculumMap
      chapters={[
        {
          id: "chapter-1",
          label: "1",
          title: "문장 성분 익히기",
          sortOrder: 1,
          status: "active",
          lessons: [
            {
              id: "version-lesson-1",
              lessonId: "lesson-1",
              title: "목적어 붙이기",
              description: "설명",
              sortOrder: 1,
              status: "active",
            },
          ],
        },
      ]}
      selectedLessonId="lesson-1"
    />
  )

  expect(screen.getByText("문장 성분 익히기")).toBeTruthy()
  expect(screen.getByText("목적어 붙이기")).toBeTruthy()
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/admin test -- curriculum-map.test.tsx lesson-workspace.test.tsx`

Expected: FAIL because components do not exist.

Actual: `curriculum-map`과 `lesson-workspace` import가 없어 테스트 suite가 실패하는 것을 확인했다.

- [x] **Step 3: Implement CurriculumMap**

Use `@dnd-kit/sortable` for sortable wrappers. Keep DnD handlers controlled through props:

```ts
type CurriculumMapProps = {
  chapters: AdminEditorCurriculumVersionDetailDto["chapters"]
  selectedLessonId: string | null
  onSelectLesson?: (lessonId: string) => void
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
}
```

- [x] **Step 4: Implement LessonWorkspace**

Render lesson title, learning intent area, change summary, and `LEARNING SEQUENCE` rows from step summaries. Include `학습 화면 미리보기`, `레슨 설정`, and `스텝 추가` buttons.

- [x] **Step 5: Run tests**

Run: `bun --filter @workspace/admin test -- curriculum-map.test.tsx lesson-workspace.test.tsx`

Expected: PASS.

Actual: focused workspace tests, `bun --filter @workspace/admin test`, and `bun --filter @workspace/admin typecheck` passed.

- [x] **Step 6: Commit**

```bash
git add apps/admin/src/features/courses/course-editor/curriculum-map.tsx apps/admin/src/features/courses/course-editor/lesson-workspace.tsx apps/admin/src/features/courses/course-editor/course-editor-shell.tsx apps/admin/src/features/courses/course-editor/curriculum-map.test.tsx apps/admin/src/features/courses/course-editor/lesson-workspace.test.tsx
git commit -m "코스 커리큘럼 작업대 구현"
```

---

### Task 12: 20개 스텝 전용 폼과 Step Workspace 추가

**Files:**

- Create: `apps/admin/src/features/courses/course-editor/step-workspace.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/*.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-workspace.test.tsx`

- [x] **Step 1: Write failing step workspace test**

Create `step-workspace.test.tsx`.

```ts
it.each([
  "INTRO",
  "CONCEPT",
  "READING_PASSAGE",
  "EXAMPLE_REVEAL",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "WORD_SELECT",
  "REORDER",
  "MATCH",
  "CLASSIFY",
  "SHORT_WRITE",
  "LONG_WRITE",
  "AI_FEEDBACK",
  "REVISION",
  "CHECKLIST",
  "REFLECTION",
  "SUMMARY",
  "TRANSCRIBE",
  "COMPLETE",
] as const)("renders a dedicated form for %s", (type) => {
  render(
    <StepWorkspace
      step={{
        id: `${type}-step`,
        lessonId: "lesson-1",
        type,
        title: `${type} step`,
        sortOrder: 1,
        points: 10,
        required: true,
        status: "active",
        content: {},
      }}
      lessonSteps={[]}
    />
  )

  expect(screen.getByText(`${type} 편집`)).toBeTruthy()
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `bun --filter @workspace/admin test -- step-workspace.test.tsx`

Expected: FAIL because `StepWorkspace` does not exist.

Actual: `step-workspace` import가 없어 테스트 suite가 실패하는 것을 확인했다.

- [x] **Step 3: Create form registry**

In `step-workspace.tsx`, map step type to form components.

```ts
const stepFormByType = {
  INTRO: IntroStepForm,
  CONCEPT: ConceptStepForm,
  READING_PASSAGE: ReadingPassageStepForm,
  EXAMPLE_REVEAL: ExampleRevealStepForm,
  COMPARE: CompareStepForm,
  MULTIPLE_CHOICE: MultipleChoiceStepForm,
  FILL_BLANK: FillBlankStepForm,
  WORD_SELECT: WordSelectStepForm,
  REORDER: ReorderStepForm,
  MATCH: MatchStepForm,
  CLASSIFY: ClassifyStepForm,
  SHORT_WRITE: ShortWriteStepForm,
  LONG_WRITE: LongWriteStepForm,
  AI_FEEDBACK: AiFeedbackStepForm,
  REVISION: RevisionStepForm,
  CHECKLIST: ChecklistStepForm,
  REFLECTION: ReflectionStepForm,
  SUMMARY: SummaryStepForm,
  TRANSCRIBE: TranscribeStepForm,
  COMPLETE: CompleteStepForm,
} satisfies Record<AdminEditorStepType, React.ComponentType<StepFormProps>>
```

- [x] **Step 4: Implement each dedicated form**

Create `apps/admin/src/features/courses/course-editor/step-forms/step-form-fields.ts`.

```ts
export function getTextField(content: unknown, key: string): string {
  return isRecord(content) && typeof content[key] === "string"
    ? content[key]
    : ""
}

export function getNumberField(content: unknown, key: string): number {
  return isRecord(content) && typeof content[key] === "number"
    ? content[key]
    : 0
}

export function getArrayField(content: unknown, key: string): unknown[] {
  return isRecord(content) && Array.isArray(content[key]) ? content[key] : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
```

Each form must render its type name and concrete domain fields for the type. Use these files and labels:

- `intro-step-form.tsx`: `학습 목표`, `도입 문구`, `예상 시간`
- `concept-step-form.tsx`: `개념 제목`, `본문`, `강조 설명`
- `reading-passage-step-form.tsx`: `지문 제목`, `본문`, `출처`
- `example-reveal-step-form.tsx`: `초기 예시`, `공개 예시`, `분석`
- `compare-step-form.tsx`: `비교 항목`, `분석`, `생각 질문`
- `multiple-choice-step-form.tsx`: `질문`, `선택지`, `해설`
- `fill-blank-step-form.tsx`: `문장 템플릿`, `단어 은행`, `해설`
- `word-select-step-form.tsx`: `문장`, `선택 구간`, `해설`
- `reorder-step-form.tsx`: `정렬 항목`, `정답 순서`, `해설`
- `match-step-form.tsx`: `왼쪽 항목`, `오른쪽 항목`, `해설`
- `classify-step-form.tsx`: `카테고리`, `분류 항목`, `해설`
- `short-write-step-form.tsx`: `작성 프롬프트`, `최소 글자 수`, `참조 답안`
- `long-write-step-form.tsx`: `작성 프롬프트`, `최소 글자 수`, `최대 글자 수`
- `ai-feedback-step-form.tsx`: `원본 스텝`, `평가 초점`, `피드백 프롬프트`
- `revision-step-form.tsx`: `원본 스텝`, `퇴고 지시`, `체크 기준`
- `checklist-step-form.tsx`: `체크 항목`, `완료 안내`
- `reflection-step-form.tsx`: `성찰 질문`, `힌트`
- `summary-step-form.tsx`: `요약 제목`, `핵심 문장`
- `transcribe-step-form.tsx`: `전사 대상`, `입력 안내`
- `complete-step-form.tsx`: `완료 제목`, `다음 행동 안내`

Example for `short-write-step-form.tsx`:

```tsx
export function ShortWriteStepForm({ step }: StepFormProps) {
  return (
    <section aria-label="SHORT_WRITE 편집" className="space-y-4">
      <h2 className="text-sm font-medium">SHORT_WRITE 편집</h2>
      <label className="grid gap-2 text-sm">
        작성 프롬프트
        <textarea defaultValue={getTextField(step.content, "prompt")} />
      </label>
      <label className="grid gap-2 text-sm">
        최소 글자 수
        <input
          defaultValue={String(getNumberField(step.content, "minLength"))}
          inputMode="numeric"
        />
      </label>
    </section>
  )
}
```

- [x] **Step 5: Run tests**

Run: `bun --filter @workspace/admin test -- step-workspace.test.tsx`

Expected: PASS.

Actual: focused step workspace tests, `bun --filter @workspace/admin test`, and `bun --filter @workspace/admin typecheck` passed.

- [x] **Step 6: Commit**

```bash
git add apps/admin/src/features/courses/course-editor/step-workspace.tsx apps/admin/src/features/courses/course-editor/step-forms apps/admin/src/features/courses/course-editor/step-workspace.test.tsx
git commit -m "스텝 타입 전용 폼 구현"
```

---

### Task 13: Working copy 미리보기와 저장 액션 연결

**Files:**

- Create: `apps/admin/src/features/courses/course-editor/lesson-preview.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-header.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- Create: `apps/admin/src/features/courses/course-editor/lesson-preview.test.tsx`

- [x] **Step 1: Write failing preview and save tests**

Create `lesson-preview.test.tsx`.

```ts
it("renders preview from working copy lesson steps", () => {
  render(
    <LessonPreview
      lessonTitle="목적어 붙이기"
      steps={[
        {
          id: "step-1",
          lessonId: "lesson-1",
          type: "INTRO",
          title: "도입",
          sortOrder: 1,
          points: 0,
          required: true,
          status: "active",
          content: {},
        },
      ]}
    />
  )

  expect(screen.getByText("목적어 붙이기")).toBeTruthy()
  expect(screen.getByText("도입")).toBeTruthy()
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `bun --filter @workspace/admin test -- lesson-preview.test.tsx`

Expected: FAIL because component does not exist.

Actual: `lesson-preview` import가 없어 테스트 suite가 실패하는 것을 확인했다.

- [x] **Step 3: Implement LessonPreview**

Render a neutral preview list with step type badges and content summaries. Do not call the server from this component.

- [x] **Step 4: Connect header actions**

In `course-editor-header.tsx`, expose props:

```ts
type CourseEditorHeaderProps = {
  dirtyCount: number
  isSaving: boolean
  onSave: () => void
  onOpenVersionMenu: () => void
}
```

Disable `저장` when `dirtyCount === 0` or `isSaving` is true.

- [x] **Step 5: Run tests**

Run: `bun --filter @workspace/admin test -- lesson-preview.test.tsx admin-course-detail-page.test.tsx`

Expected: PASS.

Actual: focused preview/page tests, `bun --filter @workspace/admin test`, and `bun --filter @workspace/admin typecheck` passed.

- [x] **Step 6: Commit**

```bash
git add apps/admin/src/features/courses/course-editor/lesson-preview.tsx apps/admin/src/features/courses/course-editor/lesson-preview.test.tsx apps/admin/src/features/courses/course-editor/course-editor-header.tsx apps/admin/src/features/courses/course-editor/course-editor-shell.tsx
git commit -m "코스 에디터 미리보기 연결"
```

---

### Task 14: 전체 검증, 문서 완료 기록, 브라우저 확인

**Files:**

- Modify: `docs/admin-site.md`

- [ ] **Step 1: Add completion document entry**

Add this section near the top of `docs/admin-site.md`.

```md
## 2026-05-28 어드민 코스 상세 에디터 구현 완료

- 어드민 코스 상세 페이지를 Course Studio 구조로 구현했다.
- draft 기반 커리큘럼 조회, 복원, 저장, 발행, 폐기 API와 admin 클라이언트 연결을 추가했다.
- 코스 기본 정보, Curriculum Map, Lesson Workspace, Step Workspace, Lesson Preview를 추가했다.
- 스텝 20개 타입은 전용 편집 폼으로 표시한다.
- 변경사항은 working copy에 쌓고 상단 저장으로 전체 snapshot을 반영한다.
```

- [ ] **Step 2: Run focused package tests**

Run:

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/admin-api test
bun --filter @workspace/admin test
```

Expected: PASS for all commands.

- [ ] **Step 3: Run typecheck and lint**

Run:

```bash
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin-api lint
```

Expected: PASS for all commands.

- [ ] **Step 4: Run formatting checks**

Run:

```bash
bunx prettier --check docs/admin-site.md docs/superpowers/specs/2026-05-28-admin-course-detail-editor-design.md
git diff --check
```

Expected: Prettier reports all matched files use Prettier style and `git diff --check` prints no output.

- [ ] **Step 5: Browser smoke check**

Run:

```bash
bun run dev:admin
```

Open the admin app, sign in with the seeded admin account, and visit `/courses/sentence-structure`. Verify:

- The page renders the Course Studio shell.
- `?view=lesson&lessonId=sentence-structure-01` restores the lesson workspace.
- `?view=step&lessonId=sentence-structure-01&stepId=sentence-structure-01-step-1` restores the step workspace.
- Save is disabled when no changes exist.
- Curriculum Map and Lesson Workspace text does not overlap at desktop width.

Stop the dev server after verification.

- [ ] **Step 6: Commit**

```bash
git add docs/admin-site.md
git commit -m "어드민 코스 상세 에디터 구현 완료"
```

---

## Self-Review

- Spec coverage: The plan covers draft-only editing, RESTful course curriculum routes, full snapshot save, restore from published, URL state, working copy, 20 dedicated step forms, DnD-ready curriculum map, preview, docs, and validation.
- Scope control: The plan keeps one route page as the product surface but splits implementation into schema, core, db, route, client, state, and UI tasks.
- Type consistency: Plan names use `AdminEditorCurriculumVersionDetailDto`, `AdminEditorLessonDetailDto`, `AdminSaveCurriculumVersionContentRequestDto`, and `AdminRestoreCurriculumDraftRequestDto` consistently.
- Risk note: draft 스텝 content는 `curriculum_version_steps`에만 저장한다. Public and learner lesson reads must be moved to version step snapshots before published step edits are considered complete.
