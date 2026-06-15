# LOL-28 로컬 런타임 기본값 중앙화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/**`와 `packages/**`에 흩어진 `http://localhost:*` 원시 문자열을 제거하고, 로컬 런타임 URL과 포트를 `@workspace/env`의 단일 계약으로 관리한다.

**Architecture:** 로컬 포트와 URL 생성 책임은 `packages/env/src/local-runtime-defaults.ts`에 둔다. 앱 런타임과 테스트는 이 값을 import하고, 문서와 `.env.example`은 예시로만 값을 적는다. 재발 방지는 저장소 스캔 스크립트로 `apps/**`, `packages/**` 코드에 원시 `http://localhost:*` URL이 남는지 검사한다.

**Tech Stack:** Bun, TypeScript, Vitest, Zod, Hono, Next.js, `@workspace/env`.

---

## 파일 구조

- Create: `scripts/check-localhost-literals.ts`
  - `apps/**`, `packages/**`에서 원시 `http://localhost:3000|3001|3002|3003|4000|4001` 문자열을 검사한다.
- Modify: `package.json`
  - `check:localhost-literals` 스크립트를 추가한다.
- Create: `packages/env/src/local-runtime-defaults.ts`
  - 로컬 개발 포트와 URL 생성 함수를 가진 단일 계약 파일이다.
- Create: `packages/env/src/local-runtime-defaults.test.ts`
  - 로컬 기본값이 현재 문서화된 포트 계약과 일치하는지 검증한다.
- Modify: `packages/env/package.json`
  - `@workspace/env/local-runtime-defaults` subpath export를 추가한다.
- Modify: `packages/env/src/index.ts`
  - 루트 export에도 로컬 기본값을 노출한다.
- Modify: `packages/env/src/parse-env.ts`
  - Zod 기본값에서 원시 localhost 문자열과 오래된 포트를 제거한다.
- Modify: `packages/env/src/parse-env.test.ts`
  - 기본값 테스트를 중앙 계약 기준으로 바꾼다.
- Modify: `apps/api/src/env.ts`, `apps/api/src/env.test.ts`
  - `BETTER_AUTH_URL` fallback과 legacy `CORS_ORIGIN` 테스트를 중앙 계약 기준으로 바꾼다.
- Modify: `apps/admin-api/src/env.test.ts`
  - `ADMIN_API_PORT`, `ADMIN_ORIGIN` fallback 기대값을 중앙 계약 기준으로 바꾼다.
- Modify: `apps/api/src/app.ts`, `apps/admin-api/src/app.ts`
  - CORS fallback 원시 URL을 중앙 계약으로 바꾼다.
- Modify: `apps/api/src/app.test.ts`, `apps/admin-api/src/app.test.ts`, `apps/admin-api/src/routes/test-dependencies.ts`, `apps/admin-api/src/routes/test-dependencies.test.ts`
  - 테스트 fixture URL도 중앙 계약으로 바꾼다.
- Modify: `apps/api/src/routes/google-oauth.route.test.ts`
  - OAuth URL fixture를 중앙 계약으로 조합한다.
- Modify: `apps/web/src/lib/api/get-server-writing-app-api.ts`, `apps/web/src/lib/api/get-browser-writing-app-api.ts`, `apps/web/src/lib/auth/auth-navigation.test.ts`
  - 학습자 API base URL fallback과 테스트 기대값을 중앙 계약으로 바꾼다.
- Modify: `apps/admin/src/lib/api/get-server-admin-api.ts`
  - 어드민 API base URL fallback을 중앙 계약으로 바꾼다.
- Modify: `turbo.json`
  - 현재 사용 중인 포트와 origin 환경 변수를 Turbo global env에 포함한다.
- Modify: `BACKEND.md`, `README.md`, `docs/operations-environment.md`, `docs/linear-lol-28-localhost-env-research.md`
  - 문서의 오래된 포트 설명과 조사 결과를 구현 후 상태로 갱신한다.

## 정책

- `apps/**`, `packages/**` 코드와 테스트에는 원시 `http://localhost:*` URL을 쓰지 않는다.
- 원시 로컬 URL 예시는 `.env.example`, `README.md`, `BACKEND.md`, `docs/**`에만 허용한다.
- 중앙 계약 파일에는 `"http://localhost:3000"` 같은 완성 URL 문자열을 두지 않고, host/protocol/port로 URL을 생성한다.
- `localhost` 자체가 필요한 유일한 코드 위치는 `packages/env/src/local-runtime-defaults.ts`다.
- 기존 legacy 환경 변수인 `CORS_ORIGIN`, `ADMIN_CORS_ORIGIN`, `ADMIN_BETTER_AUTH_SECRET` 정규화는 유지한다.

