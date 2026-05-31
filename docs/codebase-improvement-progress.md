# 코드베이스 개선 진행 기록

## 목적

`combined-codebase-improvements.md`에 정리된 개선 항목을 우선순위와 문서 순서대로 처리한다. 각 항목은 관련 코드 조사, 테스트 추가, 최소 변경 구현, 검증, 커밋 순서로 완료한다.

## 진행 원칙

- `/prototype` 디렉터리는 수정하지 않는다.
- 사용자 입력 자료인 `combined-codebase-improvements.md`와 `codebase.md`는 변경하지 않는다.
- 한 커밋은 하나의 개선 항목을 기준으로 한다.
- 동작 변경은 먼저 실패하는 테스트로 재현한 뒤 구현한다.
- 문서 갱신은 각 항목의 시작과 완료 상태를 남기는 방식으로 수행한다.

## 현재 진행 상태

| 순서 | ID        | 상태 | 요약                                                 |
| ---: | --------- | ---- | ---------------------------------------------------- |
|    1 | ADMIN-08  | 완료 | 체크박스 필드를 제어 컴포넌트로 전환했다.            |
|    2 | API-01    | 완료 | 프론트 HTTP API 응답 런타임 파싱을 도입했다.         |
|    3 | ARCH-01   | 완료 | 패키지 공개 경계와 내부 경로 직접 참조를 정리했다.   |
|    4 | AUTH-01   | 완료 | 어드민 인증 확인을 전용 세션 API로 분리했다.         |
|    5 | DATA-01   | 완료 | 마이그레이션 적용 이력 관리를 도입했다.              |
|    6 | DATA-02   | 완료 | 서버 시작 시 자동 데이터 변경 작업을 분리했다.       |
|    7 | DATA-03   | 완료 | Step content JSON 계약을 경계별로 엄격히 검증했다.   |
|    8 | DOMAIN-01 | 완료 | 플레이 가능한 레슨 불변식을 core 경계에서 검증한다.  |
|    9 | ADMIN-01  | 완료 | CourseEditorProvider의 URL/저장 책임을 분리했다.     |
|   10 | ADMIN-02  | 완료 | 에디터 선택 파생 계산과 step source를 정리했다.      |
|   11 | ADMIN-03  | 완료 | 커리큘럼 맵 내부 prop 전달을 줄였다.                 |
|   12 | ADMIN-04  | 완료 | dirty 변경 내역과 change kind 계산을 연결했다.       |
|   13 | ADMIN-07  | 완료 | 스텝 폼 필드 key와 draft content 타입을 분리했다.    |
|   14 | API-02    | 완료 | API 라우트 반복 처리 helper를 도입했다.              |
|   15 | API-03    | 완료 | health check 예외 응답을 명시화했다.                 |
|   16 | API-04    | 완료 | AI feedback provider 오류 분류를 추가했다.           |
|   17 | ARCH-02   | 완료 | UI 패키지의 Next 통합 경계를 분리했다.               |
|   18 | AUTH-02   | 완료 | 인증 프록시 요청 조립을 공통 패키지로 분리했다.      |
|   19 | AUTH-03   | 완료 | 로그인 다음 경로 검증을 앱별 허용 경로로 강화했다.   |
|   20 | AUTH-04   | 완료 | 어드민 로그인 실패 원인을 구분해 표시한다.           |
|   21 | DATA-04   | 완료 | 홈 진행 요약 조회를 단일 읽기 모델로 정리했다.       |
|   22 | DATA-05   | 완료 | AI 피드백 attempt 번호 생성을 저장소 경계로 옮겼다.  |
|   23 | DATA-06   | 완료 | DB 스키마 명명 규칙을 문서화했다.                    |
|   24 | DOMAIN-02 | 완료 | 어드민 스텝 타입 메타데이터 registry를 추가했다.     |
|   25 | FE-01     | 완료 | 레슨 경험 step renderer를 shell에서 분리했다.        |
|   26 | FE-02     | 완료 | 레슨 진행 저장 정책을 hook으로 분리했다.             |
|   27 | TEST-01   | 완료 | 테스트 무음 통과 예외와 커버리지 하한을 정리했다.    |
|   28 | ADMIN-05  | 완료 | 에디터 저장 상태 toast를 typed status로 전환했다.    |
|   29 | ADMIN-06  | 완료 | 보관 확인을 command layer에서 화면 dialog로 옮겼다.  |
|   30 | ARCH-03   | 완료 | 비어 있거나 오래된 문서를 현재 코드 상태로 갱신했다. |
|   31 | ARCH-04   | 완료 | Repomix 합본 프로필을 코드/분석 관점으로 분리했다.   |
|   32 | ARCH-05   | 완료 | 앱별 API URL 기본값을 env 계층으로 모았다.           |
|   33 | CODE-02   | 완료 | 디자인/레슨 생성 상수를 명명된 규칙으로 분리했다.    |
|   34 | DATA-07   | 완료 | admin seed 스크립트의 정적 import 경계를 분리했다.   |
|   35 | DATA-08   | 완료 | core 서비스 result 타입 껍데기를 공통화했다.         |
|   36 | DATA-09   | 완료 | content repository 출력 신뢰 경계를 명확히 했다.     |
|   37 | DATA-10   | 완료 | progress summary 변환 흐름을 단일화했다.             |

