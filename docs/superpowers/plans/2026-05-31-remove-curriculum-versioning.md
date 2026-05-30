# 커리큘럼 버전 제거 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**목표:** 커리큘럼 버전, 마이그레이션, 학습자 업그레이드 UX를 제거하고 코스의 현재 커리큘럼 하나만 저장·조회·편집한다.

**아키텍처:** 공개 콘텐츠 조회와 학습 진행은 `course_chapters`, `course_lessons`, `lesson_steps`를 직접 기준으로 삼는다. 관리자 편집기는 draft/publish 없이 같은 테이블을 직접 저장하며, 학습자 업그레이드 API와 웹 공지 UI는 사라진다.

**기술 스택:** Bun, TypeScript, Hono, Next.js, Drizzle SQLite, Vitest.

---

### 작업 1: 시작 문서 갱신

**파일:**

- 수정: `docs/bssn-simplification-audit.md`

- [ ] `2순위 B안 제거 작업 시작` 기록을 추가한다.

### 작업 2: DB 스키마와 시드 단순화

**파일:**

- 수정: `packages/db/src/schema/content.schema.ts`
- 수정: `packages/db/src/schema/learning.schema.ts`
- 수정: `packages/db/src/schema/index.ts`
- 삭제: `packages/db/src/schema/curriculum-migration.schema.ts`
- 수정: `packages/db/src/seeds/seed-content.ts`
- 수정: `packages/db/src/migrations/run-content-migration.ts`

- [ ] `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons`, `curriculum_version_steps` schema를 제거한다.
- [ ] `course_progress.curriculum_version_id`, `lesson_progress.curriculum_version_id`를 제거한다.
- [ ] 시드는 현재 커리큘럼 테이블만 채운다.
- [ ] 마이그레이션 실행기는 새 DB에 버전 테이블을 만들지 않는다.

### 작업 3: core 계약 단순화

**파일:**

- 수정: `packages/core/src/content/content.ids.ts`
- 수정: `packages/core/src/learning/learning.dto.ts`
- 수정: `packages/core/src/learning/learning.repository.ts`
- 수정: `packages/core/src/learning/learning.service.ts`
- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/core/src/admin/admin.repository.ts`
- 수정: `packages/core/src/admin/admin.service.ts`

- [ ] `CurriculumVersionId`, 업그레이드 DTO, 마이그레이션 DTO를 제거한다.
- [ ] 학습 repository는 `listCourseLessonIds(courseId)`와 `courseIncludesLesson(courseId, lessonId)`를 제공한다.
- [ ] 관리자 repository는 단일 `getCourseEditorDocument`, `saveCourseEditorDocument`, `getCourseLessonDetail`만 유지한다.

### 작업 4: DB repository 단순화

**파일:**

- 수정: `packages/db/src/repositories/drizzle-content.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-learning.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`
- 삭제: `packages/db/src/repositories/curriculum-migration-application.ts`

- [ ] 콘텐츠 조회를 현재 커리큘럼 테이블 직접 조회로 바꾼다.
- [ ] 학습 진행 저장과 완료 처리는 버전 없이 코스 단위로만 계산한다.
- [ ] 관리자 편집 저장은 현재 코스, 챕터, 레슨, 스텝을 직접 갱신한다.

### 작업 5: API와 웹/관리자 UI 정리

**파일:**

- 수정: `apps/api/src/app.ts`
- 삭제: `apps/api/src/routes/curriculum-upgrade.route.ts`
- 수정: `apps/admin-api/src/app.ts`
- 삭제: `apps/admin-api/src/routes/curriculum-versions.route.ts`
- 삭제: `apps/admin-api/src/routes/curriculum-migrations.route.ts`
- 수정: `apps/admin-api/src/routes/curriculum-editor.route.ts`
- 수정: `apps/web/src/lib/api/writing-app-api.ts`
- 삭제: `apps/web/src/features/courses/course-upgrade-notice.tsx`
- 수정: `apps/web/src/features/courses/course-detail-page.tsx`
- 수정: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- 수정: `apps/admin/src/features/courses/course-editor/*`
- 수정: `apps/admin/src/lib/api/*`

- [ ] 학습자 업그레이드 라우트와 OpenAPI 경로를 제거한다.
- [ ] 관리자 버전/마이그레이션 라우트를 제거한다.
- [ ] 관리자 화면에서 버전 메뉴, 초안 생성, 발행, 폐기를 제거한다.

### 작업 6: 테스트와 문서 갱신

**파일:**

- 수정: 관련 `*.test.ts`, `*.test.tsx`
- 수정: `BACKEND.md`
- 수정: `ARCHITECTURE.md`
- 수정: `docs/bssn-simplification-audit.md`

- [ ] 버전/마이그레이션 기대값을 단일 현재 커리큘럼 기대값으로 바꾼다.
- [ ] 제거된 API 경로가 OpenAPI에 없음을 검증한다.
- [ ] `bun test`, `bun run typecheck`, 가능한 범위의 lint를 실행한다.
