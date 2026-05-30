# 어드민 커리큘럼 편집 동시성 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 코스 편집 저장에서 Lost Update를 막고, 챕터와 레슨 row ID를 유지하는 차등 저장으로 추적성을 회복한다.

**Architecture:** 코스 편집 문서를 `course + curriculum + revision` aggregate로 다룬다. `courses.curriculum_revision`을 낙관적 동시성 토큰으로 사용하고, 저장 요청의 `expectedRevision`이 현재 revision과 일치할 때만 저장 트랜잭션을 진행한다. 챕터와 레슨은 전체 삭제 후 삽입하지 않고 ID 기준 upsert/update와 archive 전환으로 반영한다.

**Tech Stack:** Bun, TypeScript, Zod, Hono, Drizzle ORM, SQLite, Vitest, Next.js, React

---

## 파일 구조

- Modify: `packages/core/src/admin/admin.dto.ts`
  - 편집 문서 응답에 `revision`을 추가하고 저장 요청에 `expectedRevision`을 추가한다.
- Modify: `packages/core/src/admin/admin.errors.ts`
  - 기존 `conflict` 오류 DTO를 저장 서비스 결과에 연결한다.
- Modify: `packages/core/src/admin/admin.repository.ts`
  - 저장 repository 결과가 `document` 또는 `conflict`를 반환하도록 계약을 바꾼다.
- Modify: `packages/core/src/admin/admin.service.ts`
  - repository의 `conflict` 결과를 서비스와 API 계층으로 전달한다.
- Modify: `packages/core/src/admin/admin.service.test.ts`
  - 저장 요청이 `expectedRevision`을 포함하고 충돌 결과를 전달하는지 검증한다.
- Modify: `packages/db/src/schema/content.schema.ts`
  - `courses.curriculumRevision` 컬럼을 추가한다.
- Create: `packages/db/src/migrations/0011-course-curriculum-revision.sql`
  - 기존 DB에 `curriculum_revision`을 추가한다.
- Modify: `packages/db/src/migrations/run-content-migration.ts`
  - 새 migration을 idempotent하게 실행한다.
- Modify: `packages/db/src/client.test.ts`
  - schema migration 결과에 `curriculum_revision`이 있는지 검증한다.
- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
  - revision compare-and-set 저장과 챕터/레슨 차등 저장을 구현한다.
- Modify: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
  - revision 반환, stale 저장 충돌, hard delete 제거를 검증한다.
- Modify: `apps/admin-api/src/routes/curriculum-editor.route.ts`
  - 저장 성공 응답 schema를 편집 문서로 바꾸고 conflict를 HTTP 409로 매핑한다.
- Modify: `apps/admin-api/src/app.test.ts`
  - GET/PUT editor revision 계약과 conflict 매핑을 검증한다.
- Modify: `apps/admin/src/lib/api/admin-api.ts`
  - 저장 API 반환 타입을 편집 문서로 바꾼다.
- Modify: `apps/admin/src/lib/api/http-admin-api.ts`
  - 기존 `conflict` 오류 판별은 유지하고 새 저장 응답 타입을 따른다.
- Modify: `apps/admin/src/lib/api/http-admin-api.test.ts`
  - 저장 요청에 `expectedRevision`이 포함되는지 검증한다.
- Modify: `apps/admin/src/features/courses/course-editor/editor-state.ts`
  - working copy에 revision을 보존하고 저장 입력에 `expectedRevision`을 넣는다.
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
  - props로 revision을 받고 저장 성공 시 새 document의 revision으로 working copy를 갱신한다.
- Modify: `apps/admin/src/app/(admin)/courses/[id]/page.tsx`
  - 서버에서 받은 editor document revision을 클라이언트 page로 전달한다.
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`
  - 저장 payload의 `expectedRevision`과 conflict 메시지를 검증한다.
- Modify: `BACKEND.md`, `DOMAIN.md`, `docs/admin-site.md`, `docs/curriculum-editor-overwrite-concurrency-audit.md`
  - 동시성 정책, 차등 저장 정책, 구현 완료 기록을 한국어로 갱신한다.

## Task 1: Core 계약에 revision과 conflict 추가

**Files:**

- Modify: `packages/core/src/admin/admin.dto.ts`
- Modify: `packages/core/src/admin/admin.repository.ts`
- Modify: `packages/core/src/admin/admin.service.ts`
- Modify: `packages/core/src/admin/admin.service.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`packages/core/src/admin/admin.service.test.ts`의 저장 테스트를 `expectedRevision`과 새 저장 응답 document 기준으로 바꾼다. 기존 `"saves the current curriculum without draft or publish state"` 테스트의 요청에 `expectedRevision: 0`을 넣고, mock repository는 다음 결과를 반환하게 한다.