## ADMIN-08 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/step-forms/step-form-fields.tsx`
- 검증 방향: `StepWorkspace` 렌더링 후 같은 체크박스 필드의 `content` 값이 바뀌면 DOM의 `checked` 값도 함께 바뀌어야 한다.
- 완료 내용: 체크박스가 `checked`와 `onChange`를 함께 사용하는 제어 입력으로 동작한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/step-workspace.test.tsx`

## API-01 작업 메모

- 대상 파일: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`, `apps/web/src/features/lessons/lesson-api-mappers.ts`
- 조사 방향: OpenAPI 타입 단언 뒤 mapper로 넘기는 응답 경계를 찾고, 프론트 내부에서 재사용 가능한 schema parse 지점을 정한다.
- 완료 내용: HTTP 성공 응답이 내부 모델로 변환되기 전에 Zod schema로 검증되고, 계약 위반이 명시적 `contract-error`로 노출된다.
- 검증: `bun --filter @workspace/web test src/lib/api/http/create-http-writing-app-api.test.ts && bun --filter @workspace/web typecheck`

## ARCH-01 작업 메모

- 대상 파일: `packages/core/src/index.ts`, `packages/db/src/index.ts`, 각 앱의 `tsconfig.json`, 경계 우회 import 사용처
- 조사 방향: public subpath export로 대체 가능한 내부 `src` 경로 alias와 넓은 root export를 찾는다.
- 완료 내용: 앱의 core/db 내부 `src` path alias를 제거하고, DB client/migration/repository 사용처를 명시적 subpath export로 이동했다. `@workspace/core` root export는 비우고 domain subpath 사용을 강제한다.
- 범위 제외: `@workspace/ui` 내부 alias는 `UI-03`에서 별도 처리한다.
- 검증: `bun --filter @workspace/api typecheck && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/admin typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/core typecheck && bun --filter @workspace/logger typecheck`

## AUTH-01 작업 메모

- 대상 파일: `apps/admin-api/src/routes/session.route.ts`, `apps/admin-api/src/app.ts`, `apps/admin/src/lib/api/*`, `apps/admin/src/app/(admin)/layout.tsx`
- 조사 방향: `api.listUsers()`로 인증을 확인하는 흐름을 현재 관리자 세션 조회 API로 분리한다.
- 완료 내용: Admin API에 `GET /session`을 추가하고 보호 레이아웃은 `api.getSession()`만 호출한다. 사용자 페이지는 401만 로그인으로 보내고 나머지 조회 실패는 명시적 오류로 분리한다.
- 검증: `bun --filter @workspace/admin-api test && bun --filter @workspace/admin test && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin-api lint && bun --filter @workspace/admin lint`

## DATA-01 작업 메모

- 대상 파일: `packages/db/src/migrations/run-content-migration.ts`, `packages/db/src/migrations/*.sql`, `packages/db/package.json`
- 조사 방향: 현재 커스텀 migration runner에 적용 이력과 checksum 검증을 추가할 수 있는 가장 작은 경계를 찾는다.
- 완료 내용: `schema_migrations` ledger를 추가하고 SQL/코드 migration manifest의 checksum을 기록한다. 이미 적용된 migration의 checksum이 바뀌면 명시적 오류로 중단한다.
- 검증: `bun --filter @workspace/db test src/client.test.ts && bun --filter @workspace/db test && bun --filter @workspace/db typecheck && bun --filter @workspace/db lint`

## DATA-02 작업 메모

- 대상 파일: `apps/api/src/main.ts`, `apps/admin-api/src/main.ts`, `packages/db/src/seeds/seed-content.ts`, 운영 문서
- 조사 방향: 서버 시작이 seed나 migration 같은 데이터 변경 작업을 자동 수행하는 경로를 찾고 명시 실행 단계로 분리한다.
- 완료 내용: API와 Admin API 서버 시작에서 migration/seed 실행을 제거했다. `db:migrate` 명령을 추가하고 로컬 `dev:app`은 명시 setup 후 서버를 시작한다.
- 검증: `bun --filter @workspace/api test src/main.test.ts && bun --filter @workspace/api typecheck && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/api lint && bun --filter @workspace/admin-api lint && bun --filter @workspace/db lint`

## DATA-03 작업 메모

- 대상 파일: `packages/core/src/admin/admin.dto.ts`, `packages/db/src/repositories/drizzle-admin.repository.ts`, `apps/admin-api/src/routes/curriculum-editor.route.ts`
- 조사 방향: admin save/read 경계에서 step type별 content schema를 적용할 수 있는 가장 작은 core 계약을 찾는다.
- 완료 내용: step type별 content schema를 `packages/core/content`에서 export하고 admin editor step DTO가 같은 schema를 사용한다. Admin repository read path도 parsed step DTO를 반환해 DB JSON 계약을 다시 확인한다.
- 검증: `bun --filter @workspace/admin-api typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/admin-api test && bun --filter @workspace/db test && bun --filter @workspace/core test && bun --filter @workspace/core lint && bun --filter @workspace/db lint`

## DOMAIN-01 작업 메모

