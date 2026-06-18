# @workspace/hono

OpenAPI 우선 route 등록과 `code`/`message`/`errors` 기반 JSON 에러 응답을 표준화하는 내부 Hono 패키지입니다.

이 패키지는 request/response helper를 의도적으로 제공하지 않습니다. `request`와 `responses`는 `@hono/zod-openapi`의 원본 route config 구조를 그대로 사용합니다.

타입 추론을 명확히 보존해야 하는 route에서는 route config를 먼저 `as const`로 선언하고, handler를 `RouteHandler<typeof routeConfig>`로 묶은 뒤 `defineRoute()`에 전달합니다.
