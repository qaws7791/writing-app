# 챕터 레이블 제거 Implementation Plan

> **에이전트 작업자 필수:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` 권장, 또는 `superpowers:executing-plans`를 사용해 이 계획을 작업 단위로 실행한다. 단계는 추적을 위해 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** 서비스 전체에서 챕터 전용 `label` 필드를 제거하고, 챕터는 `title`과 `sortOrder`만으로 식별되게 만든다.

**아키텍처:** `label`은 DB 스키마, seed, core DTO, repository 매핑, 관리자 편집기 상태, 학습자 화면 모델에 걸쳐 퍼져 있다. 제거는 가장 아래 계층인 DB/seed부터 DTO와 repository 계약, 앱 UI 순으로 진행해 타입 오류가 실제 누락 지점을 드러내게 한다.

**Tech Stack:** Bun 1.3.10, Node 20, TypeScript, Drizzle ORM, SQLite, Zod, Hono, Next.js, Vitest, OpenAPI.

---

## 제거 대상과 제외 대상

제거 대상은 챕터 구조의 `label`만이다.

- `course_chapters.label`
- `curriculum_version_chapters.label`
- 공개 API `CourseChapterDto.label`
- 관리자 API `AdminChapterSummaryDto.label`
- 관리자 편집 저장 요청의 챕터 `label`
- 웹 코스 상세 모델의 `CourseChapter.label`
- 웹 다음 레슨 모델의 `chapterLabel`
- seed와 테스트 fixture에서 챕터에 넣는 `label`

제외 대상은 챕터 개념과 무관한 일반 UI/콘텐츠 `label`이다.

- `aria-label`
- React `<label>`
- shadcn/ui `Label`
- 스텝 콘텐츠의 `label`: 예시 비교, 분류 카테고리, 패널 제목 등
- 홈/프로필 통계 컴포넌트의 일반 prop `label`

---

## 파일 구조

- Modify: `packages/db/src/schema/content.schema.ts`
  - `courseChapters`, `curriculumVersionChapters`에서 `label` 컬럼을 제거한다.
- Modify: `packages/db/src/migrations/0000-initial-content.sql`
  - 새 DB의 `course_chapters` 생성 SQL에서 `label` 컬럼을 제거한다.
- Modify: `packages/db/src/migrations/0003-curriculum-versioning.sql`
  - 새 DB의 `curriculum_version_chapters` 생성 SQL에서 `label` 컬럼을 제거한다.
- Create: `packages/db/src/migrations/0009-remove-chapter-label.sql`
  - 기존 DB에서 두 `label` 컬럼을 제거한다.
- Modify: `packages/db/src/migrations/run-content-migration.ts`
  - 기존 DB에만 남아 있는 컬럼도 안전하게 제거한다.
- Modify: `packages/db/src/seeds/content-seed.ts`
  - `SeedChapter`와 `chapter()` 입력에서 `label`을 제거한다.
- Modify: `packages/db/src/seeds/seed-content.ts`
  - insert payload에서 `label`을 제거한다.
- Modify: `packages/core/src/content/content.dto.ts`
  - 공개 코스 상세 챕터 DTO에서 `label`을 제거한다.
- Modify: `packages/core/src/admin/admin.dto.ts`
  - 관리자 챕터 DTO와 저장 요청에서 `label`을 제거한다.
- Modify: `packages/db/src/repositories/drizzle-content.repository.ts`
  - 공개 코스 상세 매핑에서 `label`을 반환하지 않는다.
- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
  - 관리자 트리, draft 복제, 저장, 상세 매핑에서 `label`을 제거한다.
- Modify: `apps/admin/src/features/courses/course-editor/editor-state.ts`
  - `ChapterEditableField`, `ChapterInput`, 저장 입력에서 `label`을 제거한다.
- Modify: `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
  - 챕터 편집 팝오버에서 레이블 입력을 제거한다.
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
  - `onUpdateChapterField` 타입을 `"title"`만 허용하게 좁힌다.
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
  - 새 챕터 생성 시 `label`을 만들지 않는다.
- Modify: `apps/web/src/features/courses/course-detail-data.ts`
  - `CourseChapter.label`, `CourseNextLesson.chapterLabel`, fixture `chapter()` 입력을 제거한다.
