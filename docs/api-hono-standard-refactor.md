# API Hono 표준 패키지 리팩토링

## 작업 시작 기록

- `apps/api`를 `@workspace/hono` 기반의 OpenAPI route 배열 구조로 재구성한다.
- 성공 응답 endpoint와 body는 유지하고, 에러 응답은 `{ code, message, errors? }` 표준 계약으로 전환한다.
- `packages/core`는 전체 구조를 옮기지 않고 `@workspace/core/modules/*` facade만 추가한다.
- `apps/api`의 Hono module은 HTTP surface adapter로 제한하고, core 호출과 response 변환만 담당하게 한다.
- 작업 완료 시 테스트, 타입체크, lint, OpenAPI 생성 결과를 기록한다.

## 완료 기록

- `@workspace/hono/core`의 `createApp({ middleware, routes })`가 전역 middleware를 route 등록 전에 순서대로 설치하도록 확장했다.
- `defineRouteForEnv<E>()`를 추가해 `apps/api`가 `ApiHonoEnv`를 고정하면서도 `c.req.valid("json" | "param")`와 `c.var` 타입을 함께 사용할 수 있게 했다.
- `packages/core`에는 `@workspace/core/modules/auth`, `content`, `learning`, `ai-feedback`, `learner-api` facade를 추가했다. 이번 변경은 re-export에 한정하고 core 내부 모듈 재배치는 하지 않았다.
- `apps/api`는 `config`, `context`, `http`, `middleware`, `modules`, `routes`, `errors` 구조로 재구성했다.
- OpenAPI route는 `routes/index.ts`의 `as const` 배열에서 조립하고, Better Auth raw proxy는 `modules/auth`에 두되 OpenAPI route 배열에는 포함하지 않았다.
- 보호 route 인증은 route-level `requireActiveSession` middleware에서 처리하며, Hono `Context`의 `requestContext`와 `activeSession`을 request-scoped dependency로 사용한다.
- API 에러 응답은 `{ code, message, errors? }`로 표준화했다. transport validation 실패는 `VALIDATION_FAILED`, malformed JSON은 `HTTP_EXCEPTION`, core Result error는 `mapCoreError()`에서 `INVALID_REQUEST`, `NOT_FOUND`, `ATTEMPT_LIMIT_EXCEEDED`, `PROVIDER_UNAVAILABLE`로 변환한다.
- `apps/web`의 API error parser는 새 서버 에러 코드를 기존 화면용 kebab-case 코드로 변환한다.
- `docs/openapi/writing-app-api.json`와 `apps/web/src/lib/api/generated/writing-app-api.d.ts`를 새 에러 schema 기준으로 재생성했다.

## 검증 기록

- `bun --filter @workspace/hono test`
- `bun --filter @workspace/hono typecheck`
- `bun --filter @workspace/hono lint`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/api test`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/api lint`
- `bun --filter @workspace/api openapi:generate`
- `bun --filter @workspace/web api:generate`
- `bun --filter @workspace/web test`
- `bun --filter @workspace/web typecheck`