- 대상 파일: `packages/core/src/content/content.dto.ts`, `packages/core/src/learning/learning.service.ts`, 관련 core 테스트
- 조사 방향: playable lesson의 최소 step 수, INTRO first, COMPLETE last, step order, AI feedback source reference를 core 경계에서 검증한다.
- 완료 내용: content service가 lesson DTO parse 이후 playable lesson 불변식을 검증한다. 빈 steps, INTRO first 위반, COMPLETE last 위반, AI feedback source 누락은 `invalid-content`로 반환된다.
- 검증: `bun --filter @workspace/core test src/content/content.service.test.ts && bun --filter @workspace/core test && bun --filter @workspace/core typecheck && bun --filter @workspace/core lint`

## ADMIN-01 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`, `apps/admin/src/features/courses/course-editor/use-course-editor-url-state.ts`, `apps/admin/src/features/courses/course-editor/use-course-editor-save-command.ts`
- 조사 방향: CourseEditorProvider가 보유한 URL 동기화, 저장 상태, 저장 API 호출 책임을 동작 변경 없이 분리할 수 있는 가장 작은 경계를 찾는다.
- 완료 내용: URL 상태/히스토리 갱신은 `useCourseEditorUrlState`로, 저장 명령과 저장 중 상태는 `useCourseEditorSaveCommand`로 분리했다. URL 변경과 저장 성공/충돌 상태를 훅 테스트로 고정했다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/course-editor-session-hooks.test.tsx src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`
- 참고: `bun --filter @workspace/admin typecheck`는 기존 admin 테스트 fixture와 `editor-state.ts`의 step content 타입 불일치로 실패한다.

## ADMIN-02 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/editor-state.ts`, `apps/admin/src/features/courses/course-editor/editor-selectors.ts`, `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`
- 조사 방향: working copy 안의 step 데이터 원천이 중복되는 지점과 선택 상태 계산이 전체 트리를 반복 순회하는 지점을 찾는다.
- 완료 내용: working copy 내부 curriculum에서 `steps` 복제본을 제거하고 `workingCopy.steps`를 단일 step source로 고정했다. 선택 chapter/lesson/step 계산은 `createCourseEditorSelection` selector로 분리하고, lesson/step 인덱스를 한 번 구성해 조회한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/editor-selectors.test.ts src/features/courses/course-editor/editor-state.test.ts src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`
- 참고: `bun --filter @workspace/admin typecheck`는 기존 admin fixture와 draft step content 타입 불일치로 실패한다. step form의 content 타입 정리는 `ADMIN-07`에서 별도로 처리한다.

## ADMIN-03 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
- 조사 방향: CourseEditorShell과 panel 경계는 이미 context 기반으로 정리되어 있으므로, 남은 prop drilling이 실제로 발생하는 `CurriculumMap` 내부 private 컴포넌트 계층을 확인한다.
- 완료 내용: `CurriculumMap` 외부 props 계약은 유지하고, 파일 내부에 private context를 추가해 `ChapterSection`과 `SortableLessonButton`이 읽기 전용 상태와 액션 콜백을 직접 읽도록 정리했다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/curriculum-map.test.tsx src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`

## ADMIN-04 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/editor-change-kind.ts`, `apps/admin/src/features/courses/course-editor/editor-state.ts`, `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`
- 조사 방향: 기존 `useCourseEditorChangeKind()`가 빈 요약값을 사용해 실제 dirty 변경 내역과 연결되지 않는 지점을 확인한다.
- 완료 내용: dirty state에 `EditorChange` 판별 union을 추가하고, 기존 `changedFields`는 헤더 카운트 호환을 위해 유지했다. change kind는 `workingCopy.dirty.changes`를 요약해 계산한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/editor-state.test.ts src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`
- 참고: 전체 `bun --filter @workspace/admin typecheck`는 기존 admin fixture와 draft step content 타입 불일치로 실패한다.

## ADMIN-07 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/step-forms/step-form-fields.tsx`, `apps/admin/src/features/courses/course-editor/editor-state.ts`, 에디터 workspace/preview 컴포넌트
- 조사 방향: step form field key가 문자열로 열려 있는 지점과 에디터 내부 draft content가 published content 타입과 섞이는 지점을 확인한다.
- 완료 내용: `createStepForm()`의 field key를 step type별 content key로 제한했다. 에디터 working copy step은 published DTO와 분리된 draft content 타입을 사용하도록 정리하고, workspace/preview/form props도 draft step 타입을 받도록 맞췄다.
- 검증: `bun --filter @workspace/admin test src/features/courses/admin-course-detail-page.test.tsx src/features/courses/course-editor/step-workspace.test.tsx src/features/courses/course-editor/lesson-workspace.test.tsx src/features/courses/course-editor/lesson-preview.test.tsx src/features/courses/course-editor/editor-state.test.ts src/features/courses/course-editor/course-editor-session-hooks.test.tsx && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin lint`

## API-02 작업 메모