- Modify: `apps/web/src/features/courses/course-api-mappers.ts`
  - API 챕터 입력과 내부 모델 매핑에서 `label`/`chapterLabel`을 제거한다.
- Modify: `apps/web/src/features/courses/course-curriculum.tsx`
  - 코스 상세 커리큘럼에서 챕터 레이블 행을 제거한다.
- Modify: `apps/web/src/features/courses/course-detail-page.tsx`
  - 다음 레슨 표시에서 `chapterLabel ·` 접두를 제거한다.
- Modify: `apps/web/src/features/home/home-data.ts`
  - 홈 레슨 이름에서 `chapter.label` 접두를 제거한다.
- Modify: `apps/web/src/features/lessons/lesson-data.ts`
  - 장문 쓰기 context에서 `input.chapter.label` 참조를 제거한다.
- Modify: `apps/docs/openapi/writing-app-api.json`
  - 공개 API 문서에서 챕터 `label` 속성을 제거한다. 생성 명령으로 갱신한다.
- Modify: `apps/web/src/lib/api/generated/writing-app-api.d.ts`
  - OpenAPI 기반 웹 타입을 생성 명령으로 갱신한다.
- Modify: `docs/platform-product-feature-spec.md`
  - 단원 속성 설명에서 라벨을 제거한다.
- Modify: `docs/platform-backend-api.md`, `docs/admin-site.md`, `BACKEND.md`
  - 챕터 스냅샷 설명이 `label`에 의존하지 않는지 확인하고 필요한 문장을 갱신한다.
- Test: 관련 `*.test.ts`, `*.test.tsx`
  - 챕터 fixture에서 `label` 제거, 레이블 입력 테스트 삭제, 표시 문구 기대값 갱신.

---

### Task 1: DB 스키마와 마이그레이션에서 챕터 label 제거

**Files:**

- Modify: `packages/db/src/schema/content.schema.ts`
- Modify: `packages/db/src/migrations/0000-initial-content.sql`
- Modify: `packages/db/src/migrations/0003-curriculum-versioning.sql`
- Create: `packages/db/src/migrations/0009-remove-chapter-label.sql`
- Modify: `packages/db/src/migrations/run-content-migration.ts`
- Test: `packages/db/src/client.test.ts`

- [ ] **Step 1: 마이그레이션 테스트를 먼저 갱신한다**

`packages/db/src/client.test.ts`의 `curriculum version schema` 테스트에 컬럼 부재 검증을 추가한다.

```ts
const chapterColumns = sqlite
  .query<{ name: string }, []>("pragma table_info(curriculum_version_chapters)")
  .all()
  .map((row) => row.name)

expect(chapterColumns).not.toContain("label")
```

같은 파일에 `course_chapters` 검증도 추가한다.

```ts
const sourceChapterColumns = sqlite
  .query<{ name: string }, []>("pragma table_info(course_chapters)")
  .all()
  .map((row) => row.name)

expect(sourceChapterColumns).not.toContain("label")
```

- [ ] **Step 2: 실패를 확인한다**

Run:

```bash
bun --filter @workspace/db test -- client.test.ts
```

Expected: 아직 스키마에 `label`이 있으므로 `not.toContain("label")`에서 실패한다.

- [ ] **Step 3: Drizzle 스키마에서 label 컬럼을 제거한다**

`packages/db/src/schema/content.schema.ts`에서 두 줄을 삭제한다.

```ts
label: text("label").notNull(),
```

삭제 위치:

- `courseChapters`
- `curriculumVersionChapters`

- [ ] **Step 4: 초기 SQL 마이그레이션에서 label 컬럼을 제거한다**

`packages/db/src/migrations/0000-initial-content.sql`의 `course_chapters` 생성 SQL을 아래 형태로 만든다.

```sql
create table if not exists course_chapters (
  id text primary key,
  course_id text not null references courses(id),
  title text not null,
  sort_order integer not null
);
```

`packages/db/src/migrations/0003-curriculum-versioning.sql`의 `curriculum_version_chapters` 생성 SQL을 아래 형태로 만든다.

```sql
create table if not exists curriculum_version_chapters (
  id text primary key,
  curriculum_version_id text not null references curriculum_versions(id),
  source_chapter_id text references course_chapters(id),
  title text not null,
  sort_order integer not null,
  status text not null
);
```

- [ ] **Step 5: 기존 DB용 제거 마이그레이션을 추가한다**

