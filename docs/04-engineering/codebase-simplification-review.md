---
title: 코드베이스 단순화 개선 포인트
description: 2026-04-21 기준 글필 모노레포를 탐색해 단순하고 안전한 코드 구조를 만들기 위한 우선 개선 포인트를 정리합니다.
---

## 상태

- 기준 시점: 2026-04-21
- 최신 상태: 2026-05-05에 `apps/admin` 앱을 제거했습니다. 아래 Admin 관련 완료 항목은 제거 전 이력으로만 유지합니다.
- 범위: `apps/web`, `apps/api`, `packages/core`, `packages/database`
- 목적: 동작 변경 없이 구조 복잡도와 숨은 변환을 줄이기 위한 후속 작업 후보를 정리합니다.
- 전제: 현재는 개발 단계이므로 마이그레이션 비용이나 하위 호환성보다 구현 단순성과 구조 명확성을 우선합니다.
- 후속 작업: `codebase-simplification-review.md` 기준 순차 개선을 2026-04-21부터 진행합니다.
- 현재 작업: 후속 구조 단순화 작업 10개를 모두 완료했습니다.
- 추가 작업: 2026-04-21에 `codebase-simplification-improvements.md` 기준 1차 저위험 배치(`#1`, `#2`, `#3`, `#4`, `#9`, `#10`)를 시작하고 완료했습니다.
- 진행 현황: 1번 항목(스텝 타입 모델 통일), 2번 항목(세션 상세 화면 step registry 정리), 3번 항목(`progress.repository`와 `submit-step` 분리), 4번 항목(웹 API/Query 보일러플레이트 축소), 5번 항목(DI/라우트/토큰 등록 국소화), 6번 항목(`@workspace/core` 루트 배럴 축소), 7번 항목(관리자 CRUD 폼 정리)은 2026-04-21에 구현 완료했습니다.
- 기준 원칙: 지역성 확보, 조기 추상화 방지(AHA), 단일 책임, 명시적 설계, 순수 함수, 얕은 계층, 불변성, 의존성 명시화, 일관된 추상화 수준, 작은 변경 단위, 규약 우선, 파일 크기 제한

## 2026-04-21 순차 개선 작업