---

### Task 1: 원시 localhost URL 검사 스크립트 추가

**Files:**

- Create: `scripts/check-localhost-literals.ts`
- Modify: `package.json`

- [ ] **Step 1: 저장소 스캔 스크립트를 추가한다**

Create `scripts/check-localhost-literals.ts`:

```ts
import fs from "node:fs"
import path from "node:path"

const roots = ["apps", "packages"] as const
const ignoredDirectories = new Set([
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
])
const ignoredFileNames = new Set([".env.example"])
const scannedExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
])
const rawLocalhostUrlPattern =
  /http:\/\/localhost:(3000|3001|3002|3003|4000|4001)/g

type Match = {
  readonly filePath: string
  readonly line: number
  readonly text: string
}

function collectFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : collectFiles(entryPath)
    }

    if (ignoredFileNames.has(entry.name)) {
      return []
    }

    return scannedExtensions.has(path.extname(entry.name)) ? [entryPath] : []
  })
}

function findRawLocalhostUrls(filePath: string): Match[] {
  const content = fs.readFileSync(filePath, "utf8")

  return content.split(/\r?\n/).flatMap((lineText, index) => {
    const matches = [...lineText.matchAll(rawLocalhostUrlPattern)]

    return matches.map((match) => ({
      filePath,
      line: index + 1,
      text: match[0] ?? "",
    }))
  })
}

const matches = roots.flatMap((root) =>
  collectFiles(path.join(process.cwd(), root)).flatMap(findRawLocalhostUrls)
)

if (matches.length > 0) {
  console.error("Raw localhost URLs are not allowed in apps/** or packages/**.")
  for (const match of matches) {
    console.error(
      `${path.relative(process.cwd(), match.filePath)}:${match.line} ${match.text}`
    )
  }
  process.exit(1)
}

console.log("No raw localhost URLs found in apps/** or packages/**.")
```

- [ ] **Step 2: 루트 package script를 추가한다**

Modify `package.json` `scripts`:

```json
{
  "check:localhost-literals": "bun scripts/check-localhost-literals.ts"
}
```

기존 script 사이에 추가한다. 기존 script는 삭제하지 않는다.

- [ ] **Step 3: 검사 스크립트가 현재 실패하는지 확인한다**

Run:

```powershell
bun run check:localhost-literals
```

Expected: FAIL. 출력에 최소한 다음 파일들이 포함된다.

```text
packages\env\src\parse-env.ts
apps\web\src\lib\api\get-server-writing-app-api.ts
apps\web\src\lib\api\get-browser-writing-app-api.ts
apps\admin\src\lib\api\get-server-admin-api.ts
apps\api\src\app.ts
apps\admin-api\src\app.ts
```

---

### Task 2: `@workspace/env`에 로컬 런타임 기본값 계약 추가

**Files:**

- Create: `packages/env/src/local-runtime-defaults.ts`
- Create: `packages/env/src/local-runtime-defaults.test.ts`
- Modify: `packages/env/package.json`
- Modify: `packages/env/src/index.ts`

- [ ] **Step 1: 로컬 기본값 테스트를 먼저 추가한다**

Create `packages/env/src/local-runtime-defaults.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  createLocalRuntimeUrl,
  localRuntimeDefaults,
  localRuntimePorts,
} from "@/local-runtime-defaults"

describe("local runtime defaults", () => {
  it("문서화된 로컬 포트 계약을 한 곳에서 제공한다", () => {
    expect(localRuntimePorts).toEqual({
      adminApi: 4001,
      adminWeb: 3001,
      learnerApi: 4000,
      learnerWeb: 3000,
    })
  })

  it("로컬 URL은 같은 생성 규칙으로 만든다", () => {
    expect(localRuntimeDefaults).toEqual({
      adminApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.adminApi),
      adminWebOrigin: createLocalRuntimeUrl(localRuntimePorts.adminWeb),
      learnerApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.learnerApi),
      learnerWebOrigin: createLocalRuntimeUrl(localRuntimePorts.learnerWeb),
    })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run:

```powershell
bun --filter @workspace/env test -- local-runtime-defaults.test.ts
```

Expected: FAIL with module resolution error for `@/local-runtime-defaults`.

- [ ] **Step 3: 로컬 기본값 모듈을 추가한다**

Create `packages/env/src/local-runtime-defaults.ts`:

```ts
const localRuntimeProtocol = "http"
const localRuntimeHost = "localhost"