- 대상 파일: `apps/api/src/routes/*`, `apps/admin-api/src/routes/curriculum-editor.route.ts`, 각 앱의 `routes/route-helpers.ts`
- 조사 방향: 사용자 API의 세션 확인, JSON 본문 파싱, 서비스 결과 매핑 반복과 관리자 API의 편집 라우트 결과 매핑 반복을 앱 내부 helper로 줄인다.
- 완료 내용: 사용자 API에 `requireUserSession`, `parseJsonBody`, `jsonServiceResult`를 추가하고 `me`, `progress`, `learning`, `ai-feedback` 라우트에 적용했다. 관리자 API는 기존 관리자 세션 미들웨어를 유지하고 편집 라우트의 본문 파싱과 결과 매핑만 공통 helper로 이동했다.
- 검증: `bun --filter @workspace/api typecheck && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/api test && bun --filter @workspace/admin-api test && bun --filter @workspace/api lint && bun --filter @workspace/admin-api lint`
- 참고: `bun --filter @workspace/api lint`는 기존 `apps/api/src/main.test.ts`의 `turbo/no-undeclared-env-vars` 경고 2건을 유지한 채 성공한다.

## API-03 작업 메모

- 대상 파일: `apps/api/src/routes/health.route.ts`, `apps/admin-api/src/routes/health.route.ts`, 각 앱의 app 테스트
- 조사 방향: health route가 `checkDatabase()`의 false 반환뿐 아니라 예외 발생도 명시적인 503 응답과 로그로 처리하는지 확인한다.
- 완료 내용: API와 Admin API health route가 DB 확인 예외를 route 안에서 잡고 logger에 기록한 뒤 기존 DB unavailable 응답 경로로 내려가도록 했다. 두 앱 모두 예외 발생 시 503을 반환하는 테스트를 추가했다.
- 검증: `bun --filter @workspace/api test src/app.test.ts && bun --filter @workspace/admin-api test src/app.test.ts && bun --filter @workspace/api typecheck && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/api test && bun --filter @workspace/admin-api test && bun --filter @workspace/api lint && bun --filter @workspace/admin-api lint`
- 참고: `bun --filter @workspace/api lint`는 기존 `apps/api/src/main.test.ts`의 `turbo/no-undeclared-env-vars` 경고 2건을 유지한 채 성공한다.

## API-04 작업 메모

- 대상 파일: `packages/core/src/ai-feedback/ai-feedback.provider.ts`, `packages/core/src/ai-feedback/ai-feedback.service.ts`, `apps/api/src/openai/openai-feedback-provider.ts`
- 조사 방향: 외부 API 응답 계약을 흔들지 않고 provider 실패 원인을 timeout, rate limit, provider request 오류, provider response 오류, 일반 unavailable로 분류할 수 있는 내부 경계를 찾는다.
- 완료 내용: `AiFeedbackProvider` 포트를 성공/오류 result union으로 바꾸고 OpenAI provider가 SDK timeout, 429, 400/401/403/422, invalid structured output을 명시적으로 분류하게 했다. 서비스는 성공 결과만 completed attempt로 저장하고 모든 provider 실패는 기존 `ai-feedback-unavailable` 응답으로 접어 HTTP 계약을 유지한다.
- 검증: `bun --filter @workspace/core test src/ai-feedback/ai-feedback.service.test.ts && bun --filter @workspace/api test src/openai/openai-feedback-provider.test.ts && bun --filter @workspace/core typecheck && bun --filter @workspace/api typecheck && bun --filter @workspace/core test && bun --filter @workspace/api test && bun --filter @workspace/core lint && bun --filter @workspace/api lint`
- 참고: `bun --filter @workspace/api lint`는 기존 `apps/api/src/main.test.ts`의 `turbo/no-undeclared-env-vars` 경고 2건을 유지한 채 성공한다.

## ARCH-02 작업 메모

- 대상 파일: `packages/ui/package.json`, `packages/ui/src/next/*`, 앱 layout, Storybook 설정
- 조사 방향: UI primitive 패키지와 Next 앱 통합 컴포넌트의 공개 경계를 분리하고, React 런타임 소유권을 host 앱으로 명시한다.
- 완료 내용: `ThemeProvider`, `Toaster`, `toast`를 `@workspace/ui/next` subpath로 이동하고 기존 `components/ui` export에서 제거했다. `react`, `react-dom`, `next-themes`는 UI 패키지의 peer/dev dependency로 바꾸고 실제 Next 앱과 Storybook이 `next-themes`를 직접 의존하게 했다. Admin Vitest의 React dedupe 설정은 source 번들링 방어막으로 남기되 이유를 주석으로 기록했다.
- 검증: `bun install && bun pm why react && bun pm why next-themes && bun --filter @workspace/ui typecheck && bun --filter @workspace/ui lint && bun --filter @workspace/web typecheck && bun --filter @workspace/web lint && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin lint && bun --filter storybook typecheck && bun --filter storybook lint && bun --filter @workspace/web test && bun --filter @workspace/admin test && bun --filter @workspace/web build && bun --filter @workspace/admin build && bun --filter storybook build`
- 참고: `bun --filter storybook build`는 기존 Storybook/Vite의 `use client` directive, circular chunk, chunk size 경고를 출력하지만 성공한다.

## AUTH-02 작업 메모

