# 학습자 커리큘럼 업그레이드 공지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** 학습자가 새 커리큘럼 공지를 확인하고, 명시적으로 업그레이드하거나 나중에 결정할 수 있는 learner-facing API와 코스 상세 UX를 구현한다.

**Architecture:** Core learning service가 업그레이드 계약을 소유하고, DB learning repository가 진행 버전과 latest published version, active migration, dismiss 상태를 조합한다. 마이그레이션 적용 알고리즘은 DB shared helper로 분리해 admin 적용과 learner 적용이 같은 정책을 사용한다.

**Tech Stack:** Bun, TypeScript, Zod, Hono, Drizzle SQLite, Next.js App Router, React, Vitest, Testing Library, shadcn 기반 `@workspace/ui`.

---

### Task 1: 계획 문서화

**Files:**

- Create: `docs/superpowers/specs/2026-05-28-learner-curriculum-upgrade-notice-design.md`
- Create: `docs/superpowers/plans/2026-05-28-learner-curriculum-upgrade-notice.md`
- Modify: `docs/admin-site.md`
- Modify: `docs/platform-backend-api.md`

- [x] **Step 1: 문서 로그와 설계/계획 작성**

8단계 시작 로그, 설계 문서, 구현 계획을 작성한다.

- [x] **Step 2: 포맷과 커밋**

```bash
bun prettier --write docs/superpowers/specs/2026-05-28-learner-curriculum-upgrade-notice-design.md docs/superpowers/plans/2026-05-28-learner-curriculum-upgrade-notice.md docs/admin-site.md docs/platform-backend-api.md
git add docs/superpowers/specs/2026-05-28-learner-curriculum-upgrade-notice-design.md docs/superpowers/plans/2026-05-28-learner-curriculum-upgrade-notice.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "학습자 커리큘럼 업그레이드 계획 문서화"
```

### Task 2: 업그레이드 dismiss 스키마

**Files:**

- Create: `packages/db/src/migrations/0006-curriculum-upgrade-dismissal.sql`
- Modify: `packages/db/src/schema/curriculum-migration.schema.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/migrations/run-content-migration.ts`
- Modify: `packages/db/src/client.test.ts`

- [x] **Step 1: 실패 테스트 작성**

`packages/db/src/client.test.ts`에서 `curriculum_upgrade_dismissals` 테이블 생성과 컬럼 존재를 검증한다.

- [x] **Step 2: 실패 확인**

```bash
bun --filter @workspace/db test -- client.test.ts
```

기대 결과: 새 테이블이 없어 실패한다.

- [x] **Step 3: schema와 migration 구현**

`curriculum_upgrade_dismissals` Drizzle schema와 SQLite migration을 추가하고 migration runner에 포함한다.

- [x] **Step 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/db test -- client.test.ts
bun --filter @workspace/db typecheck
git add packages/db/src/schema/curriculum-migration.schema.ts packages/db/src/schema/index.ts packages/db/src/migrations/run-content-migration.ts packages/db/src/migrations/0006-curriculum-upgrade-dismissal.sql packages/db/src/client.test.ts
git commit -m "커리큘럼 업그레이드 숨김 스키마 추가"
```

### Task 3: Core learning 계약

**Files:**

- Modify: `packages/core/src/learning/learning.dto.ts`
- Modify: `packages/core/src/learning/learning.repository.ts`
- Modify: `packages/core/src/learning/learning.service.ts`
- Modify: `packages/core/src/learning/learning.service.test.ts`

- [x] **Step 1: 실패 테스트 작성**

`learning.service.test.ts`에 `getCurriculumUpgrade`, `applyCurriculumUpgrade`, `dismissCurriculumUpgrade` 동작을 추가한다.

- [x] **Step 2: 실패 확인**

```bash
bun --filter @workspace/core test -- learning.service.test.ts
```

기대 결과: 새 service/repository 메서드와 DTO가 없어 실패한다.

- [x] **Step 3: DTO와 service 구현**

`status: "available" | "not-available"` 업그레이드 조회 DTO, application DTO, dismissed DTO, repository record/result 타입, service 메서드를 추가한다.

- [x] **Step 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/core test -- learning.service.test.ts
bun --filter @workspace/core typecheck
git add packages/core/src/learning/learning.dto.ts packages/core/src/learning/learning.repository.ts packages/core/src/learning/learning.service.ts packages/core/src/learning/learning.service.test.ts
git commit -m "학습자 커리큘럼 업그레이드 계약 추가"
```

### Task 4: DB shared migration helper와 learning repository

**Files:**

- Create: `packages/db/src/repositories/curriculum-migration-application.ts`
- Modify: `packages/db/src/repositories/drizzle-admin.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- Modify: `packages/db/src/repositories/drizzle-learning.repository.ts`
- Modify: `packages/db/src/repositories/drizzle-learning.repository.test.ts`

- [x] **Step 1: 실패 테스트 작성**

`drizzle-learning.repository.test.ts`에 available notice, dismiss 후 숨김, learner apply가 진행 버전을 target으로 이동하는 테스트를 추가한다.

- [x] **Step 2: 실패 확인**

```bash
bun --filter @workspace/db test -- drizzle-learning.repository.test.ts
```

기대 결과: learning repository 메서드가 없어 실패한다.

- [x] **Step 3: shared helper 추출**

admin repository의 마이그레이션 적용 알고리즘을 `curriculum-migration-application.ts`로 옮기고 admin repository가 helper를 호출하도록 정리한다.

- [x] **Step 4: learning repository 구현**

진행 버전, latest published version, active migration, dismiss row를 기준으로 available upgrade를 계산하고, apply/dismiss 메서드를 구현한다.

- [x] **Step 5: 통과 확인과 커밋**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts drizzle-learning.repository.test.ts
bun --filter @workspace/db typecheck
git add packages/db/src/repositories/curriculum-migration-application.ts packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts packages/db/src/repositories/drizzle-learning.repository.ts packages/db/src/repositories/drizzle-learning.repository.test.ts
git commit -m "학습자 커리큘럼 업그레이드 저장소 구현"
```

