# 저품질 코드 개선 기록

## 2026-06-16 작업 시작

- 범위: 식별된 8개 저품질 코드 항목과 같은 종류의 인접 문제를 순차적으로 개선한다.
- 원칙: 기존 공개 응답 형태는 유지하고, 실패 원인을 숨기던 경계에는 관찰 가능한 원인 정보를 남긴다.
- 검증: 각 항목마다 가장 가까운 테스트를 먼저 추가하거나 보강한 뒤 관련 패키지 테스트를 실행한다.

## Finding #1 완료: OpenAPI 클라이언트 네트워크 실패 관찰성

- `createOpenApiClient`가 `fetch` 예외를 무조건 `null`로 삼키지 않고 `reportNetworkError` 훅에 원인 예외와 요청 정보를 전달하도록 변경했다.
- 호출자에게 반환되는 `ApiResult` 형태는 기존과 동일하게 `network-error`를 유지했다.
- 검증: `bun --filter @workspace/web test src/lib/api/http/openapi-client.test.ts`
- 참고: 기존 `create-http-writing-app-api.test.ts`는 현재 Vite가 `@workspace/core/content`를 해석하지 못해 테스트 파일 로딩 단계에서 실패했다.

## Finding #2 완료: 레슨 스텝 콘텐츠 렌더러 레지스트리화

- `renderStepContent`의 타입별 `switch`를 `stepContentRendererByType` 레지스트리로 바꾸고, `satisfies`로 모든 `LessonStep["type"]` 매핑을 컴파일 단계에서 요구하도록 변경했다.
- 기존 스텝 UI 컴포넌트의 동작은 유지하고, 비교 스텝 JSX만 `CompareStepView`로 분리했다.
- 검증: `bun --filter @workspace/web test src/features/lessons/lesson-step-renderer.test.tsx`
- 참고: `bun --filter @workspace/web typecheck`는 현재 `@workspace/core/content`, `@workspace/core/ai-feedback` 해석 실패로 중단된다.

## Finding #3 완료: 코스 편집 조회의 메모리 중첩 필터 제거

- `readCourseEditor`가 전체 `courseUnits`, `lessons`, `lessonSteps` 테이블을 읽은 뒤 필터링하지 않고, 활성 코스의 하위 행만 `where`, `inArray`, `orderBy`로 조회하도록 변경했다.
- 레슨과 스텝은 부모 ID별 `Map`으로 한 번만 그룹화해 트리를 조립한다.
- 검증: `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`

## Finding #4 완료: Google OAuth 외부 요청 타임아웃

- Google token 교환과 userinfo 조회 요청에 기본 5초 `AbortSignal.timeout`을 적용했다.
- 운영 환경별 조정이 가능하도록 `GoogleOAuthRouteOptions.externalRequestTimeoutMs`를 추가했다.
- 외부 요청이 타임아웃 또는 네트워크 오류로 실패하면 기존처럼 `null` 결과를 통해 502 응답으로 이어지게 유지했다.
- 검증: `bun --filter @workspace/api test src/routes/google-oauth.route.test.ts`
- 참고: `bun --filter @workspace/api typecheck`는 현재 `packages/logger`의 `hono` 타입 해석 실패로 중단된다.

## Finding #5 완료: JSON 본문 파싱 실패 원인 보존

- `readJsonBody`의 `err` 결과에 caught `error`를 포함해 잘못된 JSON 페이로드의 실패 원인을 호출자가 관찰할 수 있게 했다.
- 기존 라우트의 `kind === "err"` 분기와 HTTP 응답 형태는 유지했다.
- 검증: `bun --filter @workspace/api test src/routes/route-helpers.test.ts`
- 검증: `bun --filter @workspace/api test src/routes/learning.route.test.ts src/routes/ai-feedback.route.test.ts`

## Finding #6 완료: 어드민 repository 팩터리 책임 분리

- `createDrizzleAdminRepository`가 모든 도메인 메서드를 한 객체 리터럴에 직접 나열하지 않고, course, user, analytics, settings 조각을 합성하도록 변경했다.
- 공개 `AdminRepository` 계약과 개별 DB 함수 구현은 유지해 호출부 영향 없이 생성 책임만 분리했다.
- 검증: `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`

## Finding #7 완료: 스텝 contentJson 객체 검증 강화

- `readStepContent`가 배열이나 원시 JSON 값을 정상 객체처럼 넘기지 않고 예외를 던지도록 변경했다.
- 예외 메시지에 `step.id`를 포함해 손상된 데이터 위치를 추적할 수 있게 했다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/step-form-registry.test.tsx`
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/course-editor-shell.test.tsx`

## Finding #8 완료: Bearer 세션 해석 공통 경계

- `@workspace/core/auth`에 `readBearerToken`, `resolveBearerSession`을 추가해 learner API와 admin API가 동일한 토큰 해석 흐름을 공유하도록 변경했다.
- learner 계정 상태 확인과 admin owner 권한 확인은 각 API의 도메인 helper에 남겨 책임 경계를 유지했다.
- 검증: `bun --filter @workspace/core test src/auth/bearer-session.test.ts`
- 검증: `bun --filter @workspace/api test src/routes/route-helpers.test.ts src/routes/auth.route.test.ts src/routes/courses.route.test.ts src/routes/lessons.route.test.ts`
- 검증: `bun --filter @workspace/admin-api test src/app.test.ts src/routes/courses.route.test.ts src/routes/settings.route.test.ts`
- 검증: `bun --filter @workspace/core typecheck`

## 2026-06-16 typecheck 문제 해결 시작

- `@workspace/web` typecheck는 `@workspace/core/content`, `@workspace/core/ai-feedback` 모듈 해석 실패로 중단된다.
- `@workspace/api` typecheck는 `@workspace/logger` 소스의 `hono` 타입 해석 실패로 중단된다.
- 우선 manifest와 설치 배치를 확인해 실제 의존성 누락과 로컬 설치 상태 문제를 분리한다.

## 2026-06-16 typecheck 문제 해결 완료

- `apps/web/package.json`에 실제 import 대상인 `@workspace/core` 의존성을 추가했다.
- `bun install`로 lockfile과 workspace node_modules 배치를 갱신해 `@workspace/logger`의 `hono` 타입 해석도 정상화했다.
- 루트 typecheck에서 추가로 발견된 `packages/db/src/seeds/seed.test.ts`의 미정의 `tempDirectory` 정리 오타를 수정했다.
- Windows sqlite 파일 잠금에 대응하도록 data 하위 테스트 DB 파일 정리를 `Bun.gc(true)`와 `rmSync` retry helper로 통일했다.
- 검증: `bun --filter @workspace/web typecheck`
- 검증: `bun --filter @workspace/api typecheck`
- 검증: `bun --filter @workspace/db typecheck`
- 검증: `bun --filter @workspace/db test src/seeds/seed.test.ts`
- 검증: `bun typecheck`