- 대상 파일: `packages/auth-proxy`, `apps/web/src/app/api/auth/[...path]/route.ts`, `apps/admin/src/app/api/auth/[...path]/route.ts`
- 조사 방향: web/admin 인증 프록시에서 중복된 Request 조립 규칙을 앱별 base URL 정책과 분리한다.
- 완료 내용: `@workspace/auth-proxy` 패키지를 추가하고 auth backend URL 생성, query 보존, forwarded header 설정, GET/HEAD body 제외, streaming body와 `duplex: "half"`, `redirect: "manual"` 처리를 한 곳으로 모았다. web/admin route는 앱별 환경 변수와 기본 포트만 선택하고 같은 `proxyAuthRequest`를 호출한다.
- 검증: `bun install && bun --filter @workspace/auth-proxy test && bun --filter @workspace/auth-proxy typecheck && bun --filter @workspace/auth-proxy lint && bun --filter @workspace/web typecheck && bun --filter @workspace/web test && bun --filter @workspace/web lint && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin test && bun --filter @workspace/admin lint && bun --filter @workspace/web build && bun --filter @workspace/admin build`

## AUTH-03 작업 메모

- 대상 파일: `apps/web/src/lib/auth/auth-navigation.ts`, `apps/admin/src/lib/auth/admin-auth-navigation.ts`
- 조사 방향: 로그인 `next` 경로가 문자열 접두어만으로 허용되지 않게 앱별 허용 경로를 명시한다.
- 완료 내용: learner 앱은 `/app`, `/app/`, `/app?`만 허용해 `/app.evil` 같은 경로를 기본 `/app`으로 되돌린다. admin 앱은 `/`, `/courses`, `/users` 계열만 허용하는 allowlist로 바꿔 auth/api/미정의 화면으로의 redirect를 차단한다.
- 검증: `bun --filter @workspace/web test src/lib/auth/auth-navigation.test.ts && bun --filter @workspace/admin test src/lib/auth/admin-auth-navigation.test.ts && bun --filter @workspace/web typecheck && bun --filter @workspace/admin typecheck && bun --filter @workspace/web test && bun --filter @workspace/web lint && bun --filter @workspace/admin test && bun --filter @workspace/admin lint`

## AUTH-04 작업 메모

- 대상 파일: `apps/admin/src/lib/auth/admin-auth-client.ts`, `apps/admin/src/features/auth/admin-auth-page.test.tsx`
- 조사 방향: 어드민 이메일 로그인 실패를 HTTP status와 응답 body code 기준으로 구분하고, UI에는 원인별 안내 메시지를 표시한다.
- 완료 내용: 로그인 실패 결과에 `kind`를 추가하고 401/403 및 `INVALID_CREDENTIALS` 계열 body code는 `invalid-credentials`, 429는 `rate-limited`, 5xx는 `server-unavailable`, fetch 예외는 `network-error`로 매핑했다. 로그인 화면 테스트는 잘못된 인증 정보에 대한 구체 메시지를 검증한다.
- 검증: `bun --filter @workspace/admin test src/lib/auth/admin-auth-client.test.ts src/features/auth/admin-auth-page.test.tsx && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin test && bun --filter @workspace/admin lint`

## DATA-04 작업 메모

- 대상 파일: `packages/core/src/learning/learning.service.ts`, `packages/db/src/repositories/drizzle-learning.repository.ts`, `apps/web/src/app/app/page.tsx`
- 조사 방향: 홈 화면이 `/progress` 조회 뒤 코스별 상세와 진행률을 다시 요청하는 N+1 흐름을 확인하고, 기존 `/progress` 계약을 홈 진행 요약 읽기 모델로 확장한다.
- 완료 내용: `LearningRepository.listProgressSummaries()`를 추가해 코스와 활성 레슨 행을 한 번에 조회하고, core service가 완료 수, 다음 레슨, 레슨 표시 상태를 계산한다. Web 홈은 `/progress` 응답만으로 진행 중 코스 카드를 구성해 코스별 추가 API 호출을 제거했다.
- 검증: `bun --filter @workspace/core test && bun --filter @workspace/db test && bun --filter @workspace/api test && bun --filter @workspace/web test && bun --filter @workspace/core typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/api typecheck && bun --filter @workspace/web typecheck && bun --filter @workspace/core lint && bun --filter @workspace/db lint && bun --filter @workspace/api lint && bun --filter @workspace/web lint`

## DATA-05 작업 메모

- 대상 파일: `packages/core/src/ai-feedback/ai-feedback.service.ts`, `packages/core/src/ai-feedback/ai-feedback.repository.ts`, `packages/db/src/repositories/drizzle-feedback.repository.ts`
- 조사 방향: `countCompletedAttempts()` 뒤 service가 `attemptNumber = count + 1`을 계산하는 흐름을 저장소 단일 명령으로 옮겨, 같은 사용자와 스텝의 중복 요청이 같은 attempt 번호를 만들지 않게 한다.
- 완료 내용: `createNextCompletedAttempt()` 저장소 명령을 추가하고 service의 attempt 번호 계산 책임을 제거했다. Drizzle 저장소는 transaction 안에서 현재 최대 번호를 읽어 다음 completed attempt를 저장하며, unique constraint 충돌은 짧게 재시도하고 한도 도달은 도메인 결과로 반환한다.
- 검증: `bun --filter @workspace/core test src/ai-feedback/ai-feedback.service.test.ts && bun --filter @workspace/db test src/repositories/drizzle-feedback.repository.test.ts && bun --filter @workspace/core typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/core test && bun --filter @workspace/db test && bun --filter @workspace/core lint && bun --filter @workspace/db lint`

## DATA-06 작업 메모