### Task 5: Learner API route

**Files:**

- Create: `apps/api/src/routes/curriculum-upgrade.route.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/app.test.ts`
- Modify: `apps/api/src/openapi/openapi-document.test.ts`
- Modify: `apps/api/src/openapi/openapi-document.ts`

- [x] **Step 1: 실패 테스트 작성**

`apps/api/src/app.test.ts`에 세 route의 auth, GET available/not-available, POST apply, POST dismiss 테스트를 추가한다.

- [x] **Step 2: 실패 확인**

```bash
bun --filter @workspace/api test -- app.test.ts
```

기대 결과: route가 없어 404로 실패한다.

- [x] **Step 3: route 구현**

`require auth`, `describeRoute`, Zod response schema를 사용해 route를 추가하고 `createApiApp`에 등록한다.

- [x] **Step 4: OpenAPI 확인과 커밋**

```bash
bun --filter @workspace/api test -- app.test.ts openapi-document.test.ts
bun --filter @workspace/api typecheck
git add apps/api/src/routes/curriculum-upgrade.route.ts apps/api/src/app.ts apps/api/src/app.test.ts apps/api/src/openapi/openapi-document.ts apps/api/src/openapi/openapi-document.test.ts
git commit -m "학습자 커리큘럼 업그레이드 API 추가"
```

### Task 6: Web API client 계약

**Files:**

- Modify: `apps/web/src/lib/api/writing-app-api.ts`
- Modify: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`
- Modify: `apps/web/src/lib/api/http/create-http-writing-app-api.test.ts`
- Modify: `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts`
- Modify: `apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts`
- Modify: `apps/web/src/lib/api/generated/writing-app-api.d.ts`
- Modify: `apps/docs/openapi/writing-app-api.json`

- [x] **Step 1: 실패 테스트 작성**

HTTP client와 fake API 테스트에 curriculum upgrade 조회, apply, dismiss 동작을 추가한다.

- [x] **Step 2: 실패 확인**

```bash
bun --filter @workspace/web test -- create-http-writing-app-api.test.ts create-fake-writing-app-api.test.ts
```

기대 결과: API interface 메서드가 없어 실패한다.

- [x] **Step 3: client 구현**

`WritingAppApi`에 세 메서드를 추가하고 HTTP/fake 구현을 맞춘다.

- [x] **Step 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/web test -- create-http-writing-app-api.test.ts create-fake-writing-app-api.test.ts
bun --filter @workspace/web typecheck
git add apps/web/src/lib/api/writing-app-api.ts apps/web/src/lib/api/http/create-http-writing-app-api.ts apps/web/src/lib/api/http/create-http-writing-app-api.test.ts apps/web/src/lib/api/fake/create-fake-writing-app-api.ts apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts
git commit -m "웹 커리큘럼 업그레이드 API 클라이언트 추가"
```

### Task 7: 코스 상세 업그레이드 공지 UI

**Files:**

- Create: `apps/web/src/features/courses/course-upgrade-notice.tsx`
- Modify: `apps/web/src/features/courses/course-detail-page.tsx`
- Modify: `apps/web/src/features/courses/course-detail-page.test.tsx`
- Modify: `apps/web/src/app/app/courses/[id]/page.tsx`

- [x] **Step 1: 실패 테스트 작성**

`course-detail-page.test.tsx`에 available notice가 보이고 not-available이면 숨겨지는 테스트를 추가한다.

- [x] **Step 2: 실패 확인**

```bash
bun --filter @workspace/web test -- course-detail-page.test.tsx
```

기대 결과: 공지 props/component가 없어 실패한다.

- [x] **Step 3: UI 구현**

서버 page에서 course detail과 upgrade status를 병렬 조회하고, available일 때만 `CourseUpgradeNotice`를 렌더링한다. 업그레이드/나중에 결정 버튼은 client component에서 API 호출 후 `router.refresh()`를 실행한다.

- [x] **Step 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/web test -- course-detail-page.test.tsx
bun --filter @workspace/web typecheck
git add apps/web/src/features/courses/course-upgrade-notice.tsx apps/web/src/features/courses/course-detail-data.ts apps/web/src/features/courses/course-detail-page.tsx apps/web/src/features/courses/course-detail-page.test.tsx apps/web/src/app/app/courses/[id]/page.tsx
git commit -m "코스 상세 커리큘럼 업그레이드 공지 추가"
```

### Task 8: 문서 갱신과 최종 검증

**Files:**

- Modify: `DOMAIN.md`
- Modify: `BACKEND.md`
- Modify: `FRONTEND.md`
- Modify: `docs/curriculum-change-policy.md`
- Modify: `docs/admin-site.md`
- Modify: `docs/platform-backend-api.md`
- Modify: `docs/superpowers/plans/2026-05-28-learner-curriculum-upgrade-notice.md`

- [x] **Step 1: 문서 갱신**

8단계 완료 상태, learner API, dismiss 정책, 코스 상세 UX를 문서에 반영한다.

- [x] **Step 2: 전체 검증**

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/api test
bun --filter @workspace/web test
bun run test
bun run lint
bun run typecheck
git diff --check
```

- [x] **Step 3: 커밋**

```bash
git add DOMAIN.md BACKEND.md FRONTEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md docs/superpowers/plans/2026-05-28-learner-curriculum-upgrade-notice.md
git commit -m "학습자 커리큘럼 업그레이드 문서 갱신"
```
