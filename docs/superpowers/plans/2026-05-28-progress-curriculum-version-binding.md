# 학습 진행 커리큘럼 버전 귀속 Implementation Plan

> **에이전트 작업자 필수 지침:** 이 계획을 태스크 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** 학습자의 코스/레슨 진행을 학습 시작 시점의 커리큘럼 버전에 귀속시키고, 진행률과 다음 레슨 계산이 해당 버전의 레슨 배치를 기준으로 동작하게 한다.

**아키텍처:** 공개 콘텐츠 조회는 계속 최신 published 버전을 사용한다. 인증된 학습 진행은 `course_progress.curriculum_version_id`를 기준으로 선택된 버전을 유지하고, `lesson_progress.curriculum_version_id`에 각 레슨 진행의 기준 버전을 함께 기록한다. 학습 서비스는 기존 진행이 있으면 그 버전을 유지하고, 새 진행이면 DB repository에서 최신 published 버전을 선택한다.

**기술 스택:** Bun, TypeScript, Drizzle SQLite, Vitest, Markdown, Prettier.

---

## 범위 확인

### 포함

- `CurriculumVersionId` 브랜드 타입 추가
- 학습 repository 계약에 커리큘럼 버전 ID 포함
- `course_progress`, `lesson_progress`에 `curriculum_version_id` 추가
- 기존 진행 row를 코스별 `v1` published 버전으로 backfill
- 신규 학습 진행 저장 시 최신 published 버전 선택
- 기존 학습 진행 저장 시 기존 `course_progress.curriculum_version_id` 유지
- 코스 진행률과 다음 레슨 계산을 선택된 커리큘럼 버전의 active 레슨 배치 기준으로 변경
- 레슨 진행 저장과 완료 처리 시 해당 레슨이 선택된 커리큘럼 버전에 포함되는지 검증
- `/docs` 문서와 구현 로그 갱신

### 제외

- 공개 API 응답 DTO에 `curriculumVersionId` 노출
- 학습자 업그레이드 UX
- 관리자 draft/published 발행 API
- 마이그레이션 맵
- `lesson_answers`의 버전 분리
- 레슨 step 본문 snapshot 분리

## 파일 구조

- 수정: `packages/core/src/content/content.ids.ts`
  - `CurriculumVersionId` 브랜드 타입과 생성 함수를 추가한다.
- 수정: `packages/core/src/learning/learning.repository.ts`
  - 진행 record/input과 repository port에 커리큘럼 버전 계약을 추가한다.
- 수정: `packages/core/src/learning/learning.service.ts`
  - 진행 버전 선택, 버전별 레슨 배치 조회, 레슨 포함 여부 검증을 추가한다.
- 수정: `packages/core/src/learning/learning.service.test.ts`
  - 기존 진행 버전 유지, 신규 진행 최신 버전 선택, 버전 밖 레슨 거절을 검증한다.
- 수정: `packages/db/src/schema/learning.schema.ts`
  - `course_progress`, `lesson_progress`에 `curriculum_version_id` 컬럼을 추가한다.
- 생성: `packages/db/src/migrations/0004-progress-curriculum-version.sql`
  - 기존 진행 row를 코스별 `v1` published 버전으로 backfill한다.
- 수정: `packages/db/src/migrations/run-content-migration.ts`
  - SQLite의 `alter table add column if not exists` 부재를 보완하는 idempotent 컬럼 추가 helper를 둔다.
- 수정: `packages/db/src/repositories/drizzle-learning.repository.ts`
  - 버전 ID 저장/조회, 최신 published 버전 선택, 버전별 레슨 배치 조회, 포함 여부 검증을 구현한다.
- 수정: `packages/db/src/repositories/drizzle-learning.repository.test.ts`
  - migration 컬럼, 저장/조회 mapping, 버전별 완료 카운트를 검증한다.
- 수정: `BACKEND.md`
  - 진행 테이블의 버전 귀속과 아직 제외된 업그레이드 기능을 기록한다.
- 수정: `docs/admin-site.md`
  - 3단계 구현 시작/완료 로그를 남긴다.
- 수정: `docs/platform-backend-api.md`
  - 인증된 진행 API가 진행 버전을 유지하는 동작을 기록한다.