```ts
const saveCourseEditorDocument = vi.fn<
  AdminRepository["saveCourseEditorDocument"]
>(async (input) => ({
  status: "saved",
  document: {
    course: {
      id: input.courseId,
      title: input.course.title,
      description: input.course.description,
      sortOrder: input.course.sortOrder,
    },
    revision: input.expectedRevision + 1,
    curriculum: {
      chapters: [],
      steps: [],
    },
  },
}))
```

같은 파일에 conflict 전달 테스트를 추가한다.

```ts
it("returns conflict when the editor document revision is stale", async () => {
  const repository = createRepository({
    async saveCourseEditorDocument() {
      return {
        status: "conflict",
        error: {
          code: "conflict",
          message: "다른 관리자가 먼저 저장했습니다.",
        },
      }
    },
  })
  const service = createAdminService({ repository })

  const result = await service.saveCourseEditorDocument({
    courseId: "sentence-structure",
    expectedRevision: 0,
    course: {
      title: "문장 구조의 기본",
      description: "문장의 뼈대를 이해합니다.",
      sortOrder: 1,
    },
    chapters: [],
    lessons: [],
    steps: [],
  })

  expect(result).toEqual({
    status: "conflict",
    error: {
      code: "conflict",
      message: "다른 관리자가 먼저 저장했습니다.",
    },
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `bun --filter @workspace/core test -- admin.service`

Expected: `expectedRevision`이 DTO에 없고 `conflict`가 서비스 결과 타입에 없어 타입체크 또는 테스트가 실패한다.

- [ ] **Step 3: DTO와 repository 계약 수정**

`packages/core/src/admin/admin.dto.ts`를 수정한다.

```ts
export const adminCourseEditorDocumentDtoSchema = z.object({
  course: adminCourseDetailDtoSchema,
  revision: z.number().int().nonnegative(),
  curriculum: adminEditorCurriculumDetailDtoSchema,
})