- 대상 파일: `docs/schema-conventions.md`, `BACKEND.md`
- 조사 방향: Better Auth 계열 schema와 직접 관리 schema의 SQL 컬럼 명명 차이를 확인하고, 새 스키마 작성자가 따를 기준을 문서화한다.
- 완료 내용: Better Auth 계열 테이블은 provider convention을 유지하고, 직접 관리 테이블은 SQL 이름에 snake_case를 쓰며 Drizzle TypeScript 속성은 camelCase로 매핑한다는 규칙을 문서화했다. `BACKEND.md`의 `packages/db` 설명에서 해당 문서를 참조한다.
- 검증: `bun lefthook run pre-commit`

## DOMAIN-02 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/step-definitions.ts`, `apps/admin/src/features/courses/course-editor/step-form-registry.tsx`, 어드민 course editor 사용처
- 조사 방향: 어드민 에디터의 step type label, group, form component, 기본 metadata가 각각 다른 파일에 흩어진 지점을 확인하고, core/db step schema 변경 없이 앱 내부 registry로 먼저 응집한다.
- 완료 내용: 순수 metadata는 `step-definitions.ts`로, React form component 매핑은 `step-form-registry.tsx`로 분리했다. label, add-step group, step workspace form 선택, 새 step 기본 points는 registry를 통해 읽도록 연결했다.
- 범위 제외: core/content DTO와 DB enum 통합, 학습자 lesson renderer 분리는 영향 범위가 커서 `FE-01`과 후속 도메인 정리에서 별도로 다룬다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/editor-state.test.ts src/features/courses/course-editor/lesson-workspace.test.tsx src/features/courses/course-editor/step-workspace.test.tsx && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin lint`

## FE-01 작업 메모

- 대상 파일: `apps/web/src/features/lessons/lesson-experience.tsx`, `apps/web/src/features/lessons/lesson-step-renderer.tsx`
- 조사 방향: `LessonExperience`가 레슨 세션 상태, 이동, 저장 호출, exit dialog, 20개 step renderer를 모두 포함하는 지점을 확인하고, 저장 정책 변경 없이 renderer 묶음을 먼저 분리한다.
- 완료 내용: `LessonStepRenderer`와 step별 UI 컴포넌트를 `lesson-step-renderer.tsx`로 이동했다. `LessonExperience`는 현재 step 선택, 진행률, navigation, exit dialog, API callback 연결만 담당한다.
- 범위 제외: 저장 실패/재시도 정책 분리는 `FE-02`에서 별도로 다룬다.
- 검증: `bun --filter @workspace/web test src/features/lessons/lesson-experience.test.tsx && bun --filter @workspace/web test && bun --filter @workspace/web typecheck && bun --filter @workspace/web lint`

## FE-02 작업 메모

- 대상 파일: `apps/web/src/features/lessons/use-lesson-persistence.ts`, `apps/web/src/features/lessons/lesson-experience.tsx`
- 조사 방향: `LessonExperience` 안의 `saveLessonProgress`, `saveLessonAnswer`, `completeLesson` fire-and-forget 호출을 찾고, 화면 이동 정책과 저장 실패 처리 정책을 분리한다.
- 완료 내용: `useLessonPersistence()` hook을 추가해 best-effort 저장, 저장된 글쓰기 응답 상태, 실패 메시지 기록을 한 곳으로 모았다. `LessonExperience`는 저장 API를 직접 호출하지 않고 hook 명령을 호출하며, 저장 실패는 `role="alert"` 안내로 표시하되 현재 레슨 이동은 막지 않는다.
- 검증: `bun --filter @workspace/web test src/features/lessons/lesson-experience.test.tsx && bun --filter @workspace/web typecheck && bun --filter @workspace/web lint`

## TEST-01 작업 메모

- 대상 파일: `apps/*/vitest.config.ts`, `packages/*/vitest.config.ts`
- 조사 방향: 테스트 파일이 있는 패키지의 `passWithNoTests` 예외를 제거하고, 테스트가 아직 없는 패키지에만 이유를 주석으로 남긴다. `packages/core`, `packages/db`, `packages/env`에는 현재 상태를 기준으로 단계적 커버리지 하한을 둔다.
- 완료 내용: 테스트가 존재하는 admin-api, api, core, db, env, logger 설정에서 `passWithNoTests`를 제거했다. 자체 테스트가 아직 없는 UI 패키지만 주석과 함께 예외를 유지하고, 의미 없는 0% 커버리지 하한은 제거했다. core/env는 현재 측정값보다 낮은 단계적 하한을 추가했고, db는 Bun SQLite 테스트의 coverage 런타임 제약을 고려해 최소 하한부터 둔다.
- 검증: `bun --filter @workspace/admin-api test && bun --filter @workspace/api test && bun --filter @workspace/core test -- --coverage && bun --filter @workspace/env test -- --coverage && bun --filter @workspace/db test && bun --filter @workspace/logger test && bun --filter @workspace/ui test && bun --filter @workspace/core lint && bun --filter @workspace/db lint && bun --filter @workspace/env lint && bun --filter @workspace/ui lint`
- 참고: `bun --filter @workspace/db test -- --coverage`는 현재 `bun --bun` 런타임에서 V8 coverage API를 사용할 수 없어 실패한다. `bun test`는 변경과 무관한 전체 실행에서 출력 없이 장시간 정지해 프로세스를 종료했다.

## ADMIN-05 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`, `apps/admin/src/features/courses/course-editor/use-course-editor-save-command.ts`, `apps/admin/src/features/courses/course-editor/course-editor-panel.tsx`
- 조사 방향: 저장 훅이 문자열 상태를 만들고 toast가 `includes()`로 오류 여부를 추론하는 흐름을 확인했다. 상태 자체가 성공/오류 의미를 갖도록 `{ kind; message }` 형태로 바꾼다.
- 완료 내용: `CourseEditorStatus` 타입을 추가하고 저장 성공/실패가 각각 `success`와 `error` 상태를 직접 만들도록 했다. Toast는 문자열 검색을 제거하고 `status.kind`로 스타일, 아이콘, 접근성 role을 결정한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/course-editor-shell.test.tsx src/features/courses/course-editor/course-editor-session-hooks.test.tsx && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin lint`

## ADMIN-06 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`, `apps/admin/src/features/courses/course-editor/course-editor-panel.tsx`
- 조사 방향: 챕터/레슨/스텝 보관 command가 `window.confirm()`을 직접 호출하는 흐름을 확인하고, 기존 UI 패키지의 `AlertDialog` 컴포넌트를 화면 계층에서 사용할 수 있는지 확인한다.
- 완료 내용: 보관 command는 `archiveRequest`만 설정하고, `CourseEditorArchiveDialog`가 취소/확인을 처리하도록 분리했다. 확인 시 `confirmArchive()`가 보관 상태를 적용하며, 브라우저 confirm 의존성은 제거했다.
- 검증: `bun --filter @workspace/admin test src/features/courses/admin-course-detail-page.test.tsx src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin lint`

