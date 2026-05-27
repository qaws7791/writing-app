# 커리큘럼 노드 상태 정책 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 삭제를 실제 delete가 아니라 커리큘럼 버전 노드 상태로 다루도록 공개, 학습, 관리자 조회 경계를 고정한다.

**Architecture:** 기존 `curriculum_version_chapters.status`와 `curriculum_version_lessons.status` 컬럼을 사용한다. 공개 콘텐츠와 학습 진행 repository는 active 노드만 사용하고, 관리자 코스 트리 조회는 최신 published 버전의 active/deprecated/archived 노드를 status와 함께 반환한다. 상태 변경 API는 draft/published 발행 단계까지 열지 않는다.

**Tech Stack:** Bun, TypeScript, Zod, Hono, Drizzle SQLite, Vitest, Markdown, Prettier.

---

## 범위 확인

### 포함

- 5단계 설계 문서와 구현 계획 문서
- `/docs` 시작/완료 로그
- admin DTO의 노드 상태 필드
- admin repository의 최신 published 커리큘럼 버전 기반 코스 트리 조회
- 공개 콘텐츠 repository의 archived/deprecated 필터 회귀 테스트
- 학습 repository의 active membership 회귀 테스트
- 완료한 archived 레슨의 완료 카운트 보존 테스트
- admin API route status 응답 테스트

### 제외

- 실제 delete API
- archive/deprecate mutation API
- 관리자 draft/published 발행 API
- 학습자 업그레이드 UX
- public DTO의 status 노출
- 새 DB migration

## 파일 구조

- 생성: `docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md`
  - 5단계 설계와 결정 사항을 기록한다.
- 생성: `docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md`
  - 구현 계획을 기록한다.
- 수정: `docs/admin-site.md`
  - 5단계 계획/구현 시작과 완료 로그를 남긴다.
- 수정: `docs/platform-backend-api.md`
  - 학습자 공개/진행 API의 상태 정책을 기록한다.
- 수정: `DOMAIN.md`
  - 현재 구현 상태를 최신 단계로 갱신한다.
- 수정: `BACKEND.md`
  - 관리자 조회와 공개/학습 조회의 상태 정책을 기록한다.
- 수정: `docs/curriculum-change-policy.md`
  - 현재 상태와 5단계 완료 내용을 갱신한다.
- 수정: `packages/core/src/admin/admin.dto.ts`
  - `adminCurriculumNodeStatusSchema`와 status 필드를 추가한다.
- 수정: `packages/core/src/admin/admin.service.test.ts`
  - status DTO 검증 테스트를 추가한다.
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`
  - 코스 트리 조회를 최신 published 커리큘럼 버전 기준으로 바꾼다.
- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
  - 관리자 코스 트리에 노드 status가 포함되는지 검증한다.
- 수정: `packages/db/src/repositories/drizzle-content.repository.test.ts`
  - 공개 콘텐츠가 archived/deprecated 노드를 숨기는지 검증한다.
- 수정: `packages/db/src/repositories/drizzle-learning.repository.test.ts`
  - 학습 repository가 active 노드만 진행 후보로 쓰는지 검증한다.
- 수정: `packages/core/src/learning/learning.service.test.ts`
  - 완료한 archived 레슨의 완료 카운트 보존을 검증한다.
- 수정: `apps/admin-api/src/app.test.ts`
  - admin course tree 응답에 status 필드가 포함되는지 검증한다.
- 수정: `apps/admin-api/src/routes/courses.route.ts`
  - OpenAPI 200 응답 schema를 course list와 course tree union으로 표현한다.

## 작업 1: 5단계 문서 계획 고정

**파일:**

- 생성: `docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md`
- 생성: `docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: 문서 로그 추가**

`docs/admin-site.md` 상단에 다음 로그를 추가한다.

```md
## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 5단계 구현 계획을 작성한다.
- 실제 delete API를 열지 않고, 챕터와 레슨 노드의 `active`, `deprecated`, `archived` 상태를 읽기 계약으로 고정한다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md`에 작성한다.
- 관리자 코스 트리는 최신 published 커리큘럼 버전의 노드 상태를 표시하고, 공개/학습자 경로는 active 노드만 사용하는 범위로 제한한다.
```

`docs/platform-backend-api.md` 상단에 다음 로그를 추가한다.

```md
## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 시작

