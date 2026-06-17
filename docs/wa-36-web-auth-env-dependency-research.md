# WA-36 웹 인증 클라이언트 환경 변수 의존성 조사

- 작성일: 2026-06-17
- 대상 이슈: WA-36 `외부 환경 변수에 대한 암묵적 의존성`
- 조사 범위: `apps/web/src/lib/auth/auth-client.ts`, auth/profile UI, browser/server API client factory, 관련 테스트와 운영 문서

## 결론

WA-36은 타당하다. `apps/web/src/lib/auth/auth-client.ts`는 `getApiBaseUrl()` 안에서 `process.env["NEXT_PUBLIC_API_BASE_URL"]`를 직접 읽고, Google login과 logout 요청에 사용한다. Next.js public env를 클라이언트 코드에서 읽는 것 자체는 관례지만, 현재 구조에서는 인증 요청 함수가 런타임 설정, URL 정규화, HTTP 요청, safe redirect까지 함께 숨긴다.

문제의 핵심은 `requestLogout(apiBaseUrl)` 매개변수 하나를 추가하는 것보다 넓다. `apps/web`에는 API base URL을 파싱하고 브랜드화하는 env/runtime config 경계가 없고, 인증 client와 API client factory가 각자 환경 변수 default를 읽는다. 테스트도 `process.env`를 직접 조작해야 한다.

## 근거

- `apps/web/src/lib/auth/auth-client.ts`
  - `requestGoogleLogin()`은 `createAuthClient({ baseURL: getApiBaseUrl() })`를 직접 만든다.
  - `requestLogout()`은 `fetch(`${getApiBaseUrl()}/api/auth/sign-out`)`로 endpoint를 만든다.
  - `getApiBaseUrl()`은 `NEXT_PUBLIC_API_BASE_URL`를 읽고 trailing slash 하나만 제거한다.
- `apps/web/src/lib/auth/auth-client.test.ts`
  - 테스트가 `process.env["NEXT_PUBLIC_API_BASE_URL"]`를 직접 설정/삭제한다.
  - `fetch`는 주입하지 않고 global mock으로 대체한다.
- `apps/web/src/features/auth/auth-page.tsx`
  - UI가 `requestGoogleLogin(nextPath)`만 호출하므로 인증 API base URL 의존성이 prop이나 client dependency로 드러나지 않는다.
- `apps/web/src/features/profile/profile-page.tsx`
  - UI가 `requestLogout("/")`만 호출한다.
- `apps/web/src/lib/api/get-browser-writing-app-api.ts`
  - API factory도 `NEXT_PUBLIC_API_BASE_URL`를 default로 직접 읽는다.
  - 다만 함수 signature에는 `apiBaseUrl` override가 있어 auth-client보다 의존성이 더 명시적이다.
- `apps/web/src/lib/api/get-server-writing-app-api.ts`
  - 서버용 API factory는 `WEB_API_BASE_URL`를 직접 읽는다.
- 문서
  - `docs/operations-environment.md`는 `NEXT_PUBLIC_API_BASE_URL`과 `WEB_API_BASE_URL` 계약을 기록한다.
  - `docs/wa-24-api-url-composition-research.md`는 같은 파일의 URL 조합 책임 분산 문제를 이미 지적한다.

## 위험

- 인증 요청 함수의 환경 의존성이 호출자에게 보이지 않는다.
- 테스트가 global env와 global fetch를 조작해야 하므로 병렬성, 격리성, 실패 원인 추적이 약해진다.
- auth client, browser API client, server API client가 각각 base URL default와 정규화 정책을 갖게 된다.
- base URL이 비어 있는 경우 same-origin fallback인지 설정 누락인지 명확하지 않다.
- URL 정규화와 runtime config 검증이 흩어져 WA-24의 URL 조합 문제와 같은 종류의 결함이 반복될 수 있다.

## 개선 방안

### 방안 1. 웹 런타임 설정 모듈을 만든다

`apps/web/src/env.ts` 또는 `apps/web/src/runtime-config.ts`를 만들고, `NEXT_PUBLIC_API_BASE_URL`, `WEB_API_BASE_URL`를 이 경계에서만 읽는다. 값은 `@workspace/env`의 로컬 기본값과 URL parser를 통해 `BrowserApiBaseUrl`, `ServerApiBaseUrl`처럼 의미 있는 타입으로 노출한다.

장점은 환경 변수 접근 위치가 고정되고, 누락/잘못된 URL/로컬 기본값 정책을 한 곳에서 검증할 수 있다는 점이다.

### 방안 2. 인증 client를 factory로 바꾸고 dependency를 주입한다

`createWebAuthClient({ apiBaseUrl, fetch, createBetterAuthClient })` 같은 factory를 만들고, `requestGoogleLogin`과 `requestLogout`은 이 factory가 반환하는 command가 되게 한다. 화면에서는 앱 조립 지점에서 만든 auth client를 사용하거나, 얇은 default instance만 import한다.