## 설계 결정

- `course_progress.curriculum_version_id`는 사용자가 해당 코스에서 현재 학습 중인 커리큘럼 버전이다.
- `lesson_progress.curriculum_version_id`는 레슨 진행 row가 어느 커리큘럼 버전에서 생성되었는지 기록한다.
- 새 학습 진행은 코스별 최신 published 버전으로 시작한다.
- 기존 `course_progress`가 있으면 이후 레슨 진행 저장과 완료 처리는 그 버전을 유지한다.
- `lesson_progress`의 unique index는 이번 단계에서 `user_id`, `lesson_id` 조합을 유지한다. 한 사용자가 한 코스에서 동시에 여러 버전을 병행하는 UX는 아직 제공하지 않는다.
- `lesson_answers`는 이번 단계에서 버전 컬럼을 추가하지 않는다. 답변은 레슨 step에 귀속되고, 버전 전환/마이그레이션이 들어가는 단계에서 분리 여부를 다시 결정한다.
- 공개 레슨 본문 `GET /lessons/:lessonId`는 기존 호환성을 유지한다. 버전 일관성은 진행 저장과 완료 처리에서 검증한다.

## 작업 1: Core 학습 계약과 서비스 버전 선택

**파일:**

- 수정: `packages/core/src/content/content.ids.ts`
- 수정: `packages/core/src/learning/learning.repository.ts`
- 수정: `packages/core/src/learning/learning.service.ts`
- 수정: `packages/core/src/learning/learning.service.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/core/src/learning/learning.service.test.ts`의 content import를 다음처럼 확장한다.

```ts
import { courseId, curriculumVersionId, lessonId } from "@/content"
```

`createRepository()` 반환값에 새 repository method 기본값을 추가한다.

```ts
curriculumVersionIncludesLesson: vi.fn(async () => true),
findLatestPublishedCurriculumVersionId: vi.fn(async () =>
  curriculumVersionId("sentence-structure-v1")
),
listCurriculumVersionLessonIds: vi.fn(async () => [
  lessonId("sentence-structure-01"),
  lessonId("sentence-structure-02"),
]),
```

같은 파일에 다음 테스트를 추가한다.

```ts
it("calculates course progress from the learner curriculum version", async () => {
  const repository = {
    ...createRepository(),
    findCourseProgress: vi.fn(async () => ({
      completedCount: 1,
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      lastLessonId: lessonId("sentence-structure-01"),
    })),
    listCurriculumVersionLessonIds: vi.fn(async () => [
      lessonId("sentence-structure-01"),
      lessonId("sentence-structure-02"),
    ]),
    listLessonProgressByCourse: vi.fn(async () => [
      {
        courseId: courseId("sentence-structure"),
        curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
        currentStepId: "sentence-structure-01-step-4",
        lessonId: lessonId("sentence-structure-01"),
        status: "completed" as const,
        stepOrder: 4,
      },
    ]),
  }
  const service = createLearningService({ contentService, repository })

  const result = await service.getCourseProgress(
    userId("user-1"),
    courseId("sentence-structure")
  )

  expect(result).toMatchObject({
    status: "ok",
    value: {
      completedCount: 1,
      nextLessonId: "sentence-structure-02",
      progressPercent: 50,
      totalLessons: 2,
    },
  })
  expect(repository.listCurriculumVersionLessonIds).toHaveBeenCalledWith(
    curriculumVersionId("sentence-structure-v1")
  )
  expect(repository.listLessonProgressByCourse).toHaveBeenCalledWith(
    userId("user-1"),
    courseId("sentence-structure"),
    curriculumVersionId("sentence-structure-v1")
  )
})

it("starts new lesson progress on the latest published curriculum version", async () => {
  const repository = {
    ...createRepository(),
    findLatestPublishedCurriculumVersionId: vi.fn(async () =>
      curriculumVersionId("sentence-structure-v2")
    ),
  }
  const service = createLearningService({ contentService, repository })

  const result = await service.saveLessonProgress(
    userId("user-1"),
    lessonId("sentence-structure-01"),
    {
      currentStepId: "sentence-structure-01-step-2",
      stepOrder: 2,
    }
  )

  expect(result.status).toBe("ok")
  expect(repository.upsertCourseProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      curriculumVersionId: "sentence-structure-v2",
    })
  )
  expect(repository.upsertLessonProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      curriculumVersionId: "sentence-structure-v2",
    })
  )
})

it("rejects progress for a lesson outside the learner curriculum version", async () => {
  const repository = {
    ...createRepository(),
    curriculumVersionIncludesLesson: vi.fn(async () => false),
  }
  const service = createLearningService({ contentService, repository })

  const result = await service.saveLessonProgress(
    userId("user-1"),
    lessonId("sentence-structure-01"),
    {
      currentStepId: "sentence-structure-01-step-2",
      stepOrder: 2,
    }
  )

  expect(result).toEqual({
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message: "Lesson is not part of the learner curriculum version.",
    },
  })
  expect(repository.upsertLessonProgress).not.toHaveBeenCalled()
})
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/core test -- learning.service.test.ts
```

