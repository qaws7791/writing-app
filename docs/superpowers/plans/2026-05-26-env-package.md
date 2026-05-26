# 환경 변수 파싱 패키지 구현 계획

> **에이전트 작업자 필수 하위 스킬:** 이 계획을 작업 단위로 구현할 때는 `superpowers:subagent-driven-development` 사용을 권장하고, 인라인으로 실행할 때는 `superpowers:executing-plans`를 사용한다. 각 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** 모든 앱에서 재사용할 수 있는 Zod 기반 환경 변수 파싱 패키지 `@workspace/env`를 추가하고, `apps/api`의 기존 환경 변수 파싱을 이 패키지로 전환한다.

**아키텍처:** `packages/env`는 Zod 스키마와 raw env 객체를 받아 검증된 불변 객체를 반환하는 얇은 런타임 경계다. 앱별 환경 변수 의미 변환은 각 앱의 `env.ts`에 남기고, 공유 패키지는 오류 형식, 빈 문자열 정규화, strict runtime env 입력만 담당한다.

**기술 스택:** Bun workspace, TypeScript, Zod, Vitest, ESLint, Prettier, Turbo

---

## 파일 구조

- 생성: `docs/env-package.md`
  - 작업 시작과 완료 기록, 실제 API, 검증 결과를 한국어로 기록한다.
- 생성: `packages/env/package.json`
  - `@workspace/env` 워크스페이스 패키지 정의, `lint`, `test`, `typecheck` 스크립트 제공.
- 생성: `packages/env/tsconfig.json`
  - 기존 패키지와 같은 TypeScript 설정을 사용한다.
- 생성: `packages/env/eslint.config.js`
  - 루트 공유 ESLint 설정을 재사용한다.
- 생성: `packages/env/vitest.config.ts`
  - Node 환경에서 `src/**/*.test.ts`를 실행한다.
- 생성: `packages/env/src/index.ts`
  - 공개 API를 재export한다.
- 생성: `packages/env/src/parse-env.ts`
  - `RawEnv`, `EnvParseError`, `formatEnvIssues`, `parseEnv`를 구현한다.
- 생성: `packages/env/src/parse-env.test.ts`
  - 패키지 동작을 TDD로 고정한다.
- 수정: `vitest.workspace.ts`
  - 루트 테스트 대상에 `packages/env/vitest.config.ts`를 추가한다.
- 수정: `apps/api/package.json`
  - `@workspace/env` workspace dependency를 추가한다.
- 수정: `apps/api/src/env.ts`
  - `apiEnvSchema.parse(rawEnv)`를 `parseEnv({ schema, runtimeEnv })`로 교체한다.
- 수정: `BACKEND.md`
  - API 앱 환경 변수 파싱이 `@workspace/env`를 사용한다는 점을 반영한다.
- 수정: `bun.lock`
  - 새 workspace dependency 반영을 위해 `bun install` 실행 후 갱신한다.

## Task 1: 작업 시작 문서와 패키지 스캐폴드

**Files:**

- Create: `docs/env-package.md`
- Create: `packages/env/package.json`
- Create: `packages/env/tsconfig.json`
- Create: `packages/env/eslint.config.js`
- Create: `packages/env/vitest.config.ts`
- Create: `packages/env/src/index.ts`
- Create: `packages/env/src/parse-env.ts`
- Modify: `vitest.workspace.ts`

- [ ] **Step 1: 작업 시작 문서를 작성한다**

`docs/env-package.md`를 생성한다.

