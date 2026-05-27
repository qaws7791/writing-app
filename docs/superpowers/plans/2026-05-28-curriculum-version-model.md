# 커리큘럼 버전 모델 추가 Implementation Plan

> **에이전트 작업자 필수 지침:** 이 계획을 태스크 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** 기존 코스 콘텐츠를 코스별 `v1` published 커리큘럼 버전으로 귀속시키고, 공개 콘텐츠 조회가 최신 published 버전 구조를 기준으로 동작하게 한다.

**아키텍처:** `courses`, `course_chapters`, `course_lessons`, `lessons`, `lesson_steps`는 호환성을 위해 유지하고, 그 위에 `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons`를 병렬로 추가한다. 이번 단계는 학습 진행 테이블을 바꾸지 않으며, 진행의 버전 귀속은 다음 단계에서 처리한다.

**기술 스택:** Bun, TypeScript, Drizzle SQLite, Vitest, Markdown, Prettier.

---

## 범위 확인

### 포함

- 커리큘럼 버전 Drizzle schema 추가
- `0003-curriculum-versioning.sql` migration 추가
- 콘텐츠 seed가 코스별 `v1` published 버전을 생성하도록 확장
- 공개 콘텐츠 repository가 최신 published 버전의 챕터와 레슨 구조를 기준으로 목록, 검색, 상세를 계산하도록 변경
- 기존 공개 API 응답 형태 유지
- `/docs` 문서와 구현 로그 갱신

### 제외

- `course_progress`, `lesson_progress`의 `curriculum_version_id` 추가
- 학습자별 진행 버전 선택
- 관리자 draft/published 발행 API
- 관리자 편집 UI
- 마이그레이션 맵
- 학습자 업그레이드 UX
- lesson step 본문 snapshot 분리

## 파일 구조

- 수정: `packages/db/src/schema/content.schema.ts`
  - 커리큘럼 버전, 버전 챕터, 버전 레슨 테이블을 추가한다.
- 생성: `packages/db/src/migrations/0003-curriculum-versioning.sql`
  - SQLite 커리큘럼 버전 테이블과 인덱스를 생성한다.
- 수정: `packages/db/src/migrations/run-content-migration.ts`
  - 새 migration SQL을 실행 순서에 연결한다.
- 수정: `packages/db/src/client.test.ts`
  - migration이 새 테이블을 생성하는지 검증한다.
- 수정: `packages/db/src/seeds/seed-content.ts`
  - seed가 기존 콘텐츠 구조와 함께 코스별 `v1` published 버전을 삽입한다.
- 수정: `packages/db/src/seeds/seed-content.test.ts`
  - seed가 version/chapter/lesson version rows를 만들고 stale row를 복구하는지 검증한다.
- 수정: `packages/db/src/repositories/drizzle-content.repository.ts`
  - 공개 목록, 검색, 상세 조회가 최신 published 버전 구조를 기준으로 동작하도록 변경한다.
- 수정: `packages/db/src/repositories/drizzle-content.repository.test.ts`
  - 최신 published 버전이 공개 조회 기준인지 검증한다.
- 수정: `BACKEND.md`
  - `packages/db` 테이블 목록과 콘텐츠 조회 정책을 커리큘럼 버전 모델 기준으로 갱신한다.
- 수정: `docs/admin-site.md`
  - 2단계 구현 계획과 완료 기록을 남긴다.
- 수정: `docs/platform-backend-api.md`
  - 공개 콘텐츠 API가 최신 published 버전 기준으로 확장되는 점을 기록한다.

## 설계 결정

- `curriculum_versions.id`는 seed에서 `${course.id}-v1` 형식으로 생성한다.
- `curriculum_versions.version_number`는 코스 안에서 증가하는 정수다.
- `curriculum_versions.status`는 `draft`, `published`, `archived` 중 하나다.
- `curriculum_version_chapters.status`와 `curriculum_version_lessons.status`는 `active`, `deprecated`, `archived` 중 하나다.
- 공개 목록, 검색, 상세 API는 `published` 중 가장 큰 `version_number`를 최신 버전으로 본다.
- published 버전이 없는 코스는 공개 목록과 검색에서 제외하고, 상세 조회는 `not-found`로 이어지게 `undefined`를 반환한다.
- 기존 `course_chapters`, `course_lessons`는 이번 단계에서 제거하지 않는다. 어드민 기존 읽기 화면과 과거 호환 경로를 깨지 않기 위해 그대로 유지한다.

