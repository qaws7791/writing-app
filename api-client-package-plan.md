# `packages/api-client` 분리 계획

## 목표

`openapi-typescript`와 `openapi-fetch`를 사용하는 API 계층을 `apps/web`에서 `packages/api-client`로 분리한다.  
분리 후 `apps/web`은 얇은 어댑터(env 해석 + 패키지 호출)만 유지하고, 순수 API 타입·클라이언트 팩토리·에러 유틸리티는 패키지가 소유한다.

---

## 현재 구조

```
apps/web/
  src/foundation/api/
    client.ts       — createApiClient (NEXT_PUBLIC_API_BASE_URL / window 의존)
    error.ts        — ApiError, createApiError, throwOnError
    index.ts        — barrel exports
    schema.d.ts     — openapi-typescript 생성 타입 (auto-generated)
    openapi.json    — OpenAPI 스펙 파일
  scripts/
    generate-api-types.ts   — schema.d.ts 생성 스크립트
    fetch-openapi-spec.ts   — openapi.json fetch 스크립트
```

---

## 목표 구조

```
packages/api-client/
  package.json            — @workspace/api-client
  tsconfig.json           — @workspace/config/typescript/base.json 상속 + bundler 모드
  src/
    client.ts             — env 비의존 createApiClient({ baseUrl: string })
    error.ts              — ApiError, createApiError, throwOnError
    index.ts              — barrel exports
    schema.d.ts           — (이관) openapi-typescript 생성 타입
    openapi.json          — (이관) OpenAPI 스펙 파일
  scripts/
    generate-api-types.ts — (이관+경로수정) schema.d.ts 생성
    fetch-openapi-spec.ts — (이관+경로수정) openapi.json fetch

apps/web/
  src/foundation/api/
    client.ts             — thin wrapper: env 해석 후 @workspace/api-client 위임
    error.ts              — @workspace/api-client re-export
    index.ts              — 변경 없음 (로컬 client/error barrel)
    schema.d.ts           — 삭제 (패키지로 이관)
    openapi.json          — 삭제 (패키지로 이관)
  scripts/
    generate-api-types.ts — 삭제 (패키지로 이관)
    fetch-openapi-spec.ts — 삭제 (패키지로 이관)
```

---

## 의존 방향 (변경 후)

```
apps/web  →  @workspace/api-client  →  openapi-fetch
```

단방향 의존 구조를 유지한다.

---

## 패키지 설계 원칙

- `createApiClient`는 **env 비의존** — `{ baseUrl: string }` 를 필수 인자로 받는다
- 브라우저/서버 URL 해석 로직은 `apps/web`이 소유한다 (런타임 경계 명시)
- `schema.d.ts`는 자동 생성 파일이므로 패키지 내 스크립트로 재생성 가능
- `openapi-typescript`는 devDependency (스크립트 전용)

---

## 작업 항목

### 1단계: `packages/api-client` 패키지 생성

| 파일 | 작업 |
|------|------|
| `package.json` | 신규 생성 (`@workspace/api-client`) |
| `tsconfig.json` | 신규 생성 (bundler 모드, noEmit) |
| `src/client.ts` | 신규 작성 (env 비의존 팩토리) |
| `src/error.ts` | `apps/web/src/foundation/api/error.ts` 이관 |
| `src/index.ts` | 신규 작성 (barrel) |
| `src/schema.d.ts` | `apps/web/src/foundation/api/schema.d.ts` 이관 |
| `src/openapi.json` | `apps/web/src/foundation/api/openapi.json` 이관 |
| `scripts/generate-api-types.ts` | `apps/web/scripts/generate-api-types.ts` 이관+경로수정 |
| `scripts/fetch-openapi-spec.ts` | `apps/web/scripts/fetch-openapi-spec.ts` 이관+경로수정 |

### 2단계: `apps/web` 수정

| 파일 | 작업 |
|------|------|
| `package.json` | `@workspace/api-client: workspace:*` 추가; api 스크립트 위임 |
| `src/foundation/api/client.ts` | `@workspace/api-client` 호출 thin wrapper로 대체 |
| `src/foundation/api/error.ts` | `@workspace/api-client` re-export로 대체 |
| `src/foundation/api/schema.d.ts` | 삭제 |
| `src/foundation/api/openapi.json` | 삭제 |
| `scripts/generate-api-types.ts` | 삭제 |
| `scripts/fetch-openapi-spec.ts` | 삭제 |

### 3단계: 검증

- `bun install` 실행
- `bun run typecheck` (web + api-client)
- dev 서버 기동 확인

---

## 영향 범위

변경 후 하기 파일은 **임포트 경로 변경 없이** 동작한다:

- `apps/web/src/lib/repository.ts` — `@/foundation/api/client`, `@/foundation/api/error`
- `apps/web/src/lib/sync/sync-transport.ts` — `@/foundation/api/client`

이 파일들은 web의 얇은 어댑터를 통해 간접적으로 api-client 패키지를 사용하므로 **수정 불필요**.