`packages/db/src/migrations/0009-remove-chapter-label.sql`을 만든다.

```sql
ALTER TABLE course_chapters
DROP COLUMN label;

ALTER TABLE curriculum_version_chapters
DROP COLUMN label;
```

- [ ] **Step 6: 런타임 마이그레이션에 idempotent drop helper를 추가한다**

`runContentMigration`의 마지막에 안전 제거를 추가한다.

```ts
dropColumnIfExists(
  sqlite,
  "course_chapters",
  "label",
  "alter table course_chapters drop column label"
)
dropColumnIfExists(
  sqlite,
  "curriculum_version_chapters",
  "label",
  "alter table curriculum_version_chapters drop column label"
)
```

`addColumnIfMissing` 아래에 helper를 추가한다.

```ts
function dropColumnIfExists(
  sqlite: Database,
  tableName: string,
  columnName: string,
  alterTableSql: string
) {
  const columns = sqlite
    .query<{ name: string }, []>(`pragma table_info(${tableName})`)
    .all()

  if (!columns.some((column) => column.name === columnName)) {
    return
  }

  sqlite.exec(alterTableSql)
}
```

`0009-remove-chapter-label.sql`은 운영자가 raw SQL 마이그레이션 이력을 확인하거나 직접 적용할 때 쓰는 파일이다. 테스트와 local seed 경로에서 반복 실행되는 `runContentMigration`은 fresh DB에서도 실패하지 않도록 위 helper로 같은 제거를 idempotent하게 수행한다.

- [ ] **Step 7: DB 테스트를 통과시킨다**

Run:

```bash
bun --filter @workspace/db test -- client.test.ts
```

Expected: PASS.

- [ ] **Step 8: 커밋한다**

```bash
git add packages/db/src/schema/content.schema.ts packages/db/src/migrations/0000-initial-content.sql packages/db/src/migrations/0003-curriculum-versioning.sql packages/db/src/migrations/0009-remove-chapter-label.sql packages/db/src/migrations/run-content-migration.ts packages/db/src/client.test.ts
git commit -m "챕터 레이블 컬럼 제거"
```

---

### Task 2: seed와 core DTO 계약에서 label 제거

**Files:**

- Modify: `packages/db/src/seeds/content-seed.ts`
- Modify: `packages/db/src/seeds/seed-content.ts`
- Modify: `packages/core/src/content/content.dto.ts`
- Modify: `packages/core/src/admin/admin.dto.ts`
- Test: `packages/db/src/seeds/seed-content.test.ts`
- Test: `packages/core/src/content/content.service.test.ts`
- Test: `packages/core/src/admin/admin.service.test.ts`
- Test: `packages/core/src/admin/admin.dto.test.ts`

- [ ] **Step 1: DTO 테스트 fixture에서 챕터 label을 제거한다**

core와 seed 테스트의 챕터 객체에서 아래 속성을 삭제한다.

```ts
label: "1단원",
```

또는 테스트에 따라 아래 속성을 삭제한다.

```ts
label: "1장",
```

- [ ] **Step 2: 실패를 확인한다**

Run:

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test -- seed-content.test.ts
```

Expected: DTO 스키마가 아직 `label`을 요구하므로 일부 테스트가 실패한다.

- [ ] **Step 3: 공개 콘텐츠 DTO에서 챕터 label을 제거한다**

`packages/core/src/content/content.dto.ts`의 `courseChapterDtoSchema`를 아래처럼 둔다.

```ts
export const courseChapterDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(courseLessonDtoSchema),
})
```

- [ ] **Step 4: 관리자 DTO에서 챕터 label을 제거한다**

`packages/core/src/admin/admin.dto.ts`의 `adminChapterSummaryDtoSchema`를 아래처럼 둔다.

```ts
export const adminChapterSummaryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
  status: adminCurriculumNodeStatusSchema,
  lessons: z.array(adminLessonSummaryDtoSchema),
})
```

`adminSaveCurriculumVersionContentRequestDtoSchema`는 `adminCurriculumVersionChapterDtoSchema.omit({ lessons: true })`를 계속 사용한다. 챕터 DTO에서 `label`이 빠지면 저장 요청도 자동으로 `label`을 받지 않는다.

- [ ] **Step 5: seed 모델과 insert payload에서 label을 제거한다**

`packages/db/src/seeds/content-seed.ts`에서 `SeedChapter`와 `chapter()`를 아래처럼 바꾼다.

```ts
type SeedChapter = {
  id: string
  title: string
  sortOrder: number
  lessons: SeedLesson[]
}

