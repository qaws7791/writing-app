# 관리자 커리큘럼 발행 워크플로우 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** 관리자가 최신 published 커리큘럼 버전에서 draft를 만들고, draft를 publish해 신규 학습자용 최신 버전으로 승격할 수 있게 한다.

**Architecture:** 기존 `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons` 테이블을 사용한다. Core admin service는 버전 목록/상세/draft 생성/publish 계약과 오류 결과를 정의하고, DB admin repository는 transaction으로 draft snapshot을 복제한다. Admin API는 관리자 인증 route로 해당 service 결과를 HTTP status에 매핑한다.

**Tech Stack:** Bun, TypeScript, Zod, Hono, Drizzle SQLite, Vitest, Markdown, Prettier.

---

## 범위 확인

### 포함

- 6단계 설계 문서와 구현 계획 문서
- 관리자 커리큘럼 버전 DTO와 service/repository 계약
- 코스별 커리큘럼 버전 목록 조회
- 최신 published 버전에서 draft 생성
- 커리큘럼 버전 상세 조회
- draft publish
- Admin API route
- draft publish 후 공개 최신 버전 변경 검증
- 기존 학습자 진행 버전 불변 검증
- `/docs` 구현 로그와 백엔드 문서 갱신

### 제외

- `PATCH /curriculum-versions/:versionId`
- draft 구조 편집 API
- 노드 추가/이동/상태 변경 API
- 마이그레이션 맵
- 학습자 업그레이드 UX
- published 버전 직접 수정 API
- 새 DB migration

## 파일 구조

- 생성: `docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md`
- 생성: `docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`
- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/core/src/admin/admin.errors.ts`
- 수정: `packages/core/src/admin/admin.repository.ts`
- 수정: `packages/core/src/admin/admin.service.ts`
- 수정: `packages/core/src/admin/admin.service.test.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- 수정: `apps/admin-api/src/app.ts`
- 생성: `apps/admin-api/src/routes/curriculum-versions.route.ts`
- 수정: `apps/admin-api/src/app.test.ts`
- 수정: `DOMAIN.md`
- 수정: `BACKEND.md`
- 수정: `docs/curriculum-change-policy.md`

## 작업 1: 6단계 문서 계획 고정

**파일:**

- 생성: `docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md`
- 생성: `docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [x] **단계 1: 문서 로그 추가**

`docs/admin-site.md` 상단에 계획 시작/완료 로그를 추가한다.

```md
## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 6단계 구현 계획을 작성한다.
- 이번 단계는 draft 생성, 버전 조회, draft publish의 최소 발행 경계만 구현하고 draft 구조 편집 API는 제외한다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md`에 작성한다.
- published 구조 직접 수정 없이 최신 published 복제 draft를 만들고 publish하는 수직 경로로 제한한다.
```

`docs/platform-backend-api.md` 상단에도 같은 단계의 학습자 영향 로그를 추가한다.

```md
## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 시작

- 관리자 draft publish 후 신규 학습자는 새 최신 published 버전으로 시작하고, 기존 학습자는 저장된 진행 버전을 유지하는지 검증한다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 완료

- Admin API에 커리큘럼 버전 목록, draft 생성, 상세 조회, publish route를 추가하는 계획을 고정한다.
- 학습자 public DTO에는 version metadata를 노출하지 않는다.
```

- [x] **단계 2: 포맷과 커밋**

```bash
bun prettier --write docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md docs/admin-site.md docs/platform-backend-api.md
git diff --check
git add docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "관리자 커리큘럼 발행 워크플로우 계획 문서화"
```

## 작업 2: Core 관리자 계약 추가

**파일:**

- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/core/src/admin/admin.errors.ts`
- 수정: `packages/core/src/admin/admin.repository.ts`
- 수정: `packages/core/src/admin/admin.service.ts`
- 수정: `packages/core/src/admin/admin.service.test.ts`

- [x] **단계 1: 실패 테스트 작성**

`packages/core/src/admin/admin.service.test.ts`의 repository fixture에 다음 메서드를 추가하고 service 테스트를 작성한다.

```ts
async listCurriculumVersions() {
  return {
    versions: [
      {
        id: "sentence-structure-v1",
        courseId: "sentence-structure",
        versionNumber: 1,
        status: "published",
        title: "문장 구조의 기본",
        changelog: "초기 버전",
        publishedAt: "2026-05-28T00:00:00.000Z",
        createdAt: "2026-05-28T00:00:00.000Z",
      },
    ],
  }
},
async createCurriculumDraft() {
  return {
    status: "created",
    version: {
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "draft",
      title: "문장 구조의 기본",
      changelog: "Draft from v1",
      publishedAt: null,
      createdAt: "2026-05-28T00:00:00.000Z",
    },
  }
},
async getCurriculumVersionDetail() {
  return {
    id: "sentence-structure-v2",
    courseId: "sentence-structure",
    versionNumber: 2,
    status: "draft",
    title: "문장 구조의 기본",
    changelog: "Draft from v1",
    publishedAt: null,
    createdAt: "2026-05-28T00:00:00.000Z",
    chapters: [],
  }
},
async publishCurriculumVersion() {
  return {
    status: "published",
    version: {
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "published",
      title: "문장 구조의 기본",
      changelog: "Draft from v1",
      publishedAt: "2026-05-28T00:00:00.000Z",
      createdAt: "2026-05-28T00:00:00.000Z",
    },
  }
},
```

테스트는 `listCurriculumVersions`, `createCurriculumDraft`, `getCurriculumVersionDetail`, `publishCurriculumVersion`의 `ok` 결과와 invalid/not-found 결과 보존을 검증한다.

- [x] **단계 2: 실패 확인**

```bash
bun --filter @workspace/core test -- admin.service.test.ts
```

기대 결과: `AdminRepository`와 `AdminService`에 새 메서드가 없어 실패한다.

- [x] **단계 3: 구현**

`packages/core/src/admin/admin.dto.ts`에 다음 schema를 추가한다.

```ts
export const adminCurriculumVersionStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
])

export const adminCurriculumVersionSummaryDtoSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  status: adminCurriculumVersionStatusSchema,
  title: z.string().min(1),
  changelog: z.string().min(1),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})
```

상세 DTO는 `AdminCourseTree`의 chapter/lesson shape를 재사용하지 않고 version detail 전용 schema로 정의한다.

`admin.errors.ts`에 `adminNotFoundErrorDtoSchema`를 추가한다.

`AdminRepository`와 `AdminService`에는 다음 메서드를 추가한다.

```ts
listCurriculumVersions(courseId: string): Promise<AdminCurriculumVersionListDto>
createCurriculumDraft(courseId: string): Promise<AdminCreateCurriculumDraftRepositoryResult>
getCurriculumVersionDetail(versionId: string): Promise<AdminCurriculumVersionDetailDto | undefined>
publishCurriculumVersion(versionId: string): Promise<AdminPublishCurriculumVersionRepositoryResult>
```

- [x] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/core test -- admin.service.test.ts
bun --filter @workspace/core test
bun --filter @workspace/core typecheck
git add packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.errors.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts
git commit -m "관리자 커리큘럼 버전 발행 계약 추가"
```

## 작업 3: DB repository 발행 워크플로우 구현

**파일:**

- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`

- [x] **단계 1: 실패 테스트 작성**

`drizzle-admin.repository.test.ts`에 다음을 검증하는 테스트를 추가한다.

- `createCurriculumDraft("sentence-structure")`가 `sentence-structure-v2` draft를 생성한다.
- draft의 chapters/lessons는 v1 snapshot을 복제한다.
- 이미 draft가 있으면 `{ status: "invalid-request" }`를 반환한다.
- `publishCurriculumVersion("sentence-structure-v2")` 후 content repository가 v2를 최신 published로 본다.
- 기존 `course_progress.curriculum_version_id`는 v1로 남는다.

- [x] **단계 2: 실패 확인**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
```