export const adminSaveCurriculumContentRequestDtoSchema = z.object({
  courseId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative(),
  course: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    sortOrder: z.number().int().positive(),
  }),
  chapters: z.array(adminCurriculumChapterDtoSchema.omit({ lessons: true })),
  lessons: z.array(
    adminCurriculumLessonDtoSchema.extend({
      chapterId: z.string().min(1),
    })
  ),
  steps: z.array(adminEditorStepDetailDtoSchema),
})
```

`packages/core/src/admin/admin.repository.ts`를 수정한다.

```ts
import type {
  AdminConflictErrorDto,
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "@/admin/admin.errors"

export type AdminSaveCurriculumContentRepositoryResult =
  | {
      status: "saved"
      document: AdminCourseEditorDetailDto
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
```

- [ ] **Step 4: service 결과 타입 수정**

`packages/core/src/admin/admin.service.ts`에서 `AdminConflictErrorDto`를 import하고 mutation 결과에 포함한다.

```ts
import type {
  AdminConflictErrorDto,
  AdminDatabaseUnavailableErrorDto,
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "@/admin/admin.errors"

type ConflictResult = {
  status: "conflict"
  error: AdminConflictErrorDto
}

type AdminMutationServiceResult<TValue> =
  | AdminServiceResult<TValue>
  | InvalidRequestResult
  | NotFoundResult
  | ConflictResult
```

저장 메서드는 saved 결과의 `document`를 parse한다.

```ts
return {
  status: "ok",
  value: adminCourseEditorDetailDtoSchema.parse(result.document),
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `bun --filter @workspace/core test -- admin.service`

Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts
git commit -m "어드민 편집 문서에 revision 계약 추가"
```

## Task 2: DB schema와 migration에 curriculum_revision 추가

**Files:**

- Modify: `packages/db/src/schema/content.schema.ts`
- Create: `packages/db/src/migrations/0011-course-curriculum-revision.sql`
- Modify: `packages/db/src/migrations/run-content-migration.ts`
- Modify: `packages/db/src/client.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`packages/db/src/client.test.ts`의 `"current curriculum schema"` 테스트에서 course column 검증을 추가한다.

```ts
const courseColumns = sqlite
  .query<{ name: string }, []>("pragma table_info(courses)")
  .all()
  .map((row) => row.name)

expect(courseColumns).toContain("curriculum_revision")
```

- [ ] **Step 2: 실패 확인**

Run: `bun --filter @workspace/db test -- client.test`

Expected: `curriculum_revision` 컬럼이 없어 실패한다.

- [ ] **Step 3: schema 수정**

`packages/db/src/schema/content.schema.ts`의 `courses` 테이블에 컬럼을 추가한다.

```ts
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => courseCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
  curriculumRevision: integer("curriculum_revision").notNull().default(0),
})
```

- [ ] **Step 4: migration 파일 생성**

`packages/db/src/migrations/0011-course-curriculum-revision.sql`을 생성한다.

```sql
alter table courses add column curriculum_revision integer not null default 0;
```

- [ ] **Step 5: migration runner 연결**

`packages/db/src/migrations/run-content-migration.ts`에 SQL 로드를 추가한다.

```ts
const courseCurriculumRevisionSql = readFileSync(
  new URL("./0011-course-curriculum-revision.sql", import.meta.url),
  "utf8"
)
```

`runContentMigration` 안에서 idempotent하게 실행한다.

```ts
addColumnIfMissing(
  sqlite,
  "courses",
  "curriculum_revision",
  courseCurriculumRevisionSql
)
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `bun --filter @workspace/db test -- client.test`

Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add packages/db/src/schema/content.schema.ts packages/db/src/migrations/0011-course-curriculum-revision.sql packages/db/src/migrations/run-content-migration.ts packages/db/src/client.test.ts
git commit -m "코스 커리큘럼 revision 컬럼 추가"
```

## Task 3: DB repository에 revision 충돌 방어와 차등 저장 추가

**Files:**

- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-admin.repository.test.ts`

- [ ] **Step 1: revision 반환과 증가 테스트 작성**

`packages/db/src/repositories/drizzle-admin.repository.test.ts`의 첫 테스트에 revision 기대값을 추가한다.

```ts
expect(document?.revision).toBe(0)
```

저장 테스트에는 `expectedRevision: document.revision`을 넣고 저장 결과의 revision 증가를 검증한다.

```ts
expect(result.status).toBe("saved")
if (result.status !== "saved") {
  throw new Error("Editor document save failed.")
}
expect(result.document.revision).toBe(document.revision + 1)
```

- [ ] **Step 2: stale revision 충돌 테스트 작성**

같은 파일에 테스트를 추가한다.

```ts
it("rejects stale current curriculum saves without changing rows", async () => {
  const db = createDatabase(sqlite)
  const repository = createDrizzleAdminRepository(db)
  const document =
    await repository.getCourseEditorDocument("sentence-structure")

  if (!document) {
    throw new Error("Editor document is missing.")
  }

  const firstSave = await repository.saveCourseEditorDocument({
    courseId: "sentence-structure",
    expectedRevision: document.revision,
    course: {
      ...document.course,
      title: "먼저 저장한 제목",
    },
    chapters: document.curriculum.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      sortOrder: chapter.sortOrder,
      status: chapter.status,
    })),
    lessons: document.curriculum.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        ...lesson,
        chapterId: chapter.id,
      }))
    ),
    steps: document.curriculum.steps,
  })

  expect(firstSave.status).toBe("saved")

  const staleSave = await repository.saveCourseEditorDocument({
    courseId: "sentence-structure",
    expectedRevision: document.revision,
    course: {
      ...document.course,
      title: "나중에 저장한 제목",
    },
    chapters: [],
    lessons: [],
    steps: [],
  })

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, "sentence-structure"))
  const chapters = await db
    .select()
    .from(courseChapters)
    .where(eq(courseChapters.courseId, "sentence-structure"))

  expect(staleSave).toEqual({
    status: "conflict",
    error: {
      code: "conflict",
      message: "다른 관리자가 먼저 저장했습니다.",
    },
  })
  expect(course?.title).toBe("먼저 저장한 제목")
  expect(chapters.length).toBeGreaterThan(0)
})
```

- [ ] **Step 3: hard delete 제거 테스트 작성**

같은 파일에 테스트를 추가한다.

```ts
it("archives omitted chapters and lessons instead of deleting them", async () => {
  const db = createDatabase(sqlite)
  const repository = createDrizzleAdminRepository(db)
  const document =
    await repository.getCourseEditorDocument("sentence-structure")

  if (!document) {
    throw new Error("Editor document is missing.")
  }

  await repository.saveCourseEditorDocument({
    courseId: "sentence-structure",
    expectedRevision: document.revision,
    course: document.course,
    chapters: [
      {
        id: "sentence-structure-chapter-1",
        title: "문장의 뼈대",
        sortOrder: 1,
        status: "active",
      },
    ],
    lessons: [
      {
        id: "sentence-structure-01",
        chapterId: "sentence-structure-chapter-1",
        lessonId: "sentence-structure-01",
        title: "주어와 서술어 찾기",
        description: "중심 성분을 구분합니다.",
        sortOrder: 1,
        status: "active",
      },
    ],
    steps: document.curriculum.steps.filter(
      (step) => step.lessonId === "sentence-structure-01"
    ),
  })

  const [omittedChapter] = await db
    .select()
    .from(courseChapters)
    .where(eq(courseChapters.id, "sentence-structure-chapter-2"))
  const [omittedLesson] = await db
    .select()
    .from(courseLessons)
    .where(eq(courseLessons.id, "sentence-structure-02"))

  expect(omittedChapter?.status).toBe("archived")
  expect(omittedLesson?.status).toBe("archived")
})
```

- [ ] **Step 4: 실패 확인**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository`