기대 결과: `curriculumVersionId` export와 repository method가 아직 없어서 실패한다.

- [ ] **단계 3: Core 계약 구현**

`packages/core/src/content/content.ids.ts`에 다음 타입과 함수를 추가한다.

```ts
export type CurriculumVersionId = Brand<string, "curriculum-version-id">

export function curriculumVersionId(value: string): CurriculumVersionId {
  return value as CurriculumVersionId
}
```

`packages/core/src/learning/learning.repository.ts`에서 import와 record/input/interface를 다음 형태로 확장한다.

```ts
import type { CourseId, CurriculumVersionId, LessonId } from "@/content"

export interface CourseProgressRecord {
  completedCount: number
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  lastLessonId?: LessonId
}

export interface LessonProgressRecord {
  completedAt?: Date | null
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  currentStepId: string
  lessonId: LessonId
  status: LessonProgressStatus
  stepOrder: number
}

export interface UpsertCourseProgressInput {
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  lastLessonId: LessonId
  userId: UserId
}

export interface UpsertLessonProgressInput {
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  currentStepId: string
  lessonId: LessonId
  status: LessonProgressStatus
  stepOrder: number
  userId: UserId
}

export interface CompleteLessonInput {
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  finalStepId: string
  lessonId: LessonId
  stepOrder: number
  userId: UserId
}
```

`LearningRepository`에 다음 method를 추가한다.

```ts
findLatestPublishedCurriculumVersionId(
  courseId: CourseId
): Promise<CurriculumVersionId | undefined>
listCurriculumVersionLessonIds(
  curriculumVersionId: CurriculumVersionId
): Promise<LessonId[]>
curriculumVersionIncludesLesson(
  curriculumVersionId: CurriculumVersionId,
  lessonId: LessonId
): Promise<boolean>
```

- [ ] **단계 4: 학습 서비스 구현**

`packages/core/src/learning/learning.service.ts`에서 `CourseId`, `CurriculumVersionId`, `LessonId`를 import하고, 서비스 내부에 다음 helper를 추가한다.

```ts
async function resolveCurriculumVersionId(
  repository: LearningRepository,
  userId: UserId,
  courseId: CourseId
): Promise<CurriculumVersionId | undefined> {
  const existingProgress = await repository.findCourseProgress(userId, courseId)

  if (existingProgress) {
    return existingProgress.curriculumVersionId
  }

  return repository.findLatestPublishedCurriculumVersionId(courseId)
}
```

`getCourseProgress`는 `resolveCurriculumVersionId`로 버전을 찾고, `repository.listCurriculumVersionLessonIds(curriculumVersionId)` 결과를 기준으로 `completedCount`, `nextLessonId`, `progressPercent`, `totalLessons`를 계산한다.

`saveLessonProgress`와 `completeLesson`은 저장 전에 다음 검증을 수행한다.

```ts
const curriculumVersionId = await resolveCurriculumVersionId(
  repository,
  userId,
  lessonResult.value.courseId as CourseId
)

if (!curriculumVersionId) {
  return invalidRequest("Published curriculum version was not found.")
}

const isVersionLesson = await repository.curriculumVersionIncludesLesson(
  curriculumVersionId,
  lessonId
)

if (!isVersionLesson) {
  return invalidRequest("Lesson is not part of the learner curriculum version.")
}
```