## 작업 1: 커리큘럼 버전 schema와 migration

**파일:**

- 수정: `packages/db/src/client.test.ts`
- 수정: `packages/db/src/schema/content.schema.ts`
- 생성: `packages/db/src/migrations/0003-curriculum-versioning.sql`
- 수정: `packages/db/src/migrations/run-content-migration.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/db/src/client.test.ts`의 import를 다음처럼 확장한다.

```ts
import {
  adminUser,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
} from "@/schema"
```

같은 파일 하단에 다음 테스트를 추가한다.

```ts
describe("curriculum version schema", () => {
  it("creates curriculum version tables", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table' order by name"
      )
      .all()
      .map((row) => row.name)

    expect(tables).toContain("curriculum_versions")
    expect(tables).toContain("curriculum_version_chapters")
    expect(tables).toContain("curriculum_version_lessons")
    expect(curriculumVersions).toBeDefined()
    expect(curriculumVersionChapters).toBeDefined()
    expect(curriculumVersionLessons).toBeDefined()
  })
})
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/db test -- client.test.ts
```

기대 결과: `curriculumVersions` export가 없거나 `curriculum_versions` 테이블이 없어서 실패한다.

- [ ] **단계 3: Drizzle schema 추가**

`packages/db/src/schema/content.schema.ts`의 sqlite import를 다음처럼 바꾼다.

```ts
import {
  type AnySQLiteColumn,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
```

`courses` 정의 뒤에 다음 테이블을 추가한다.

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
```

`courseChapters` 정의 뒤에 다음 테이블을 추가한다.

```ts
export const curriculumVersionChapters = sqliteTable(
  "curriculum_version_chapters",
  {
    id: text("id").primaryKey(),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    sourceChapterId: text("source_chapter_id").references(
      () => courseChapters.id
    ),
    label: text("label").notNull(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", {
      enum: ["active", "deprecated", "archived"],
    }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_version_chapters_version_sort_idx").on(
      table.curriculumVersionId,
      table.sortOrder
    ),
  ]
)
```

`courseLessons` 정의 뒤에 다음 테이블을 추가한다.

```ts
export const curriculumVersionLessons = sqliteTable(
  "curriculum_version_lessons",
  {
    id: text("id").primaryKey(),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => curriculumVersionChapters.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", {
      enum: ["active", "deprecated", "archived"],
    }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_version_lessons_chapter_sort_idx").on(
      table.chapterId,
      table.sortOrder
    ),
  ]
)
```

- [ ] **단계 4: migration SQL 추가**

`packages/db/src/migrations/0003-curriculum-versioning.sql`을 생성한다.

```sql
pragma foreign_keys = on;

create table if not exists curriculum_versions (
  id text primary key,
  course_id text not null references courses(id),
  version_number integer not null,
  status text not null,
  title text not null,
  changelog text not null,
  published_at integer,
  created_at integer not null
);

create unique index if not exists curriculum_versions_course_version_idx
  on curriculum_versions(course_id, version_number);

create table if not exists curriculum_version_chapters (
  id text primary key,
  curriculum_version_id text not null references curriculum_versions(id),
  source_chapter_id text references course_chapters(id),
  label text not null,
  title text not null,
  sort_order integer not null,
  status text not null
);

create unique index if not exists curriculum_version_chapters_version_sort_idx
  on curriculum_version_chapters(curriculum_version_id, sort_order);

create table if not exists curriculum_version_lessons (
  id text primary key,
  curriculum_version_id text not null references curriculum_versions(id),
  chapter_id text not null references curriculum_version_chapters(id),
  lesson_id text not null references lessons(id),
  title text not null,
  description text not null,
  sort_order integer not null,
  status text not null
);