| 상태 | 항목                                     | 범위                                                                                                                                                                                                                                                                                                                                          | 메모                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 완료 | API seed/reset 스크립트 중복 제거        | `apps/api/src/scripts/seed.ts`, `apps/api/src/scripts/db-reset.ts`, `apps/api/src/scripts/seed-helpers.ts`                                                                                                                                                                                                                                    | 공용 helper로 테스트 사용자/여정 시딩과 스크립트 런타임 초기화를 모으고, 임시 DB 경로에서 `typecheck`, `seed`, `db-reset` 검증 완료                                                                                                                                                                                                                                                                                                            |
| 완료 | Admin 대시보드 인라인 SVG 제거           | `apps/admin/src/app/(dashboard)/dashboard/page.tsx`                                                                                                                                                                                                                                                                                           | 통계 카드와 빠른 이동 아이콘을 `lucide-react`로 교체하고 `admin` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                                       |
| 완료 | `autosave-writing` ResultAsync 단순화    | `packages/core/src/modules/writings/use-cases/autosave-writing.ts`                                                                                                                                                                                                                                                                            | 검증 실패 early return을 `errAsync`로 치환하고 `@workspace/core` 타입체크·테스트 검증 완료                                                                                                                                                                                                                                                                                                                                                     |
| 완료 | Admin API `_unsafeUnwrap()` 제거         | `apps/admin/src/app/api/journeys/route.ts`, `apps/admin/src/app/api/journeys/[id]/sessions/route.ts`, `apps/admin/src/app/api/prompts/route.ts`                                                                                                                                                                                               | `match()` 기반 응답 분기로 `_unsafeUnwrap()`을 제거하고 `admin` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                                        |
| 완료 | Web Query Key 상수화                     | `apps/web/src/features/*/query-keys.ts`                                                                                                                                                                                                                                                                                                       | feature별 query key 팩토리로 리터럴 키와 generic detail helper 의존을 제거하고 `web` 타입체크·테스트 검증 완료                                                                                                                                                                                                                                                                                                                                 |
| 완료 | Admin 폼 상태 관리 규약 명시             | `AGENTS.md`, `docs/04-engineering/frontend-architecture-guide.md`                                                                                                                                                                                                                                                                             | `apps/admin`은 controlled `useState` + form helper 규약을 유지한다는 기준을 문서화하고 `git diff --check` 검증 완료                                                                                                                                                                                                                                                                                                                            |
| 완료 | Service Worker TypeScript 전환           | `apps/web/src/service-worker/sw.ts`, `apps/web/public/sw.js`, `apps/web/package.json`                                                                                                                                                                                                                                                         | TS 소스에서 `public/sw.js`를 생성하고 모듈 전역 mutable cache를 제거한 뒤 `web` build:service-worker·typecheck·lint 검증 완료                                                                                                                                                                                                                                                                                                                  |
| 완료 | SessionDetailClientPage 책임 분리        | `apps/web/src/app/journeys/[journeyId]/sessions/[sessionId]/client.tsx`                                                                                                                                                                                                                                                                       | 순수 매핑과 세션 러너 훅을 분리해 라우트 진입 컴포넌트는 상태 분기와 화면 조립만 담당하게 정리하고 `web` 타입체크·테스트·린트 검증 완료                                                                                                                                                                                                                                                                                                        |
| 완료 | `step-registry` 타입 관계 정리           | `apps/web/src/views/session-detail-view/types.ts`, `apps/web/src/views/session-detail-view/step-registry.tsx`                                                                                                                                                                                                                                 | `Step`를 content-aware union으로 정리하고 registry의 `as` 단언/중복 타입 가드를 줄인 뒤 `web` 타입체크·테스트·린트 검증 완료                                                                                                                                                                                                                                                                                                                   |
| 완료 | Admin API 라우트 helper 정리             | `apps/admin/src/app/api/**/*.ts`, `apps/admin/src/lib/api/admin-route.ts`                                                                                                                                                                                                                                                                     | body 파싱과 Result 응답 변환 helper로 PUT/POST/GET 핸들러 반복 코드를 축소하고 `admin` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                 |
| 완료 | API runtime 모듈 응집                    | `apps/api/src/runtime/modules/*.ts`, `apps/api/src/runtime/tokens/*`, `apps/api/src/routes/**/*.ts`                                                                                                                                                                                                                                           | 토큰 정의와 유즈케이스 등록을 도메인별 module 파일로 합치고 중앙 registry/tokens 경유를 제거한 뒤 `api` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                |
| 완료 | Hono 커스텀 라우트 래퍼 단순화           | `apps/api/src/lib/hono/*.ts`, `apps/api/src/routes/**/*.ts`                                                                                                                                                                                                                                                                                   | `define-route`에 handler input/Result 해석을 모아 보조 helper 파일을 제거하고 `api` 타입체크·린트 검증 완료 (`api test`는 기존 `bun:sqlite` 로딩 문제로 실패)                                                                                                                                                                                                                                                                                  |
| 완료 | `unwrapOrThrow` deprecated 제거          | `apps/api/src/routes/**/*.ts`, `apps/api/src/http/unwrap-or-throw.ts`                                                                                                                                                                                                                                                                         | 라우트가 `Result`를 직접 반환하도록 정리하고 deprecated helper 파일을 삭제한 뒤 `api` 타입체크·린트 검증 완료 (`api test`는 기존 `bun:sqlite` 로딩 문제로 실패)                                                                                                                                                                                                                                                                                |
| 완료 | 단일-아이템 라우트 배럴 제거             | `apps/api/src/routes/index.ts`, `apps/api/src/routes/{auth,dev,health,home,me,users}`, `apps/api/src/runtime/bootstrap.ts`                                                                                                                                                                                                                    | 단일 라우트 배럴을 직접 import로 치환하고 불필요한 `index.ts`를 삭제한 뒤 `api` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                        |
| 완료 | `SESSION_COOKIE_NAME` 상수화             | `apps/web/src/middleware.ts`, `apps/web/src/foundation/auth/constants.ts`                                                                                                                                                                                                                                                                     | Better Auth 세션 쿠키 이름을 공유 상수로 이동하고 `web` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                                                |
| 완료 | `session-detail-view/index.ts` 제거      | `apps/web/src/app/journeys/[journeyId]/sessions/[sessionId]/client.tsx`, `apps/web/src/views/session-detail-view/index.ts`                                                                                                                                                                                                                    | 단일 re-export import를 직접 경로로 치환하고 불필요한 `index.ts`를 삭제한 뒤 `web` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                     |
| 완료 | `get-user-profile` writing count 단순화  | `packages/core/src/modules/writings/*`, `packages/database/src/repository/writing.repository.ts`, `apps/api/src/routes/users/get-user-profile.ts`                                                                                                                                                                                             | `countByUserId`/`countWritingsUseCase`를 추가해 페이지 순회를 제거했고 `api`·`@workspace/core`·`@workspace/database` 타입체크와 린트 검증 완료 (`core` lint의 coverage 경고 3건은 기존 상태)                                                                                                                                                                                                                                                   |
| 완료 | `session-detail-view/types.ts` 단순화    | `apps/web/src/views/session-detail-view/types.ts`, `apps/web/src/views/session-detail-view/steps/*.tsx`, `apps/web/src/app/journeys/[journeyId]/sessions/[sessionId]/session-mappers.ts`                                                                                                                                                      | 뷰 전용 타입만 남기고 코어 스텝 콘텐츠 타입은 각 사용처에서 직접 import하도록 정리한 뒤 `web` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                          |
| 완료 | `observability/logger.ts` 통합           | `apps/api/src/observability/logger.ts`, `apps/api/src/runtime/modules/infrastructure.ts`, `apps/api/src/**/*.ts`                                                                                                                                                                                                                              | API 전용 logger 래퍼를 제거하고 `@workspace/logging`과 서비스명 상수를 직접 사용하도록 정리한 뒤 `api` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                 |
| 완료 | API 라우트 로컬 응답 스키마 이전         | `packages/core/src/modules/{auth,home,users}/*`, `apps/api/src/routes/{health,me,users,dev}/*.ts`, `apps/api/src/app-env.ts`                                                                                                                                                                                                                  | `health`, `me`, `users/profile`, `dev/auth-emails` 계약 스키마를 `@workspace/core`로 이동하고 `api`·`@workspace/core` 타입체크와 린트 검증 완료 (`core` lint의 coverage 경고 3건은 기존 상태)                                                                                                                                                                                                                                                  |
| 완료 | `writing-operations.ts` 구조 정리        | `packages/core/src/modules/writings/operations/*`, `packages/core/src/modules/writings/index.ts`, `packages/database/src/repository/writing.repository.ts`                                                                                                                                                                                    | `createPreview`를 `operations/` 디렉터리로 이동하고 저장소 중복 구현을 제거한 뒤 `api`·`@workspace/core`·`@workspace/database` 타입체크와 린트 검증 완료 (`core` lint의 coverage 경고 3건은 기존 상태)                                                                                                                                                                                                                                         |
| 완료 | `GreetingSection` 재검토                 | `apps/web/src/views/home-view.tsx`, `apps/web/src/features/home/components/{greeting-section.tsx,index.ts}`                                                                                                                                                                                                                                   | 단일 사용처 인사말 컴포넌트를 `HomeView`로 인라인 병합하고 `web` 타입체크·린트 검증 완료                                                                                                                                                                                                                                                                                                                                                       |
| 완료 | Web/API 저위험 단순화 1차 배치           | `apps/web/src/app`, `apps/web/src/features`, `apps/web/src/foundation`, `apps/api/src/app.ts`, `apps/api/src/runtime/{container,use-case-keys}.ts`                                                                                                                                                                                            | `ThemeProvider` 중복 파일 1개와 redirect 전용 page 3개를 삭제하고, 탭 `Suspense` 경계를 layout으로 올렸으며, feature 배럴 6곳에서 repository re-export를 제거했습니다. 날짜 포맷 유틸 2개를 공용화했고, API 미들웨어는 키 목록 기반 타입 안전 등록으로 바꿔 새 use case 누락을 더 빨리 드러내게 했습니다. `web` 타입체크·린트·테스트, `api` 타입체크·린트 검증 완료. `api test`는 기존 `bun:sqlite` 환경 의존성 문제로 실패                    |
| 완료 | Admin detail page DB 직접 접근 제거      | `apps/admin/src/app/(dashboard)/journeys/[id]/page.tsx`, `apps/admin/src/app/(dashboard)/journeys/[id]/sessions/[sessionId]/page.tsx`, `apps/admin/src/app/(dashboard)/journeys/[id]/sessions/[sessionId]/steps/[stepId]/page.tsx`, `apps/admin/src/app/(dashboard)/prompts/[id]/page.tsx`, `apps/admin/src/lib/runtime/admin-page-result.ts` | detail page 4곳의 `@workspace/database`/`getDb()` 직접 접근을 제거하고 `getAdminRuntime().useCases` 호출로 치환했습니다. 서버 컴포넌트에서 `ResultAsync`를 `notFound()` 기반으로 일관되게 해제하는 helper를 추가해 같은 패턴을 반복하기 쉽게 만들었습니다. `admin` 타입체크·린트 검증 완료, 대상 detail page의 직접 DB 접근은 4건에서 0건으로 감소했습니다.                                                                                    |
| 완료 | 트랜잭션 경계 및 파생 카운터 상태 재검증 | `packages/core/src/modules/{writings,progress}/use-cases/*.ts`, `packages/core/src/shared/transaction/transaction-boundary-guard.test.ts`, `packages/database/src/transaction/create-repository-transaction-manager.test.ts`, `packages/database/src/repository/writing.repository.ts`                                                        | `create-writing`, `enroll-journey`, `complete-session`, `submit-step`가 모두 `transactionManager.run(...)` 안에 들어가 있는 것을 확인했고, `writing_prompts.response_count`는 글 생성과 같은 트랜잭션 경계 안에서 갱신되는 상태입니다. `@workspace/core`의 transaction guard 테스트 5건과 `@workspace/database` rollback 테스트 2건이 통과해 `codebase-simplification-improvements.md`의 `#6`, `#8`은 현재 코드 기준 완료 상태로 판단했습니다. |
| 완료 | Writing editor state 책임 분리           | `apps/web/src/views/writing-editor/use-writing-editor-state.ts`, `apps/web/src/views/writing-editor/{use-dirty-guard,use-writing-editor,use-writing-persistence}.ts`, `apps/web/src/views/writing-editor-view.tsx`                                                                                                                            | 에디터 초기화/기본값 주입, 저장·삭제 persistence, `beforeunload` dirty guard를 각각 독립 훅으로 분리하고 `useWritingEditorState`는 내비게이션과 화면 조합만 담당하도록 줄였습니다. `web` 타입체크·린트·테스트 검증 완료, writing editor 상태 훅은 1개 거대 훅에서 3개 하위 훅 + 1개 조합 훅 구조로 바뀌었습니다.                                                                                                                               |

