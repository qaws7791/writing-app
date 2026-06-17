# WA-19 Bearer 토큰 파싱 경계 분석

## 2026-06-17 시작

- Notion 이슈: `WA-19 런타임 검증을 우회하는 문자열 파싱`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-19 페이지
- 조사 범위: `packages/core/src/auth/bearer-session.ts`, 관련 테스트, API/admin 테스트 fake의 Authorization 파싱, 기존 Bearer 경계 문서
- 목표: `readBearerToken()`의 문자열 파싱이 실제 인증 경계 위험을 만드는지 판단하고, learner/admin API가 같은 검증 규칙을 쓰도록 개선 방향을 도출한다.

## 2026-06-17 구현 시작

- 선택한 방향: Bearer header 문법을 core parser에서 명시하고, API/admin 테스트 fake도 같은 parser를 사용하게 한다.
- 허용 정책: scheme은 `Bearer`를 대소문자 무관하게 허용하고, scheme 뒤 공백은 하나 이상 허용한다.
- 거절 정책: token은 공백 없는 한 덩어리만 허용하며, 빈 token, 다른 scheme, 추가 segment가 있는 header는 거절한다.

## 이슈 요약

WA-19는 `readBearerToken()`이 `authorizationHeader.split(" ")`로 scheme과 token을 분리해 공백 변형이나 다른 포맷에서 잘못된 토큰을 추출할 수 있다고 지적한다.

## 코드 조사

현재 구현은 다음과 같다.

```ts
const [scheme, token] = authorizationHeader.split(" ")

if (scheme !== "Bearer" || token === undefined || token.length === 0) {
  return null
}

return token
```

현재 테스트는 아래 정도만 검증한다.

- `Bearer session-token`은 통과
- `Basic session-token`은 거절
- `null`은 거절

검증되지 않는 케이스:

- `Bearer    session-token`
- `bearer session-token`
- `Bearer session-token extra`
- `Bearer\t session-token`
- 앞뒤 공백
- 빈 token

또한 여러 API/admin 테스트 fake는 `headers.get("Authorization")?.replace(/^Bearer /, "")`를 직접 사용한다. 따라서 공통 parser의 실제 동작과 테스트 fake의 token 추출 규칙이 달라질 수 있다.

## 판단

WA-19는 타당하다. 현재 parser는 배열 인덱싱 오류를 직접 던지지는 않지만, 인증 경계에서 허용/거절할 header 문법을 명확하게 표현하지 못한다.

특히 `Bearer token extra`를 `token`으로 해석할 수 있고, scheme 대소문자 처리는 HTTP 인증 scheme 관례와 맞지 않는다. 인증 경계는 관대함과 엄격함의 기준이 코드에서 드러나야 하며, learner/admin API와 테스트 fake가 같은 parser를 써야 한다.

## 해결 방안

### 방안 1. strict parser를 정규식으로 구현한다

`/^Bearer\s+([^\s]+)$/i`처럼 인증 scheme은 대소문자를 허용하고, token은 공백 없는 한 덩어리만 허용한다.

정책:

- `Bearer session-token`: 허용
- `bearer session-token`: 허용
- `Bearer    session-token`: 허용할지 거절할지 명시
- `Bearer session-token extra`: 거절
- `Bearer`: 거절
- `Basic token`: 거절

장점은 인증 header 문법이 한 줄로 명확하게 드러난다는 점이다.

추천 강도: 높음.

### 방안 2. parser 결과를 explicit result로 바꾼다

현재 `readBearerToken()`은 실패 원인을 모두 `null`로 접는다. 내부 테스트와 로그를 위해 다음처럼 실패 이유를 나눌 수 있다.

```ts
type BearerTokenParseResult =
  | { readonly kind: "ok"; readonly token: string }
  | {
      readonly kind: "err"
      readonly reason: "missing" | "invalid-scheme" | "invalid-format"
    }
```

외부 HTTP 응답은 계속 401 하나로 접어도, 내부 테스트와 관찰성은 좋아진다.

추천 강도: 중간 이상.

### 방안 3. learner/admin 테스트 fake도 공통 parser를 사용하게 한다

현재 여러 테스트 helper가 `replace(/^Bearer /, "")`로 token을 직접 뽑는다. 이 중복을 제거하고 `@workspace/core/auth`의 parser를 사용하게 한다.

장점은 production parser와 테스트 parser가 어긋나는 일을 막는다. 인증 경계 회귀 테스트도 한 곳에서 관리할 수 있다.

추천 강도: 높음.

### 방안 4. Bearer 경계 정책 문서를 최신화한다

`docs/linear-lol-30-bearer-session-token-boundary.md`는 세션 토큰만 인증에 사용한다는 정책을 기록한다. 여기에 Authorization header 문법 정책을 추가한다.

포함할 내용:

- 지원하는 scheme
- 공백 처리
- token 내부 공백 허용 여부
- malformed header의 실패 결과
- 테스트 fake도 공통 parser를 사용한다는 규칙

추천 강도: 중간.

## 권장 순서

1. `readBearerToken()`에 malformed header 회귀 테스트를 추가한다.
2. 정규식 기반 strict parser로 교체한다.
3. 테스트 helper의 직접 `replace(/^Bearer /, "")`를 공통 parser 사용으로 바꾼다.
4. 필요하면 parser 반환값을 `Result` 형태로 확장한다.
5. Bearer 경계 문서를 Authorization header 문법까지 갱신한다.

## 검증 계획

- `bun --filter @workspace/core test src/auth/bearer-session.test.ts`
- `bun --filter @workspace/api test src/routes/route-helpers.test.ts src/routes/auth.route.test.ts`
- `bun --filter @workspace/admin-api test src/app.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/admin-api typecheck`

## 2026-06-17 완료

- Notion `WA-19` 내용을 확인했다.
- `readBearerToken()`과 관련 테스트, API/admin 테스트 fake의 Authorization 파싱을 조사했다.
- WA-19는 타당하다고 판단했다.
- strict parser, explicit parse result, 테스트 fake의 공통 parser 사용, Bearer 경계 문서화의 4가지 개선 방안을 도출했다.

## 2026-06-17 구현 완료

- `parseBearerToken()`을 추가해 Bearer 파싱 성공과 실패 이유를 discriminated union으로 표현했다.
- `readBearerToken()`은 `parseBearerToken()` 위의 호환 wrapper로 유지해 기존 호출부의 외부 계약을 보존했다.
- parser는 `Bearer` scheme을 대소문자 무관하게 허용하고, scheme 뒤 하나 이상의 공백과 공백 없는 단일 token만 허용한다.
- `Bearer token extra`, 빈 token, 내부 공백이 있는 token, 앞뒤 공백이 붙은 header, 다른 scheme은 거절한다.
- learner/admin API 테스트 fake의 직접 `replace(/^Bearer /, "")` 파싱을 제거하고 core parser를 사용하게 했다.
- `docs/linear-lol-30-bearer-session-token-boundary.md`에 Authorization header 문법과 테스트 fake의 공통 parser 사용 규칙을 추가했다.

## 검증 결과

- `bun --filter @workspace/core test src/auth/bearer-session.test.ts`
- `bun --filter @workspace/api test src/routes/route-helpers.test.ts src/routes/auth.route.test.ts src/routes/courses.route.test.ts src/routes/progress.route.test.ts src/routes/learning.route.test.ts src/app.test.ts`
- `bun --filter @workspace/admin-api test src/routes/courses.route.test.ts src/routes/settings.route.test.ts src/app.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/core lint`
- `bun --filter @workspace/api lint`
- `bun --filter @workspace/admin-api lint`
