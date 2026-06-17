# WA-22 요청 로거 런타임 의존성 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-22 `명시적이지 않은 UUID 및 시간 생성`
- 조사 범위: `packages/logger/src/hono-request-logger.ts`, `packages/logger/src/logger.test.ts`, `apps/api/src/app.ts`, `apps/admin-api/src/app.ts`, 관련 운영 문서

## 이슈 요약

WA-22는 `packages/logger/src/hono-request-logger.ts`의 request logging middleware가 `crypto.randomUUID()`와 `performance.now()`를 직접 사용해 테스트 가능성과 결정성을 해친다고 지적한다.

## 코드 조사

`createRequestLoggingMiddleware()`는 현재 다음 옵션을 받는다.

- `logRequest`
- `createRequestId?`

따라서 request id 생성은 일부 주입 가능하다. 그러나 시간 측정은 middleware 내부에서 `performance.now()`를 두 번 직접 호출한다.

```ts
const startedAt = performance.now()
...
durationMs: Math.max(0, Math.round(performance.now() - startedAt))
```

기본 request id 생성은 private `createDefaultRequestId()`에서 `crypto.randomUUID()`를 직접 호출한다. `createRequestLoggingMiddleware()` 자체를 검증하는 테스트는 별도로 보이지 않고, `packages/logger/src/logger.test.ts`는 pino logger와 request log helper만 테스트한다.

반면 `apps/api/src/app.ts`와 `apps/admin-api/src/app.ts`는 route dependency로 `now?: () => Date`를 받고 각 route에 전달한다. 즉 비즈니스 시간은 이미 composition root에서 주입하는 방향을 갖고 있지만, 관측 middleware의 monotonic clock은 같은 정책을 따르지 않는다.

## 판단

이슈는 타당하다.

단, request id는 이미 `createRequestId` 옵션으로 일부 개선되어 있으므로 문제의 핵심은 ID만이 아니라 runtime capability가 middleware 내부에 숨는 구조다. 특히 `performance.now()`가 고정되어 있으면 duration 계산을 deterministic하게 테스트하기 어렵고, clock이 역전되거나 환경별 API 차이가 있을 때 대응 지점이 없다.

로깅은 운영 관측의 기반이므로 request id, monotonic time, wall-clock timestamp 정책이 흩어지면 API 앱과 Admin API 앱의 로그 품질이 다르게 흔들릴 수 있다.

## 개선 방안

### 방안 1. request logging middleware 옵션을 runtime capability로 확장한다

`RequestLoggingMiddlewareOptions`에 다음 의존성을 명시한다.

- `createRequestId?: () => string`
- `readMonotonicTimeMs?: () => number`

기본값은 `crypto.randomUUID()`와 `performance.now()`를 사용하는 production adapter로 둔다. 테스트에서는 `readMonotonicTimeMs`가 `100`, `112.4`처럼 순차 값을 반환하게 만들어 `durationMs`를 안정적으로 검증한다.

장점은 기존 호출부 변경을 최소화하면서도 runtime dependency가 명시된다. 단점은 옵션 이름과 기본 adapter의 정책을 문서화해야 한다.

### 방안 2. logger 패키지에 `RequestRuntime` 또는 `ObservabilityRuntime` 타입을 둔다

ID와 시간 의존성을 개별 옵션으로 흩뿌리는 대신 다음 타입으로 묶는다.

```ts
type RequestLoggingRuntime = {
  readonly createRequestId: () => string
  readonly readMonotonicTimeMs: () => number
}
```

`createDefaultRequestLoggingRuntime()`을 제공하고, middleware는 runtime을 통해서만 ID와 시간을 읽는다. 장점은 향후 trace id, span id, sampling clock 같은 관측 의존성을 추가할 때 options가 무질서하게 늘지 않는다.

### 방안 3. API 앱 조립 루트에서 관측 runtime을 주입한다

`apps/api/src/app.ts`와 `apps/admin-api/src/app.ts`의 dependency type에 request logging runtime을 추가한다. production `main.ts`는 default runtime을 주입하고, app test는 고정 request id와 고정 monotonic time을 주입한다.

장점은 앱 조립 루트가 외부 세계와의 접점이라는 원칙이 로깅에도 적용된다. 단점은 app dependency type이 조금 커지므로 route용 `now`와 middleware용 monotonic clock의 역할을 이름으로 분명히 구분해야 한다.

### 방안 4. request logging middleware 전용 테스트를 추가한다

현재 logger test는 `createRequestLogger()`가 event를 pino에 넘기는지만 확인한다. 별도로 Hono app에 middleware를 붙여 다음을 검증한다.

- `x-request-id` header가 없으면 주입된 ID generator를 사용한다.
- `x-request-id` header가 있으면 기존 값을 보존한다.
- 응답에도 `x-request-id`가 기록된다.
- duration은 주입된 monotonic clock 차이로 계산된다.
- route가 예외를 던져도 `finally`에서 완료 로그가 남는다.

장점은 관측 경계의 회귀를 기능적으로 잡는다.

### 방안 5. 관측 의존성 문서를 추가한다

`docs/operations-environment.md` 또는 API 운영 문서에 다음 정책을 기록한다.

- request id는 외부 header를 우선하고 없으면 runtime generator가 만든다.
- duration은 wall clock이 아니라 monotonic clock으로 계산한다.
- 테스트는 clock과 ID generator를 주입해 deterministic하게 검증한다.
- logger package는 process-level 전역을 직접 읽는 대신 default adapter를 통해 읽는다.

장점은 새 middleware나 batch logger가 추가될 때 같은 원칙을 재사용할 수 있다.

## 권장 진행 순서

1. `RequestLoggingRuntime` 타입과 default runtime factory를 `packages/logger`에 추가한다.
2. `createRequestLoggingMiddleware()`가 runtime을 옵션으로 받게 한다.
3. middleware 전용 테스트를 추가해 request id, response header, duration, 예외 시 logging을 검증한다.
4. API 앱과 Admin API 앱의 composition root에서 runtime 주입 정책을 정한다.
5. 운영 문서에 request id와 duration 측정 원칙을 기록한다.

## 검증 계획

- `bun --filter @workspace/logger test`
- `bun --filter @workspace/api test`
- `bun --filter @workspace/admin-api test`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-22 본문을 읽고 logger middleware, logger 테스트, API 앱 조립 루트의 시간 주입 패턴을 조사했다.
- 이슈는 타당하다고 판단했다.
- 개선 방향은 단순 mock 옵션 추가가 아니라 관측 runtime 명시화, middleware 기능 테스트, 앱 조립 루트 주입, 운영 문서화로 정리했다.
- `RequestLoggingRuntime`과 `defaultRequestLoggingRuntime`을 logger 패키지에 추가했다.
- `createRequestLoggingMiddleware()`는 request id generator와 monotonic clock reader를 옵션으로 받으며, 기본값은 default runtime adapter를 사용한다.
- 학습자 API와 어드민 API 조립 루트는 request logging runtime dependency를 받을 수 있고, production main은 default runtime을 명시적으로 주입한다.
- Hono middleware 테스트를 추가해 기존 `x-request-id` 보존, 새 request id 생성, response header 설정, duration 계산, 예외 발생 시 finally logging을 검증했다.

## 검증 결과

- `bun --filter @workspace/logger test src/hono-request-logger.test.ts src/logger.test.ts`
- `bun --filter @workspace/logger typecheck`
- `bun --filter @workspace/logger lint`
- `bun --filter @workspace/api test src/app.test.ts`
- `bun --filter @workspace/admin-api test src/app.test.ts`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/api lint`
- `bun --filter @workspace/admin-api lint`