```markdown
# 환경 변수 파싱 패키지

## 2026-05-26 시작

- `packages/env`에 Zod 기반 환경 변수 파싱 패키지 `@workspace/env`를 추가한다.
- 첫 구현의 공개 API는 `parseEnv`, `EnvParseError`, `formatEnvIssues`, `RawEnv`로 제한한다.
- `runtimeEnv`와 `runtimeEnvStrict` 중 하나를 입력받아 검증된 불변 환경 변수 객체를 반환한다.
- 빈 문자열은 기본적으로 `undefined`로 정규화한다.
- 서버/클라이언트 환경 변수 분리, client prefix 검증, preset, 비동기 secret 로딩, 검증 건너뛰기는 범위에 포함하지 않는다.
- 첫 적용 대상은 `apps/api/src/env.ts`다.
```

- [ ] **Step 2: 패키지 manifest를 만든다**

`packages/env/package.json`을 생성한다.

```json
{
  "name": "@workspace/env",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.2.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "@workspace/config": "workspace:*",
    "eslint": "^9",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 3: TypeScript 설정을 만든다**

`packages/env/tsconfig.json`을 생성한다.

```json
{
  "extends": "@workspace/config/typescript/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "paths": { "@/*": ["./src/*"] },
    "types": ["bun"]
  },
  "include": ["src/**/*.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: ESLint 설정을 만든다**

`packages/env/eslint.config.js`를 생성한다.

```js
import { config } from "@workspace/config/eslint/base"

/** @type {import("eslint").Linter.Config} */
export default config
```

- [ ] **Step 5: Vitest 설정을 만든다**

`packages/env/vitest.config.ts`를 생성한다.

```ts
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
})
```

- [ ] **Step 6: 빈 공개 엔트리와 구현 파일을 만든다**

`packages/env/src/index.ts`를 생성한다.

```ts
export {
  EnvParseError,
  formatEnvIssues,
  parseEnv,
  type RawEnv,
} from "@/parse-env"
```

`packages/env/src/parse-env.ts`를 생성한다.

```ts
import { z } from "zod"

export type RawEnv = Record<string, string | undefined>

export class EnvParseError extends Error {
  readonly issues: z.ZodIssue[]

  constructor(message: string, issues: readonly z.ZodIssue[]) {
    super(message)
    this.name = "EnvParseError"
    this.issues = [...issues]
  }
}

export function formatEnvIssues(issues: readonly z.ZodIssue[]) {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "env"

      return `- ${path}: ${issue.message}`
    })
    .sort()
    .join("\n")
}

export function parseEnv() {
  throw new Error("parseEnv is not implemented yet")
}
```

- [ ] **Step 7: 루트 Vitest workspace에 env 패키지를 추가한다**

`vitest.workspace.ts`를 수정한다.

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      "packages/ui/vitest.config.ts",
      "packages/core/vitest.config.ts",
      "packages/logger/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/env/vitest.config.ts",
      "apps/api/vitest.config.ts",
    ],
  },
})
```

- [ ] **Step 8: 패키지 테스트 명령이 실패하는지 확인한다**

Run:

```bash
bun --filter @workspace/env test
```

Expected: FAIL. 아직 테스트 파일이 없으면 pass할 수 있으므로, 이 단계에서는 다음 Task에서 실패 테스트를 추가하기 전까지 스캐폴드가 실행 가능한지만 확인한다.

- [ ] **Step 9: 스캐폴드 변경을 커밋한다**

```bash
git add docs/env-package.md packages/env vitest.workspace.ts
git commit -m "환경 변수 패키지 구조를 추가"
```

## Task 2: `@workspace/env` 동작을 테스트로 고정

**Files:**

- Create: `packages/env/src/parse-env.test.ts`
- Modify: `packages/env/src/parse-env.ts`

- [ ] **Step 1: 실패 테스트를 작성한다**

`packages/env/src/parse-env.test.ts`를 생성한다.

```ts
import { describe, expect, it } from "vitest"
import { z } from "zod"

import { EnvParseError, formatEnvIssues, parseEnv } from "@/parse-env"

