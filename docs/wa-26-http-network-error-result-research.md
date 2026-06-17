# WA-26 HTTP 네트워크 오류 값 처리 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-26 `에러를 값으로 처리하지 않고 Null 병합`
- 조사 범위: `apps/web/src/lib/api/http/openapi-client.ts`, `apps/admin/src/lib/api/http-admin-api.ts`, web/admin API error/result 타입과 테스트

## 이슈 요약

WA-26은 `apps/web/src/lib/api/http/openapi-client.ts`의 `fetchJson()`이 `fetch` 예외를 잡은 뒤 `null`을 반환해 네트워크 오류 원인을 잃는다고 지적한다.

## 코드 조사

web OpenAPI client의 흐름은 다음과 같다.

1. `fetchJson(request, fetch, reportNetworkError)` 호출
2. `fetch` 예외 발생 시 `reportNetworkError?.({ error, request })` 호출
3. `null` 반환
4. 호출부가 `response === null`이면 `apiFailure(networkApiError())` 반환

따라서 web client는 원인을 reporter로는 전달하지만, 함수의 반환 타입에는 원인이 표현되지 않는다. 호출부는 DNS 오류, timeout, abort, CORS 실패를 모두 같은 `network-error`로만 본다.

admin HTTP client는 더 약하다.

```ts
const response = await fetch(request).catch(() => null)
```

여기서는 예외 원인을 reporter로도 남기지 않고 바로 `networkAdminApiError()`로 변환한다.

현재 `ApiError`와 `AdminApiError`에는 `code`, `message`, `status?`만 있고 network error cause나 category는 없다.

## 판단

이슈는 타당하다.

네트워크 오류를 사용자에게 항상 같은 메시지로 보여주는 것은 가능하지만, 내부 결과 타입에서 원인을 잃는 것은 관측성과 복구 전략을 제한한다. 특히 abort, timeout, DNS, TLS, CORS, offline 상태는 재시도, 사용자 안내, 로그 severity가 달라질 수 있다.

문제는 web client 한 함수만이 아니다. web/admin HTTP adapter가 서로 다른 방식으로 fetch 예외를 삼키고 있으며, API result 타입도 network 오류 원인을 표현할 공간이 없다. 이 구조에서는 화면과 로깅 계층이 원인별 정책을 만들기 어렵다.

## 개선 방안

### 방안 1. `fetchJson` 반환 타입을 `Result<Response, HttpNetworkError>`로 바꾼다

`Response | null` 대신 명시적 result variant를 사용한다.

```ts
type FetchResponseResult =
  | { readonly kind: "ok"; readonly response: Response }
  | { readonly kind: "network-error"; readonly error: HttpNetworkError }
```

`HttpNetworkError`는 최소한 `cause: unknown`, `requestUrl`, `method`를 가진다. 호출부는 이 값을 `ApiError`로 변환하되 원인을 버리지 않는다.

### 방안 2. network error cause를 API error 타입에 보존한다

`ApiError`와 `AdminApiError`의 network branch를 discriminated union으로 바꾼다.

```ts
type NetworkApiError = {
  readonly code: "network-error"
  readonly message: string
  readonly cause: unknown
  readonly method: string
  readonly url: string
}
```

UI가 cause를 직접 표시하지 않더라도 logger, telemetry, retry policy가 사용할 수 있다. 민감 정보가 URL에 포함될 수 있으므로 query redaction 정책도 함께 둔다.

### 방안 3. web/admin 공통 HTTP transport를 만든다

web OpenAPI client와 admin HTTP client가 각자 `fetch` 예외를 처리하지 않게 `requestTransport()` 같은 공통 helper를 둔다.

- request 생성
- fetch 실행
- network exception 분류
- response body parse
- contract error 분류
- network error reporting

장점은 web/admin의 오류 처리 semantics가 같아지고, `catch(() => null)` 같은 패턴이 재발하지 않는다.

### 방안 4. 네트워크 오류 분류 정책을 추가한다

브라우저 fetch는 많은 실패를 `TypeError`로 뭉개지만, 환경에 따라 `AbortError`, timeout wrapper, offline 상태를 분류할 수 있다.

- `aborted`
- `timeout`
- `offline`
- `fetch-failed`
- `unknown`

초기에는 `unknown` 중심으로 시작해도 `kind`를 열어두면 나중에 retry/backoff 정책을 붙일 수 있다.

### 방안 5. 테스트를 원인 보존 중심으로 바꾼다

현재 web test는 fetch 예외가 `network-error`로 변환되고 reporter가 호출되는지만 검증한다. 다음 케이스를 추가한다.

- 반환된 `ApiResult`의 network error에 cause가 보존된다.
- reporter와 반환값이 같은 원인 정보를 공유한다.
- admin HTTP client도 원인을 보존한다.
- abort/timeout 분류가 있으면 각각 다른 `kind`를 반환한다.
- UI는 사용자 메시지에 cause를 노출하지 않는다.

## 권장 진행 순서

1. `HttpNetworkError`와 fetch result union을 web client에 먼저 추가한다.
2. `ApiError`의 network branch가 cause, method, url을 보존하게 한다.
3. admin HTTP client도 같은 network error 타입과 transport helper를 사용한다.
4. 원인 보존 테스트를 web/admin client에 추가한다.
5. URL redaction과 network error reporting 정책을 문서화한다.

## 검증 계획

- `bun --filter @workspace/web test -- openapi-client create-http-writing-app-api`
- `bun --filter @workspace/admin test -- http-admin-api`
- `bun --filter @workspace/web test -- lesson-experience`
- `bun --filter @workspace/admin test`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-26 본문을 읽고 web/admin HTTP client의 fetch 예외 처리, API error/result 타입, 관련 테스트를 조사했다.
- 이슈는 타당하다고 판단했다.
- `@workspace/http-client` 패키지에 `fetchHttpResponse()`와 `HttpNetworkError` 계약을 추가했다.
- web OpenAPI client와 admin HTTP client에서 `Response | null`, `catch(() => null)` 경로를 제거했다.
- `ApiError`와 `AdminApiError`의 `network-error` branch가 원인, method, query가 제거된 URL, 실패 분류를 보존하게 했다.
- web reporter와 반환된 `ApiResult`가 같은 네트워크 실패 값을 공유하도록 고정했다.
- 공통 transport, web client, admin client 회귀 테스트로 네트워크 오류 원인 보존을 검증했다.