이후 `upsertCourseProgress`, `upsertLessonProgress`, `completeLesson` 호출 input에 `curriculumVersionId`를 포함한다.

- [ ] **단계 5: 통과 확인**

실행:

```bash
bun --filter @workspace/core test -- learning.service.test.ts
bun --filter @workspace/core test
```

기대 결과: 학습 서비스 테스트가 모두 통과한다.

- [ ] **단계 6: 커밋**

```bash
git add packages/core/src/content/content.ids.ts packages/core/src/learning/learning.repository.ts packages/core/src/learning/learning.service.ts packages/core/src/learning/learning.service.test.ts
git commit -m "학습 도메인에 진행 버전 계약 추가"
```

## 작업 2: DB 진행 버전 저장과 조회

**파일:**

- 수정: `packages/db/src/schema/learning.schema.ts`
- 생성: `packages/db/src/migrations/0004-progress-curriculum-version.sql`
- 수정: `packages/db/src/migrations/run-content-migration.ts`
- 수정: `packages/db/src/repositories/drizzle-learning.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-learning.repository.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/db/src/repositories/drizzle-learning.repository.test.ts`의 import를 다음처럼 확장한다.

```ts
import {
  courseId,
  curriculumVersionId,
  lessonId,
} from "@workspace/core/content"
import {
  courseProgress,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  lessonProgress,
  user,
} from "@/schema"
```

마이그레이션 테스트에 다음 검증을 추가한다.

```ts
const courseProgressColumns = sqlite
  .query<{ name: string }, []>("pragma table_info(course_progress)")
  .all()
  .map((column) => column.name)
const lessonProgressColumns = sqlite
  .query<{ name: string }, []>("pragma table_info(lesson_progress)")
  .all()
  .map((column) => column.name)

expect(courseProgressColumns).toContain("curriculum_version_id")
expect(lessonProgressColumns).toContain("curriculum_version_id")
```

repository 테스트에 다음 테스트를 추가한다.

```ts
it("stores and reads curriculum version ids on progress rows", async () => {
  const repository = createDrizzleLearningRepository(db, { now: () => now })

  await repository.upsertCourseProgress({
    courseId: courseId("sentence-structure"),
    curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
    lastLessonId: lessonId("sentence-structure-01"),
    userId: userId("user-1"),
  })
  const lessonRow = await repository.upsertLessonProgress({
    courseId: courseId("sentence-structure"),
    curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
    currentStepId: "sentence-structure-01-step-1",
    lessonId: lessonId("sentence-structure-01"),
    status: "in-progress",
    stepOrder: 1,
    userId: userId("user-1"),
  })

  const courseRow = await repository.findCourseProgress(
    userId("user-1"),
    courseId("sentence-structure")
  )

  expect(courseRow?.curriculumVersionId).toBe("sentence-structure-v1")
  expect(lessonRow.curriculumVersionId).toBe("sentence-structure-v1")
})

it("counts completed lessons only inside the selected curriculum version", async () => {
  const repository = createDrizzleLearningRepository(db, { now: () => now })
  await db.insert(curriculumVersions).values({
    id: "sentence-structure-v2",
    courseId: "sentence-structure",
    versionNumber: 2,
    status: "published",
    title: "문장 구조의 기본 v2",
    changelog: "완료 카운트 검증",
    publishedAt: now,
    createdAt: now,
  })
  await db.insert(curriculumVersionChapters).values({
    id: "sentence-structure-chapter-1-v2",
    curriculumVersionId: "sentence-structure-v2",
    sourceChapterId: "sentence-structure-chapter-1",
    label: "1단원",
    title: "새 문장의 뼈대",
    sortOrder: 1,
    status: "active",
  })
  await db.insert(curriculumVersionLessons).values({
    id: "sentence-structure-01-v2",
    curriculumVersionId: "sentence-structure-v2",
    chapterId: "sentence-structure-chapter-1-v2",
    lessonId: "sentence-structure-01",
    title: "새 주어와 서술어 찾기",
    description: "새 버전 설명입니다.",
    sortOrder: 1,
    status: "active",
  })

  await repository.completeLesson({
    courseId: courseId("sentence-structure"),
    curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
    finalStepId: "sentence-structure-01-step-3",
    lessonId: lessonId("sentence-structure-01"),
    stepOrder: 3,
    userId: userId("user-1"),
  })
  await db.update(lessonProgress).set({
    curriculumVersionId: "sentence-structure-v2",
  })

  const completed = await repository.completeLesson({
    courseId: courseId("sentence-structure"),
    curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
    finalStepId: "sentence-structure-02-step-3",
    lessonId: lessonId("sentence-structure-02"),
    stepOrder: 3,
    userId: userId("user-1"),
  })

  expect(completed.completedCount).toBe(1)
})
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/db test -- drizzle-learning.repository.test.ts
```

