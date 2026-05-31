# Hono API 직접 인증 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 인증 프록시와 `@workspace/auth-proxy`를 제거하고, 브라우저가 Hono API 서버의 Better Auth endpoint로 직접 인증 요청을 보내도록 단순화한다.

**Architecture:** 인증의 public owner를 Hono API origin으로 고정한다. 로컬에서는 host-only 쿠키를 유지하고, 운영 서브도메인 배포에서는 Better Auth `crossSubDomainCookies.domain`을 명시해 `app.example.com`과 `api.example.com` 사이에서 세션 쿠키를 공유한다. Next 앱은 인증 요청을 중계하지 않고 API base URL만 클라이언트에 전달한다.

**Tech Stack:** Bun 1.3.10, Node 20, TypeScript, Next.js 16 App Router, Hono, Better Auth 1.6, Vitest, ESLint, Prettier

---

## 전제와 결정

- 삭제 대상 프록시는 애플리케이션 코드 프록시다. `apps/web/src/app/api/auth/[...path]/route.ts`, `apps/admin/src/app/api/auth/[...path]/route.ts`, `packages/auth-proxy`를 제거한다.
- Hono API의 `/api/auth/*` 라우트는 유지한다. 이 라우트가 인증 요청의 단일 진입점이다.
- 로컬 기본값은 기존처럼 `localhost:3000 -> localhost:4000`, `localhost:3001 -> localhost:4001`이다. localhost 쿠키는 포트를 구분하지 않으므로 별도 cookie domain을 설정하지 않는다.
- 운영에서 학습자 웹과 API가 `app.example.com`, `api.example.com`처럼 같은 parent domain을 공유할 때만 `BETTER_AUTH_COOKIE_DOMAIN=example.com`을 설정한다.
- 운영에서 어드민 웹과 API가 `admin.example.com`, `admin-api.example.com`처럼 같은 parent domain을 공유할 때만 `ADMIN_BETTER_AUTH_COOKIE_DOMAIN=example.com`을 설정한다.
- 서로 다른 site domain 사이의 third-party cookie 지원은 목표가 아니다. 이 계획은 같은 site의 cross-origin, cross-subdomain 배포를 단순화하는 계획이다.
- Better Auth 공식 문서 기준으로 cross-subdomain cookie는 `advanced.crossSubDomainCookies`를 사용한다. 다른 domain API를 직접 호출하는 third-party cookie 구조는 Safari ITP 문제가 있으므로 배제한다.

## 파일 구조

- Modify: `apps/api/src/env.ts` - 학습자 API cookie domain 환경 변수 파싱
- Modify: `apps/api/src/env.test.ts` - 학습자 API 환경 변수 회귀 테스트
- Modify: `apps/api/src/auth/auth.ts` - Better Auth cookie 설정 추가, 앱 프록시 헤더 신뢰 제거
- Modify: `apps/api/src/auth/auth.test.ts` - trusted origin, cookie domain, email/password 비활성 테스트
- Modify: `apps/api/src/main.ts` - `cookieDomain`을 auth runtime에 전달
- Modify: `apps/api/.env.example` - 선택 환경 변수 예시 추가
- Modify: `apps/admin-api/src/env.ts` - 관리자 API cookie domain 환경 변수 파싱
- Modify: `apps/admin-api/src/env.test.ts` - 관리자 API 환경 변수 회귀 테스트
- Modify: `apps/admin-api/src/auth/admin-auth.ts` - 관리자 Better Auth cookie 설정 추가, 앱 프록시 헤더 신뢰 제거
- Create: `apps/admin-api/src/auth/admin-auth.test.ts` - 관리자 Better Auth 설정 회귀 테스트
- Modify: `apps/admin-api/src/main.ts` - `cookieDomain`을 admin auth runtime에 전달
- Modify: `apps/admin-api/.env.example` - 선택 환경 변수 예시 추가
- Create: `apps/web/.env.example` - 브라우저/서버 API base URL 예시 명시
- Modify: `apps/web/src/app/login/page.tsx` - 로그인 페이지에서 직접 API auth base URL 전달
- Modify: `apps/web/src/lib/auth/auth-client.test.ts` - 기본 same-origin 기대 제거, 직접 API base URL 기대 고정
- Delete: `apps/web/src/app/api/auth/[...path]/route.ts` - 학습자 Next auth proxy 제거
- Modify: `apps/web/package.json` - `@workspace/auth-proxy` 의존성 제거
- Modify: `apps/admin/src/app/login/page.tsx` - 관리자 로그인 페이지에서 직접 API auth base URL 전달
- Modify: `apps/admin/src/features/auth/admin-auth-page.test.tsx` - 직접 API auth URL 기대 고정
- Delete: `apps/admin/src/app/api/auth/[...path]/route.ts` - 관리자 Next auth proxy 제거
- Modify: `apps/admin/package.json` - `@workspace/auth-proxy` 의존성 제거
- Delete: `packages/auth-proxy` - 공통 프록시 패키지 제거
- Modify: `bun.lock` - `bun install`로 workspace 의존성 정리
- Modify: `CONTEXT.md` - 인증 경계 최신화
- Modify: `FRONTEND.md` - Next auth proxy 라우트 제거, 직접 API auth 흐름 문서화
- Modify: `BACKEND.md` - cookie domain 환경 변수와 직접 auth endpoint 문서화
- Modify: `docs/operations-environment.md` - 운영 도메인/CORS/cookie domain 체크리스트 최신화
- Modify: `docs/frontend-api-client.md` - 과거 same-origin 프록시 설명을 직접 API 인증으로 갱신
- Modify: `docs/codebase-improvement-progress.md` - 기존 AUTH-02 상태를 폐기/대체 기록으로 갱신