## 요약

| 우선순위 | 개선 포인트                                       | 관련 원칙                                                                   | 대표 파일                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 완료     | 스텝 타입 모델을 하나로 통일                      | Explicit over Implicit, Convention over Configuration, Locality of Behavior | `packages/core/src/modules/journeys/journey-types.ts`, `packages/core/src/modules/journeys/journey-schemas.ts`, `apps/web/src/app/journeys/[journeyId]/sessions/[sessionId]/client.tsx`, `apps/admin/src/components/step-form.tsx` |
| 완료     | 세션 상세 화면의 스텝별 규칙을 한 곳으로 모으기   | Locality of Behavior, SRP, Consistent Level of Abstraction                  | `apps/web/src/views/session-detail-view/session-detail-view.tsx`, `apps/web/src/views/session-detail-view/step-renderer.tsx`, `apps/web/src/features/sessions/session-step-response.ts`                                            |
| 완료     | `progress` 저장소와 `submit-step` 유즈케이스 분리 | SRP, Limit File/Module Size, Prefer Pure Functions                          | `packages/database/src/repository/progress.repository.ts`, `packages/core/src/modules/progress/use-cases/submit-step.ts`                                                                                                           |
| 완료     | 웹 API 호출 보일러플레이트를 작은 유틸로 축소     | AHA, Explicit Dependencies, Small Changesets                                | `apps/web/src/features/*/repositories/*.ts`, `apps/web/src/features/*/hooks/*.ts`                                                                                                                                                  |
| 완료     | DI/라우트/토큰 등록을 모듈 단위로 국소화          | Locality of Behavior, Explicit Dependencies, Small Changesets               | `apps/api/src/runtime/container.ts`, `apps/api/src/runtime/modules/use-cases.ts`, `apps/api/src/runtime/tokens/index.ts`, `apps/api/src/routes/index.ts`, `apps/admin/src/lib/runtime/admin-composition.ts`                        |
| 완료     | `@workspace/core` 루트 배럴을 더 좁게 만들기      | Explicit Dependencies, SRP, Limit File/Module Size                          | `packages/core/src/index.ts`, `packages/core/package.json`, `apps/api/src/routes/*`, `packages/database/src/repository/*`                                                                                                          |
| 완료     | 관리자 CRUD 폼의 네트워크/라우팅/파싱 중복 줄이기 | AHA, SRP, Small Changesets                                                  | `apps/admin/src/components/journey-form.tsx`, `apps/admin/src/components/step-form.tsx`, `apps/admin/src/lib/forms/admin-mutation.ts`, `apps/admin/src/lib/forms/step-form-helpers.ts`                                             |