## ARCH-03 작업 메모

- 대상 파일: `CONTEXT.md`, `GLOSSARY.md`, `FRONTEND.md`, `apps/web/README.md`
- 조사 방향: 비어 있는 루트 문서와 “empty workspace”로 남아 있는 웹 README, 영문 중심의 프론트엔드 가이드가 현재 라우트와 문서 언어 정책에 맞지 않는 지점을 확인한다.
- 완료 내용: `CONTEXT.md`에 제품 목표와 런타임 경계를 추가하고, `GLOSSARY.md`에 핵심 도메인/아키텍처 용어를 정의했다. `apps/web/README.md`는 실제 App Router 라우트와 feature 구조 기준으로 갱신했고, `FRONTEND.md`는 현재 구현 기준의 한국어 프론트엔드 가이드로 정리했다.
- 검증: `bun prettier --check CONTEXT.md GLOSSARY.md FRONTEND.md apps/web/README.md docs/codebase-improvement-progress.md && bun lefthook run pre-commit`

## ARCH-04 작업 메모

- 대상 파일: `package.json`, `.gitignore`
- 조사 방향: 기존 `repomix` 명령이 `docs`, `packages/config`, `scripts`, `apps/storybook`을 모두 제외하는 단일 코드 중심 합본만 생성하는 지점을 확인한다. 품질 게이트와 아키텍처 리뷰에 필요한 문서, 공통 설정, lint-staged 스크립트, Storybook 설정을 포함하는 별도 프로필을 추가한다.
- 완료 내용: 기존 `repomix`는 `repomix:code` 별칭으로 유지하고, `repomix:analysis`를 추가해 루트 설계 문서, `docs/*.md`, OpenAPI 정적 계약, `packages/config`, `scripts`, Storybook 설정과 stories를 포함한다. 생성 산출물인 `codebase.md`, `codebase-analysis.md`는 `.gitignore`에 추가했다.
- 검증: `bun run repomix:code -- --no-files --top-files-len 5 && bun run repomix:analysis -- --no-files --token-count-tree 1 --top-files-len 10 && bun run repomix:analysis && rg -n "^## File: (docs/|packages/config/|scripts/|apps/storybook/)" codebase-analysis.md && rg -n "^## File: (prototype/|\\.worktrees/|docs/superpowers/|apps/storybook/dist/|apps/storybook/\\.turbo/|combined-codebase-improvements\\.md|codebase\\.md|codebase-analysis\\.md)" codebase-analysis.md codebase.md`

## ARCH-05 작업 메모