---

### Task 1: 학습자 API 환경 변수에 cookie domain 추가

**Files:**

- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/env.test.ts`
- Modify: `apps/api/.env.example`

- [ ] **Step 1: 실패 테스트 작성**

`apps/api/src/env.test.ts`의 `parses required platform backend configuration` 테스트 기대값에 `cookieDomain: undefined`를 추가하고, 아래 테스트를 같은 `describe("parseApiEnv")` 블록에 추가한다.

```ts
it("parses optional Better Auth cookie domain", () => {
  const env = parseApiEnv({
    BETTER_AUTH_COOKIE_DOMAIN: "example.com",
    BETTER_AUTH_SECRET: "test-secret-with-enough-length",
    BETTER_AUTH_URL: "https://api.example.com",
    CORS_ORIGIN: "https://app.example.com",
    DATABASE_URL: "file:data/test-api.sqlite",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
    OPENAI_API_KEY: "openai-api-key",
    OPENAI_MODEL: "gpt-5-mini",
  })

  expect(env).toMatchObject({
    betterAuthUrl: "https://api.example.com",
    cookieDomain: "example.com",
    corsOrigins: ["https://app.example.com"],
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/api test -- src/env.test.ts
```

Expected: `cookieDomain` 속성이 없어서 실패한다.

- [ ] **Step 3: 환경 변수 파싱 구현**

`apps/api/src/env.ts`를 다음 기준으로 수정한다.

```ts
const apiEnvSchema = z.object({
  BETTER_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGIN: z.string().default(localCorsOrigins),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
})
```

`parseApiEnv` 반환값에 `cookieDomain`을 추가한다.

```ts
return {
  betterAuthSecret: env.BETTER_AUTH_SECRET,
  betterAuthUrl: env.BETTER_AUTH_URL,
  cookieDomain: env.BETTER_AUTH_COOKIE_DOMAIN,
  corsOrigins: env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databasePath: env.DATABASE_URL.startsWith("file:")
    ? env.DATABASE_URL.slice("file:".length)
    : env.DATABASE_URL,
  environment: env.NODE_ENV,
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  logLevel: env.LOG_LEVEL,
  openAiApiKey: env.OPENAI_API_KEY,
  openAiModel: env.OPENAI_MODEL,
  port: env.PORT,
}
```

- [ ] **Step 4: `.env.example` 갱신**

`apps/api/.env.example`에서 `BETTER_AUTH_URL` 아래에 선택 값을 추가한다.

```env
BETTER_AUTH_COOKIE_DOMAIN=
```

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/api test -- src/env.test.ts
```

Expected: `apps/api/src/env.test.ts` 전체 PASS.

- [ ] **Step 6: 커밋**

```bash
git add apps/api/src/env.ts apps/api/src/env.test.ts apps/api/.env.example
git commit -m "학습자 인증 쿠키 도메인 환경 변수를 추가"
```

---

### Task 2: 학습자 Better Auth 런타임을 직접 API 인증에 맞게 조정

**Files:**

- Modify: `apps/api/src/auth/auth.ts`
- Modify: `apps/api/src/auth/auth.test.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: 실패 테스트 작성**

`apps/api/src/auth/auth.test.ts`에서 `trusts proxy headers for auth requests proxied by the web app` 테스트를 삭제하고 아래 테스트 2개를 추가한다.

```ts
it("does not trust application proxy headers for direct API auth requests", () => {
  const input = {
    baseUrl: "https://api.example.com",
    db: {} as WritingAppDatabase,
    googleClientId: "google-client-id",
    googleClientSecret: "google-client-secret",
    secret: "test-secret-with-enough-length",
  }

  createAuthRuntime(input)

  expect(authMocks.betterAuth).toHaveBeenCalledWith(
    expect.objectContaining({
      advanced: expect.not.objectContaining({
        trustedProxyHeaders: true,
      }),
    })
  )
})

it("enables cross-subdomain cookies when a cookie domain is configured", () => {
  const input = {
    baseUrl: "https://api.example.com",
    cookieDomain: "example.com",
    db: {} as WritingAppDatabase,
    googleClientId: "google-client-id",
    googleClientSecret: "google-client-secret",
    secret: "test-secret-with-enough-length",
    trustedOrigins: ["https://app.example.com"],
  }

  createAuthRuntime(input)

  expect(authMocks.betterAuth).toHaveBeenCalledWith(
    expect.objectContaining({
      advanced: {
        crossSubDomainCookies: {
          domain: "example.com",
          enabled: true,
        },
      },
    })
  )
})
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/api test -- src/auth/auth.test.ts
```

Expected: 기존 런타임이 `trustedProxyHeaders`를 넣고 `cookieDomain`을 받지 않아 실패한다.

- [ ] **Step 3: 런타임 입력 타입과 advanced 설정 수정**

`apps/api/src/auth/auth.ts`를 다음 기준으로 수정한다.

```ts
interface CreateAuthRuntimeInput {
  baseUrl: string
  cookieDomain?: string
  db: WritingAppDatabase
  googleClientId: string
  googleClientSecret: string
  secret: string
  trustedOrigins?: string[]
}
```

`betterAuth` 호출의 `advanced` 설정을 다음처럼 바꾼다.

```ts
    advanced: getAdvancedAuthOptions(input.cookieDomain),
```

파일 하단에 helper를 추가한다.

```ts
function getAdvancedAuthOptions(cookieDomain: string | undefined) {
  if (!cookieDomain) {
    return {}
  }

  return {
    crossSubDomainCookies: {
      domain: cookieDomain,
      enabled: true,
    },
  }
}
```

- [ ] **Step 4: main 조립에서 cookieDomain 전달**

`apps/api/src/main.ts`의 `createAuthRuntime` 호출을 수정한다.

```ts
const auth = createAuthRuntime({
  baseUrl: env.betterAuthUrl,
  cookieDomain: env.cookieDomain,
  db,
  googleClientId: env.googleClientId,
  googleClientSecret: env.googleClientSecret,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
})
```

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/api test -- src/auth/auth.test.ts src/main.test.ts
bun --filter @workspace/api typecheck
```

Expected: 테스트와 typecheck PASS.

- [ ] **Step 6: 커밋**

```bash
git add apps/api/src/auth/auth.ts apps/api/src/auth/auth.test.ts apps/api/src/main.ts
git commit -m "학습자 인증을 직접 API 쿠키 설정으로 전환"
```

---

### Task 3: 관리자 API 환경 변수와 Better Auth cookie 설정 추가

**Files:**

- Modify: `apps/admin-api/src/env.ts`
- Modify: `apps/admin-api/src/env.test.ts`
- Modify: `apps/admin-api/src/auth/admin-auth.ts`
- Create: `apps/admin-api/src/auth/admin-auth.test.ts`
- Modify: `apps/admin-api/src/main.ts`
- Modify: `apps/admin-api/.env.example`

- [ ] **Step 1: 환경 변수 실패 테스트 작성**

`apps/admin-api/src/env.test.ts`의 기대값에 `cookieDomain: undefined`를 추가하고 아래 테스트를 추가한다.

```ts
it("parses optional admin Better Auth cookie domain", () => {
  expect(
    parseAdminApiEnv({
      ADMIN_BETTER_AUTH_COOKIE_DOMAIN: "example.com",
      ADMIN_BETTER_AUTH_SECRET: "admin-secret",
      ADMIN_BETTER_AUTH_URL: "https://admin-api.example.com",
      ADMIN_CORS_ORIGIN: "https://admin.example.com",
      DATABASE_URL: "file:../../data/api.sqlite",
    })
  ).toMatchObject({
    betterAuthUrl: "https://admin-api.example.com",
    cookieDomain: "example.com",
    corsOrigins: ["https://admin.example.com"],
  })
})
```

- [ ] **Step 2: 관리자 auth 런타임 실패 테스트 작성**

`apps/admin-api/src/auth/admin-auth.test.ts`를 생성한다.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { WritingAppDatabase } from "@workspace/db/client"

const authMocks = vi.hoisted(() => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  })),
  drizzleAdapter: vi.fn(() => "drizzle-adapter"),
}))