Expected: revision 필드와 conflict 결과가 구현되지 않아 실패한다.

- [ ] **Step 5: repository 조회에 revision 추가**

`getCourseDetail`, `getCourseEditorDocument`, 저장 반환용 course select에 `curriculumRevision`을 읽고 DTO에는 `revision`으로 매핑한다.

```ts
const [course] = await db
  .select({
    id: courses.id,
    title: courses.title,
    description: courses.description,
    sortOrder: courses.sortOrder,
    revision: courses.curriculumRevision,
  })
  .from(courses)
  .where(eq(courses.id, courseId))
  .limit(1)
```

편집 문서 반환은 다음 형태로 바꾼다.

```ts
return {
  course: {
    id: course.id,
    title: course.title,
    description: course.description,
    sortOrder: course.sortOrder,
  },
  revision: course.revision,
  curriculum,
} satisfies AdminCourseEditorDetailDto
```

- [ ] **Step 6: compare-and-set 저장 구현**

`saveCurrentCurriculum` 초입의 course 조회는 category와 현재 필드를 함께 읽는다.

```ts
const [course] = await tx
  .select({
    categoryId: courses.categoryId,
  })
  .from(courses)
  .where(eq(courses.id, input.courseId))
  .limit(1)
```

course가 있으면 `ensureEditorLessons` 다음이 아니라, 저장 변경 전에 revision 조건 update를 먼저 실행한다.

```ts
const [updatedCourse] = await tx
  .update(courses)
  .set({
    title: input.course.title,
    description: input.course.description,
    sortOrder: input.course.sortOrder,
    curriculumRevision: sql`${courses.curriculumRevision} + 1`,
  })
  .where(
    and(
      eq(courses.id, input.courseId),
      eq(courses.curriculumRevision, input.expectedRevision)
    )
  )
  .returning({
    id: courses.id,
    title: courses.title,
    description: courses.description,
    sortOrder: courses.sortOrder,
    revision: courses.curriculumRevision,
  })

if (!updatedCourse) {
  return {
    status: "conflict",
    error: {
      code: "conflict",
      message: "다른 관리자가 먼저 저장했습니다.",
    },
  } as const
}

await ensureEditorLessons(tx, input, course.categoryId)
```

- [ ] **Step 7: 챕터/레슨 차등 저장 구현**

삭제 블록을 제거하고, 기존 row를 archive한 뒤 입력 row를 upsert한다.

```ts
const existingChapters = await tx
  .select({ id: courseChapters.id })
  .from(courseChapters)
  .where(eq(courseChapters.courseId, input.courseId))
const existingChapterIds = existingChapters.map((chapter) => chapter.id)
const inputChapterIds = input.chapters.map((chapter) => chapter.id)
const omittedChapterIds = existingChapterIds.filter(
  (chapterId) => !inputChapterIds.includes(chapterId)
)

if (omittedChapterIds.length > 0) {
  await tx
    .update(courseChapters)
    .set({ status: "archived" })
    .where(inArray(courseChapters.id, omittedChapterIds))
}

if (input.chapters.length > 0) {
  await tx
    .insert(courseChapters)
    .values(
      input.chapters.map((chapter) => ({
        id: chapter.id,
        courseId: input.courseId,
        title: chapter.title,
        sortOrder: chapter.sortOrder,
        status: chapter.status,
      }))
    )
    .onConflictDoUpdate({
      target: courseChapters.id,
      set: {
        title: sql`excluded.title`,
        sortOrder: sql`excluded.sort_order`,
        status: sql`excluded.status`,
      },
    })
}
```

레슨도 같은 방식으로 처리한다. 기존 레슨은 기존 챕터 ID 기준으로 조회하고, 빠진 레슨은 `archived`로 바꾼다.

```ts
const existingLessons =
  existingChapterIds.length === 0
    ? []
    : await tx
        .select({ id: courseLessons.id })
        .from(courseLessons)
        .where(inArray(courseLessons.chapterId, existingChapterIds))
const existingLessonIds = existingLessons.map((lesson) => lesson.id)
const inputCourseLessonIds = input.lessons.map((lesson) => lesson.id)
const omittedCourseLessonIds = existingLessonIds.filter(
  (lessonId) => !inputCourseLessonIds.includes(lessonId)
)

if (omittedCourseLessonIds.length > 0) {
  await tx
    .update(courseLessons)
    .set({ status: "archived" })
    .where(inArray(courseLessons.id, omittedCourseLessonIds))
}
```