기대 결과: `curriculum_version_id` 컬럼과 repository 계약 구현이 없어 실패한다.

- [ ] **단계 3: Drizzle schema와 migration 추가**

`packages/db/src/schema/learning.schema.ts`에서 `curriculumVersions`를 import하고, `courseProgress`, `lessonProgress`에 다음 컬럼을 추가한다.

```ts
curriculumVersionId: text("curriculum_version_id").references(
  () => curriculumVersions.id
),
```

`packages/db/src/migrations/0004-progress-curriculum-version.sql`을 생성한다.

```sql
pragma foreign_keys = on;

update course_progress
set curriculum_version_id = (
  select id
  from curriculum_versions
  where curriculum_versions.course_id = course_progress.course_id
    and curriculum_versions.version_number = 1
)
where curriculum_version_id is null;

update lesson_progress
set curriculum_version_id = (
  select course_progress.curriculum_version_id
  from course_progress
  where course_progress.user_id = lesson_progress.user_id
    and course_progress.course_id = lesson_progress.course_id
)
where curriculum_version_id is null;
```

`packages/db/src/migrations/run-content-migration.ts`에 다음 helper를 추가하고, `0003` 실행 뒤 `0004` 실행 전에 호출한다.

```ts
function addColumnIfMissing(
  sqlite: Database,
  tableName: string,
  columnName: string,
  alterTableSql: string
) {
  const columns = sqlite
    .query<{ name: string }, []>(`pragma table_info(${tableName})`)
    .all()

  if (columns.some((column) => column.name === columnName)) {
    return
  }

  sqlite.exec(alterTableSql)
}
```

호출 코드는 다음과 같다.

```ts
addColumnIfMissing(
  sqlite,
  "course_progress",
  "curriculum_version_id",
  "alter table course_progress add column curriculum_version_id text references curriculum_versions(id)"
)
addColumnIfMissing(
  sqlite,
  "lesson_progress",
  "curriculum_version_id",
  "alter table lesson_progress add column curriculum_version_id text references curriculum_versions(id)"
)
sqlite.exec(progressCurriculumVersionMigrationSql)
```

- [ ] **단계 4: Drizzle learning repository 구현**

`packages/db/src/repositories/drizzle-learning.repository.ts`에서 content schema import를 추가한다.

```ts
import {
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
} from "@/schema/content.schema"
```

`upsertCourseProgress`, `upsertLessonProgress`, `completeLesson` insert/update 값에 `curriculumVersionId: input.curriculumVersionId`를 추가한다. `countCompletedLessons`는 signature를 다음처럼 바꾼다.

```ts
async function countCompletedLessons(
  db: WritingAppDatabase,
  userId: string,
  courseId: string,
  curriculumVersionId: string
): Promise<number>
```

where 조건에 다음 조건을 추가한다.

```ts
eq(lessonProgress.curriculumVersionId, curriculumVersionId)
```

repository object에 다음 method를 추가한다.