## 1. 스텝 타입 모델을 하나로 통일

### 작업 결과

- 완료 상태: 구현 완료
- 현재 기준 타입은 `INTRO`, `COMPLETION`, `CONCEPT`, `EXAMPLE`, `MULTIPLE_CHOICE`, `FILL_IN_THE_BLANK`, `ORDERING`, `HIGHLIGHT`, `SHORT_ANSWER`, `WRITING`, `REWRITING`, `AI_FEEDBACK`, `AI_COMPARISON` 입니다.
- `packages/core`, `packages/database`, `apps/api`, `apps/admin`, `apps/web`, OpenAPI 생성물, API client 타입이 모두 같은 스텝 타입을 사용하도록 정리했습니다.

### 정리한 내용

- 코어의 `StepType`과 payload content type을 하나의 규약으로 통일했습니다.
- 관리자 폼과 목록이 같은 스텝 타입을 직접 사용하도록 바꿨습니다.
- Web 세션 화면의 `FALLBACK_STEP_TYPE`을 제거했습니다.
- `submit-step`의 AI 큐잉 조건도 coarse type 대신 실제 스텝 타입(`WRITING → AI_FEEDBACK`, `REWRITING → AI_COMPARISON`) 기준으로 바꿨습니다.

## 2. 세션 상세 화면의 스텝별 규칙을 한 곳으로 모으기