export const localRuntimePorts = Object.freeze({
  adminApi: 4001,
  adminWeb: 3001,
  learnerApi: 4000,
  learnerWeb: 3000,
})

export function createLocalRuntimeUrl(port: number): string {
  return `${localRuntimeProtocol}://${localRuntimeHost}:${port}`
}

export const localRuntimeDefaults = Object.freeze({
  adminApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.adminApi),
  adminWebOrigin: createLocalRuntimeUrl(localRuntimePorts.adminWeb),
  learnerApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.learnerApi),
  learnerWebOrigin: createLocalRuntimeUrl(localRuntimePorts.learnerWeb),
})
```

- [ ] **Step 4: subpath export를 추가한다**

Modify `packages/env/package.json`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./local-runtime-defaults": "./src/local-runtime-defaults.ts",
    "./parse-env": "./src/parse-env.ts"
  }
}
```

- [ ] **Step 5: 루트 export를 추가한다**

Modify `packages/env/src/index.ts`:

```ts
export * from "@workspace/env/local-runtime-defaults"
export * from "@workspace/env/parse-env"
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run:

```powershell
bun --filter @workspace/env test -- local-runtime-defaults.test.ts
```

Expected: PASS, 1 file / 2 tests.

---

### Task 3: env parser 기본값을 중앙 계약으로 교체

**Files:**

- Modify: `packages/env/src/parse-env.ts`
- Modify: `packages/env/src/parse-env.test.ts`
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/env.test.ts`
- Modify: `apps/admin-api/src/env.test.ts`

- [ ] **Step 1: parser 기본값 테스트를 중앙 계약 기준으로 바꾼다**

Modify `packages/env/src/parse-env.test.ts` imports:

```ts
import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "@/local-runtime-defaults"
```

Add this test after `validSecret`:

```ts
it("로컬 런타임 기본값은 중앙 계약을 따른다", () => {
  expect(
    parseEnv({
      BETTER_AUTH_SECRET: validSecret,
    })
  ).toMatchObject({
    ADMIN_API_PORT: localRuntimePorts.adminApi,
    ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
    API_PORT: localRuntimePorts.learnerApi,
    WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
  })
})
```

In the existing first test, replace raw URL values:

```ts
ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
```

And expected values:

```ts
ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
```

- [ ] **Step 2: parser 테스트가 현재 실패하는지 확인한다**

Run:

```powershell
bun --filter @workspace/env test -- parse-env.test.ts
```

Expected: FAIL because current defaults are `3001`, `3002`, `3003`.

- [ ] **Step 3: parser 구현을 중앙 계약으로 바꾼다**

Modify `packages/env/src/parse-env.ts`:

```ts
import { z, type ZodError } from "zod"

import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "@/local-runtime-defaults"
```

Replace these schema defaults:

```ts
export const appEnvSchema = z.object({
  ADMIN_API_PORT: portSchema.default(localRuntimePorts.adminApi),
  ADMIN_ORIGIN: z.url().default(localRuntimeDefaults.adminWebOrigin),
  API_PORT: portSchema.default(localRuntimePorts.learnerApi),
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  NODE_ENV: nodeEnvSchema,
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.2"),
  WEB_ORIGIN: z.url().default(localRuntimeDefaults.learnerWebOrigin),
})
```

- [ ] **Step 4: API env fallback에서 원시 URL 생성을 제거한다**

Modify `apps/api/src/env.ts`:

```ts
import {
  createLocalRuntimeUrl,
  parseEnv,
  type AppEnvInput,
} from "@workspace/env"
```

Replace `authBaseUrl`:

```ts
authBaseUrl: env.BETTER_AUTH_URL ?? createLocalRuntimeUrl(env.API_PORT),
```

- [ ] **Step 5: API env 테스트 기대값을 중앙 계약으로 바꾼다**

Modify `apps/api/src/env.test.ts`:

```ts
import {
  createLocalRuntimeUrl,
  localRuntimeDefaults,
  localRuntimePorts,
} from "@workspace/env"
```

Replace raw origin inputs and expectations:

```ts
WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
webOrigin: localRuntimeDefaults.learnerWebOrigin,
```

Replace legacy `CORS_ORIGIN` input:

```ts
CORS_ORIGIN: [
  localRuntimeDefaults.learnerWebOrigin,
  localRuntimeDefaults.adminWebOrigin,
].join(","),
```

Replace the default fallback expectation:

```ts
authBaseUrl: localRuntimeDefaults.learnerApiBaseUrl,
port: localRuntimePorts.learnerApi,
webOrigin: localRuntimeDefaults.learnerWebOrigin,
```

Keep custom port expectation explicit but generated:

```ts
authBaseUrl: createLocalRuntimeUrl(4101),
```

- [ ] **Step 6: 어드민 API env 테스트 기대값을 중앙 계약으로 바꾼다**

Modify `apps/admin-api/src/env.test.ts`:

```ts
import { localRuntimeDefaults, localRuntimePorts } from "@workspace/env"
```

Replace raw admin origin inputs and expectations in the first test:

```ts
ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
adminOrigin: localRuntimeDefaults.adminWebOrigin,
```

Replace legacy origin input and default port expectation:

```ts
ADMIN_CORS_ORIGIN: localRuntimeDefaults.adminWebOrigin,
adminOrigin: localRuntimeDefaults.adminWebOrigin,
port: localRuntimePorts.adminApi,
```

- [ ] **Step 7: env 관련 테스트를 실행한다**

Run:

```powershell
bun --filter @workspace/env test
bun --filter @workspace/api test -- env.test.ts
bun --filter @workspace/admin-api test -- env.test.ts
```

Expected: all PASS.

---

### Task 4: 앱 런타임 fallback과 CORS fallback 교체

**Files:**

- Modify: `apps/api/src/app.ts`
- Modify: `apps/admin-api/src/app.ts`
- Modify: `apps/web/src/lib/api/get-server-writing-app-api.ts`
- Modify: `apps/web/src/lib/api/get-browser-writing-app-api.ts`
- Modify: `apps/admin/src/lib/api/get-server-admin-api.ts`

- [ ] **Step 1: API CORS fallback을 중앙 계약으로 바꾼다**

Modify `apps/api/src/app.ts` imports:

```ts
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
```

Replace CORS origin fallback:

```ts
origin: dependencies.webOrigin ?? localRuntimeDefaults.learnerWebOrigin,
```

- [ ] **Step 2: 어드민 API CORS fallback을 중앙 계약으로 바꾼다**

Modify `apps/admin-api/src/app.ts` imports:

```ts
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
```

Replace CORS origin fallback:

```ts
origin: dependencies.adminOrigin ?? localRuntimeDefaults.adminWebOrigin,
```

- [ ] **Step 3: 학습자 웹 API fallback을 중앙 계약으로 바꾼다**

Modify `apps/web/src/lib/api/get-server-writing-app-api.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getServerWritingAppApi({
  apiBaseUrl = process.env["WEB_API_BASE_URL"] ??
    localRuntimeDefaults.learnerApiBaseUrl,
  tokenProvider,
}: {
  readonly apiBaseUrl?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}): WritingAppApi {
  return createHttpWritingAppApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
```

Modify `apps/web/src/lib/api/get-browser-writing-app-api.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi({
  apiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"] ??
    localRuntimeDefaults.learnerApiBaseUrl,
  tokenProvider,
}: {
  readonly apiBaseUrl?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}): WritingAppApi {
  return createHttpWritingAppApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
```

- [ ] **Step 4: 어드민 웹 API fallback을 중앙 계약으로 바꾼다**

Modify `apps/admin/src/lib/api/get-server-admin-api.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"
import type { AdminApi } from "@/lib/api/admin-api"

export function getServerAdminApi({
  apiBaseUrl = process.env["ADMIN_API_BASE_URL"] ??
    localRuntimeDefaults.adminApiBaseUrl,
  tokenProvider,
}: {
  readonly apiBaseUrl?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}): AdminApi {
  return createHttpAdminApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
```

- [ ] **Step 5: 타입 체크로 import 경계를 확인한다**

Run:

```powershell
bun --filter @workspace/api typecheck
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/web typecheck
bun --filter @workspace/admin typecheck
```

Expected: all PASS.

---

### Task 5: 테스트 fixture의 원시 localhost URL 제거

**Files:**

- Modify: `apps/api/src/app.test.ts`
- Modify: `apps/admin-api/src/app.test.ts`
- Modify: `apps/admin-api/src/routes/test-dependencies.ts`
- Modify: `apps/admin-api/src/routes/test-dependencies.test.ts`
- Modify: `apps/api/src/routes/google-oauth.route.test.ts`
- Modify: `apps/web/src/lib/auth/auth-navigation.test.ts`