vi.mock("better-auth", () => ({
  betterAuth: authMocks.betterAuth,
}))

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: authMocks.drizzleAdapter,
}))

import { createAdminAuthRuntime } from "@/auth/admin-auth"

describe("createAdminAuthRuntime", () => {
  beforeEach(() => {
    authMocks.betterAuth.mockClear()
    authMocks.drizzleAdapter.mockClear()
  })

  it("keeps the admin cookie prefix and trusted origins", () => {
    createAdminAuthRuntime({
      baseUrl: "https://admin-api.example.com",
      db: {} as WritingAppDatabase,
      secret: "admin-secret",
      trustedOrigins: ["https://admin.example.com"],
    })

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.objectContaining({
          cookiePrefix: "writing-app-admin",
        }),
        trustedOrigins: ["https://admin.example.com"],
      })
    )
  })

  it("does not trust application proxy headers for direct admin API auth requests", () => {
    createAdminAuthRuntime({
      baseUrl: "https://admin-api.example.com",
      db: {} as WritingAppDatabase,
      secret: "admin-secret",
    })

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.not.objectContaining({
          trustedProxyHeaders: true,
        }),
      })
    )
  })

  it("enables cross-subdomain admin cookies when a cookie domain is configured", () => {
    createAdminAuthRuntime({
      baseUrl: "https://admin-api.example.com",
      cookieDomain: "example.com",
      db: {} as WritingAppDatabase,
      secret: "admin-secret",
      trustedOrigins: ["https://admin.example.com"],
    })

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.objectContaining({
          cookiePrefix: "writing-app-admin",
          crossSubDomainCookies: {
            domain: "example.com",
            enabled: true,
          },
        }),
      })
    )
  })
})
```

- [ ] **Step 3: 실패 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- src/env.test.ts src/auth/admin-auth.test.ts
```