```ts
async findLatestPublishedCurriculumVersionId(courseId) {
  const [version] = await db
    .select()
    .from(curriculumVersions)
    .where(
      and(
        eq(curriculumVersions.courseId, courseId),
        eq(curriculumVersions.status, "published")
      )
    )
    .orderBy(desc(curriculumVersions.versionNumber))
    .limit(1)

  return version?.id as CurriculumVersionId | undefined
},

async listCurriculumVersionLessonIds(curriculumVersionId) {
  const rows = await db
    .select({ lessonId: curriculumVersionLessons.lessonId })
    .from(curriculumVersionChapters)
    .innerJoin(
      curriculumVersionLessons,
      eq(curriculumVersionLessons.chapterId, curriculumVersionChapters.id)
    )
    .where(
      and(
        eq(curriculumVersionChapters.curriculumVersionId, curriculumVersionId),
        eq(curriculumVersionChapters.status, "active"),
        eq(curriculumVersionLessons.status, "active")
      )
    )
    .orderBy(
      asc(curriculumVersionChapters.sortOrder),
      asc(curriculumVersionLessons.sortOrder)
    )

  return rows.map((row) => row.lessonId as LessonId)
},

async curriculumVersionIncludesLesson(curriculumVersionId, lessonId) {
  const [row] = await db
    .select({ id: curriculumVersionLessons.id })
    .from(curriculumVersionLessons)
    .where(
      and(
        eq(curriculumVersionLessons.curriculumVersionId, curriculumVersionId),
        eq(curriculumVersionLessons.lessonId, lessonId),
        eq(curriculumVersionLessons.status, "active")
      )
    )
    .limit(1)

  return Boolean(row)
},
```

`mapCourseProgress`와 `mapLessonProgress`는 `curriculumVersionId`가 없으면 오류를 던지고, 있으면 브랜드 타입으로 반환한다.

- [ ] **단계 5: 통과 확인**

실행:

```bash
bun --filter @workspace/db test -- drizzle-learning.repository.test.ts
bun --filter @workspace/db test
```

기대 결과: DB 테스트가 모두 통과한다.

- [ ] **단계 6: 커밋**

```bash
git add packages/db/src/schema/learning.schema.ts packages/db/src/migrations/0004-progress-curriculum-version.sql packages/db/src/migrations/run-content-migration.ts packages/db/src/repositories/drizzle-learning.repository.ts packages/db/src/repositories/drizzle-learning.repository.test.ts
git commit -m "학습 진행을 커리큘럼 버전에 귀속"
```

## 작업 3: 문서 갱신과 전체 검증

**파일:**

- 수정: `BACKEND.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: 문서 갱신**

`BACKEND.md`의 콘텐츠 변경 정책과 `packages/db` 설명에 다음 내용을 반영한다.

```md
학습 진행은 `course_progress.curriculum_version_id`를 기준으로 학습자가 시작한 커리큘럼 버전을 유지한다. `lesson_progress.curriculum_version_id`는 각 레슨 진행이 어느 버전에서 생성되었는지 기록하며, 진행률과 다음 레슨 계산은 해당 버전의 active 레슨 배치를 기준으로 한다.
```

`docs/admin-site.md`와 `docs/platform-backend-api.md` 상단에 3단계 구현 시작/완료 로그를 추가한다.

- [ ] **단계 2: 문서 검색 확인**

실행:

```bash
rg -n "curriculum_version_id|진행 버전|커리큘럼 버전" BACKEND.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 진행 버전 귀속 정책과 아직 남은 업그레이드/발행 범위가 문서에 드러난다.

- [ ] **단계 3: 전체 검증**

실행:

```bash
bun prettier --write BACKEND.md docs/admin-site.md docs/platform-backend-api.md
bun --filter @workspace/core test
bun --filter @workspace/db typecheck
bun --filter @workspace/db test
bun --filter @workspace/api test
bun run test
git diff --check
```

기대 결과: 모든 명령이 종료 코드 0으로 끝난다.

- [ ] **단계 4: 커밋**

```bash
git add BACKEND.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "학습 진행 버전 귀속 문서 갱신"
```

## 자체 검토

- 로드맵 3단계의 핵심인 기존 진행 버전 유지, 신규 진행 최신 published 시작, 진행률/다음 레슨의 버전 기준 계산을 작업 1과 작업 2에 배치했다.
- 관리자 발행, 마이그레이션 맵, 업그레이드 UX, 답변 버전 분리는 제외 범위로 명시했다.
- 공개 API 응답 DTO에는 새 필드를 노출하지 않아 프론트엔드 변경 범위를 만들지 않는다.
- SQLite의 `alter table add column if not exists` 미지원은 `run-content-migration.ts` helper로 명시적으로 처리한다.
