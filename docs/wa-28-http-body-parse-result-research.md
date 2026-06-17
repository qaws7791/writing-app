# WA-28 HTTP Body 파싱 오류 처리 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-28 `불안전한 HTTP Body 파싱`
- 조사 범위: `apps/api/src/routes/route-helpers.ts`, learning/AI feedback routes, admin-api mutation routes, API error response 계약과 테스트

## 이슈 요약

WA-28은 `apps/api/src/routes/route-helpers.ts`의 `readJsonBody()`가 `context.req.json()` 실패를 넓은 `catch`로 잡고 원인을 무시한 채 단순 오류로 반환한다고 지적한다.

## 코드 조사

현재 `readJsonBody()`는 다음 result를 반환한다.

- `{ kind: "ok"; value }`
- `{ kind: "err"; error }`

즉 이슈 본문과 달리 caught `error`를 완전히 버리지는 않는다. `apps/api/src/routes/route-helpers.test.ts`도 잘못된 JSON 본문에서 `SyntaxError`가 `err` 결과에 포함되는지 검증한다.

하지만 learning route와 AI feedback route는 `body.kind === "err"`일 때 모두 `errorResponse("invalid_request")`로 변환한다. 결과적으로 HTTP 응답과 route-level branch에서는 다음 실패가 모두 같은 400으로 접힌다.

- malformed JSON
- 비어 있는 body
- JSON은 맞지만 schema가 틀린 body
- Hono/body parser가 던지는 기타 예외

admin-api에는 더 직접적인 `await context.req.json().catch(() => null)` 패턴이 남아 있다. 예를 들어 사용자 상태 변경과 설정 저장 route는 JSON parse 실패를 `null`로 병합한 뒤 schema parse 실패와 같은 `invalid_request`로 처리한다.

## 판단

이슈는 타당하다. 다만 세부 설명은 현재 코드와 일부 다르다.

`readJsonBody()` 자체는 오류 원인을 `error` 필드에 보존하지만, 그 오류가 typed domain value로 분류되지 않고 route 호출부에서 모두 같은 `invalid_request`로 사라진다. 또한 admin-api는 여전히 parse error를 `null`로 병합한다. 따라서 body parsing 실패를 값으로 다루는 체계가 아직 충분하지 않다.

다만 `SyntaxError.message`를 그대로 클라이언트 응답에 포함하는 것은 신중해야 한다. 사용자에게는 안정적인 error code/detail을 주고, raw cause는 로그와 내부 event에 남기는 구조가 더 안전하다.

## 개선 방안

### 방안 1. JSON body parse result를 discriminated union으로 세분화한다

`readJsonBody()`의 err 결과를 `unknown error` 하나가 아니라 다음처럼 분류한다.

- `malformed-json`
- `empty-body`
- `unsupported-media-type`
- `body-too-large`
- `unknown-body-read-error`

각 variant는 내부 cause를 보존하되 HTTP 응답에는 안전한 code/detail만 노출한다.

### 방안 2. schema validation 실패와 body parse 실패를 분리한다

현재 route는 body parse 실패와 Zod schema 실패를 모두 `invalid_request`로 반환한다. API error 계약을 확장해 다음을 구분한다.

- `invalid_json`
- `invalid_body`
- `invalid_request`

또는 top-level code는 `invalid_request`로 유지하되 `detail.code`를 추가한다.

```ts
{ error: { code: "invalid_request", detail: { code: "malformed_json" } } }
```

장점은 클라이언트와 로그가 원인을 구분하고, 기존 error code 호환성도 유지할 수 있다.

### 방안 3. API와 Admin API가 공유하는 body parser helper를 만든다

학습자 API의 `readJsonBody()`와 admin-api의 `context.req.json().catch(() => null)` 패턴을 하나의 helper로 통합한다.

- body read
- content-type 확인
- JSON parse error 분류
- schema safeParse
- HTTP error mapping

장점은 두 API 앱의 오류 semantics가 같아지고, admin-api에 남아 있는 `catch(() => null)` 패턴이 제거된다.

### 방안 4. route는 parsing helper 결과를 HTTP로만 매핑한다

각 route는 다음 정도만 수행한다.

1. session 확인
2. `parseJsonBody(context, schema)` 호출
3. 실패 variant를 `jsonBodyErrorResponse()`로 변환
4. 성공 command를 service에 전달

이렇게 하면 route마다 `if (body.kind === "err")`, `schema.safeParse()`가 반복되지 않는다.

### 방안 5. 관측과 보안 정책을 분리한다

raw `SyntaxError`와 request URL/method는 logger나 request error reporter에 남기되, 클라이언트 응답에는 안정적인 한국어 메시지와 detail code만 반환한다. body 원문은 민감 정보가 포함될 수 있으므로 로깅하지 않는다.

## 권장 진행 순서

1. `JsonBodyParseError` union과 `parseJsonBody(context, schema)` helper를 API 공통 route helper에 추가한다.
2. learning/AI feedback route를 helper 기반으로 바꾼다.
3. admin-api에도 같은 helper 또는 같은 구조의 helper를 적용해 `catch(() => null)`을 제거한다.
4. error response 계약에 `detail.code`를 추가할지, 별도 error code를 추가할지 결정한다.
5. malformed JSON, empty body, schema invalid, unsupported content type 테스트를 API/Admin API에 추가한다.
6. OpenAPI error schema와 web/admin client error mapping을 갱신한다.

## 검증 계획

- `bun --filter @workspace/api test -- route-helpers learning.route ai-feedback.route`
- `bun --filter @workspace/admin-api test`
- `bun --filter @workspace/web test -- openapi-client`
- `bun --filter @workspace/admin test -- http-admin-api`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-28 본문을 읽고 API route helper, mutation route, admin-api body parsing 패턴, error response 계약과 테스트를 조사했다.
- `readJsonBody()`가 오류 객체를 이미 보존한다는 점은 확인했지만, 호출부와 admin-api에서 원인이 구조화되지 않는 문제는 타당하다고 판단했다.
- 개선 방향은 raw message 노출이 아니라 typed body parse result, shared parser helper, detail code, 관측/보안 분리로 정리했다.
- 학습자 API route helper에 `parseJsonBody()`와 JSON body 오류 detail 변환을 추가해 malformed JSON과 schema invalid를 분리했다.
- 학습자 learning/AI feedback 쓰기 라우트가 body parsing helper를 사용하도록 바꿨고, `invalid_request` 응답에는 안전한 `error.detail.code`를 붙였다.
- 관리자 API route helper에도 같은 구조의 parser를 추가하고, 사용자 상태 변경과 운영 설정 저장에서 `context.req.json().catch(() => null)` 패턴을 제거했다.
- error response 타입과 학습자 OpenAPI 문서에 선택적 `error.detail.code` 계약을 반영했다.
- malformed JSON과 invalid body 회귀 테스트를 API/Admin API 라우트에 추가했다.