입력 레슨은 insert/update한다.

```ts
if (input.lessons.length > 0) {
  await tx
    .insert(courseLessons)
    .values(
      input.lessons.map((lesson) => ({
        id: lesson.id,
        chapterId: lesson.chapterId,
        lessonId: lesson.lessonId,
        title: lesson.title,
        description: lesson.description,
        sortOrder: lesson.sortOrder,
        status: lesson.status,
      }))
    )
    .onConflictDoUpdate({
      target: courseLessons.id,
      set: {
        chapterId: sql`excluded.chapter_id`,
        lessonId: sql`excluded.lesson_id`,
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        sortOrder: sql`excluded.sort_order`,
        status: sql`excluded.status`,
      },
    })
}
```

- [ ] **Step 8: 저장 반환을 document로 변경**

`saveCurrentCurriculum`의 반환을 `document`로 바꾼다.

```ts
return {
  status: "saved",
  document: {
    course: {
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      sortOrder: updatedCourse.sortOrder,
    },
    revision: updatedCourse.revision,
    curriculum: {
      chapters: input.chapters.map((chapter) => ({
        ...chapter,
        lessons: input.lessons
          .filter((lesson) => lesson.chapterId === chapter.id)
          .map(({ chapterId: _chapterId, ...lesson }) => lesson),
      })),
      steps: input.steps,
    },
  },
} as const
```

- [ ] **Step 9: 테스트 통과 확인**

Run: `bun --filter @workspace/db test -- drizzle-admin.repository`

Expected: PASS

- [ ] **Step 10: 커밋**

```bash
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "커리큘럼 저장 충돌과 차등 저장 처리"
```

## Task 4: Admin API route에 revision 계약과 409 매핑 적용

**Files:**

- Modify: `apps/admin-api/src/routes/curriculum-editor.route.ts`
- Modify: `apps/admin-api/src/app.test.ts`

- [ ] **Step 1: API 테스트 수정**

`apps/admin-api/src/app.test.ts`의 `curriculum` fixture 옆에 `editorDocument` fixture를 추가한다.

```ts
const editorDocument = {
  course,
  revision: 0,
  curriculum,
}
```

mock service의 `getCourseEditorDocument`와 `saveCourseEditorDocument`가 `editorDocument`를 반환하도록 바꾼다.

```ts
async getCourseEditorDocument() {
  return {
    status: "ok",
    value: editorDocument,
  }
},
async saveCourseEditorDocument() {
  return {
    status: "ok",
    value: {
      ...editorDocument,
      revision: 1,
    },
  }
},
```

GET editor 테스트 기대값을 바꾼다.

```ts
await expect(response.json()).resolves.toEqual(editorDocument)
```

PUT editor body에 `expectedRevision: 0`을 추가하고 응답 기대값을 바꾼다.

```ts
await expect(response.json()).resolves.toEqual({
  ...editorDocument,
  revision: 1,
})
```

- [ ] **Step 2: conflict 매핑 테스트 추가**

`apps/admin-api/src/app.test.ts`에 테스트를 추가한다.

```ts
it("maps stale course editor saves to conflict", async () => {
  const response = await createTestApp({
    adminService: {
      ...adminService,
      async saveCourseEditorDocument() {
        return {
          status: "conflict",
          error: {
            code: "conflict",
            message: "다른 관리자가 먼저 저장했습니다.",
          },
        }
      },
    },
  }).request("/courses/sentence-structure/editor", {
    body: JSON.stringify({
      courseId: "sentence-structure",
      expectedRevision: 0,
      course: {
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        sortOrder: 1,
      },
      chapters: [],
      lessons: [],
      steps: [],
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "PUT",
  })

  expect(response.status).toBe(409)
  await expect(response.json()).resolves.toEqual({
    code: "conflict",
    message: "다른 관리자가 먼저 저장했습니다.",
  })
})
```

- [ ] **Step 3: 실패 확인**

Run: `bun --filter @workspace/admin-api test -- app.test`

Expected: route 응답 schema와 switch에 conflict 처리가 없어 실패한다.

- [ ] **Step 4: route schema와 switch 수정**

`apps/admin-api/src/routes/curriculum-editor.route.ts`에서 PUT 성공 응답 schema를 `adminCourseEditorDetailDtoSchema`로 바꾼다.

```ts
200: {
  description: "관리자 코스 편집 문서를 저장했습니다.",
  content: {
    "application/json": {
      schema: resolver(adminCourseEditorDetailDtoSchema),
    },
  },
},
409: {
  description: "다른 관리자가 먼저 저장한 편집 문서입니다.",
  content: jsonErrorResponse(adminConflictErrorDtoSchema),
},
```