### 작업 결과

- 완료 상태: 구현 완료
- `apps/web/src/views/session-detail-view/step-registry.tsx`를 추가해 렌더링, CTA 규칙, 제출 직렬화, 서버 응답 역직렬화를 한 파일에 모았습니다.
- `SessionDetailView`, `StepRenderer`, `session-step-response.ts`는 registry를 호출하는 얇은 오케스트레이션 계층으로 줄였습니다.

### 현재 증상

- `session-detail-view.tsx`가 CTA 활성화 규칙을 `SELECTION_TYPES`, `AI_TYPES`, `INPUT_TYPES` 배열로 관리합니다.
- `step-renderer.tsx`가 별도 `switch`로 컴포넌트 렌더링을 관리합니다.
- `session-step-response.ts`가 또 다른 `switch`로 직렬화/역직렬화를 관리합니다.
- `step-state.ts`는 타입 가드를 별도 파일에서 유지합니다.

### 왜 복잡한가

- 하나의 스텝 행동 규칙이 최소 3~4개 파일에 퍼져 있어 지역성이 낮습니다.
- 새 스텝 타입 추가나 기존 타입 수정 시 누락 지점이 많습니다.
- `as` 단언이 반복되어 타입 시스템이 제공할 수 있는 안전성이 줄어듭니다.