Expected: `cookieDomain` 파싱과 admin auth cookie domain 설정이 없어 실패한다.

- [ ] **Step 4: 관리자 API 환경 변수 구현**

`apps/admin-api/src/env.ts`의 schema에 선택 변수를 추가한다.

```ts
const adminApiEnvSchema = z.object({
  ADMIN_BETTER_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  ADMIN_BETTER_AUTH_SECRET: z.string().min(1),
  ADMIN_BETTER_AUTH_URL: z.string().url(),
  ADMIN_CORS_ORIGIN: z.string().default("http://localhost:3001"),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
})
```

반환값에 `cookieDomain`을 추가한다.

```ts
return {
  betterAuthSecret: env.ADMIN_BETTER_AUTH_SECRET,
  betterAuthUrl: env.ADMIN_BETTER_AUTH_URL,
  cookieDomain: env.ADMIN_BETTER_AUTH_COOKIE_DOMAIN,
  corsOrigins: env.ADMIN_CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databasePath: env.DATABASE_URL.startsWith("file:")
    ? env.DATABASE_URL.slice("file:".length)
    : env.DATABASE_URL,
  environment: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  port: env.PORT,
}
```

- [ ] **Step 5: 관리자 Better Auth 런타임 구현**

`apps/admin-api/src/auth/admin-auth.ts`의 입력 타입에 `cookieDomain`을 추가한다.

```ts
interface CreateAdminAuthRuntimeInput {
  baseUrl: string
  cookieDomain?: string
  db: WritingAppDatabase
  secret: string
  trustedOrigins?: string[]
}
```

`advanced` 설정을 다음처럼 바꾼다.

```ts
    advanced: getAdvancedAdminAuthOptions(input.cookieDomain),
```

파일 하단에 helper를 추가한다.

```ts
function getAdvancedAdminAuthOptions(cookieDomain: string | undefined) {
  const baseOptions = {
    cookiePrefix: "writing-app-admin",
  }

  if (!cookieDomain) {
    return baseOptions
  }

  return {
    ...baseOptions,
    crossSubDomainCookies: {
      domain: cookieDomain,
      enabled: true,
    },
  }
}
```

- [ ] **Step 6: main 조립과 `.env.example` 갱신**

`apps/admin-api/src/main.ts`를 수정한다.

```ts
const auth = createAdminAuthRuntime({
  baseUrl: env.betterAuthUrl,
  cookieDomain: env.cookieDomain,
  db,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
})
```

`apps/admin-api/.env.example`에서 `ADMIN_BETTER_AUTH_URL` 아래에 선택 값을 추가한다.

```env
ADMIN_BETTER_AUTH_COOKIE_DOMAIN=
```

- [ ] **Step 7: 테스트 통과 확인**

Run:

```bash
bun --filter @workspace/admin-api test -- src/env.test.ts src/auth/admin-auth.test.ts
bun --filter @workspace/admin-api typecheck
```

Expected: 테스트와 typecheck PASS.

- [ ] **Step 8: 커밋**

```bash
git add apps/admin-api/src/env.ts apps/admin-api/src/env.test.ts apps/admin-api/src/auth/admin-auth.ts apps/admin-api/src/auth/admin-auth.test.ts apps/admin-api/src/main.ts apps/admin-api/.env.example
git commit -m "관리자 인증 쿠키 도메인 환경 변수를 추가"
```

---

### Task 4: 학습자 웹 로그인에서 Hono API로 직접 인증 요청 전환

**Files:**

