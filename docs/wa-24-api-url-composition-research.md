# WA-24 API URL 조합 정규화 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-24 `정규화되지 않은 URL 조합`
- 조사 범위: `apps/web/src/lib/auth/auth-client.ts`, web OpenAPI client, admin HTTP client, admin auth client, 관련 테스트

## 이슈 요약

WA-24는 `apps/web/src/lib/auth/auth-client.ts`가 `fetch(`${getApiBaseUrl()}/api/auth/sign-out`)`처럼 문자열 병합으로 URL을 만들고 있어 base URL의 trailing slash 형태에 취약하다고 지적한다.

## 코드 조사

`apps/web/src/lib/auth/auth-client.ts`의 `getApiBaseUrl()`은 다음처럼 끝 slash 하나만 제거한다.

```ts
return (process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "").replace(/\/$/, "")
```

따라서 `https://api.example.test/`는 안전하게 `https://api.example.test`가 되지만, `https://api.example.test//`처럼 slash가 둘 이상이면 하나만 제거되어 `https://api.example.test//api/auth/sign-out` 형태가 될 수 있다.

유사한 URL 조합 방식은 여러 곳에 존재한다.

- `apps/web/src/lib/api/http/openapi-client.ts`
  - `baseUrl.replace(/\/$/, "")`와 `path.replace(/^\//, "")`를 직접 조합한다.
- `apps/admin/src/lib/api/http-admin-api.ts`
  - `baseUrl.replace(/\/+$/, "")` 후 `${normalizedBaseUrl}${input.path}`로 조합한다.
- `apps/admin/src/lib/auth/admin-auth-client.ts`
  - `getAdminApiBaseUrl().replace(/\/$/, "")` 후 `/api/auth/sign-in/email`을 붙인다.

즉 일부 구현은 끝 slash 여러 개를 제거하고, 일부 구현은 하나만 제거하며, 일부는 base와 path 사이의 slash를 직접 관리한다. 반면 `auth-client.ts`의 callback URL 생성은 이미 `new URL(resolveSafeNextPath(nextPath), browserOrigin)`을 사용한다.

## 판단

이슈는 타당하다.

현재 구현은 대부분 정상 환경값에서는 동작하지만, URL 조합 정책이 client마다 다르고 테스트가 base URL 변형을 충분히 검증하지 않는다. API base URL은 운영 환경 변수에서 들어오는 값이므로 trailing slash, path prefix, 빈 값, 상대 경로 같은 변형을 parser에 맡기는 쪽이 더 안전하다.

문제의 핵심은 `requestLogout()` 한 줄만이 아니라 API URL 생성 책임이 여러 파일에 흩어져 있다는 점이다. 같은 실수가 admin auth, web OpenAPI client, admin HTTP client에서 반복될 수 있다.

## 개선 방안

### 방안 1. 공통 URL builder를 도입한다

web/admin client가 공유할 수 있는 작은 helper를 만든다.

```ts
buildApiUrl(baseUrl, path)
```

내부는 `new URL(path, normalizedBaseUrl).toString()`을 사용한다. 단, `new URL("/path", "https://host/api")`는 path prefix `/api`를 지울 수 있으므로 base URL에 path prefix를 허용할지 정책을 먼저 결정해야 한다. path prefix를 보존해야 한다면 base URL을 directory URL로 정규화한 뒤 상대 path를 붙이는 helper를 사용한다.

장점은 URL 조합 규칙과 테스트가 한 곳에 모인다. 단점은 기존 client들의 기대 URL을 모두 검증해야 한다.

### 방안 2. API base URL 타입을 정규화된 값으로 브랜드화한다

환경값을 그대로 string으로 넘기지 않고 `ApiBaseUrl` brand type으로 parse한다.

- 끝 slash는 정규화한다.
- protocol과 host가 있는 절대 URL인지 검증한다.
- 허용한다면 path prefix 규칙을 명시한다.
- 빈 문자열 same-origin fallback을 허용할지 별도 타입으로 분리한다.