### 권장 방향

- 스텝별 메타데이터를 한 곳에 모은 registry로 바꾸는 편이 낫습니다.
- 각 스텝 엔트리는 `render`, `serialize`, `deserialize`, `canProceed` 정도만 가지게 하고, 화면 컨테이너는 오케스트레이션만 담당하게 합니다.
- 가능하면 `content.type` 기반 discriminated union을 그대로 사용해 `as` 단언을 줄입니다.

### 작은 변경 단위

1. `steps/` 하위에 스텝 registry 파일을 추가합니다.
2. 기존 `switch` 로직을 registry 조회로 치환합니다.
3. CTA 판정과 응답 직렬화를 각 스텝 엔트리로 이동합니다.
4. `SessionDetailView`는 현재 스텝 선택과 이동만 담당하게 축소합니다.

## 3. `progress` 저장소와 `submit-step` 유즈케이스 분리

### 작업 결과

- 완료 상태: 구현 완료
- `progress.repository.ts`는 조립만 남기고, 파서·매퍼·여정 진행·세션 진행·세션 AI 상태를 별도 파일로 분리했습니다.
- `submit-step.ts`는 오케스트레이션만 남기고, 응답 검증·AI 입력 구성·에러 정규화를 helper 파일로 분리했습니다.

### 현재 증상

- `packages/database/src/repository/progress.repository.ts`는 JSON 파싱, row mapper, 여정 진행률 조회/갱신, 세션 진행률 조회/갱신, AI 상태 큐 claim/save를 모두 담당합니다.
- `packages/core/src/modules/progress/use-cases/submit-step.ts`는 응답 검증, AI 입력 구성, 완료 처리, 다음 스텝 이동, 런타임 재빌드까지 모두 담당합니다.

### 왜 복잡한가

- 읽기 전용 로직과 상태 전이 로직이 한 파일에 섞여 추상화 수준이 일정하지 않습니다.
- 순수하게 테스트할 수 있는 규칙과 저장소 호출이 강하게 얽혀 있습니다.
- 작은 변경도 큰 파일을 함께 열어야 해서 변경 단위가 커집니다.

### 권장 방향

- 저장소는 `journey-progress`, `session-progress`, `session-ai-state`처럼 책임별로 나누거나 최소한 내부 파일을 분리합니다.
- `submit-step`은 순수 계산 함수와 effect orchestration을 분리합니다.
- 예를 들면 `validateStepResponse`, `buildAiInput`, `resolveCompletionUpdate`, `resolveNextProgressUpdate`는 순수 함수로 별도 파일에 둘 수 있습니다.

### 작은 변경 단위

1. `submit-step.ts`에서 순수 계산 블록을 별도 함수로 추출합니다.
2. `progress.repository.ts`를 읽기/쓰기/AI 상태 영역으로 물리 분리합니다.
3. 필요하면 포트도 책임 기준으로 다시 나눕니다.
4. 큰 파일을 남기기보다 호출부까지 함께 정리해 구조를 끝냅니다.

## 4. 웹 API 호출 보일러플레이트를 작은 유틸로 축소

### 작업 결과

- 완료 상태: 구현 완료
- `apps/web/src/foundation/api/result.ts`, `query-helpers.ts`를 추가해 API 결과 해제, positive ID 처리, detail cache 갱신을 공통화했습니다.
- 반복도가 높았던 detail query 훅과 session mutation 훅, 주요 repository들의 에러 처리 패턴을 같은 유틸로 정리했습니다.

### 현재 증상

- `apps/web/src/features/journeys/repositories/journey.repository.ts`, `.../prompts/repositories/prompt.repository.ts`, `.../sessions/repositories/session.repository.ts`, `.../writings/repositories/writing.repository.ts`에서 `if (error) throw error`와 `if (!data) throw new Error(...)` 패턴이 반복됩니다.
- `useJourneyDetail`, `usePromptDetail`, `useSessionDetail` 같은 훅은 유효한 ID 검사와 `enabled` 계산을 거의 같은 형태로 반복합니다.
- mutation 훅도 `setQueryData` 또는 `invalidateQueries` 패턴이 유사하게 반복됩니다.