- Create: `apps/web/.env.example`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/lib/auth/auth-client.test.ts`
- Delete: `apps/web/src/app/api/auth/[...path]/route.ts`
- Modify: `apps/web/package.json`

- [ ] **Step 1: auth client 테스트 기대 변경**

`apps/web/src/lib/auth/auth-client.test.ts`의 첫 테스트 이름과 기대를 직접 API base URL 기준으로 바꾼다.

```ts
it("starts Google social auth through the configured API auth route", async () => {
  const social = vi.fn(async () => undefined)
  const createClient = vi.fn<CreateSocialAuthClient>(() => ({
    signIn: {
      social,
    },
  }))

  await requestGoogleAuth({
    appOrigin: "http://localhost:3000",
    baseUrl: "http://localhost:4000",
    callbackPath: "/app/courses",
    createClient,
  })

  expect(createClient).toHaveBeenCalledWith({
    baseURL: "http://localhost:4000",
  })
  expect(social).toHaveBeenCalledWith({
    callbackURL: "http://localhost:3000/app/courses",
    provider: "google",
  })
})
```

- [ ] **Step 2: 로그인 page 테스트가 없으므로 typecheck 실패를 먼저 만든다**

`apps/web/src/app/login/page.tsx`에서 아직 변경하지 않은 상태로 아래 구현을 적용하면 `getWebEnv` import가 필요하다. 먼저 테스트 명령을 실행해 현재 기준을 확인한다.

Run:

```bash
bun --filter @workspace/web test -- src/lib/auth/auth-client.test.ts
```

Expected: 수정한 첫 테스트는 현재 `requestGoogleAuth`가 `baseUrl`을 지원하므로 PASS한다. 이 단계는 기존 auth client가 직접 API base URL을 받을 수 있음을 고정한다.

- [ ] **Step 3: 로그인 page에서 API auth base URL 전달**

`apps/web/src/app/login/page.tsx` import에 `getWebEnv`를 추가한다.

```ts
import { getWebEnv } from "@/env"
```

`Page` 함수의 return 직전에 env를 읽고 `AuthPage`에 넘긴다.

```tsx
const env = getWebEnv()

return <AuthPage authBaseUrl={env.browserApiBaseUrl} nextPath={nextPath} />
```

- [ ] **Step 4: 학습자 웹 env 예시 추가**

`apps/web/.env.example`을 생성한다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
WEB_API_BASE_URL=http://localhost:4000
```

- [ ] **Step 5: 학습자 Next auth proxy 삭제**

파일을 삭제한다.

```bash
Remove-Item -LiteralPath 'apps\web\src\app\api\auth\[...path]\route.ts'
```

- [ ] **Step 6: 학습자 웹 의존성 제거**

`apps/web/package.json`의 `dependencies`에서 아래 줄을 제거한다.

```json
"@workspace/auth-proxy": "workspace:*",
```

- [ ] **Step 7: 테스트와 typecheck 확인**

Run:

```bash
bun --filter @workspace/web test -- src/lib/auth/auth-client.test.ts
bun --filter @workspace/web typecheck
```

Expected: 테스트와 typecheck PASS. 삭제된 route를 참조하는 import가 없어야 한다.

- [ ] **Step 8: 커밋**

```bash
git add apps/web/.env.example apps/web/src/app/login/page.tsx apps/web/src/lib/auth/auth-client.test.ts apps/web/package.json
git add -u apps/web/src/app/api/auth
git commit -m "학습자 웹 인증 요청을 API로 직접 전환"
```

---

### Task 5: 관리자 웹 로그인에서 Hono API로 직접 인증 요청 전환

**Files:**

- Modify: `apps/admin/src/app/login/page.tsx`
- Modify: `apps/admin/src/features/auth/admin-auth-page.test.tsx`
- Delete: `apps/admin/src/app/api/auth/[...path]/route.ts`
- Modify: `apps/admin/package.json`

- [ ] **Step 1: 관리자 로그인 컴포넌트 테스트 기대 변경**

`apps/admin/src/features/auth/admin-auth-page.test.tsx`의 첫 테스트 render와 fetch 기대를 바꾼다.

```tsx
render(
  <AdminAuthPage
    authBaseUrl="http://localhost:4001"
    nextPath="/users?status=active"
  />
)
```

fetch 기대 URL을 직접 API URL로 바꾼다.

```ts
expect(fetch).toHaveBeenCalledWith(
  "http://localhost:4001/api/auth/sign-in/email",
  expect.objectContaining({
    credentials: "include",
    method: "POST",
  })
)
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
bun --filter @workspace/admin test -- src/features/auth/admin-auth-page.test.tsx
```

Expected: 현재 테스트를 바꾼 뒤에도 `requestAdminEmailAuth`가 `baseUrl`을 이미 지원하므로 PASS한다. 이 단계는 직접 API auth URL을 회귀 테스트로 고정한다.