import에 `adminConflictErrorDtoSchema`를 추가한다.

```ts
import {
  adminConflictErrorDtoSchema,
  adminCourseEditorDetailDtoSchema,
  adminCourseEditorSaveRequestDtoSchema,
  adminCourseDetailDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminEditorLessonDetailDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
} from "@workspace/core/admin"
```

GET/PUT switch에 conflict를 추가한다.

```ts
case "conflict":
  return context.json(result.error, 409)
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `bun --filter @workspace/admin-api test -- app.test`

Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add apps/admin-api/src/routes/curriculum-editor.route.ts apps/admin-api/src/app.test.ts
git commit -m "어드민 편집 저장 충돌을 409로 반환"
```

## Task 5: Admin UI와 HTTP client에 expectedRevision 연결

**Files:**

- Modify: `apps/admin/src/lib/api/admin-api.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.test.ts`
- Modify: `apps/admin/src/features/courses/course-editor/editor-state.ts`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- Modify: `apps/admin/src/app/(admin)/courses/[id]/page.tsx`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`

- [ ] **Step 1: editor-state 테스트 수정**

`apps/admin/src/features/courses/course-editor/editor-state.test.ts`의 저장 입력 테스트에서 working copy 생성 입력에 `revision: 0`을 추가하고 저장 payload를 검증한다.

```ts
expect(createCourseEditorSaveInput(workingCopy)).toEqual(
  expect.objectContaining({
    courseId: "sentence-structure",
    expectedRevision: 0,
  })
)
```

- [ ] **Step 2: page 테스트 수정**

`apps/admin/src/features/courses/admin-course-detail-page.test.tsx`의 render props에 `revision={0}`을 추가한다. 저장 mock은 새 document를 반환한다.

```ts
const saveCourseEditorDocument = vi.fn<AdminApi["saveCourseEditorDocument"]>(
  async (input) => ({
    status: "ok",
    value: {
      course: {
        id: input.courseId,
        title: input.course.title,
        description: input.course.description,
        sortOrder: input.course.sortOrder,
      },
      revision: input.expectedRevision + 1,
      curriculum: {
        chapters: input.chapters.map((chapter) => ({
          ...chapter,
          lessons: input.lessons
            .filter((lesson) => lesson.chapterId === chapter.id)
            .map((lesson) => lesson),
        })),
        steps: input.steps,
      },
    },
  })
)
```

저장 호출 기대값에 `expectedRevision: 0`을 추가한다.

```ts
expect(saveCourseEditorDocument).toHaveBeenCalledWith(
  expect.objectContaining({
    courseId: "sentence-structure",
    expectedRevision: 0,
  })
)
```

- [ ] **Step 3: conflict UI 테스트 추가**

`apps/admin/src/features/courses/admin-course-detail-page.test.tsx`에 테스트를 추가한다.

```ts
it("shows a conflict message when another admin saved first", async () => {
  const user = userEvent.setup()

  render(
    <AdminCourseDetailPage
      adminApi={createAdminApiMock({
        async saveCourseEditorDocument() {
          return {
            status: "error",
            error: {
              code: "conflict",
              message: "다른 관리자가 먼저 저장했습니다.",
            },
            httpStatus: 409,
          }
        },
      })}
      course={courseFixture}
      revision={0}
      curriculum={curriculumFixture}
      urlState={{
        view: "lesson",
        lessonId: "sentence-structure-01",
        stepId: null,
      }}
    />
  )

  await user.clear(screen.getByLabelText("코스 제목"))
  await user.type(screen.getByLabelText("코스 제목"), "충돌 코스")
  await user.click(screen.getByRole("button", { name: "저장" }))

  await waitFor(() => {
    expect(
      screen.getByText(
        "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 변경을 다시 적용하세요."
      )
    ).toBeTruthy()
  })
})
```

- [ ] **Step 4: 실패 확인**

Run: `bun --filter @workspace/admin test -- editor-state admin-course-detail-page http-admin-api`

Expected: `revision` prop과 저장 응답 타입이 아직 없어 실패한다.

- [ ] **Step 5: API 타입 수정**

`apps/admin/src/lib/api/admin-api.ts`에서 저장 반환 타입을 바꾼다.

```ts
saveCourseEditorDocument(
  input: AdminCourseEditorSaveRequestDto
): Promise<AdminApiResult<AdminCourseEditorDetailDto>>
```

`apps/admin/src/lib/api/http-admin-api.ts`는 body 전송 로직을 유지한다. `isAdminApiErrorDto`는 이미 `conflict`를 허용하므로 그대로 둔다.

- [ ] **Step 6: editor-state에 revision 추가**

`apps/admin/src/features/courses/course-editor/editor-state.ts`에 working copy revision을 추가한다.

```ts
export type CourseEditorWorkingCopy = {
  course: AdminCourseDetailDto
  dirty: CourseEditorDirtyState
  revision: number
  curriculum: AdminEditorCurriculumDetailDto
  steps: AdminEditorCurriculumDetailDto["steps"]
}
```

생성 입력과 반환에 revision을 추가한다.

```ts
export function createCourseEditorWorkingCopy(input: {
  course: AdminCourseDetailDto
  revision: number
  curriculum: AdminEditorCurriculumDetailDto
}): CourseEditorWorkingCopy {
  return {
    course: { ...input.course },
    dirty: getDirtyState([]),
    revision: input.revision,
    curriculum: {
      ...input.curriculum,
      chapters: input.curriculum.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({ ...lesson })),
      })),
      steps: input.curriculum.steps.map((step) => ({
        ...step,
        content: cloneJsonValue(step.content),
      })),
    },
    steps: input.curriculum.steps.map((step) => ({
      ...step,
      content: cloneJsonValue(step.content),
    })),
  }
}
```

저장 입력에 `expectedRevision`을 추가한다.

```ts
export function createCourseEditorSaveInput(
  workingCopy: CourseEditorWorkingCopy
): AdminSaveCurriculumContentRequestDto {
  return {
    courseId: workingCopy.course.id,
    expectedRevision: workingCopy.revision,
    course: {
      title: workingCopy.course.title,
      description: workingCopy.course.description,
      sortOrder: workingCopy.course.sortOrder,
    },
    chapters: workingCopy.curriculum.chapters.map((chapter) => ({
      id: chapter.id,
      sortOrder: chapter.sortOrder,
      status: chapter.status,
      title: chapter.title,
    })),
    lessons: workingCopy.curriculum.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        ...lesson,
        chapterId: chapter.id,
      }))
    ),
    steps: workingCopy.steps,
  }
}
```

- [ ] **Step 7: page prop과 save 성공 처리 수정**

`apps/admin/src/features/courses/admin-course-detail-page.tsx` props에 revision을 추가한다.

```ts
type AdminCourseDetailPageProps = {
  adminApi?: AdminApi
  adminApiBaseUrl?: string
  course: AdminCourseDetailDto
  revision: number
  curriculum: AdminEditorCurriculumDetailDto
  urlState: CourseEditorUrlState
}
```

working copy 생성 호출을 바꾼다.

```ts
createCourseEditorWorkingCopy({ course, revision, curriculum })
```

저장 성공 처리와 conflict 메시지를 바꾼다.

```ts
if (result.status === "error") {
  setStatusMessage(
    result.error.code === "conflict"
      ? "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 변경을 다시 적용하세요."
      : result.error.message
  )
  return
}