기대 결과: repository에 새 메서드가 없어 실패한다.

- [x] **단계 3: 구현**

`createDrizzleAdminRepository`에 새 메서드를 구현한다.

핵심 정책:

- draft가 이미 있으면 invalid-request
- source published가 없으면 not-found
- next versionNumber는 코스의 max version number + 1
- draft id는 `${courseId}-v${nextVersionNumber}`
- chapter id는 `${sourceChapterId ?? chapter.id}-v${nextVersionNumber}`
- lesson id는 `${lesson.lessonId}-v${nextVersionNumber}`
- publish는 draft만 허용

- [x] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
bun --filter @workspace/db test
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "관리자 커리큘럼 draft 생성과 발행 구현"
```

## 작업 4: Admin API route 추가

**파일:**

- 생성: `apps/admin-api/src/routes/curriculum-versions.route.ts`
- 수정: `apps/admin-api/src/app.ts`
- 수정: `apps/admin-api/src/app.test.ts`

- [x] **단계 1: 실패 테스트 작성**

`apps/admin-api/src/app.test.ts`의 fake `adminService`에 새 메서드를 추가하고 다음 route 테스트를 작성한다.

- `GET /courses/sentence-structure/curriculum-versions`
- `POST /courses/sentence-structure/curriculum-versions`
- `GET /curriculum-versions/sentence-structure-v2`
- `POST /curriculum-versions/sentence-structure-v2/publish`
- unauthenticated 요청은 401
- invalid-request는 400
- not-found는 404

- [x] **단계 2: 실패 확인**

```bash
bun --filter @workspace/admin-api test -- app.test.ts
```

기대 결과: route가 등록되지 않아 404 또는 타입 오류로 실패한다.

- [x] **단계 3: 구현**

`curriculum-versions.route.ts`를 생성해 `requireAdminSession`과 `describeRoute`를 사용한다. service 결과 매핑은 다음과 같다.

- `ok` → 200
- `invalid-request` → 400
- `not-found` → 404
- `unavailable` → 503

`app.ts`에 route registration을 추가한다.

- [x] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/admin-api test -- app.test.ts
bun --filter @workspace/admin-api test
git add apps/admin-api/src/routes/curriculum-versions.route.ts apps/admin-api/src/app.ts apps/admin-api/src/app.test.ts
git commit -m "관리자 커리큘럼 버전 발행 API 추가"
```

## 작업 5: 문서 갱신과 전체 검증

**파일:**

- 수정: `DOMAIN.md`
- 수정: `BACKEND.md`
- 수정: `docs/curriculum-change-policy.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [x] **단계 1: 문서 갱신**

6단계 구현 시작/완료 로그를 `/docs` 상단에 추가하고, `DOMAIN.md`, `BACKEND.md`, `docs/curriculum-change-policy.md`의 현재 상태를 draft/published 발행 워크플로우까지 갱신한다.

- [x] **단계 2: 전체 검증**

```bash
bun prettier --write DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.errors.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts apps/admin-api/src/app.ts apps/admin-api/src/app.test.ts apps/admin-api/src/routes/curriculum-versions.route.ts
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/admin-api test
bun run test
bun run lint
bun run typecheck
git diff --check
```

기대 결과: 모든 명령이 종료 코드 0으로 끝난다. `bun run lint`에서 기존 `apps/api/src/main.test.ts` env warning 2개가 보일 수 있지만 error는 없어야 한다.

- [x] **단계 3: 커밋**

```bash
git add DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "관리자 커리큘럼 발행 워크플로우 문서 갱신"
```

## 자체 검토

- 로드맵 6단계의 완료 조건인 draft 생성, publish 후 최신 published 전환, 기존 학습자 진행 버전 불변을 포함한다.
- draft 구조 편집, 마이그레이션 맵, 학습자 업그레이드 UX는 제외 범위로 남겼다.
- 새 migration 없이 기존 version snapshot 테이블을 사용한다.
- TDD 단계마다 실패 확인 후 구현한다.