- 대상 파일: `apps/web/src/env.ts`, `apps/admin/src/env.ts`, 앱별 API 생성/인증 프록시 호출부
- 조사 방향: `WEB_API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `ADMIN_API_BASE_URL`의 로컬 기본값이 API client와 auth proxy, 어드민 코스 상세 page/client 경계에 흩어진 지점을 확인한다. 기존 `@workspace/env`와 Zod 기반 raw env parse 패턴을 웹/어드민 앱에도 적용한다.
- 완료 내용: `parseWebEnv()`와 `parseAdminWebEnv()`를 추가해 로컬 API 기본값을 앱 env 계층으로 모았다. 웹/어드민 API client와 auth proxy는 파싱된 env 값을 사용하고, 어드민 코스 상세 client는 서버가 넘긴 `adminApiBaseUrl`만 사용한다.
- 검증: `bun --filter @workspace/web test src/env.test.ts src/lib/api/get-server-writing-app-api.test.ts src/lib/api/get-browser-writing-app-api.test.ts && bun --filter @workspace/admin test src/env.test.ts src/features/courses/admin-course-detail-page.test.tsx && bun --filter @workspace/web typecheck && bun --filter @workspace/admin typecheck && bun --filter @workspace/web lint && bun --filter @workspace/admin lint`

## CODE-02 작업 메모

- 대상 파일: `packages/ui/src/hooks/use-mobile.ts`, `apps/web/src/features/lessons/lesson-data.ts`
- 조사 방향: 디자인 시스템 규칙과 레슨 생성 규칙을 실제 변경 가능한 상수로 분리하고, 단순 콘텐츠/픽스처 숫자는 데이터 의미를 유지한다.
- 완료 내용: UI mobile breakpoint를 UI config 상수로 옮겼고, 레슨 생성의 step frame, default points, reflection points, 글자 수 제한, AI score range, 예상 시간 규칙을 인접 도메인 상수로 분리했다. 코스 카드의 `lessonCount`는 상세 레슨 데이터에서 파생해 중복 입력을 제거했다.
- 검증: `bun --filter @workspace/web test && bun --filter @workspace/ui test && bun --filter @workspace/web typecheck && bun --filter @workspace/ui typecheck && bun --filter @workspace/web lint && bun --filter @workspace/ui lint && bun prettier --check packages/ui/package.json packages/ui/src/config/breakpoints.ts packages/ui/src/hooks/use-mobile.ts apps/web/src/features/courses/course-data.ts apps/web/src/features/lessons/lesson-generation-rules.ts apps/web/src/features/lessons/lesson-data.ts apps/web/src/lib/api/fake/create-fake-writing-app-api.ts docs/codebase-improvement-progress.md`

## DATA-07 작업 메모

- 대상 파일: `apps/admin-api/src/scripts/seed-admin.ts`, `apps/admin-api/src/scripts/seed-admin-user.ts`, `apps/admin-api/vitest.config.ts`
- 조사 방향: Bun 전용 DB runtime import와 테스트 가능한 seed 로직을 분리하고, Vitest의 native module 처리 정책을 명시한다.
- 완료 내용: `seedAdminUser`의 순수 정책을 별도 모듈로 옮기고, 실행 스크립트는 `bun:sqlite`와 DB client/migration을 정적으로 import한다. 실제 Drizzle DB는 좁은 `AdminSeedDatabase` 포트로 연결하고, Vitest 설정에는 `bun:sqlite` 외부화를 명시했다.
- 검증: `bun --filter @workspace/admin-api typecheck && bun --filter @workspace/admin-api test && bun --filter @workspace/admin-api lint && bun --filter @workspace/admin-api seed:admin`

## DATA-08 작업 메모

- 대상 파일: `packages/core/src/result.ts`, `packages/core/src/content/content.service.ts`, `packages/core/src/learning/learning.service.ts`, `packages/core/src/admin/admin.service.ts`
- 조사 방향: 서비스별 error DTO 조합은 유지하고, `ok`, `not-found`, `invalid-request`, `invalid-content`, `unavailable`, `conflict` result 껍데기만 공통 building block으로 분리한다.
- 완료 내용: `packages/core/src/result.ts`에 공통 result building block을 추가하고, content/learning/admin 서비스는 도메인별 error DTO union만 조합하도록 정리했다. AI feedback 서비스는 전용 status가 많아 이번 관련 위치 범위에서는 제외했다.
- 검증: `bun --filter @workspace/core typecheck && bun --filter @workspace/core test && bun --filter @workspace/core lint`

## DATA-09 작업 메모

- 대상 파일: `packages/core/src/content/content.repository.ts`, `packages/core/src/content/content.service.ts`, `packages/db/src/repositories/drizzle-content.repository.ts`
- 조사 방향: content repository 포트는 raw 데이터를 반환하고, service가 DTO schema parse와 플레이 가능 레슨 불변식 검증을 담당하는 단일 검증 경계로 둔다.
- 완료 내용: `ContentRepository` 반환 타입을 raw/unknown 중심으로 낮추고, content service의 임시 값도 parse 전에는 DTO로 신뢰하지 않게 했다. Drizzle repository 테스트는 필요한 지점에서 schema parse 후 구조를 검증한다.
- 검증: `bun --filter @workspace/core test src/content/content.service.test.ts && bun --filter @workspace/db test src/repositories/drizzle-content.repository.test.ts && bun --filter @workspace/core typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/core lint && bun --filter @workspace/db lint`

## DATA-10 작업 메모

- 대상 파일: `packages/core/src/learning/learning.service.ts`
- 조사 방향: `listProgress`의 summary 변환에서 완료 수, 다음 레슨, 표시 상태 계산이 여러 순회와 mutation에 흩어진 지점을 확인한다.
- 완료 내용: progress summary lesson 변환을 단일 루프로 정리하고, 다음 레슨 표시를 변환 후 객체 mutation으로 보정하지 않게 했다. 모든 레슨 완료와 빈 레슨 목록 케이스도 명시적으로 검증했다.
- 검증: `bun --filter @workspace/core test src/learning/learning.service.test.ts && bun --filter @workspace/core typecheck && bun --filter @workspace/core lint`

## 다음 단계

다음 작업은 P2의 `DOMAIN-03`을 문서 순서대로 진행한다.
