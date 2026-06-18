# Hono 패키지 이관

## 작업 시작 기록

- `workspace-hono/설계문서.md`의 결정에 따라 내부 Hono 표준 패키지를 현재 모노레포로 이관한다.
- 현재 저장소는 Bun 워크스페이스가 `packages/*`를 사용하므로 패키지 위치는 `packages/hono`로 둔다.
- pnpm catalog 전제는 사용하지 않고 기존 패키지처럼 `package.json`에서 명시 버전을 관리한다.
- 검증은 패키지 단위 Vitest, TypeScript typecheck, lint를 우선 실행한다.

## 완료 기록

- `@workspace/hono` 패키지를 `packages/hono`에 추가했다.
- 공개 entrypoint는 설계 문서의 결정대로 `@workspace/hono/core`, `@workspace/hono/errors`, `@workspace/hono/zod`만 제공한다.
- `createApp()`은 전역 middleware, route 등록, validation error hook, 404 handler, error handler를 고정 순서로 설치한다.
- `defineRoute()`는 OpenAPI path 문법을 검사하고 Hono-style `:id` path를 config error로 거부한다.
- `defineRouteForEnv<E>()`는 앱별 Hono Env를 고정하면서 route별 `c.req.valid()` 타입 추론을 보존한다.
- 에러 응답은 `AppError`, `HTTPException`, validation error, 404, 예상하지 못한 error를 `code`/`message`/`errors` 구조로 표준화한다.
- 앱별 Env를 쓰는 route는 `defineRouteForEnv<E>()`로 route를 정의하고, 복잡한 handler 타입은 route config를 먼저 선언한 뒤 `RouteHandler<typeof routeConfig, E>`로 묶어 사용한다.
- 원본 이관 디렉터리인 `workspace-hono/`는 `packages/hono`로 옮긴 뒤 정리했다.

## 검증

- `bun --filter @workspace/hono lint`
- `bun --filter @workspace/hono typecheck`
- `bun --filter @workspace/hono test`
- `bun run test --filter=@workspace/hono`
- `bun run lint`
- `bun run typecheck --filter=@workspace/hono`
- `bun run format:check`