setWorkingCopy(
  createCourseEditorWorkingCopy({
    course: result.value.course,
    revision: result.value.revision,
    curriculum: result.value.curriculum,
  })
)
```

- [ ] **Step 8: route에서 revision 전달**

`apps/admin/src/app/(admin)/courses/[id]/page.tsx`의 component props에 revision을 추가한다.

```tsx
<AdminCourseDetailPage
  adminApiBaseUrl={process.env["ADMIN_API_BASE_URL"]}
  course={editorDocument.value.course}
  revision={editorDocument.value.revision}
  curriculum={editorDocument.value.curriculum}
  urlState={urlState}
/>
```

- [ ] **Step 9: 테스트 통과 확인**

Run: `bun --filter @workspace/admin test -- editor-state admin-course-detail-page http-admin-api`

Expected: PASS

- [ ] **Step 10: 커밋**

```bash
git add apps/admin/src/lib/api/admin-api.ts apps/admin/src/lib/api/http-admin-api.ts apps/admin/src/lib/api/http-admin-api.test.ts apps/admin/src/features/courses/course-editor/editor-state.ts apps/admin/src/features/courses/admin-course-detail-page.tsx 'apps/admin/src/app/(admin)/courses/[id]/page.tsx' apps/admin/src/features/courses/admin-course-detail-page.test.tsx apps/admin/src/features/courses/course-editor/editor-state.test.ts
git commit -m "어드민 편집 UI에 저장 revision 연결"
```

## Task 6: 문서 갱신

**Files:**

- Modify: `DOMAIN.md`
- Modify: `BACKEND.md`
- Modify: `docs/admin-site.md`
- Modify: `docs/curriculum-editor-overwrite-concurrency-audit.md`

- [ ] **Step 1: DOMAIN 문서 갱신**

`DOMAIN.md`의 어드민 편집 정책에 다음 내용을 추가한다.

```md
어드민 코스 편집기는 현재 커리큘럼 하나를 직접 편집하지만, 저장은 `curriculum_revision` 기반 낙관적 동시성 제어를 따른다. 관리자가 편집 문서를 읽은 뒤 다른 관리자가 먼저 저장하면 이후 저장 요청은 `409 conflict`로 거절된다.