장점은 테스트가 `process.env`와 global fetch를 건드리지 않고 명시 dependency를 주입할 수 있다는 점이다.

### 방안 3. 인증 URL과 API URL 생성을 공통 builder로 통합한다

WA-24에서 제안한 `buildApiUrl` 또는 branded `ApiBaseUrl`을 auth-client에도 적용한다. sign-out endpoint, OpenAPI endpoint, admin endpoint가 같은 URL 결합 규칙을 사용하게 한다.

장점은 trailing slash, path prefix, 빈 값 정책이 인증 경로와 일반 API 경로에서 일관된다.

### 방안 4. client/server config를 분리하되 같은 schema family로 관리한다

브라우저에 노출 가능한 `NEXT_PUBLIC_*` 설정과 서버 전용 `WEB_*` 설정은 다른 타입으로 분리한다. 그러나 둘 다 `@workspace/env` 또는 web env module의 schema family에서 관리해 문서, `.env.example`, 테스트 기대값이 같은 출처를 따르게 한다.

장점은 보안 경계와 실행 경계가 명시화되고, 서버 전용 값을 실수로 client bundle에 노출하는 위험을 줄인다.

### 방안 5. 환경 계약 회귀 테스트와 raw env 접근 스캔을 추가한다

`apps/web/src/env.test.ts`로 URL parse와 fallback 정책을 검증하고, 실행 코드에서 `process.env["NEXT_PUBLIC_API_BASE_URL"]` 접근이 env module 밖에 남지 않도록 `rg` 기반 스캔을 pre-commit 또는 CI에 추가한다.

장점은 같은 암묵 의존성이 새 파일에 다시 생기는 것을 빠르게 잡을 수 있다.

## 권장 진행 순서

1. `apps/web/src/env.ts` 또는 `runtime-config.ts`를 만들고 browser/server API base URL parse를 모은다.
2. URL builder와 `ApiBaseUrl` 타입을 도입해 WA-24와 함께 해결한다.
3. auth client를 factory 형태로 바꾸고 `apiBaseUrl`, `fetch`, Better Auth client factory를 주입한다.
4. browser/server API factory도 같은 config 타입을 받게 정리한다.
5. env module 밖 raw `process.env` 접근을 검사하는 회귀 테스트 또는 스캔을 추가한다.

## Notion 업데이트 요약

- WA-36 본문을 읽고 웹 인증 client, 로그인/프로필 UI, browser/server API factory, auth-client 테스트, 운영 문서를 조사했다.
- 이슈는 타당하며, 단순 함수 인자 추가보다 웹 runtime config 경계, auth client factory, URL builder 통합이 필요하다.
- 같은 문제가 반복되지 않게 하려면 env 접근 위치를 고정하고, 테스트에서 global env 조작을 줄이며, raw env 접근 스캔을 도입해야 한다.

## 2026-06-17 구현 완료

- `apps/web/src/runtime-config.ts`를 추가해 `NEXT_PUBLIC_API_BASE_URL`과 `WEB_API_BASE_URL` 접근을 한 모듈로 모았다.
- `BrowserApiBaseUrl`, `ServerApiBaseUrl` brand type을 도입해 브라우저/서버 API base URL의 의미를 분리했다.
- `readBrowserApiBaseUrl()`, `readServerApiBaseUrl()`은 값이 비어 있으면 `@workspace/env`의 로컬 기본 API URL을 사용하고, URL parser를 통과한 뒤 trailing slash를 제거한다.
- `buildApiUrl()`을 추가해 auth sign-out endpoint 같은 API path 조합을 문자열 병합 대신 같은 규칙으로 처리한다.
- `apps/web/src/lib/auth/auth-client.ts`를 `createWebAuthClient({ apiBaseUrl, fetchImplementation, betterAuthClientFactory })` factory 기반으로 바꿨다. 기본 `requestGoogleLogin()`과 `requestLogout()`은 runtime config에서 읽은 browser API base URL을 사용하는 얇은 wrapper로 유지했다.
- `apps/web/src/lib/api/get-browser-writing-app-api.ts`와 `apps/web/src/lib/api/get-server-writing-app-api.ts`도 각각 runtime config의 browser/server reader를 기본값으로 사용하게 바꿨다.
- `apps/web/src/runtime-config.test.ts`에 URL 정규화, path 조합, 실행 코드 raw env 접근 스캔 테스트를 추가했다.
- `apps/web/src/lib/auth/auth-client.test.ts`는 더 이상 `process.env`나 global `fetch`를 직접 조작하지 않고 dependency 주입으로 검증한다.
- `docs/operations-environment.md`에 web runtime config 경계를 기록했다.

## 검증 결과

- `bun --filter @workspace/web test src/lib/auth/auth-client.test.ts src/runtime-config.test.ts`
- `bun --filter @workspace/web test src/lib/auth/auth-client.test.ts src/runtime-config.test.ts src/lib/api/http/create-http-writing-app-api.test.ts`
- `bun --filter @workspace/web typecheck`
- `bun --filter @workspace/web lint`