- [ ] **Step 3: 로그인 page에서 API auth base URL 전달**

`apps/admin/src/app/login/page.tsx` import에 `getAdminWebEnv`를 추가한다.

```ts
import { getAdminWebEnv } from "@/env"
```

`Page` 함수에서 env를 읽고 `AdminAuthPage`에 넘긴다.

```tsx
const env = getAdminWebEnv()

return <AdminAuthPage authBaseUrl={env.adminApiBaseUrl} nextPath={nextPath} />
```

- [ ] **Step 4: 관리자 Next auth proxy 삭제**

파일을 삭제한다.

```bash
Remove-Item -LiteralPath 'apps\admin\src\app\api\auth\[...path]\route.ts'
```

- [ ] **Step 5: 관리자 웹 의존성 제거**

`apps/admin/package.json`의 `dependencies`에서 아래 줄을 제거한다.

```json
"@workspace/auth-proxy": "workspace:*",
```

- [ ] **Step 6: 테스트와 typecheck 확인**

Run:

```bash
bun --filter @workspace/admin test -- src/features/auth/admin-auth-page.test.tsx
bun --filter @workspace/admin typecheck
```

Expected: 테스트와 typecheck PASS.

- [ ] **Step 7: 커밋**

```bash
git add apps/admin/src/app/login/page.tsx apps/admin/src/features/auth/admin-auth-page.test.tsx apps/admin/package.json
git add -u apps/admin/src/app/api/auth
git commit -m "관리자 웹 인증 요청을 API로 직접 전환"
```

---

### Task 6: auth-proxy 패키지와 lockfile 정리

**Files:**

- Delete: `packages/auth-proxy`
- Modify: `bun.lock`

- [ ] **Step 1: 남은 참조 확인**

Run:

```bash
rg -n "@workspace/auth-proxy|proxyAuthRequest|auth-proxy" -g "!prototype/**"
```

Expected: `packages/auth-proxy`, `bun.lock`, 과거 문서만 출력된다. `apps/*/src`에서 출력되면 Task 4 또는 Task 5가 끝나지 않은 것이다.

- [ ] **Step 2: 패키지 삭제**

PowerShell에서 패키지 디렉터리를 삭제한다.

```bash
Remove-Item -LiteralPath 'packages\auth-proxy' -Recurse
```

- [ ] **Step 3: lockfile 갱신**

Run:

```bash
bun install
```

Expected: `bun.lock`에서 `@workspace/auth-proxy` workspace 항목과 전용 vitest dependency 항목이 제거된다.

- [ ] **Step 4: 삭제 검증**

Run:

```bash
rg -n "@workspace/auth-proxy|proxyAuthRequest|auth-proxy" apps packages bun.lock -g "!prototype/**"
```

Expected: 출력 없음.

- [ ] **Step 5: 커밋**

```bash
git add -u packages/auth-proxy apps/web/package.json apps/admin/package.json bun.lock
git commit -m "인증 프록시 패키지를 제거"
```

---

### Task 7: 문서 최신화

**Files:**

- Modify: `CONTEXT.md`
- Modify: `FRONTEND.md`
- Modify: `BACKEND.md`
- Modify: `docs/operations-environment.md`
- Modify: `docs/frontend-api-client.md`
- Modify: `docs/codebase-improvement-progress.md`

- [ ] **Step 1: 문서에서 제거할 과거 표현 확인**

Run:

```bash
rg -n "인증 프록시|same-origin 인증 프록시|same-origin `/api/auth|auth-proxy|요청을 전달하는 프록시" CONTEXT.md FRONTEND.md BACKEND.md docs -g "!prototype/**"
```

Expected: 수정 대상 문서의 과거 프록시 설명이 출력된다.

- [ ] **Step 2: `CONTEXT.md` 갱신**

`CONTEXT.md`의 인증 프록시 문장을 아래 의미로 바꾼다.

```md
- 인증 요청은 각 프론트엔드에서 Hono API의 `/api/auth/*` endpoint로 직접 보낸다.
- 운영에서 웹과 API가 서로 다른 서브도메인을 쓰는 경우 Better Auth cookie domain을 parent domain으로 명시한다.
```

- [ ] **Step 3: `FRONTEND.md` 갱신**

학습자 웹 라우트 목록에서 `/api/auth/*` 프록시 항목을 제거하고, 인증 설명을 아래 문장으로 바꾼다.

```md
학습자 로그인은 `NEXT_PUBLIC_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 호출한다. 브라우저 요청은 `credentials: "include"`를 사용하고, API는 `CORS_ORIGIN`과 Better Auth `trustedOrigins`로 학습자 웹 origin을 허용한다.
```

어드민 웹 라우트 목록에서 `/api/auth/*` 프록시 항목을 제거하고, 관리자 인증 설명을 아래 문장으로 바꾼다.

```md
관리자 로그인은 `ADMIN_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 호출한다. 브라우저 요청은 `credentials: "include"`를 사용하고, 어드민 API는 `ADMIN_CORS_ORIGIN`과 Better Auth `trustedOrigins`로 어드민 웹 origin을 허용한다.
```

- [ ] **Step 4: `BACKEND.md` 갱신**

학습자 API 환경 변수 표에 아래 행을 추가한다.

```md
| `BETTER_AUTH_COOKIE_DOMAIN` | 선택 | 비움 또는 `example.com` | 웹과 API가 같은 parent domain의 서로 다른 서브도메인일 때 Better Auth 세션 쿠키를 공유할 domain |
```

관리자 API 환경 변수 표에 아래 행을 추가한다.

```md
| `ADMIN_BETTER_AUTH_COOKIE_DOMAIN` | 선택 | 비움 또는 `example.com` | 어드민 웹과 어드민 API가 같은 parent domain의 서로 다른 서브도메인일 때 관리자 세션 쿠키를 공유할 domain |
```

인증 설명에 아래 문장을 추가한다.

```md
Next.js 앱은 `/api/auth/*`를 프록시하지 않는다. 인증 요청의 public endpoint는 Hono API 서버이며, CORS origin과 Better Auth trusted origin이 같은 목록을 기준으로 검증한다.
```

- [ ] **Step 5: `docs/operations-environment.md` 갱신**

학습자 API 환경 변수 표에 `BETTER_AUTH_COOKIE_DOMAIN`을 추가하고, 어드민 API 환경 변수 표에 `ADMIN_BETTER_AUTH_COOKIE_DOMAIN`을 추가한다. 배포 체크리스트에 아래 항목을 추가한다.

```md
- 웹 origin과 API origin이 같은 parent domain의 서브도메인인지 확인한다.
- 서브도메인 배포에서는 `BETTER_AUTH_COOKIE_DOMAIN` 또는 `ADMIN_BETTER_AUTH_COOKIE_DOMAIN`을 parent domain으로 설정한다.
- 서로 다른 site domain 배포에서는 직접 cookie 인증을 사용하지 않는다.
```

어드민 웹 설명의 “same-origin auth proxy” 표현을 제거하고 아래 문장으로 바꾼다.

```md
`apps/admin`은 서버 컴포넌트와 브라우저 로그인 요청에서 어드민 API URL을 명시적으로 사용한다.
```

- [ ] **Step 6: `docs/frontend-api-client.md` 갱신**

과거 변경 이력은 삭제하지 말고, 문서 상단에 새 완료 기록을 추가한다.

```md
## 2026-05-31 인증 프록시 제거와 직접 API 인증 전환

- 웹과 어드민의 Next.js `/api/auth/*` 프록시를 제거한다.
- 학습자 Google OAuth 시작은 `NEXT_PUBLIC_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 사용한다.
- 관리자 이메일 로그인은 `ADMIN_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 사용한다.
- Hono API는 CORS credentials와 Better Auth trusted origin을 유지하고, 운영 서브도메인 배포에서는 cookie domain 환경 변수로 세션 쿠키 공유 범위를 명시한다.
```

- [ ] **Step 7: `docs/codebase-improvement-progress.md` 갱신**

기존 AUTH-02 완료 기록 근처에 아래 후속 기록을 추가한다.

```md
- 2026-05-31 후속 결정: 인증 프록시 공통화는 임시 복잡도 완화였으나, 최종 구조에서는 프론트엔드가 Hono API의 Better Auth endpoint를 직접 호출하도록 전환한다. `@workspace/auth-proxy`와 Next `/api/auth/*` route는 제거 대상이다.
```

- [ ] **Step 8: 문서 검증**

Run:

```bash
rg -n "same-origin 인증 프록시|요청을 전달하는 프록시|@workspace/auth-proxy|packages/auth-proxy" CONTEXT.md FRONTEND.md BACKEND.md docs -g "!prototype/**"
```

Expected: 과거 이력으로 의도적으로 남긴 `docs/codebase-improvement-progress.md`의 `@workspace/auth-proxy` 기록 외에는 현재 구조 설명에서 출력이 없어야 한다.

- [ ] **Step 9: 커밋**

```bash
git add CONTEXT.md FRONTEND.md BACKEND.md docs/operations-environment.md docs/frontend-api-client.md docs/codebase-improvement-progress.md
git commit -m "직접 API 인증 구조를 문서화"
```

---

### Task 8: 전체 검증과 로컬 스모크

**Files:**

- Read: `package.json`
- Read: `apps/api/.env.example`
- Read: `apps/admin-api/.env.example`
- Read: `apps/web/.env.example`
- Read: `apps/admin/.env.example`

- [ ] **Step 1: 정적 검증 실행**

Run:

```bash
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
bun --filter @workspace/admin-api test
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin-api lint
bun --filter @workspace/web test
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bun --filter @workspace/admin test
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
```

Expected: 전부 PASS.

- [ ] **Step 2: 전체 빌드 실행**

Run:

```bash
bun run build
```

Expected: Turbo build PASS. 삭제된 `@workspace/auth-proxy` workspace 참조 오류가 없어야 한다.

- [ ] **Step 3: 학습자 로컬 스모크 환경 준비**

PowerShell 세션 1에서 API를 실행한다.

```powershell
$env:BETTER_AUTH_SECRET = "replace-with-local-auth-secret"
$env:BETTER_AUTH_URL = "http://localhost:4000"
$env:CORS_ORIGIN = "http://localhost:3000"
$env:DATABASE_URL = "file:../../data/api.sqlite"
$env:GOOGLE_CLIENT_ID = "replace-with-google-client-id"
$env:GOOGLE_CLIENT_SECRET = "replace-with-google-client-secret"
$env:OPENAI_API_KEY = "replace-with-openai-api-key"
$env:OPENAI_MODEL = "gpt-5-mini"
bun --filter @workspace/api dev
```

PowerShell 세션 2에서 웹을 실행한다.

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000"
$env:WEB_API_BASE_URL = "http://localhost:4000"
bun --filter @workspace/web dev
```

- [ ] **Step 4: 학습자 CORS preflight 확인**

PowerShell 세션 3에서 실행한다.

```powershell
curl.exe -i -X OPTIONS "http://localhost:4000/api/auth/sign-in/social" `
  -H "Origin: http://localhost:3000" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

Expected: `HTTP/1.1 204` 또는 200 계열 응답, `access-control-allow-origin: http://localhost:3000`, `access-control-allow-credentials: true`.

- [ ] **Step 5: 관리자 로컬 스모크 환경 준비**

PowerShell 세션 4에서 어드민 API를 실행한다.

```powershell
$env:ADMIN_BETTER_AUTH_SECRET = "replace-with-local-admin-secret"
$env:ADMIN_BETTER_AUTH_URL = "http://localhost:4001"
$env:ADMIN_CORS_ORIGIN = "http://localhost:3001"
$env:DATABASE_URL = "file:../../data/api.sqlite"
bun --filter @workspace/admin-api dev
```

PowerShell 세션 5에서 어드민 웹을 실행한다.

```powershell
$env:ADMIN_API_BASE_URL = "http://localhost:4001"
bun --filter @workspace/admin dev
```

- [ ] **Step 6: 관리자 CORS preflight 확인**

PowerShell 세션 6에서 실행한다.

```powershell
curl.exe -i -X OPTIONS "http://localhost:4001/api/auth/sign-in/email" `
  -H "Origin: http://localhost:3001" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

Expected: `HTTP/1.1 204` 또는 200 계열 응답, `access-control-allow-origin: http://localhost:3001`, `access-control-allow-credentials: true`.

- [ ] **Step 7: 관리자 로그인 요청 스모크**

관리자 시드가 준비된 상태에서 브라우저로 `http://localhost:3001/login`에 접속한다. 개발자 도구 Network 탭에서 로그인 요청이 아래 URL로 직접 나가는지 확인한다.

```text
http://localhost:4001/api/auth/sign-in/email
```

Expected: 요청 URL이 `http://localhost:3001/api/auth/sign-in/email`이 아니며, 성공 응답의 `Set-Cookie`가 브라우저에 저장된다.

- [ ] **Step 8: 프로세스 종료**

작업에 사용한 모든 `bun --filter ... dev` 프로세스를 `Ctrl+C`로 종료한다.

- [ ] **Step 9: 최종 pre-commit 검증**

Run:

```bash
bun lefthook run pre-commit
```

Expected: lint, formatting, typecheck 등 configured pre-commit checks PASS.

- [ ] **Step 10: 최종 커밋**

```bash
git status --short
git add .
git commit -m "인증 프록시를 제거하고 직접 API 인증으로 단순화"
```

---

## Self-Review

- Spec coverage: 프록시 제거, 직접 API 인증 요청, Hono CORS 유지, Better Auth cookie domain 설정, 문서 갱신, 검증 절차가 Task 1-8에 모두 포함되어 있다.
- Placeholder scan: 실행 불가능한 임시 표식이나 미완성 지시가 없다.
- Type consistency: `cookieDomain?: string`은 env 반환값, `createAuthRuntime`, `createAdminAuthRuntime`, `main.ts` 호출에서 같은 이름으로 사용한다.
- Scope check: 이 계획은 인증 프록시 제거에만 집중한다. API 도메인 통합, Next 앱과 Hono API 프로세스 병합, OAuth provider 재설정 자동화는 포함하지 않는다.