- 공개 콘텐츠 API와 학습 진행 API가 archived/deprecated 노드를 신규 학습 경로에서 제외하도록 5단계 계획을 작성한다.
- 이미 완료된 archived 레슨의 완료 카운트는 학습 진행 row 기준으로 보존한다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 완료

- 공개 콘텐츠 API는 최신 published 버전의 active 챕터와 active 레슨만 반환한다.
- 학습 진행 API는 진행 버전의 active 레슨만 다음 학습 후보와 저장 가능 레슨으로 사용한다.
- delete API와 archive mutation API는 아직 제공하지 않는다.
```

- [ ] **단계 2: 포맷과 diff 확인**

```bash
bun prettier --write docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md docs/admin-site.md docs/platform-backend-api.md
git diff --check
```

기대 결과: 종료 코드 0.

- [ ] **단계 3: 커밋**

```bash
git add docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "커리큘럼 노드 상태 정책 계획 문서화"
```

## 작업 2: 관리자 DTO에 노드 상태 추가

**파일:**

- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/core/src/admin/admin.service.test.ts`
- 수정: `apps/admin-api/src/app.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/core/src/admin/admin.service.test.ts`의 기본 repository fixture에 chapter와 lesson status를 추가한다.

```ts
status: "active",
```

`returns a course tree` 테스트에서 다음 값을 검증한다.

```ts
lessons: [{ lessonId: "sentence-structure-01", status: "active" }],
status: "active",
```

알 수 없는 status가 repository에서 반환되면 service가 unavailable을 반환하는 테스트를 추가한다.

```ts
it("returns unavailable when course tree repository returns an invalid node status", async () => {
  const service = createAdminService({
    repository: {
      ...repository,
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
                  status: "deleted",
                  lessons: [],
                },
              ],
            },
          ],
        }
      },
    },
  })

  await expect(service.listCourseTree()).resolves.toMatchObject({
    status: "unavailable",
    error: {
      code: "database-unavailable",
    },
  })
})
```

`apps/admin-api/src/app.test.ts`의 fake `adminService.listCourseTree()` 응답과 기대 응답에 `status: "active"`를 추가한다.

- [ ] **단계 2: 실패 확인**

```bash
bun --filter @workspace/core test -- admin.service.test.ts
bun --filter @workspace/admin-api test -- app.test.ts
```

기대 결과: core/admin DTO가 status 필드를 아직 허용하지 않아 테스트가 실패한다.

- [ ] **단계 3: 구현**

`packages/core/src/admin/admin.dto.ts`에 상태 schema를 추가하고 chapter/lesson DTO에 필드를 추가한다.

```ts
export const adminCurriculumNodeStatusSchema = z.enum([
  "active",
  "deprecated",
  "archived",
])

export const adminLessonSummaryDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().positive(),
  status: adminCurriculumNodeStatusSchema,
})

export const adminChapterSummaryDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
  status: adminCurriculumNodeStatusSchema,
  lessons: z.array(adminLessonSummaryDtoSchema),
})
```

`apps/admin-api/src/routes/courses.route.ts`는 `adminCourseTreeDtoSchema`를 import하고 OpenAPI 200 schema를 union으로 바꾼다.

```ts
schema: resolver(z.union([adminCourseListDtoSchema, adminCourseTreeDtoSchema])),
```

- [ ] **단계 4: 통과 확인**

```bash
bun --filter @workspace/core test -- admin.service.test.ts
bun --filter @workspace/admin-api test -- app.test.ts
```

기대 결과: 두 테스트가 모두 통과한다.

- [ ] **단계 5: 커밋**

```bash
git add packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.service.test.ts apps/admin-api/src/app.test.ts apps/admin-api/src/routes/courses.route.ts
git commit -m "관리자 코스 트리에 노드 상태 계약 추가"
```

## 작업 3: 관리자 repository를 최신 published 버전 기준으로 변경

**파일:**

- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/db/src/repositories/drizzle-admin.repository.test.ts`의 course tree fixture에 `curriculumVersions`, `curriculumVersionChapters`, `curriculumVersionLessons` insert를 추가하고 기대값에 status를 포함한다. 테스트 이름은 다음으로 바꾼다.

```ts
it("lists latest published curriculum tree with node statuses", async () => {
```

핵심 기대값은 다음과 같다.

```ts
expect(result.courses[0]?.chapters[0]).toMatchObject({
  id: "version-chapter-first-v2",
  status: "deprecated",
  lessons: [
    {
      id: "version-lesson-first-v2",
      lessonId: "lesson-first",
      status: "active",
    },
    {
      id: "version-lesson-second-v2",
      lessonId: "lesson-second",
      status: "archived",
    },
  ],
})
```

- [ ] **단계 2: 실패 확인**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
```

기대 결과: 현재 repository가 원본 `course_chapters`, `course_lessons`를 읽어 version node id와 status를 반환하지 않아 실패한다.

- [ ] **단계 3: 구현**

`packages/db/src/repositories/drizzle-admin.repository.ts`의 import를 다음처럼 확장한다.

```ts
import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm"
```

schema import에 버전 테이블을 추가한다.

```ts
import {
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  user,
} from "@/schema"
```

`listCourseTree()`는 최신 published 버전 map을 만들고 version chapter/lesson row를 반환한다.

```ts
async listCourseTree() {
  const courseRows = await db.select().from(courses).orderBy(asc(courses.sortOrder))
  const latestVersionsByCourseId = await listLatestPublishedVersionsByCourseId(db)
  const versionIds = [...latestVersionsByCourseId.values()].map((version) => version.id)
  const [chapterRows, lessonRows] =
    versionIds.length === 0
      ? [[], []]
      : await Promise.all([
          db
            .select()
            .from(curriculumVersionChapters)
            .where(inArray(curriculumVersionChapters.curriculumVersionId, versionIds))
            .orderBy(asc(curriculumVersionChapters.sortOrder)),
          db
            .select()
            .from(curriculumVersionLessons)
            .where(inArray(curriculumVersionLessons.curriculumVersionId, versionIds))
            .orderBy(asc(curriculumVersionLessons.sortOrder)),
        ])

  return {
    courses: courseRows.map((course) => {
      const version = latestVersionsByCourseId.get(course.id)
      const courseChapters = version
        ? chapterRows.filter((chapter) => chapter.curriculumVersionId === version.id)
        : []

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        sortOrder: course.sortOrder,
        chapters: courseChapters.map((chapter) => ({
          id: chapter.id,
          label: chapter.label,
          title: chapter.title,
          sortOrder: chapter.sortOrder,
          status: chapter.status,
          lessons: lessonRows
            .filter((lesson) => lesson.chapterId === chapter.id)
            .map((lesson) => ({
              id: lesson.id,
              lessonId: lesson.lessonId,
              title: lesson.title,
              description: lesson.description,
              sortOrder: lesson.sortOrder,
              status: lesson.status,
            })),
        })),
      }
    }),
  }
}
```

helper는 content repository와 같은 정책으로 작성한다.

```ts
async function listLatestPublishedVersionsByCourseId(db: WritingAppDatabase) {
  const versionRows = await db
    .select()
    .from(curriculumVersions)
    .where(eq(curriculumVersions.status, "published"))
    .orderBy(
      asc(curriculumVersions.courseId),
      asc(curriculumVersions.versionNumber)
    )

  return versionRows.reduce((versionsByCourseId, version) => {
    versionsByCourseId.set(version.courseId, version)

    return versionsByCourseId
  }, new Map<string, typeof curriculumVersions.$inferSelect>())
}
```

- [ ] **단계 4: 통과 확인**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
bun --filter @workspace/db test
```

기대 결과: db 테스트가 모두 통과한다.

- [ ] **단계 5: 커밋**

```bash
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "관리자 코스 트리를 최신 버전 상태 기준으로 조회"
```

## 작업 4: 공개/학습 상태 정책 회귀 테스트

**파일:**

- 수정: `packages/db/src/repositories/drizzle-content.repository.test.ts`
- 수정: `packages/db/src/repositories/drizzle-learning.repository.test.ts`
- 수정: `packages/core/src/learning/learning.service.test.ts`

- [ ] **단계 1: 공개 콘텐츠 테스트 추가**

`packages/db/src/repositories/drizzle-content.repository.test.ts`에 archived/deprecated가 숨겨지는 테스트를 추가한다.

```ts
it("hides archived and deprecated nodes from public curriculum paths", async () => {
  const db = createDatabase(sqlite)
  await db.insert(curriculumVersions).values({
    id: "sentence-structure-v2",
    courseId: "sentence-structure",
    versionNumber: 2,
    status: "published",
    title: "문장 구조의 기본 v2",
    changelog: "상태 정책 검증",
    publishedAt: new Date("2026-05-28T00:00:00.000Z"),
    createdAt: new Date("2026-05-28T00:00:00.000Z"),
  })
  await db.insert(curriculumVersionChapters).values([
    {
      id: "sentence-structure-active-chapter-v2",
      curriculumVersionId: "sentence-structure-v2",
      sourceChapterId: "sentence-structure-chapter-1",
      label: "1단원",
      title: "공개 챕터",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "sentence-structure-archived-chapter-v2",
      curriculumVersionId: "sentence-structure-v2",
      sourceChapterId: "sentence-structure-chapter-2",
      label: "2단원",
      title: "숨김 챕터",
      sortOrder: 2,
      status: "archived",
    },
  ])
  await db.insert(curriculumVersionLessons).values([
    {
      id: "sentence-structure-active-lesson-v2",
      curriculumVersionId: "sentence-structure-v2",
      chapterId: "sentence-structure-active-chapter-v2",
      lessonId: "sentence-structure-01",
      title: "공개 레슨",
      description: "공개되는 레슨입니다.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "sentence-structure-deprecated-lesson-v2",
      curriculumVersionId: "sentence-structure-v2",
      chapterId: "sentence-structure-active-chapter-v2",
      lessonId: "sentence-structure-02",
      title: "대체 예정 레슨",
      description: "공개 경로에서는 숨깁니다.",
      sortOrder: 2,
      status: "deprecated",
    },
    {
      id: "sentence-structure-archived-lesson-v2",
      curriculumVersionId: "sentence-structure-v2",
      chapterId: "sentence-structure-archived-chapter-v2",
      lessonId: "sentence-structure-03",
      title: "숨김 레슨",
      description: "숨김 챕터 하위 레슨입니다.",
      sortOrder: 1,
      status: "active",
    },
  ])
  const repository = createDrizzleContentRepository(db)

  const categories = await repository.listCourseCategories()
  const search = await repository.searchCourses("문장")
  const detail = await repository.findCourseDetail(
    courseId("sentence-structure")
  )

  const summary = categories.categories
    .flatMap((category) => category.courses)
    .find((course) => course.id === "sentence-structure")
  const searchSummary = search.courses.find(
    (course) => course.id === "sentence-structure"
  )

  expect(summary?.lessonCount).toBe(1)
  expect(searchSummary?.lessonCount).toBe(1)
  expect(detail?.lessonCount).toBe(1)
  expect(detail?.chapters).toEqual([
    {
      id: "sentence-structure-active-chapter-v2",
      label: "1단원",
      title: "공개 챕터",
      lessons: [
        {
          id: "sentence-structure-active-lesson-v2",
          lessonId: "sentence-structure-01",
          title: "공개 레슨",
          description: "공개되는 레슨입니다.",
          order: 1,
        },
      ],
    },
  ])
})
```

- [ ] **단계 2: 학습 repository 테스트 추가**

`packages/db/src/repositories/drizzle-learning.repository.test.ts`에 active membership 테스트를 추가한다.

```ts
it("uses only active curriculum nodes as learner-version lesson candidates", async () => {
  const repository = createDrizzleLearningRepository(db, { now: () => now })
  await db
    .update(curriculumVersionLessons)
    .set({ status: "archived" })
    .where(eq(curriculumVersionLessons.id, "sentence-structure-02-v1"))
  await db
    .update(curriculumVersionLessons)
    .set({ status: "deprecated" })
    .where(eq(curriculumVersionLessons.id, "sentence-structure-03-v1"))

  const lessonIds = await repository.listCurriculumVersionLessonIds(
    curriculumVersionId("sentence-structure-v1")
  )
  const includesArchived = await repository.curriculumVersionIncludesLesson(
    curriculumVersionId("sentence-structure-v1"),
    lessonId("sentence-structure-02")
  )

  expect(lessonIds).not.toContain(lessonId("sentence-structure-02"))
  expect(lessonIds).not.toContain(lessonId("sentence-structure-03"))
  expect(includesArchived).toBe(false)
})
```

`packages/db/src/repositories/drizzle-learning.repository.test.ts`의 import를 `import { eq } from "drizzle-orm"`로 확장한다.

- [ ] **단계 3: 완료 카운트 보존 테스트 추가**

`packages/core/src/learning/learning.service.test.ts`에 이미 완료된 archived 레슨 카운트 보존 테스트를 추가한다.

```ts
it("keeps completed archived lessons in the learner progress count", async () => {
  const repository = {
    ...createRepository(),
    listCurriculumVersionLessonIds: vi.fn(async () => [
      lessonId("sentence-structure-02"),
    ]),
    listLessonProgressByCourse: vi.fn(async () => [
      {
        courseId: courseId("sentence-structure"),
        curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
        currentStepId: "sentence-structure-01-step-3",
        lessonId: lessonId("sentence-structure-01"),
        status: "completed" as const,
        stepOrder: 3,
      },
    ]),
  }
  const service = createLearningService({ contentService, repository })

  const result = await service.getCourseProgress(
    userId("user-1"),
    courseId("sentence-structure")
  )

  expect(result).toEqual({
    status: "ok",
    value: {
      completedCount: 1,
      courseId: courseId("sentence-structure"),
      nextLessonId: lessonId("sentence-structure-02"),
      progressPercent: 100,
      totalLessons: 1,
    },
  })
})
```

- [ ] **단계 4: 통과 확인**

```bash
bun --filter @workspace/db test -- drizzle-content.repository.test.ts
bun --filter @workspace/db test -- drizzle-learning.repository.test.ts
bun --filter @workspace/core test -- learning.service.test.ts
```

기대 결과: 회귀 테스트가 모두 통과한다.

- [ ] **단계 5: 커밋**

```bash
git add packages/db/src/repositories/drizzle-content.repository.test.ts packages/db/src/repositories/drizzle-learning.repository.test.ts packages/core/src/learning/learning.service.test.ts
git commit -m "공개와 학습 경로의 노드 상태 정책 검증"
```

## 작업 5: 문서 갱신과 전체 검증

**파일:**

- 수정: `DOMAIN.md`
- 수정: `BACKEND.md`
- 수정: `docs/curriculum-change-policy.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: 문서 갱신**

`DOMAIN.md`의 현재 구현 상태를 갱신한다.

```md
현재 저장소는 커리큘럼 버전 스키마, 학습 진행 버전 귀속, 버전 인식 읽기 경로, 노드 상태 읽기 정책을 구현했다. 공개 콘텐츠와 학습 진행 경로는 active 노드만 신규 학습 경로로 사용하고, 관리자 코스 트리 조회는 최신 published 버전의 active/deprecated/archived 상태를 표시한다.
```

`BACKEND.md`에 다음 문장을 반영한다.

```md
관리자 코스 트리 조회는 최신 published 커리큘럼 버전의 챕터와 레슨을 상태와 함께 반환한다. 공개 콘텐츠와 학습 진행 경로는 active 노드만 신규 학습 경로로 사용하지만, 이미 저장된 완료 진행 row는 archived 여부와 관계없이 완료 성취로 남긴다.
```

`docs/curriculum-change-policy.md`의 현재 상태를 5단계 완료 기준으로 갱신한다.

`docs/admin-site.md`와 `docs/platform-backend-api.md` 상단에 구현 시작/완료 로그를 추가한다.

- [ ] **단계 2: 검색 확인**

```bash
rg -n "노드 상태|archived|deprecated|active|delete API|완료 카운트" DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 상태 정책과 delete API 제외 범위가 문서에 드러난다.

- [ ] **단계 3: 전체 검증**

```bash
bun prettier --write DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.service.test.ts packages/core/src/learning/learning.service.test.ts packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts packages/db/src/repositories/drizzle-content.repository.test.ts packages/db/src/repositories/drizzle-learning.repository.test.ts apps/admin-api/src/app.test.ts apps/admin-api/src/routes/courses.route.ts
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/admin-api test
bun run test
bun run lint
bun run typecheck
git diff --check
```

기대 결과: 모든 명령이 종료 코드 0으로 끝난다. `bun run lint`에서 기존 `turbo/no-undeclared-env-vars` 경고가 다시 보일 수 있지만 에러가 없어야 한다.

- [ ] **단계 4: 커밋**

```bash
git add DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "커리큘럼 노드 상태 정책 문서 갱신"
```

## 자체 검토

- 5단계 완료 조건인 archived 노드 숨김, 완료 성취 보존, 관리자 상태 표시를 각각 테스트로 확인한다.
- 실제 delete API와 archive mutation API는 제외 범위에 남긴다.
- 새 migration 없이 기존 상태 컬럼을 사용한다.
- public DTO에는 status를 노출하지 않는다.