챕터와 레슨은 삭제 후 재생성하지 않는다. 저장 요청에 포함된 항목은 ID 기준으로 갱신하고, 요청에서 빠진 기존 챕터와 레슨은 `archived` 상태로 전환해 추적 가능한 row ID를 유지한다.
```

- [ ] **Step 2: BACKEND 문서 갱신**

`BACKEND.md`의 관리자 편집 설명을 다음 내용으로 갱신한다.

```md
관리자 편집은 현재 커리큘럼 전체 스냅샷을 저장하되 `expectedRevision`을 필수로 받는다. 서버는 `courses.curriculum_revision`과 일치하는 요청만 반영하고, 저장 성공 시 revision을 증가시킨 편집 문서를 반환한다. revision이 다르면 `409 conflict`를 반환하고 커리큘럼 row를 변경하지 않는다.
```

- [ ] **Step 3: admin-site 문서 완료 기록 추가**

`docs/admin-site.md` 상단에 완료 기록을 추가한다.

```md
## 2026-05-31 어드민 편집 저장 동시성 개선 완료

- 코스 편집 문서에 `revision`을 포함하고 저장 요청에 `expectedRevision`을 요구하도록 했다.
- Admin API는 오래된 편집 문서 저장을 `409 conflict`로 거절한다.
- 커리큘럼 저장은 챕터와 레슨을 삭제 후 삽입하지 않고 ID 기준 갱신과 `archived` 전환으로 처리한다.
```

- [ ] **Step 4: 감사 문서 상태 갱신**

`docs/curriculum-editor-overwrite-concurrency-audit.md` 끝에 구현 완료 섹션을 추가한다.

```md
## 구현 완료 기준 반영

개선 후 저장 경계는 `curriculum_revision` 기반 낙관적 동시성 제어를 사용한다. stale 저장은 `409 conflict`로 거절되며, 충돌 요청은 챕터, 레슨, 스텝 row를 변경하지 않는다. 챕터와 레슨 저장은 ID 기준 upsert/update와 `archived` 전환으로 처리해 row ID를 유지한다.
```

- [ ] **Step 5: 문서 포맷 확인**

Run: `bun prettier --check DOMAIN.md BACKEND.md docs/admin-site.md docs/curriculum-editor-overwrite-concurrency-audit.md`

Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add DOMAIN.md BACKEND.md docs/admin-site.md docs/curriculum-editor-overwrite-concurrency-audit.md
git commit -m "어드민 편집 동시성 정책 문서화"
```

## Task 7: 최종 검증

**Files:**

- No file edits

- [ ] **Step 1: Core 테스트 실행**

Run: `bun --filter @workspace/core test`

Expected: PASS

- [ ] **Step 2: DB 테스트 실행**

Run: `bun --filter @workspace/db test`

Expected: PASS

- [ ] **Step 3: Admin API 테스트 실행**

Run: `bun --filter @workspace/admin-api test`

Expected: PASS

- [ ] **Step 4: Admin UI 테스트 실행**

Run: `bun --filter @workspace/admin test`

Expected: PASS

- [ ] **Step 5: 타입체크 실행**

Run: `bun typecheck`

Expected: PASS

- [ ] **Step 6: 린트 실행**

Run: `bun lint`

Expected: PASS

- [ ] **Step 7: pre-commit 실행**

Run: `bun lefthook run pre-commit`

Expected: PASS

- [ ] **Step 8: 작업트리 확인**

Run: `git status --short`

Expected: 의도한 변경만 남아 있거나 모든 변경이 커밋되어 깨끗하다. 기존 미추적 `codebase.md`가 계속 보이면 사용자 변경으로 간주하고 건드리지 않는다.

## Self-Review

- Spec coverage: 낙관적 동시성 제어는 Task 1, 3, 4, 5가 구현한다. 삭제 후 삽입 제거는 Task 3이 구현한다. 명시적 conflict UX는 Task 5가 구현한다. 문서 최신화는 Task 6이 구현한다.
- Placeholder scan: 계획에는 빈칸을 남기는 표현이나 실행자가 임의로 해석해야 하는 단계가 없다.
- Type consistency: `revision`은 편집 문서 응답 필드이고, `expectedRevision`은 저장 요청 필드다. 저장 성공 결과는 `AdminCourseEditorDetailDto` 형태의 `document`를 repository에서 반환하고 service/API/client는 같은 document shape을 사용한다.