create unique index if not exists curriculum_version_lessons_chapter_sort_idx
  on curriculum_version_lessons(chapter_id, sort_order);
```

- [ ] **단계 5: migration runner에 연결**

`packages/db/src/migrations/run-content-migration.ts`에 다음 상수를 추가한다.

```ts
const curriculumVersioningMigrationSql = readFileSync(
  new URL("./0003-curriculum-versioning.sql", import.meta.url),
  "utf8"
)
```

`runContentMigration` 함수에 다음 실행을 추가한다.

```ts
sqlite.exec(curriculumVersioningMigrationSql)
```

- [ ] **단계 6: 통과 확인**

실행:

```bash
bun --filter @workspace/db test -- client.test.ts
```

기대 결과: `client.test.ts`가 통과한다.

- [ ] **단계 7: 커밋**

실행:

```bash
git add packages/db/src/client.test.ts packages/db/src/schema/content.schema.ts packages/db/src/migrations/0003-curriculum-versioning.sql packages/db/src/migrations/run-content-migration.ts
git commit -m "커리큘럼 버전 스키마 추가"
```

기대 결과: 커리큘럼 버전 schema와 migration이 커밋된다.

## 작업 2: seed가 `v1` published 버전을 생성

**파일:**

- 수정: `packages/db/src/seeds/seed-content.test.ts`
- 수정: `packages/db/src/seeds/seed-content.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/db/src/seeds/seed-content.test.ts`의 schema import를 다음처럼 확장한다.

```ts
import {
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  lessons,
  lessonSteps,
} from "@/schema"
```

첫 번째 테스트의 `await seedContent(db)` 다음에 다음 검증을 추가한다.

```ts
const versionRows = await db.select().from(curriculumVersions)
const versionChapterRows = await db.select().from(curriculumVersionChapters)
const versionLessonRows = await db.select().from(curriculumVersionLessons)

expect(versionRows).toContainEqual(
  expect.objectContaining({
    id: "sentence-structure-v1",
    courseId: "sentence-structure",
    versionNumber: 1,
    status: "published",
    title: "문장 구조의 기본",
    changelog: "초기 커리큘럼 버전",
  })
)
expect(
  versionChapterRows.filter(
    (chapter) => chapter.curriculumVersionId === "sentence-structure-v1"
  )
).toHaveLength(3)
expect(
  versionLessonRows.filter(
    (lesson) => lesson.curriculumVersionId === "sentence-structure-v1"
  )
).toHaveLength(12)
expect(versionLessonRows).toContainEqual(
  expect.objectContaining({
    id: "sentence-structure-01-v1",
    chapterId: "sentence-structure-chapter-1-v1",
    lessonId: "sentence-structure-01",
    status: "active",
  })
)
```

`afterEach`에 다음 삭제를 기존 콘텐츠 삭제보다 앞에 추가한다.

```ts
sqlite.exec("delete from curriculum_version_lessons")
sqlite.exec("delete from curriculum_version_chapters")
sqlite.exec("delete from curriculum_versions")
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/db test -- seed-content.test.ts
```

기대 결과: seed가 version rows를 만들지 않아 실패한다.

- [ ] **단계 3: seed row 배열 추가**

`packages/db/src/seeds/seed-content.ts` import에 새 테이블을 추가한다.

```ts
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
```

`seedContent`의 row 배열 선언에 다음 배열을 추가한다.

```ts
const curriculumVersionRows: (typeof curriculumVersions.$inferInsert)[] = []
const curriculumVersionChapterRows: (typeof curriculumVersionChapters.$inferInsert)[] =
  []
const curriculumVersionLessonRows: (typeof curriculumVersionLessons.$inferInsert)[] =
  []
const seedPublishedAt = new Date("2026-05-28T00:00:00.000Z")
```

- [ ] **단계 4: 코스별 `v1` row 생성**

`for (const course of category.courses)` 블록에서 `courseRows.push` 호출 바로 뒤에 다음 코드를 추가한다.

```ts
const curriculumVersionId = `${course.id}-v1`