- [ ] **Step 1: API app CORS 테스트를 중앙 계약으로 바꾼다**

Modify `apps/api/src/app.test.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env"
```

Replace the CORS test values:

```ts
webOrigin: localRuntimeDefaults.learnerWebOrigin,
Origin: localRuntimeDefaults.learnerWebOrigin,
```

Replace expected header:

```ts
expect(response.headers.get("access-control-allow-origin")).toBe(
  localRuntimeDefaults.learnerWebOrigin
)
```

- [ ] **Step 2: 어드민 API 테스트 의존성 기본 origin을 중앙 계약으로 바꾼다**

Modify `apps/admin-api/src/routes/test-dependencies.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env"
```

Replace default:

```ts
adminOrigin: overrides.adminOrigin ?? localRuntimeDefaults.adminWebOrigin,
```

Modify `apps/admin-api/src/routes/test-dependencies.test.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env"
```

Replace expectation:

```ts
expect(dependencies.adminOrigin).toBe(localRuntimeDefaults.adminWebOrigin)
```

- [ ] **Step 3: 어드민 API app CORS 테스트를 중앙 계약으로 바꾼다**

Modify `apps/admin-api/src/app.test.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env"
```

Replace preflight origin:

```ts
Origin: localRuntimeDefaults.adminWebOrigin,
```

- [ ] **Step 4: Google OAuth route 테스트 URL을 중앙 계약으로 조합한다**

Modify `apps/api/src/routes/google-oauth.route.test.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env"
```

At the top of the file, add constants:

```ts
const authBaseUrl = localRuntimeDefaults.learnerApiBaseUrl
const webOrigin = localRuntimeDefaults.learnerWebOrigin
const googleCallbackUrl = `${authBaseUrl}/api/auth/callback/google`
```

Replace each dependency object:

```ts
authBaseUrl,
webOrigin,
```

Replace callback URL expectations:

```ts
googleCallbackUrl
```

- [ ] **Step 5: 웹 auth navigation 테스트 URL을 중앙 계약으로 조합한다**

Modify `apps/web/src/lib/auth/auth-navigation.test.ts`:

```ts
import { localRuntimeDefaults } from "@workspace/env"
```

Replace setup:

```ts
process.env["NEXT_PUBLIC_API_BASE_URL"] = localRuntimeDefaults.learnerApiBaseUrl
```

Replace expectations:

```ts
;`${localRuntimeDefaults.learnerApiBaseUrl}/api/auth/sign-in/google?callbackURL=%2Fapp%2Fprofile`
```

```ts
;`${localRuntimeDefaults.learnerApiBaseUrl}/api/auth/sign-out?callbackURL=%2F`
```

- [ ] **Step 6: 앱 테스트를 실행한다**

Run:

```powershell
bun --filter @workspace/api test
bun --filter @workspace/admin-api test
bun --filter @workspace/web test -- auth-navigation.test.ts
```

Expected: all PASS.

---

### Task 6: Turbo env 계약과 문서 갱신

**Files:**

- Modify: `turbo.json`
- Modify: `BACKEND.md`
- Modify: `README.md`
- Modify: `docs/operations-environment.md`
- Modify: `docs/linear-lol-28-localhost-env-research.md`

- [ ] **Step 1: Turbo global env에 현재 런타임 env를 추가한다**

Modify `turbo.json` `globalEnv` so it includes these names:

```json
[
  "ADMIN_API_BASE_URL",
  "ADMIN_API_PORT",
  "ADMIN_BETTER_AUTH_SECRET",
  "ADMIN_BETTER_AUTH_URL",
  "ADMIN_CORS_ORIGIN",
  "ADMIN_DEV_SESSION_TOKEN",
  "ADMIN_ORIGIN",
  "ADMIN_SEED_EMAIL",
  "ADMIN_SEED_NAME",
  "API_PORT",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "CI",
  "CORS_ORIGIN",
  "DATABASE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_API_MODE",
  "NODE_ENV",
  "WEB_API_BASE_URL",
  "WEB_API_MODE",
  "WEB_ORIGIN"
]
```

Keep the existing legacy names for compatibility. Do not remove `CORS_ORIGIN`, `ADMIN_CORS_ORIGIN`, `NEXT_PUBLIC_API_MODE`, or `WEB_API_MODE` in this task.

- [ ] **Step 2: BACKEND.md의 오래된 어드민 origin 기본값을 갱신한다**

