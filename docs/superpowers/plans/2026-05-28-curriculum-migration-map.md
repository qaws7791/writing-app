# 커리큘럼 마이그레이션 맵 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 커리큘럼 버전 사이의 레슨 마이그레이션 맵을 만들고, 특정 사용자 진행을 맵 기준으로 새 버전에 적용할 수 있게 한다.

**Architecture:** Core admin 계약이 migration DTO와 service 결과를 정의하고, DB admin repository가 migration map 저장과 사용자 단위 적용을 transaction으로 처리한다. Admin API는 인증 route와 HTTP status 매핑만 담당한다.

**Tech Stack:** Bun, TypeScript, Zod, Hono, Drizzle SQLite, Vitest, Markdown, Prettier.

---

## 범위 확인

### 포함

- 7단계 설계 문서와 구현 계획 문서
- 마이그레이션 맵 DB schema와 SQLite migration
- 관리자 core DTO, repository, service 계약
- 관리자 API route
- 사용자 1명에 대한 migration apply repository 로직
- equivalent/split/merged/removed 완료 이전 정책
- idempotent 재실행 검증
- 실패 application row 관측성
- `/docs`, `DOMAIN.md`, `BACKEND.md` 갱신

### 제외

- learner-facing 업그레이드 API
- 학습자 공지/배너 UX
- 여러 사용자 일괄 적용
- migration map 수정/삭제 API
- lesson answer 이전
- 부분 진행 이전

## 파일 구조

- 생성: `docs/superpowers/specs/2026-05-28-curriculum-migration-map-design.md`
- 생성: `docs/superpowers/plans/2026-05-28-curriculum-migration-map.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`
- 생성: `packages/db/src/migrations/0005-curriculum-migration-map.sql`
- 수정: `packages/db/src/migrations/run-content-migration.ts`
- 생성: `packages/db/src/schema/curriculum-migration.schema.ts`
- 수정: `packages/db/src/schema/index.ts`
- 수정: `packages/db/src/client.test.ts`
- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/core/src/admin/admin.repository.ts`
- 수정: `packages/core/src/admin/admin.service.ts`
- 수정: `packages/core/src/admin/admin.service.test.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- 생성: `apps/admin-api/src/routes/curriculum-migrations.route.ts`
- 수정: `apps/admin-api/src/app.ts`
- 수정: `apps/admin-api/src/app.test.ts`
- 수정: `DOMAIN.md`
- 수정: `BACKEND.md`
- 수정: `docs/curriculum-change-policy.md`

## 작업 1: 설계와 구현 계획 고정

**파일:**

- 생성: `docs/superpowers/specs/2026-05-28-curriculum-migration-map-design.md`
- 생성: `docs/superpowers/plans/2026-05-28-curriculum-migration-map.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: 문서 로그 추가**

`docs/admin-site.md`와 `docs/platform-backend-api.md` 상단에 7단계 구현 계획 시작/완료 로그를 추가한다.

- [ ] **단계 2: 포맷과 커밋**

```bash
bun prettier --write docs/superpowers/specs/2026-05-28-curriculum-migration-map-design.md docs/superpowers/plans/2026-05-28-curriculum-migration-map.md docs/admin-site.md docs/platform-backend-api.md
git diff --check
git add docs/superpowers/specs/2026-05-28-curriculum-migration-map-design.md docs/superpowers/plans/2026-05-28-curriculum-migration-map.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "커리큘럼 마이그레이션 맵 계획 문서화"
```

## 작업 2: DB schema와 migration 추가

**파일:**

- 생성: `packages/db/src/migrations/0005-curriculum-migration-map.sql`
- 수정: `packages/db/src/migrations/run-content-migration.ts`
- 생성: `packages/db/src/schema/curriculum-migration.schema.ts`
- 수정: `packages/db/src/schema/index.ts`
- 수정: `packages/db/src/client.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/db/src/client.test.ts`에 migration map tables 생성 테스트를 추가한다.

- [ ] **단계 2: 실패 확인**

```bash
bun --filter @workspace/db test -- client.test.ts
```

기대 결과: 새 schema export와 tables가 없어 실패한다.

- [ ] **단계 3: schema와 migration 구현**

세 테이블을 추가한다.

- `curriculum_version_migrations`
- `lesson_migration_mappings`
- `curriculum_migration_applications`

- [ ] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/db test -- client.test.ts
bun --filter @workspace/db typecheck
git diff --check
git add packages/db/src/migrations/0005-curriculum-migration-map.sql packages/db/src/migrations/run-content-migration.ts packages/db/src/schema/curriculum-migration.schema.ts packages/db/src/schema/index.ts packages/db/src/client.test.ts
git commit -m "커리큘럼 마이그레이션 맵 스키마 추가"
```