curriculumVersionRows.push({
  id: curriculumVersionId,
  courseId: course.id,
  versionNumber: 1,
  status: "published",
  title: course.title,
  changelog: "초기 커리큘럼 버전",
  publishedAt: seedPublishedAt,
  createdAt: seedPublishedAt,
})
```

`for (const chapter of course.chapters)` 블록 안에 `chapterRows.push` 호출 뒤 다음 코드를 추가한다.

```ts
curriculumVersionChapterRows.push({
  id: `${chapter.id}-v1`,
  curriculumVersionId,
  sourceChapterId: chapter.id,
  label: chapter.label,
  title: chapter.title,
  sortOrder: chapter.sortOrder,
  status: "active",
})
```

`courseLessonRows.push` 호출 뒤 다음 코드를 추가한다.

```ts
curriculumVersionLessonRows.push({
  id: `${lesson.id}-v1`,
  curriculumVersionId,
  chapterId: `${chapter.id}-v1`,
  lessonId: lesson.id,
  title: lesson.title,
  description: lesson.description,
  sortOrder: lesson.sortOrder,
  status: "active",
})
```

- [ ] **단계 5: transaction 삭제와 삽입 순서 수정**

`db.transaction` 안의 삭제 순서를 다음처럼 바꾼다.

```ts
await tx.delete(lessonSteps)
await tx.delete(curriculumVersionLessons)
await tx.delete(curriculumVersionChapters)
await tx.delete(curriculumVersions)
await tx.delete(courseLessons)
await tx.delete(lessons)
await tx.delete(courseChapters)
await tx.delete(courses)
await tx.delete(courseCategories)
```

삽입 순서를 다음처럼 확장한다.

```ts
await tx.insert(courseCategories).values(categoryRows)
await tx.insert(courses).values(courseRows)
await tx.insert(courseChapters).values(chapterRows)
await tx.insert(lessons).values(lessonRows)
await tx.insert(courseLessons).values(courseLessonRows)
await tx.insert(curriculumVersions).values(curriculumVersionRows)
await tx.insert(curriculumVersionChapters).values(curriculumVersionChapterRows)
await tx.insert(curriculumVersionLessons).values(curriculumVersionLessonRows)
await tx.insert(lessonSteps).values(lessonStepRows)
```

- [ ] **단계 6: 통과 확인**

실행:

```bash
bun --filter @workspace/db test -- seed-content.test.ts
```

기대 결과: `seed-content.test.ts`가 통과한다.

- [ ] **단계 7: 커밋**

실행:

```bash
git add packages/db/src/seeds/seed-content.ts packages/db/src/seeds/seed-content.test.ts
git commit -m "콘텐츠 시드에 v1 커리큘럼 버전 추가"
```

기대 결과: seed 변경이 커밋된다.

## 작업 3: 공개 콘텐츠 repository를 최신 published 버전 기준으로 변경

**파일:**

- 수정: `packages/db/src/repositories/drizzle-content.repository.test.ts`
- 수정: `packages/db/src/repositories/drizzle-content.repository.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/db/src/repositories/drizzle-content.repository.test.ts` import를 다음처럼 확장한다.

```ts
import {
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
} from "@/schema"
```

`describe("createDrizzleContentRepository", () => {` 블록 안에 다음 테스트를 추가한다.

```ts
it("uses the latest published curriculum version for course summaries and detail", async () => {
  const db = createDatabase(sqlite)

  await db.insert(curriculumVersions).values({
    id: "sentence-structure-v2",
    courseId: "sentence-structure",
    versionNumber: 2,
    status: "published",
    title: "문장 구조의 기본 v2",
    changelog: "공개 조회 기준 검증",
    publishedAt: new Date("2026-05-28T00:00:00.000Z"),
    createdAt: new Date("2026-05-28T00:00:00.000Z"),
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
    description: "최신 published 버전의 레슨 설명입니다.",
    sortOrder: 1,
    status: "active",
  })

  const repository = createDrizzleContentRepository(db)

  const categories = await repository.listCourseCategories()
  const sentenceStructure = categories.categories
    .flatMap((category) => category.courses)
    .find((course) => course.id === "sentence-structure")
  const detail = await repository.findCourseDetail(
    courseId("sentence-structure")
  )

  expect(sentenceStructure?.lessonCount).toBe(1)
  expect(detail?.lessonCount).toBe(1)
  expect(detail?.chapters).toEqual([
    {
      id: "sentence-structure-chapter-1-v2",
      label: "1단원",
      title: "새 문장의 뼈대",
      lessons: [
        {
          id: "sentence-structure-01-v2",
          lessonId: "sentence-structure-01",
          title: "새 주어와 서술어 찾기",
          description: "최신 published 버전의 레슨 설명입니다.",
          order: 1,
        },
      ],
    },
  ])
})
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/db test -- drizzle-content.repository.test.ts
```

기대 결과: repository가 아직 `course_chapters`, `course_lessons`를 직접 읽어서 `lessonCount`가 `12`로 나와 실패한다.

- [ ] **단계 3: repository import와 타입 수정**

`packages/db/src/repositories/drizzle-content.repository.ts`의 schema import에 다음 테이블을 추가한다.

```ts
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
```

기존 타입 선언을 다음처럼 바꾼다.

```ts
type CourseLessonRow = typeof curriculumVersionLessons.$inferSelect
type CurriculumVersionRow = typeof curriculumVersions.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect
```

- [ ] **단계 4: 최신 published helper 추가**

`createDrizzleContentRepository` 아래 helper 영역에 다음 함수를 추가한다.

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
  }, new Map<string, CurriculumVersionRow>())
}

async function findLatestPublishedVersion(
  db: WritingAppDatabase,
  courseId: string
): Promise<CurriculumVersionRow | undefined> {
  return (await listLatestPublishedVersionsByCourseId(db)).get(courseId)
}
```

기존 `countLessonsByCourseId`를 다음 함수로 교체한다.

```ts
async function countLessonsByCurriculumVersionId(
  db: WritingAppDatabase,
  curriculumVersionIds: string[]
) {
  if (curriculumVersionIds.length === 0) {
    return new Map<string, number>()
  }

  const lessonCountRows = await db
    .select({
      curriculumVersionId: curriculumVersionLessons.curriculumVersionId,
      lessonCount: count(curriculumVersionLessons.id),
    })
    .from(curriculumVersionLessons)
    .where(
      inArray(
        curriculumVersionLessons.curriculumVersionId,
        curriculumVersionIds
      )
    )
    .groupBy(curriculumVersionLessons.curriculumVersionId)

  return new Map(
    lessonCountRows.map((row) => [row.curriculumVersionId, row.lessonCount])
  )
}
```

- [ ] **단계 5: 목록과 검색을 최신 published 기준으로 변경**

`listCourseCategories` 안에서 기존 `lessonCountRows` 조회를 제거하고 다음 흐름으로 바꾼다.

```ts
const [categoryRows, courseRows, latestVersionsByCourseId] = await Promise.all([
  db.select().from(courseCategories).orderBy(asc(courseCategories.sortOrder)),
  db.select().from(courses).orderBy(asc(courses.sortOrder)),
  listLatestPublishedVersionsByCourseId(db),
])
const lessonCountsByVersionId = await countLessonsByCurriculumVersionId(
  db,
  [...latestVersionsByCourseId.values()].map((version) => version.id)
)
```

course mapping은 다음처럼 바꾼다.

```ts
          courses: courseRows
            .filter((course) => course.categoryId === category.id)
            .flatMap((course) => {
              const version = latestVersionsByCourseId.get(course.id)

              if (!version) {
                return []
              }

              return [
                {
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  lessonCount: lessonCountsByVersionId.get(version.id) ?? 0,
                  thumbnail: course.thumbnailPath,
                },
              ]
            }),
```

`searchCourses`는 `countLessonsByCourseId` 대신 같은 helper를 사용한다.

```ts
const latestVersionsByCourseId = await listLatestPublishedVersionsByCourseId(db)
const lessonCountsByVersionId = await countLessonsByCurriculumVersionId(
  db,
  [...latestVersionsByCourseId.values()].map((version) => version.id)
)

return {
  courses: courseRows.flatMap((course) => {
    const version = latestVersionsByCourseId.get(course.id)

    if (!version) {
      return []
    }

    return [
      {
        id: course.id,
        title: course.title,
        description: course.description,
        lessonCount: lessonCountsByVersionId.get(version.id) ?? 0,
        thumbnail: course.thumbnailPath,
      },
    ]
  }),
}
```

- [ ] **단계 6: 상세 조회를 최신 published 기준으로 변경**

`findCourseDetail`에서 course 조회 뒤 다음 코드를 추가한다.

```ts
const version = await findLatestPublishedVersion(db, courseId)

if (!version) {
  return undefined
}
```

chapter 조회를 다음처럼 바꾼다.

```ts
const chapterRows = await db
  .select()
  .from(curriculumVersionChapters)
  .where(eq(curriculumVersionChapters.curriculumVersionId, version.id))
  .orderBy(asc(curriculumVersionChapters.sortOrder))
```

`listCourseLessons`는 `curriculumVersionLessons`를 읽도록 바꾼다.

```ts
async function listCourseLessons(
  db: WritingAppDatabase,
  chapterIds: string[]
): Promise<CourseLessonRow[]> {
  if (chapterIds.length === 0) {
    return []
  }

  return db
    .select()
    .from(curriculumVersionLessons)
    .where(inArray(curriculumVersionLessons.chapterId, chapterIds))
    .orderBy(asc(curriculumVersionLessons.sortOrder))
}
```

`chapterRows.map`에서 기존 필드 이름을 그대로 사용할 수 있다. `curriculumVersionChapters`는 `id`, `label`, `title`, `sortOrder`를 가진다.

- [ ] **단계 7: 통과 확인**

실행:

```bash
bun --filter @workspace/db test -- drizzle-content.repository.test.ts
```

기대 결과: `drizzle-content.repository.test.ts`가 통과한다.

- [ ] **단계 8: 회귀 테스트 실행**

실행:

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/api test
```

기대 결과: 공개 콘텐츠 DTO와 API 경로가 기존 응답 형태를 유지하며 통과한다.

- [ ] **단계 9: 커밋**

실행:

```bash
git add packages/db/src/repositories/drizzle-content.repository.ts packages/db/src/repositories/drizzle-content.repository.test.ts
git commit -m "공개 콘텐츠 조회를 최신 커리큘럼 버전 기준으로 변경"
```

기대 결과: repository 변경이 커밋된다.

## 작업 4: 문서 갱신과 전체 검증

**파일:**

- 수정: `BACKEND.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: `BACKEND.md` 테이블 목록 갱신**

`BACKEND.md`의 인증과 학습자 상태 테이블 목록 뒤에 다음 항목을 추가한다.

```markdown
- `curriculum_versions`: 코스별 커리큘럼 버전과 published/draft/archive 상태
- `curriculum_version_chapters`: 특정 커리큘럼 버전에 포함된 챕터 snapshot
- `curriculum_version_lessons`: 특정 커리큘럼 버전에 포함된 레슨 배치 snapshot
```

콘텐츠 시드 설명 문단을 다음 문단으로 교체한다.

```markdown
콘텐츠 시드는 현재 웹 정적 카탈로그와 과정 상세 화면의 과정/챕터/레슨 ID를 명시적으로 보관한다. API는 `vocabulary-basics` 같은 기존 과정 요약과 `sentence-structure-02` 같은 후속 레슨 ID를 반환할 수 있다. 각 코스는 seed 시점에 `v1` published 커리큘럼 버전을 함께 생성하고, 공개 코스 목록과 코스 상세는 최신 published 버전의 챕터와 레슨 배치를 기준으로 계산한다. 다만 모든 레슨의 프로토타입 본문을 복제하지는 않으며, 각 레슨은 현재 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE` 기본 단계로 플레이 가능성과 학습 상태 저장 경로를 보장한다.
```

- [ ] **단계 2: `docs/admin-site.md` 상단에 구현 기록 추가**

`docs/admin-site.md` 제목 바로 아래에 다음 내용을 추가한다.

```markdown
## 2026-05-28 커리큘럼 버전 모델 추가 시작

- 커리큘럼 버전 관리 로드맵의 2단계로 코스별 `v1` published 버전 모델을 추가한다.
- 이번 단계는 관리자 편집 UI와 학습 진행 버전 귀속을 제외하고, DB 스키마와 seed, 공개 콘텐츠 조회 기준만 변경한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-version-model.md`에 작성한다.

## 2026-05-28 커리큘럼 버전 모델 추가 완료

- `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons` 테이블을 추가한다.
- 콘텐츠 seed는 각 코스의 `v1` published 버전을 함께 생성한다.
- 공개 코스 목록, 검색, 코스 상세는 최신 published 버전의 챕터와 레슨 배치를 기준으로 계산한다.
- 학습 진행의 `curriculum_version_id` 귀속은 다음 단계로 남긴다.
```

- [ ] **단계 3: `docs/platform-backend-api.md` 상단에 API 관점 기록 추가**

`docs/platform-backend-api.md` 제목 바로 아래에 다음 내용을 추가한다.

```markdown
## 2026-05-28 커리큘럼 버전 모델 추가 시작

- 공개 콘텐츠 API가 최신 published 커리큘럼 버전 기준으로 코스 요약과 상세를 계산하도록 DB 조회 경계를 바꾼다.
- API 응답 DTO는 유지하고 내부 repository 기준만 버전 인식으로 바꾼다.

## 2026-05-28 커리큘럼 버전 모델 추가 완료

- 콘텐츠 seed는 코스별 `v1` published 버전을 생성한다.
- 공개 `GET /courses`, `GET /courses/search`, `GET /courses/:courseId`는 최신 published 버전의 레슨 수와 배치를 기준으로 응답한다.
- 학습자 진행 API는 아직 기존 `course_id`, `lesson_id` 기준이며, 진행 버전 귀속은 다음 단계에서 처리한다.
```

- [ ] **단계 4: 문서 확인**

실행:

```bash
rg -n "curriculum_versions|v1|최신 published|진행 버전 귀속" BACKEND.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 세 문서에서 새 테이블, `v1`, 최신 published 기준, 다음 단계 범위가 확인된다.

- [ ] **단계 5: 포맷 실행**

실행:

```bash
./node_modules/.bin/prettier --write packages/db/src/schema/content.schema.ts packages/db/src/migrations/run-content-migration.ts packages/db/src/seeds/seed-content.ts packages/db/src/seeds/seed-content.test.ts packages/db/src/repositories/drizzle-content.repository.ts packages/db/src/repositories/drizzle-content.repository.test.ts packages/db/src/client.test.ts BACKEND.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 대상 파일이 포맷되고 오류 없이 종료된다.

- [ ] **단계 6: 전체 검증**

실행:

```bash
bun --filter @workspace/db typecheck
bun --filter @workspace/db test
bun --filter @workspace/api test
bun run test
git diff --check
```

기대 결과: 모든 명령이 종료 코드 `0`을 반환한다. `bun run test`에서 UI 테스트가 `onCheckedChange` 경고를 출력할 수 있지만 테스트 실패가 아니면 통과로 본다.

- [ ] **단계 7: 커밋**

실행:

```bash
git add BACKEND.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "커리큘럼 버전 모델 문서 갱신"
```

기대 결과: 문서 변경이 커밋된다.

## 자체 검토 체크리스트

- [ ] 기존 공개 API DTO를 바꾸지 않는다.
- [ ] `course_progress`, `lesson_progress`는 이번 단계에서 수정하지 않는다.
- [ ] seed 실행 후 모든 코스에 `v1` published version이 생긴다.
- [ ] 공개 목록, 검색, 상세는 latest published version 기준으로 동작한다.
- [ ] published version이 없는 코스는 공개 조회에서 제외된다.
- [ ] 기존 `course_chapters`, `course_lessons` 테이블은 제거하지 않는다.
- [ ] 관리자 발행, 마이그레이션 맵, 학습자 업그레이드 UX는 이번 단계에서 구현하지 않는다.