장점은 각 client가 URL 정규화 책임을 반복하지 않는다. 단점은 env parser와 client factory signature를 함께 바꿔야 한다.

### 방안 3. web/admin/auth client를 같은 URL builder로 통합한다

다음 파일들이 모두 같은 helper를 사용하게 한다.

- `apps/web/src/lib/auth/auth-client.ts`
- `apps/web/src/lib/api/http/openapi-client.ts`
- `apps/admin/src/lib/auth/admin-auth-client.ts`
- `apps/admin/src/lib/api/http-admin-api.ts`

인증 endpoint, OpenAPI endpoint, Admin API endpoint의 path 생성은 각 client가 담당하되, base URL과 path 결합은 공통 helper에 위임한다. 장점은 테스트와 운영 동작이 일관된다.

### 방안 4. path와 query 생성 책임을 분리한다

현재 여러 client가 path string에 query string을 직접 붙인다. URL builder가 `path`와 `searchParams`를 분리해 받으면 query encoding도 한 곳에서 검증할 수 있다.

예:

```ts
buildApiUrl(baseUrl, {
  path: "/analytics/lessons",
  searchParams,
})
```

장점은 path encoding, query encoding, base URL 결합 정책이 분리된다. 특히 admin list query가 늘어날수록 문자열 interpolation 오류를 줄인다.

### 방안 5. URL 변형 회귀 테스트를 추가한다

공통 helper와 각 client에 다음 케이스를 고정한다.

- base URL 끝 slash 없음
- base URL 끝 slash 하나
- base URL 끝 slash 여러 개
- path 앞 slash 있음/없음
- query string 포함
- URL path prefix를 허용한다면 prefix 보존
- 잘못된 base URL 입력 시 명시적 오류

장점은 환경 변수 값 모양이 달라도 client URL이 안정적으로 유지된다.

## 권장 진행 순서

1. base URL에 path prefix를 허용할지 결정하고 문서화한다.
2. `buildApiUrl` helper와 테스트를 만든다.
3. web OpenAPI client와 admin HTTP client를 helper로 옮긴다.
4. web/admin auth client도 같은 helper를 사용하게 한다.
5. 환경값을 `ApiBaseUrl` 타입으로 parse하거나, 최소한 client factory 진입점에서 정규화한다.
6. `FRONTEND.md` 또는 운영 환경 문서에 API URL 조합 원칙을 기록한다.

## 검증 계획

- `bun --filter @workspace/web test -- openapi-client auth-client`
- `bun --filter @workspace/admin test -- http-admin-api admin-auth-client`
- `bun --filter @workspace/env test`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-24 본문을 읽고 web auth client, web OpenAPI client, admin auth client, admin HTTP client의 URL 조합 방식을 조사했다.
- 이슈는 타당하다고 판단했다.
- 개선 방향은 단일 줄 교체가 아니라 공통 URL builder, base URL 타입 정규화, query 생성 책임 분리, 변형 회귀 테스트로 정리했다.
- 학습자 OpenAPI client가 기존 `runtime-config`의 `buildApiUrl()`을 사용하도록 바꿔 인증 client와 API client의 URL 조합 규칙을 통일했다.
- 어드민 웹에 `runtime-config.ts`를 추가해 `ADMIN_API_BASE_URL` 읽기, base URL 정규화, endpoint URL 조합을 단일 경계로 모았다.
- 어드민 auth client와 HTTP admin API client가 `buildAdminApiUrl()`을 사용하도록 바꾸고, 실행 코드가 `ADMIN_API_BASE_URL`을 직접 읽지 않는 회귀 테스트를 추가했다.
- base URL 끝 slash 없음/하나/여러 개와 path 앞 slash 유무에 대한 URL 조합 테스트를 학습자/어드민 runtime config에 추가했다.