## 작업 3: Core admin 계약 추가

**파일:**

- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/core/src/admin/admin.repository.ts`
- 수정: `packages/core/src/admin/admin.service.ts`
- 수정: `packages/core/src/admin/admin.service.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

admin service 테스트에 다음 동작을 추가한다.

- `createCurriculumMigration`
- `getCurriculumMigration`
- `applyCurriculumMigration`
- invalid/not-found 결과 보존

- [ ] **단계 2: 실패 확인**

```bash
bun --filter @workspace/core test -- admin.service.test.ts
```

기대 결과: 새 service/repository 메서드가 없어 실패한다.

- [ ] **단계 3: DTO와 service 구현**

mapping type enum, migration detail DTO, application DTO, repository result union을 추가한다.

- [ ] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/core test -- admin.service.test.ts
bun --filter @workspace/core test
bun --filter @workspace/core typecheck
git diff --check
git add packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts
git commit -m "관리자 커리큘럼 마이그레이션 계약 추가"
```

## 작업 4: DB admin repository 구현

**파일:**

- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

repository 테스트에 다음을 추가한다.

- migration map 생성과 조회
- removed mapping은 `toLessonId: null`만 허용
- equivalent/split/merged/removed 완료 이전 정책
- 재실행 idempotency
- 실패 application row 기록

- [ ] **단계 2: 실패 확인**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
```

기대 결과: repository 메서드가 없어 실패한다.

- [ ] **단계 3: repository 구현**

`createCurriculumMigration`, `getCurriculumMigration`, `applyCurriculumMigration`을 transaction 중심으로 구현한다.

- [ ] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
bun --filter @workspace/db test
bun --filter @workspace/db typecheck
git diff --check
git add packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts
git commit -m "커리큘럼 마이그레이션 적용 저장소 구현"
```

## 작업 5: Admin API route 추가

**파일:**

- 생성: `apps/admin-api/src/routes/curriculum-migrations.route.ts`
- 수정: `apps/admin-api/src/app.ts`
- 수정: `apps/admin-api/src/app.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

`apps/admin-api/src/app.test.ts`에 다음 route 테스트를 추가한다.

- `POST /curriculum-migrations`
- `GET /curriculum-migrations/:migrationId`
- `POST /curriculum-migrations/:migrationId/apply`
- invalid-request는 400
- not-found는 404
- unauthenticated는 401

- [ ] **단계 2: 실패 확인**

```bash
bun --filter @workspace/admin-api test -- app.test.ts
```

기대 결과: route가 등록되지 않아 404로 실패한다.

- [ ] **단계 3: route 구현**

`requireAdminSession`, `describeRoute`, Zod request parsing을 사용한다.

- [ ] **단계 4: 통과 확인과 커밋**

```bash
bun --filter @workspace/admin-api test -- app.test.ts
bun --filter @workspace/admin-api test
bun --filter @workspace/admin-api typecheck
git diff --check
git add apps/admin-api/src/routes/curriculum-migrations.route.ts apps/admin-api/src/app.ts apps/admin-api/src/app.test.ts
git commit -m "관리자 커리큘럼 마이그레이션 API 추가"
```

## 작업 6: 문서 갱신과 전체 검증

**파일:**

- 수정: `DOMAIN.md`
- 수정: `BACKEND.md`
- 수정: `docs/curriculum-change-policy.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`
- 수정: `docs/superpowers/plans/2026-05-28-curriculum-migration-map.md`

- [ ] **단계 1: 문서 갱신**

7단계 구현 완료 로그와 현재 상태를 갱신한다.

- [ ] **단계 2: 전체 검증**

```bash
bun prettier --write DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md docs/superpowers/specs/2026-05-28-curriculum-migration-map-design.md docs/superpowers/plans/2026-05-28-curriculum-migration-map.md packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts packages/db/src/repositories/drizzle-admin.repository.ts packages/db/src/repositories/drizzle-admin.repository.test.ts apps/admin-api/src/app.ts apps/admin-api/src/app.test.ts apps/admin-api/src/routes/curriculum-migrations.route.ts
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/admin-api test
bun run test
bun run lint
bun run typecheck
git diff --check
```

- [ ] **단계 3: 커밋**

```bash
git add DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md docs/superpowers/plans/2026-05-28-curriculum-migration-map.md
git commit -m "커리큘럼 마이그레이션 맵 문서 갱신"
```

## 자체 검토

- 마이그레이션 맵과 적용 정책은 포함하고, 학습자 UX는 제외 범위로 남겼다.
- 완료 상태만 이전하고 partial progress와 answers는 이전하지 않는다고 명시했다.
- 재실행 idempotency와 실패 관측성을 테스트 범위에 포함했다.