Find the admin API environment table row for `ADMIN_ORIGIN` and change the local value from `http://localhost:3003` to:

```markdown
`http://localhost:3001`
```

Keep the Korean description unchanged unless it mentions port `3003`.

- [ ] **Step 3: README.md의 로컬 실행 예시를 확인한다**

Ensure these values remain aligned:

```env
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
WEB_API_BASE_URL=http://localhost:4000
ADMIN_ORIGIN=http://localhost:3001
ADMIN_API_BASE_URL=http://localhost:4001
```

If README already has these exact values, do not touch unrelated lines.

- [ ] **Step 4: operations 문서의 “코드 기본값과 다르다” 문장을 제거한다**

Modify `docs/operations-environment.md` local development section. Replace:

```markdown
로컬 표준 포트와 현재 실행 상태는 다음과 같다. API 포트는 코드의 기본값과 다르므로 `.env`에서 명시한다.
```

With:

```markdown
로컬 표준 포트와 현재 실행 상태는 다음과 같다. 코드의 로컬 기본값과 `.env.example`은 같은 포트 계약을 따른다.
```

- [ ] **Step 5: LOL-28 조사 문서에 구현 계획 위치를 추가한다**

Append to `docs/linear-lol-28-localhost-env-research.md`:

```markdown
## 구현 계획

- 계획 문서: `docs/superpowers/plans/2026-06-15-lol-28-local-runtime-defaults.md`
- 방향: `@workspace/env`에 로컬 런타임 기본값을 중앙화하고, 앱과 테스트는 해당 계약을 import한다.
- 재발 방지: `bun run check:localhost-literals`로 `apps/**`, `packages/**`의 원시 `http://localhost:*` URL을 검사한다.
```

- [ ] **Step 6: 문서 포맷을 확인한다**

Run:

```powershell
bun prettier --check BACKEND.md README.md docs\\operations-environment.md docs\\linear-lol-28-localhost-env-research.md docs\\superpowers\\plans\\2026-06-15-lol-28-local-runtime-defaults.md
```

Expected: PASS.

---

### Task 7: 최종 검증과 원시 URL 제거 확인

**Files:**

- No direct edits unless verification reveals missed literals.

- [ ] **Step 1: 원시 localhost URL 검사가 통과하는지 확인한다**

Run:

```powershell
bun run check:localhost-literals
```

Expected:

```text
No raw localhost URLs found in apps/** or packages/**.
```

- [ ] **Step 2: 직접 rg로 검사 결과를 교차 확인한다**

Run:

```powershell
rg -n "http://localhost:(3000|3001|3002|3003|4000|4001)" apps packages --glob "!**/.env.example" --glob "!**/node_modules/**"
```

Expected: no output, exit code 1.

- [ ] **Step 3: 관련 패키지 검증을 실행한다**

Run:

```powershell
bun --filter @workspace/env test
bun --filter @workspace/api test
bun --filter @workspace/admin-api test
bun --filter @workspace/web test -- auth-navigation.test.ts
bun --filter @workspace/env typecheck
bun --filter @workspace/api typecheck
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/web typecheck
bun --filter @workspace/admin typecheck
```

Expected: all PASS.

- [ ] **Step 4: 전체 pre-commit 검증을 가능한 범위에서 실행한다**

Run:

```powershell
bun lefthook run pre-commit
```

Expected: PASS. If it fails because of pre-existing unrelated files, record the failing command and error lines in the completion note without changing unrelated files.

- [ ] **Step 5: 변경 범위를 확인한다**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only the files listed in this plan are modified or created.

---

## 자체 검토

- Spec coverage: `LOL-28`의 하드코딩된 localhost 문제는 중앙 기본값, 테스트 fixture 교체, 런타임 fallback 교체, 문서 갱신, 재발 방지 스크립트로 모두 다룬다.
- Scope control: 새 env parser나 앱별 설정 계층을 만들지 않는다. 기존 `@workspace/env` 경계와 앱별 의미 변환을 유지한다.
- Residual risk: `.env.example`과 문서에는 예시 URL이 계속 남는다. 이는 실행 코드 하드코딩이 아니라 사용자에게 필요한 로컬 실행 예시이므로 허용한다.
- Type consistency: `localRuntimeDefaults`는 URL 문자열, `localRuntimePorts`는 숫자 포트, `createLocalRuntimeUrl(port)`는 임의 포트 테스트와 `BETTER_AUTH_URL` fallback 조합에만 쓴다.