describe("parseEnv", () => {
  it("returns typed parsed values from a Zod schema", () => {
    const env = parseEnv({
      schema: z.object({
        DATABASE_URL: z.string().min(1),
        PORT: z.coerce.number().int().positive().default(4000),
      }),
      runtimeEnv: {
        DATABASE_URL: "file:data/api.sqlite",
        PORT: "4100",
      },
    })

    expect(env).toEqual({
      DATABASE_URL: "file:data/api.sqlite",
      PORT: 4100,
    })
  })

  it("normalizes empty strings to undefined by default", () => {
    const env = parseEnv({
      schema: z.object({
        PORT: z.coerce.number().int().positive().default(4000),
      }),
      runtimeEnv: {
        PORT: "",
      },
    })

    expect(env.PORT).toBe(4000)
  })

  it("keeps empty strings when emptyStringAsUndefined is false", () => {
    const env = parseEnv({
      schema: z.object({
        OPTIONAL_LABEL: z.string(),
      }),
      runtimeEnv: {
        OPTIONAL_LABEL: "",
      },
      emptyStringAsUndefined: false,
    })

    expect(env.OPTIONAL_LABEL).toBe("")
  })

  it("accepts strict runtime env values", () => {
    const env = parseEnv({
      schema: z.object({
        NEXT_PUBLIC_API_URL: z.string().url(),
      }),
      runtimeEnvStrict: {
        NEXT_PUBLIC_API_URL: "https://example.com",
      },
    })

    expect(env.NEXT_PUBLIC_API_URL).toBe("https://example.com")
  })

  it("throws EnvParseError when validation fails", () => {
    expect(() =>
      parseEnv({
        schema: z.object({
          DATABASE_URL: z.string().min(1),
        }),
        runtimeEnv: {},
      })
    ).toThrow(EnvParseError)
  })

  it("formats issues without adding environment variable values", () => {
    try {
      parseEnv({
        schema: z.object({
          OPENAI_API_KEY: z.string().min(20),
        }),
        runtimeEnv: {
          OPENAI_API_KEY: "secret-short-value",
        },
      })
    } catch (error) {
      expect(error).toBeInstanceOf(EnvParseError)

      const envError = error as EnvParseError

      expect(envError.message).toContain("OPENAI_API_KEY")
      expect(envError.message).not.toContain("secret-short-value")
      expect(formatEnvIssues(envError.issues)).not.toContain(
        "secret-short-value"
      )
    }
  })

  it("allows callers to replace validation error handling", () => {
    class ApiEnvError extends Error {}

    expect(() =>
      parseEnv({
        schema: z.object({
          DATABASE_URL: z.string().min(1),
        }),
        runtimeEnv: {},
        onValidationError: (error) => {
          throw new ApiEnvError(error.message)
        },
      })
    ).toThrow(ApiEnvError)
  })

  it("freezes the returned env object", () => {
    const env = parseEnv({
      schema: z.object({
        PORT: z.coerce.number().default(4000),
      }),
      runtimeEnv: {},
    })

    expect(Object.isFrozen(env)).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run:

```bash
bun --filter @workspace/env test
```

Expected: FAIL with `parseEnv is not implemented yet`.

- [ ] **Step 3: 최소 구현을 작성한다**

`packages/env/src/parse-env.ts`를 다음으로 교체한다.

```ts
import { z } from "zod"

export type RawEnv = Record<string, string | undefined>

type EnvSchema = z.ZodObject<z.ZodRawShape>

type StrictRuntimeEnv<TSchema extends EnvSchema> = {
  [TKey in keyof z.infer<TSchema> & string]-?: string | undefined
}

type ParseEnvOptions<TSchema extends EnvSchema> = {
  schema: TSchema
  emptyStringAsUndefined?: boolean
  onValidationError?: (error: EnvParseError) => never
} & (
  | {
      runtimeEnv: RawEnv
      runtimeEnvStrict?: never
    }
  | {
      runtimeEnv?: never
      runtimeEnvStrict: StrictRuntimeEnv<TSchema>
    }
)

export class EnvParseError extends Error {
  readonly issues: z.ZodIssue[]

  constructor(message: string, issues: readonly z.ZodIssue[]) {
    super(message)
    this.name = "EnvParseError"
    this.issues = [...issues]
  }
}

export function formatEnvIssues(issues: readonly z.ZodIssue[]) {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "env"

      return `- ${path}: ${issue.message}`
    })
    .sort()
    .join("\n")
}

export function parseEnv<TSchema extends EnvSchema>({
  schema,
  emptyStringAsUndefined = true,
  onValidationError,
  ...runtimeOptions
}: ParseEnvOptions<TSchema>): Readonly<z.infer<TSchema>> {
  const runtimeEnv =
    "runtimeEnvStrict" in runtimeOptions
      ? runtimeOptions.runtimeEnvStrict
      : runtimeOptions.runtimeEnv

  const parseTarget = emptyStringAsUndefined
    ? normalizeEmptyStrings(runtimeEnv)
    : runtimeEnv

  const result = schema.safeParse(parseTarget)

  if (!result.success) {
    const message = `Invalid environment variables:\n${formatEnvIssues(
      result.error.issues
    )}`
    const error = new EnvParseError(message, result.error.issues)

    if (onValidationError) {
      return onValidationError(error)
    }

    throw error
  }

  return Object.freeze(result.data) as Readonly<z.infer<TSchema>>
}

function normalizeEmptyStrings(runtimeEnv: RawEnv): RawEnv {
  return Object.fromEntries(
    Object.entries(runtimeEnv).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ])
  )
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run:

```bash
bun --filter @workspace/env test
```

Expected: PASS.

- [ ] **Step 5: 타입 검사와 린트를 실행한다**

Run:

```bash
bun --filter @workspace/env typecheck
bun --filter @workspace/env lint
```

Expected: PASS.

- [ ] **Step 6: env 패키지 구현을 커밋한다**

```bash
git add packages/env
git commit -m "환경 변수 파서를 구현"
```

## Task 3: API 앱을 `@workspace/env`로 전환

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/env.ts`
- Modify: `bun.lock`

- [ ] **Step 1: API 앱 dependency를 추가한다**

`apps/api/package.json`의 `dependencies`에 `@workspace/env`를 추가한다.

```json
{
  "dependencies": {
    "@hono/standard-validator": "^0.2.0",
    "@workspace/core": "workspace:*",
    "@workspace/db": "workspace:*",
    "@workspace/env": "workspace:*",
    "@workspace/logger": "workspace:*",
    "better-auth": "^1.6.0",
    "hono": "^4.10.0",
    "hono-openapi": "^1.1.0",
    "openai": "^6.39.0",
    "zod": "^4.2.0",
    "zod-openapi": "^5.4.0"
  }
}
```

- [ ] **Step 2: lockfile을 갱신한다**

Run:

```bash
bun install
```

Expected: `bun.lock`에 `packages/env`와 `apps/api` dependency 변화가 반영된다.

- [ ] **Step 3: API 환경 변수 파싱을 전환한다**

`apps/api/src/env.ts`의 import와 parse 호출을 수정한다.

```ts
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { parseEnv, type RawEnv } from "@workspace/env"
import { z } from "zod"
```

`parseApiEnv` 시그니처와 본문 시작을 수정한다.

```ts
export function parseApiEnv(rawEnv: RawEnv) {
  const env = parseEnv({
    schema: apiEnvSchema,
    runtimeEnv: rawEnv,
  })

  return {
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
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
}
```

- [ ] **Step 4: API 테스트가 통과하는지 확인한다**

Run:

```bash
bun --filter @workspace/api test
```

Expected: PASS. 기존 `parseApiEnv` 테스트가 새 패키지를 경유해도 동일하게 통과한다.

- [ ] **Step 5: API 타입 검사와 린트를 실행한다**

Run:

```bash
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
```

Expected: PASS.

- [ ] **Step 6: API 전환을 커밋한다**

```bash
git add apps/api/package.json apps/api/src/env.ts bun.lock
git commit -m "API 환경 변수 파싱을 공유 패키지로 전환"
```

## Task 4: 문서 완료 기록과 최종 검증

**Files:**

- Modify: `docs/env-package.md`
- Modify: `BACKEND.md`

- [ ] **Step 1: 작업 완료 문서를 갱신한다**

`docs/env-package.md`에 완료 섹션을 추가한다.

```markdown
## 2026-05-26 완료

- `packages/env`에 `@workspace/env` 패키지를 추가했다.
- 공개 API는 `parseEnv`, `EnvParseError`, `formatEnvIssues`, `RawEnv`다.
- `parseEnv`는 `runtimeEnv` 또는 `runtimeEnvStrict`를 입력받고, 검증 성공 시 Zod 결과를 얕게 freeze해 반환한다.
- 기본적으로 빈 문자열을 `undefined`로 정규화한다.
- 검증 실패 시 환경 변수 값을 포함하지 않는 `EnvParseError`를 던진다.
- `apps/api/src/env.ts`는 기존 앱별 의미 변환을 유지하면서 공유 파서를 사용하도록 전환했다.

## 2026-05-26 검증

- `bun --filter @workspace/env test`
- `bun --filter @workspace/env typecheck`
- `bun --filter @workspace/env lint`
- `bun --filter @workspace/api test`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/api lint`
- `git diff --check`
- `bun lefthook run pre-commit`
```

- [ ] **Step 2: 백엔드 문서를 갱신한다**

`BACKEND.md`의 `apps/api` 환경 변수 설명 근처에 다음 내용을 반영한다.

```markdown
API 앱은 `@workspace/env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. 공유 패키지는 Zod 검증, 빈 문자열 정규화, 오류 메시지 형식만 담당한다. `DATABASE_URL`의 `file:` prefix 제거, `CORS_ORIGIN` 분리 같은 앱별 의미 변환은 `apps/api/src/env.ts`에 유지한다.
```

- [ ] **Step 3: 변경 파일 포맷을 확인한다**

Run:

```bash
bunx prettier --check "docs/env-package.md" "BACKEND.md" "packages/env/**/*.{ts,js,json}" "apps/api/package.json" "apps/api/src/env.ts" "vitest.workspace.ts"
```

Expected: PASS.

- [ ] **Step 4: 관련 패키지 검증을 실행한다**

Run:

```bash
bun --filter @workspace/env test
bun --filter @workspace/env typecheck
bun --filter @workspace/env lint
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
```

Expected: PASS.

- [ ] **Step 5: diff 검사를 실행한다**

Run:

```bash
git diff --check
```

Expected: PASS.

- [ ] **Step 6: pre-commit 검증을 실행한다**

Run:

```bash
bun lefthook run pre-commit
```

Expected: PASS. 기존 작업트리의 `FRONTEND.md`와 `prototype/`은 이번 작업 범위가 아니므로 스테이징하지 않는다.

- [ ] **Step 7: 문서와 최종 검증을 커밋한다**

```bash
git add docs/env-package.md BACKEND.md
git commit -m "환경 변수 패키지 문서를 갱신"
```

## 자체 검토 체크리스트

- 스펙의 모든 목표는 Task 1-4에 대응한다.
- `server/client/shared`, `clientPrefix`, preset, `skipValidation`, async validation은 구현 범위에 없다.
- 환경 변수 값은 오류 메시지 생성 과정에서 직접 추가하지 않는다.
- `runtimeEnv`와 `runtimeEnvStrict`는 union 타입으로 동시에 사용할 수 없게 한다.
- API 앱의 `CORS_ORIGIN`, `DATABASE_URL`, `ensureDatabaseDirectory` 책임은 앱에 남긴다.
- `/prototype` 디렉터리는 읽거나 수정하지 않는다.