### 왜 복잡한가

- 이미 반복 횟수가 충분해서 AHA 관점에서도 더 미루기 어렵습니다.
- 에러 처리와 query key 규약이 feature마다 조금씩 달라질 가능성이 커집니다.
- 하지만 여기서 전역 추상화 계층을 과도하게 만들면 오히려 복잡해질 수 있습니다.

### 권장 방향

- 전역 거대 SDK를 만드는 대신 `apps/web/src/foundation/api`에 아주 작은 공통 유틸만 둡니다.
- 예: `unwrapApiResult`, `requirePositiveId`, `createDetailQueryKey`, `setDetailCache`.
- feature repository는 endpoint 이름과 입력/출력만 남기고, 공통 패턴만 줄입니다.

### 작은 변경 단위

1. `unwrapApiResult` 같은 작은 유틸을 추가합니다.
2. detail query 훅의 ID 검증을 공통 함수로 뽑습니다.
3. mutation cache 갱신도 반복도가 높은 패턴은 바로 묶습니다.

## 5. DI/라우트/토큰 등록을 모듈 단위로 국소화

### 작업 결과

- 완료 상태: 구현 완료
- API 라우트는 각 도메인 폴더의 `index.ts`에서 자기 라우트 집합을 내보내고, 루트 `routes/index.ts`는 이를 합치는 역할만 맡도록 줄였습니다.
- API 유즈케이스 등록은 `use-case-registries` 하위의 도메인별 registration 파일로 나눴고, 공개 컨텍스트 키도 각 도메인에서 정의한 목록을 `container.ts`가 조합하도록 바꿨습니다.
- 토큰 정의는 이미 `runtime/tokens/*`로 분리한 구조를 유지하고, `runtime/tokens/index.ts`에서만 재export하도록 정리했습니다.
- Admin 런타임도 인프라 조립, 여정 유즈케이스 조립, 글감 유즈케이스 조립으로 분리해 `admin-composition.ts`는 합성만 담당하게 바꿨습니다.

### 현재 증상

- 새 유즈케이스를 추가하면 `apps/api/src/runtime/modules/use-cases.ts`, `apps/api/src/runtime/container.ts`, `apps/api/src/runtime/tokens.ts`, `apps/api/src/routes/index.ts`를 함께 수정해야 합니다.
- 관리자 앱도 `apps/admin/src/lib/runtime/admin-composition.ts`에서 별도로 같은 조립 책임을 다시 가집니다.
- `USE_CASE_KEYS` 같은 수동 목록은 누락되기 쉬운 bookkeeping 코드입니다.

### 왜 복잡한가

- 의존성이 명시적이라는 장점은 있지만, 변경 지역성이 너무 낮습니다.
- 도메인 하나를 추가해도 여러 중앙 파일을 동시에 만져야 하므로 작은 변경 단위가 깨집니다.
- 루트 조립 파일이 점점 커지고 도메인별 맥락이 사라집니다.

### 권장 방향

- reflection 기반 자동 등록 대신, 도메인별 manifest를 두는 쪽이 더 단순합니다.
- 예를 들어 `journeys-module`, `sessions-module`, `writings-module`이 각각 다음을 내보내게 합니다.
- 등록할 use case
- 노출할 token
- mount할 route
- 루트는 manifest 배열을 합치는 역할만 맡습니다.

### 작은 변경 단위

1. 도메인별 manifest 구조를 먼저 정의합니다.
2. API와 Admin 조립 코드를 그 구조로 바로 정리합니다.
3. 중앙 등록 파일과 수동 목록을 제거합니다.

## 6. `@workspace/core` 루트 배럴을 더 좁게 만들기

### 작업 결과

- 완료 상태: 구현 완료
- `packages/core/package.json`에 `shared`, `journeys`, `progress`, `ai-feedback` subpath export를 추가했습니다.
- `packages/core/src/index.ts`는 shared 공용 export만 남기고, 도메인 모듈 export는 각 subpath로 이동했습니다.
- API, Admin, Database, AI, Web에서 모듈 전용 타입과 스키마는 `@workspace/core/modules/*`로, 공용 brand/error/schema는 `@workspace/core/shared` 또는 루트 shared export로 가져오도록 정리했습니다.