function chapter(
  id: string,
  title: string,
  sortOrder: number,
  lessons: SeedLesson[]
): SeedChapter {
  return {
    id,
    title,
    sortOrder,
    lessons,
  }
}
```

모든 호출은 두 번째 인자인 `"1단원"`, `"2단원"` 같은 값을 제거해 아래 형태로 바꾼다.

```ts
chapter("sentence-structure-chapter-1", "문장의 뼈대", 1, [
```

`packages/db/src/seeds/seed-content.ts`의 insert payload에서 `label` 할당을 삭제한다.

```ts
chapterRows.push({
  id: chapter.id,
  courseId: course.id,
  title: chapter.title,
  sortOrder: chapter.sortOrder,
})

curriculumVersionChapterRows.push({
  id: `${chapter.id}-v1`,
  curriculumVersionId,
  sourceChapterId: chapter.id,
  title: chapter.title,
  sortOrder: chapter.sortOrder,
  status: "active",
})
```

- [ ] **Step 6: core와 seed 테스트를 통과시킨다**

Run:

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test -- seed-content.test.ts
```

Expected: PASS.

- [ ] **Step 7: 커밋한다**

```bash
git add packages/core/src/content/content.dto.ts packages/core/src/admin/admin.dto.ts packages/core/src/content/content.service.test.ts packages/core/src/admin/admin.service.test.ts packages/core/src/admin/admin.dto.test.ts packages/db/src/seeds/content-seed.ts packages/db/src/seeds/seed-content.ts packages/db/src/seeds/seed-content.test.ts
git commit -m "챕터 DTO와 시드에서 레이블 제거"
```

---

### Task 3: repository 매핑과 저장 흐름에서 label 제거

**Files:**

- Modify: `packages/db/src/repositories/drizzle-content.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Test: `packages/db/src/repositories/drizzle-content.repository.test.ts`
- Test: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- Test: `packages/db/src/repositories/drizzle-learning.repository.test.ts`
- Test: `apps/api/src/app.test.ts`
- Test: `apps/api/src/versioned-learning.integration.test.ts`
- Test: `apps/admin-api/src/app.test.ts`

- [ ] **Step 1: repository와 API 테스트 fixture에서 챕터 label을 제거한다**

모든 챕터 insert, save request, response expected object에서 챕터 전용 `label` 속성을 삭제한다.

```ts
label: "1단원",
```

```ts
label: "1장",
```

```ts
label: "새 단원",
```

- [ ] **Step 2: 실패를 확인한다**

Run:

```bash
bun --filter @workspace/db test -- drizzle-content.repository.test.ts drizzle-admin.repository.test.ts drizzle-learning.repository.test.ts
bun --filter @workspace/api test
bun --filter @workspace/admin-api test
```

Expected: repository가 아직 `label`을 반환하거나 insert하려고 해서 타입 또는 런타임 실패가 발생한다.

- [ ] **Step 3: 공개 repository 매핑에서 label 반환을 제거한다**

`packages/db/src/repositories/drizzle-content.repository.ts`의 `findCourseDetail` 챕터 매핑을 아래 형태로 바꾼다.

```ts
chapters: chapterRows.map((chapter) => ({
  id: chapter.id,
  title: chapter.title,
  lessons: lessonRows
    .filter((lesson) => lesson.chapterId === chapter.id)
    .map(mapCourseLesson),
})),
```

- [ ] **Step 4: 관리자 repository 트리 매핑에서 label 반환을 제거한다**

`packages/db/src/repositories/drizzle-admin.repository.ts`의 `listCourseTree` 챕터 매핑을 아래 형태로 바꾼다.

```ts
chapters: courseChapters.map((chapter) => ({
  id: chapter.id,
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
```

- [ ] **Step 5: draft 복제 insert에서 label을 제거한다**

`createDraftVersion`의 `draftChapters` 항목에서 `label: chapter.label`을 삭제한다.

```ts
return {
  id,
  curriculumVersionId: draftVersion.id,
  sourceChapterId: chapter.sourceChapterId,
  title: chapter.title,
  sortOrder: chapter.sortOrder,
  status: chapter.status,
} satisfies typeof curriculumVersionChapters.$inferInsert
```

- [ ] **Step 6: 편집 저장 insert에서 label을 제거한다**

`replaceDraftSnapshot` 또는 저장 함수의 `curriculumVersionChapters` insert payload에서 `label: chapter.label`을 삭제한다.

```ts
input.chapters.map((chapter) => ({
  id: chapter.id,
  curriculumVersionId: version.id,
  sourceChapterId: null,
  title: chapter.title,
  sortOrder: chapter.sortOrder,
  status: chapter.status,
}))
```

- [ ] **Step 7: 관리자 상세 매핑에서 label을 제거한다**

`mapCurriculumVersionDetail`의 챕터 매핑을 아래처럼 둔다.

```ts
chapters: chapters.map((chapter) => ({
  id: chapter.id,
  title: chapter.title,
  sortOrder: chapter.sortOrder,
  status: chapter.status,
  lessons: lessons
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
```

- [ ] **Step 8: repository와 API 테스트를 통과시킨다**

Run:

```bash
bun --filter @workspace/db test -- drizzle-content.repository.test.ts drizzle-admin.repository.test.ts drizzle-learning.repository.test.ts
bun --filter @workspace/api test
bun --filter @workspace/admin-api test
```

Expected: PASS.

- [ ] **Step 9: 커밋한다**

```bash
git add packages/db/src/repositories/drizzle-content.repository.ts packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-content.repository.test.ts packages/db/src/repositories/drizzle-admin.repository.test.ts packages/db/src/repositories/drizzle-learning.repository.test.ts apps/api/src/app.test.ts apps/api/src/versioned-learning.integration.test.ts apps/admin-api/src/app.test.ts
git commit -m "저장소와 API 응답에서 챕터 레이블 제거"
```

---

### Task 4: 관리자 편집기에서 label 편집과 저장 입력 제거

**Files:**

- Modify: `apps/admin/src/features/courses/course-editor/editor-state.ts`
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- Test: `apps/admin/src/features/courses/course-editor/editor-state.test.ts`
- Test: `apps/admin/src/features/courses/course-editor/curriculum-map.test.tsx`
- Test: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`

- [ ] **Step 1: 관리자 UI 테스트에서 레이블 입력 기대를 제거한다**

`curriculum-map.test.tsx`의 `"opens chapter edit popover and updates chapter fields"` 테스트를 제목 편집만 검증하게 바꾼다.

```ts
const titleInput = screen.getByLabelText("문장 성분 익히기 챕터 제목")
expect(screen.queryByLabelText("레이블")).toBeNull()

fireEvent.change(titleInput, {
  target: { value: "문장 성분 익히기 수정" },
})

expect(onUpdateChapterField).toHaveBeenCalledWith(
  "chapter-1",
  "title",
  expect.stringContaining("수정")
)
```

관리자 편집기 fixture의 챕터 객체에서 `label: "1"`을 삭제한다.

- [ ] **Step 2: 실패를 확인한다**

Run:

```bash
bun --filter @workspace/admin test -- curriculum-map.test.tsx editor-state.test.ts admin-course-detail-page.test.tsx
```

Expected: 컴포넌트와 상태 타입이 아직 `label`을 요구하므로 실패한다.

- [ ] **Step 3: 편집기 상태 타입에서 label을 제거한다**

`apps/admin/src/features/courses/course-editor/editor-state.ts`에서 타입을 좁힌다.

```ts
type ChapterEditableField = "title"

type ChapterInput = {
  id: string
  title: string
}
```

`createCourseEditorSaveInput`의 챕터 payload에서 `label`을 삭제한다.

```ts
chapters: workingCopy.version.chapters.map((chapter) => ({
  id: chapter.id,
  sortOrder: chapter.sortOrder,
  status: chapter.status,
  title: chapter.title,
})),
```

- [ ] **Step 4: 편집기 props 타입을 title 전용으로 좁힌다**

`course-editor-shell.tsx`와 `curriculum-map.tsx`의 `onUpdateChapterField` 타입을 아래처럼 바꾼다.

```ts
onUpdateChapterField?: (
  chapterId: string,
  field: "title",
  value: string
) => void
```

- [ ] **Step 5: 챕터 편집 팝오버에서 레이블 입력을 제거한다**

`curriculum-map.tsx`의 팝오버에서 `레이블` `<label>` 블록 전체를 삭제하고, 제목 입력만 남긴다.

```tsx
<label className="grid gap-1.5 text-xs text-muted-foreground">
  제목
  <input
    aria-label={`${chapter.title} 챕터 제목`}
    className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
    value={chapter.title}
    onChange={(event) =>
      onUpdateChapterField?.(chapter.id, "title", event.currentTarget.value)
    }
  />
</label>
```

- [ ] **Step 6: 새 챕터 생성에서 label 기본값을 제거한다**

`admin-course-detail-page.tsx`의 `handleAddChapter`를 아래처럼 바꾼다.

```ts
addChapter(current, {
  id: createDraftId("draft-chapter"),
  title: "새 챕터",
})
```

- [ ] **Step 7: 관리자 테스트를 통과시킨다**

Run:

```bash
bun --filter @workspace/admin test -- curriculum-map.test.tsx editor-state.test.ts admin-course-detail-page.test.tsx
```

Expected: PASS.

- [ ] **Step 8: 커밋한다**

```bash
git add apps/admin/src/features/courses/course-editor/editor-state.ts apps/admin/src/features/courses/course-editor/course-editor-shell.tsx apps/admin/src/features/courses/course-editor/curriculum-map.tsx apps/admin/src/features/courses/admin-course-detail-page.tsx apps/admin/src/features/courses/course-editor/editor-state.test.ts apps/admin/src/features/courses/course-editor/curriculum-map.test.tsx apps/admin/src/features/courses/admin-course-detail-page.test.tsx
git commit -m "관리자 챕터 편집에서 레이블 제거"
```

---

### Task 5: 학습자 웹 모델과 화면에서 label 표시 제거

**Files:**

- Modify: `apps/web/src/features/courses/course-detail-data.ts`
- Modify: `apps/web/src/features/courses/course-api-mappers.ts`
- Modify: `apps/web/src/features/courses/course-curriculum.tsx`
- Modify: `apps/web/src/features/courses/course-detail-page.tsx`
- Modify: `apps/web/src/features/home/home-data.ts`
- Modify: `apps/web/src/features/lessons/lesson-data.ts`
- Test: `apps/web/src/features/courses/course-api-mappers.test.ts`
- Test: `apps/web/src/features/courses/course-detail-page.test.tsx`

- [ ] **Step 1: 웹 테스트에서 챕터 label fixture와 기대값을 제거한다**

`course-api-mappers.test.ts`의 API fixture 챕터에서 `label`을 삭제한다.

```ts
{
  id: "chapter-1",
  title: "문장의 뼈대",
  lessons: [
```

`course-detail-page.test.tsx`의 `notStartedCourse.nextLesson`에서 `chapterLabel`을 삭제한다.

- [ ] **Step 2: 실패를 확인한다**

Run:

```bash
bun --filter @workspace/web test -- course-api-mappers.test.ts course-detail-page.test.tsx
```

Expected: 웹 모델이 아직 `label`/`chapterLabel`을 요구하므로 실패한다.

- [ ] **Step 3: 웹 코스 상세 모델에서 label과 chapterLabel을 제거한다**

`course-detail-data.ts`에서 `CourseChapter`와 `CourseNextLesson`을 아래처럼 바꾼다.

```ts
export interface CourseChapter {
  id: CourseChapterId
  title: string
  lessons: readonly CourseLesson[]
}

export interface CourseNextLesson {
  title: string
  description: string
  lessonId: CourseLessonId
}
```

`chapter()` helper는 아래처럼 바꾼다.

```ts
function chapter(
  id: string,
  title: string,
  lessons: readonly CourseLesson[]
): CourseChapter {
  return {
    id: chapterId(id),
    title,
    lessons,
  }
}
```

`createCourseDetail`의 `lessonsWithChapter`는 chapter label을 만들지 않는다.

```ts
const lessons = input.chapters.flatMap((courseChapter) => courseChapter.lessons)
```

다음 레슨 생성은 아래처럼 둔다.

```ts
nextLesson: {
  title: nextLessonSource.title,
  description: nextLessonSource.description,
  lessonId: nextLessonSource.lessonId,
},
```

- [ ] **Step 4: API mapper에서 label과 chapterLabel을 제거한다**

`course-api-mappers.ts`의 `CourseDetailDto.chapters` 타입에서 `label`을 삭제한다.

```ts
chapters: readonly {
  id: string
  title: string
  lessons: readonly {
```

챕터 매핑은 아래처럼 둔다.

```ts
const chapters = dto.chapters.map(
  (chapter): CourseChapter => ({
    id: chapter.id as CourseChapter["id"],
    title: chapter.title,
    lessons: chapter.lessons.map(
      (lesson): CourseLesson => ({
        id: lesson.id as CourseLesson["id"],
        lessonId: lesson.lessonId as CourseLesson["lessonId"],
        title: lesson.title,
        description: lesson.description,
        completed: false,
      })
    ),
  })
)
```

`firstLesson`와 `nextLessonSource` 계산은 레슨만 다룬다.

```ts
const firstLesson = chapters.flatMap((chapter) => chapter.lessons)[0]
```

```ts
const nextLessonSource =
  chapters
    .flatMap((chapter) => chapter.lessons)
    .find((lesson) => lesson.lessonId === progress.nextLessonId) ??
  chapters.flatMap((chapter) => chapter.lessons)[0]
```

`nextLesson` 생성은 `chapterLabel` 없이 둔다.

```ts
nextLesson: nextLessonSource
  ? {
      title: nextLessonSource.title,
      description: nextLessonSource.description,
      lessonId: nextLessonSource.lessonId,
    }
  : course.nextLesson,
```

- [ ] **Step 5: 코스 상세 화면에서 챕터 label 표시를 제거한다**

`course-curriculum.tsx`에서 아래 블록을 삭제한다.

```tsx
<span className="text-xs font-semibold text-muted-foreground uppercase">
  {chapter.label}
</span>
```

`course-detail-page.tsx`에서 다음 레슨 문구를 아래처럼 바꾼다.

```tsx
{
  course.nextLesson.title
}
```

- [ ] **Step 6: 홈 레슨 이름과 레슨 콘텐츠 context에서 label을 제거한다**

`home-data.ts`에서 레슨 이름을 레슨 제목만 쓰게 바꾼다.

```ts
name: lesson.title,
```

`lesson-data.ts`의 장문 쓰기 context를 아래처럼 바꾼다.

```ts
context: `"${input.chapter.title}" 단원의 흐름을 떠올리며 ${input.profile.goodLabel}을 남겨보세요.`,
```

- [ ] **Step 7: 웹 테스트를 통과시킨다**

Run:

```bash
bun --filter @workspace/web test -- course-api-mappers.test.ts course-detail-page.test.tsx
```

Expected: PASS.

- [ ] **Step 8: 커밋한다**

```bash
git add apps/web/src/features/courses/course-detail-data.ts apps/web/src/features/courses/course-api-mappers.ts apps/web/src/features/courses/course-curriculum.tsx apps/web/src/features/courses/course-detail-page.tsx apps/web/src/features/home/home-data.ts apps/web/src/features/lessons/lesson-data.ts apps/web/src/features/courses/course-api-mappers.test.ts apps/web/src/features/courses/course-detail-page.test.tsx
git commit -m "학습자 화면에서 챕터 레이블 제거"
```

---

### Task 6: OpenAPI와 문서 갱신

**Files:**

- Modify: `apps/docs/openapi/writing-app-api.json`
- Modify: `apps/web/src/lib/api/generated/writing-app-api.d.ts`
- Modify: `docs/platform-product-feature-spec.md`
- Modify: `docs/platform-backend-api.md`
- Modify: `docs/admin-site.md`
- Modify: `BACKEND.md`
- Test: `apps/api/src/openapi/openapi-document.test.ts`
- Test: `apps/api/src/app.test.ts`

- [ ] **Step 1: OpenAPI 생성 테스트를 먼저 갱신한다**

OpenAPI 문서 테스트 또는 API app 테스트에서 코스 상세 챕터 schema가 `label`을 포함하지 않는다는 검증을 추가한다.

```ts
expect(JSON.stringify(document)).not.toContain('"label"')
```

이 검증은 문서 전체에 일반 `label`이 많을 수 있으면 사용하지 않는다. 대신 `CourseChapterDto`가 있는 schema 경로만 찾아 `label` 부재를 검증한다.

- [ ] **Step 2: 공개 API 문서를 재생성한다**

Run:

```bash
bun --filter @workspace/api openapi:generate
```

Expected: `apps/docs/openapi/writing-app-api.json`에서 코스 상세 챕터 속성의 `label`이 사라진다.

- [ ] **Step 3: 웹 OpenAPI 타입을 재생성한다**

Run:

```bash
bun --filter @workspace/web api:generate
```

Expected: `apps/web/src/lib/api/generated/writing-app-api.d.ts`에서 공개 코스 상세 챕터 타입의 `label: string`이 사라진다.

- [ ] **Step 4: 제품 문서에서 단원 속성을 갱신한다**

`docs/platform-product-feature-spec.md`의 단원 행을 아래처럼 바꾼다.

```md
| 단원 | 코스 상세 안에서 레슨을 묶는 커리큘럼 단위 | ID, 제목, 레슨 목록, 완료 수 |
```

- [ ] **Step 5: 백엔드/관리자 문서에서 label 의존 문장을 제거한다**

아래 파일에서 챕터 스냅샷 설명이 `label`을 언급하면 삭제한다.

- `docs/platform-backend-api.md`
- `docs/admin-site.md`
- `BACKEND.md`

변경 후 문장은 “챕터 스냅샷은 제목, 정렬 순서, 상태와 레슨 배치를 가진다”처럼 쓴다.

- [ ] **Step 6: 문서 관련 테스트를 통과시킨다**

Run:

```bash
bun --filter @workspace/api test -- openapi-document.test.ts app.test.ts
bun --filter @workspace/web typecheck
```

Expected: PASS.

- [ ] **Step 7: 커밋한다**

```bash
git add apps/docs/openapi/writing-app-api.json apps/web/src/lib/api/generated/writing-app-api.d.ts docs/platform-product-feature-spec.md docs/platform-backend-api.md docs/admin-site.md BACKEND.md apps/api/src/openapi/openapi-document.test.ts apps/api/src/app.test.ts
git commit -m "챕터 레이블 제거 문서와 API 스펙 갱신"
```

---

### Task 7: 전체 참조 검색과 최종 검증

**Files:**

- No direct file target. 남은 참조를 찾아 이전 Task 파일에 반영한다.

- [ ] **Step 1: 챕터 label 잔여 참조를 검색한다**

Run:

```bash
rg -n "chapter\\.label|chapterLabel|label: chapter\\.label|label text not null|label: z\\.string\\(\\)\\.min\\(1\\)" apps packages docs BACKEND.md DOMAIN.md FRONTEND.md GLOSSARY.md CONTEXT.md --glob '!prototype/**' --glob '!node_modules/**' --glob '!docs/superpowers/**'
```

Expected: 챕터 전용 참조가 없다. 스텝 콘텐츠, 접근성, UI 컴포넌트의 일반 `label`만 남는다.

- [ ] **Step 2: TypeScript 전체 검증을 실행한다**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 3: 테스트 전체를 실행한다**

Run:

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 4: lint를 실행한다**

Run:

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 5: pre-commit 검증을 실행한다**

Run:

```bash
bun lefthook run pre-commit
```

Expected: PASS.

- [ ] **Step 6: 작업 중 띄운 프로세스를 종료한다**

개발 서버나 watch 프로세스를 사용했다면 종료한다. 이 계획은 기본적으로 테스트 명령만 사용하므로 별도 장기 실행 프로세스가 없어야 한다.

- [ ] **Step 7: 최종 커밋을 만든다**

잔여 수정이 있으면 한국어 커밋 메시지로 커밋한다.

```bash
git status --short
git add apps packages docs BACKEND.md
git commit -m "챕터 레이블 잔여 참조 제거"
```

---

## 자기 검토

- Spec coverage: DB 컬럼, seed, core DTO, repository, 관리자 API, 공개 API, 관리자 UI, 학습자 UI, OpenAPI, 문서, 테스트가 모두 포함되어 있다.
- Placeholder scan: 실행자가 채워야 하는 미완성 항목은 없다.
- Type consistency: 챕터 구조는 제거 후 `id`, `title`, `sortOrder`, `status`, `lessons`를 사용한다. 공개 웹 모델은 `CourseChapter.title`과 `CourseNextLesson.title`만 사용한다.
- Scope check: 스텝 콘텐츠와 일반 UI의 `label`은 도메인 의미가 다르므로 제거 범위에서 제외했다.