### 현재 증상

- `packages/core/src/index.ts`가 여러 모듈의 타입, 스키마, 유즈케이스 팩토리, 에러를 한 번에 재-export합니다.
- 결과적으로 `apps/api`, `apps/admin`, `apps/web`이 `@workspace/core` 루트만 import해도 거의 모든 것을 참조할 수 있습니다.

### 왜 복잡한가

- 모듈 경계가 import 문만 봐서는 잘 드러나지 않습니다.
- 루트 배럴이 커질수록 충돌과 순환 의존성 위험도 커집니다.
- 특정 모듈만 변경해도 루트 export 파일을 수정하게 되어 unrelated touch가 늘어납니다.

### 권장 방향

- 루트 entry는 정말 공통인 shared 타입만 남기고, 도메인별 subpath export를 우선 사용합니다.
- 예: `@workspace/core/journeys`, `@workspace/core/progress`, `@workspace/core/shared`.
- 이렇게 하면 import 자체가 의존성을 더 명시적으로 보여줍니다.

### 작은 변경 단위

1. `package.json`에 subpath export를 추가합니다.
2. 도메인별 import를 subpath 기준으로 바로 정리합니다.
3. 루트 배럴은 shared 공통 항목만 남기고 축소합니다.

## 7. 관리자 CRUD 폼의 네트워크/라우팅/파싱 중복 줄이기

### 작업 결과

- 완료 상태: 구현 완료
- `apps/admin/src/lib/forms/admin-mutation.ts`를 추가해 `fetch` 호출, JSON body 직렬화, 에러 메시지 정규화, 성공 후 라우팅을 공통화했습니다.
- `journey-form`, `prompt-form`, `session-form`, `step-form`은 입력 상태와 제출 흐름만 남기고, 네트워크 보일러플레이트를 helper 호출로 치환했습니다.
- `apps/admin/src/lib/forms/step-form-helpers.ts`를 추가해 step type 옵션/라벨과 `contentJson` 직렬화·파싱을 한 곳으로 모았습니다.
- `step-list`도 같은 step label 정의를 공유하도록 바꿨습니다.

### 현재 증상

- `apps/admin/src/components/journey-form.tsx`와 `step-form.tsx`는 로컬 state, `fetch`, error 처리, `router.push`, `router.refresh`, delete confirm을 각각 직접 구현합니다.
- `step-form.tsx`는 JSON 파싱까지 UI 컴포넌트 안에서 처리합니다.

### 왜 복잡한가

- 폼 컴포넌트가 입력 UI와 transport 세부사항을 동시에 떠안습니다.
- 비슷한 패턴이 다른 CRUD 폼에도 늘어나면 수정 시 일관성이 깨집니다.
- 에러 메시지 형식과 성공 후 이동 규칙이 파일마다 달라질 수 있습니다.

### 권장 방향

- 폼은 입력값 수집과 표시만 맡기고, 제출/삭제는 feature-local action helper로 분리합니다.
- JSON step payload처럼 도메인 전용 파싱이 필요한 경우에도 parser 함수를 컴포넌트 밖으로 빼는 편이 낫습니다.
- 다만 여기서는 범용 폼 프레임워크까지 만들 필요는 없습니다.

### 작은 변경 단위

1. `submitJourneyForm`, `deleteJourney`, `submitStepForm`, `deleteStep` 같은 액션 함수를 분리합니다.
2. 에러 응답 파싱 규약을 공통화합니다.
3. 폼 컴포넌트는 입력과 표시만 담당하게 정리합니다.

## 권장 실행 순서

1. 스텝 타입 통일
2. 세션 상세 step registry 도입
3. `submit-step`과 `progress.repository` 내부 분리
4. 웹 API 유틸 최소 공통화
5. 모듈 manifest 기반 조립
6. `@workspace/core` subpath export 도입
7. 관리자 CRUD 액션 정리

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-core-guide]]
- [[dependency-injection]]
- [[frontend-architecture-guide]]
- [[state-management-guide]]
