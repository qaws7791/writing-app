# 환경 변수 파싱 패키지 설계

## 배경

현재 모노레포는 Bun 워크스페이스로 구성되어 있고, 런타임 앱은 `apps/api`, `apps/web`, `apps/docs`, `apps/storybook`이다. 백엔드 API는 `apps/api/src/env.ts`에서 Zod 스키마로 환경 변수를 직접 검증한다. `packages/db`의 일부 스크립트도 `process.env["DATABASE_URL"]`를 직접 읽는다.

앞으로 Hono 기반 API, Next.js 앱, 문서 앱, 스토리북, 스크립트가 환경 변수 검증을 반복하게 된다. 각 앱이 환경 변수의 의미와 변환 규칙을 가까이에 유지하되, raw env 객체를 Zod로 검증하고 오류를 일관되게 표시하는 최소 공통 패키지가 필요하다.

유사 라이브러리 조사 결과는 다음 설계 판단에 반영한다.

- T3 Env는 `runtimeEnv`, `runtimeEnvStrict`, `emptyStringAsUndefined`, `onValidationError` 같은 좋은 API 이름과 실패 처리 확장점을 제공한다.
- T3 Env의 `server`, `client`, `shared`, `clientPrefix`, preset 구조는 앱별 서버/클라이언트 경계까지 책임지므로 이번 패키지 범위보다 크다.
- envalid와 envsafe는 정제된 env 객체와 커스텀 reporter 개념을 제공하지만 자체 validator DSL을 사용한다. 이 모노레포는 이미 Zod를 쓰므로 별도 DSL은 만들지 않는다.

## 목표

- `packages/env`에 `@workspace/env` 패키지를 추가한다.
- Zod 스키마와 raw env 객체를 입력받아 타입이 추론된 환경 변수 객체를 반환한다.
- 검증 실패 시 값은 노출하지 않고 키와 원인만 담은 오류를 던진다.
- Next.js처럼 환경 변수를 명시적으로 나열해야 하는 환경을 위해 strict runtime env 입력을 지원한다.
- 빈 문자열을 기본적으로 `undefined`로 정규화해 Zod 기본값과 필수값 검증이 자연스럽게 동작하게 한다.
- 환경 변수의 앱별 의미 변환은 각 앱의 `env.ts`에 남긴다.

## 비목표

- 서버/클라이언트 환경 변수 분리 정책을 패키지에서 강제하지 않는다.
- `NEXT_PUBLIC_` 같은 client prefix 검증은 제공하지 않는다.
- Vercel, UploadThing, Upstash 같은 preset은 제공하지 않는다.
- 검증을 건너뛰는 `skipValidation` 옵션은 제공하지 않는다.
- 비동기 secret provider, 원격 secret 로딩, 파일 기반 `.env` 로딩은 제공하지 않는다.
- Zod가 아닌 자체 validator DSL은 만들지 않는다.

## 패키지 구조

```txt
packages/env
  package.json
  tsconfig.json
  eslint.config.js
  vitest.config.ts
  src
    index.ts
    parse-env.ts
    parse-env.test.ts
```

`src/index.ts`는 공개 API만 재export한다. 구현과 테스트는 `parse-env.ts`, `parse-env.test.ts`에 둔다.

## 공개 API

첫 버전의 공개 API는 네 가지로 제한한다.

```ts
export type RawEnv = Record<string, string | undefined>

export class EnvParseError extends Error {
  readonly issues: z.ZodIssue[]
}

export function formatEnvIssues(issues: readonly z.ZodIssue[]): string

export function parseEnv<TSchema extends z.ZodObject>(
  options: ParseEnvOptions<TSchema>
): Readonly<z.infer<TSchema>>
```

`parseEnv` 옵션은 다음 형태다.

```ts
type ParseEnvOptions<TSchema extends z.ZodObject> = {
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
```

`runtimeEnv`와 `runtimeEnvStrict`는 동시에 사용할 수 없다. 둘 중 하나만 허용한다.

## 일반 사용법

서버 앱이나 스크립트처럼 raw env 전체를 넘겨도 되는 환경은 `runtimeEnv`를 사용한다.

```ts
import { parseEnv } from "@workspace/env"
import { z } from "zod"

const apiEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
})

export const rawApiEnv = parseEnv({
  schema: apiEnvSchema,
  runtimeEnv: Bun.env,
})
```

반환 타입은 Zod 스키마에서 추론된다.

```ts
rawApiEnv.DATABASE_URL // string
rawApiEnv.PORT // number
```

앱별 의미 변환은 각 앱에 남긴다.

```ts
export function parseApiEnv(rawEnv: RawEnv) {
  const env = parseEnv({
    schema: apiEnvSchema,
    runtimeEnv: rawEnv,
  })

  return {
    databasePath: env.DATABASE_URL.startsWith("file:")
      ? env.DATABASE_URL.slice("file:".length)
      : env.DATABASE_URL,
    port: env.PORT,
  }
}
```

## Strict 사용법

Next.js처럼 빌드 타임 치환과 번들링 경계가 중요한 환경은 `runtimeEnvStrict`를 사용한다. 스키마에 정의한 키를 명시적으로 나열한다.

```ts
const webEnv = parseEnv({
  schema: z.object({
    NEXT_PUBLIC_API_URL: z.string().url(),
  }),
  runtimeEnvStrict: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
})
```

이 패키지는 `NEXT_PUBLIC_` prefix를 강제하지 않는다. 클라이언트에 노출 가능한 변수와 서버 전용 변수는 앱별 `env.ts` 파일을 분리해 관리한다.

## 빈 문자열 처리

`emptyStringAsUndefined`의 기본값은 `true`다.

`.env` 파일에서 다음과 같이 빈 값이 들어올 수 있다.

```env
PORT=
```

이 값은 기본적으로 `undefined`로 정규화된다. 따라서 다음 스키마는 기본값 `4000`을 적용한다.

```ts
z.object({
  PORT: z.coerce.number().int().positive().default(4000),
})
```

빈 문자열을 실제 값으로 취급해야 하는 특수한 앱은 `emptyStringAsUndefined: false`를 명시한다.

## 오류 처리

검증 실패 시 `parseEnv`는 `EnvParseError`를 던진다. 오류 메시지와 `formatEnvIssues` 출력은 환경 변수 값을 포함하지 않는다.

예상 메시지 형식:

```txt
Invalid environment variables:
- DATABASE_URL: Invalid input: expected string, received undefined
- PORT: Too small: expected number to be >0
```

커스텀 오류 처리가 필요한 앱은 `onValidationError`를 사용한다.

```ts
parseEnv({
  schema: apiEnvSchema,
  runtimeEnv: Bun.env,
  onValidationError: (error) => {
    throw new EnvParseError(
      "API 환경 변수 설정이 올바르지 않습니다.",
      error.issues
    )
  },
})
```

`onValidationError`의 반환 타입은 `never`다. 환경 변수 검증 실패 후에도 앱이 계속 실행되는 흐름은 지원하지 않는다.

## 반환 객체

반환 객체는 다음 규칙을 따른다.

- 스키마에 정의된 키만 포함한다.
- Zod transform, default, coercion 결과를 반영한다.
- `Object.freeze`로 얕게 고정한다.
- `Readonly<z.infer<TSchema>>` 타입으로 반환한다.

환경 변수는 앱 시작 시 확정되는 런타임 설정이다. 반환 객체를 불변으로 두면 실행 중 설정 변경을 암묵적으로 허용하지 않는다.

## 앱 통합

첫 구현에서는 `apps/api/src/env.ts`만 새 패키지로 전환한다.

기존 코드:

```ts
const env = apiEnvSchema.parse(rawEnv)
```

변경 후:

```ts
const env = parseEnv({
  schema: apiEnvSchema,
  runtimeEnv: rawEnv,
})
```

`CORS_ORIGIN` 분리, `DATABASE_URL`의 `file:` prefix 제거, `ensureDatabaseDirectory`는 API 앱의 책임으로 유지한다.

## 타입 안정성

반환 객체 사용은 Zod 스키마 기반으로 타입 안전하다. 존재하지 않는 키 접근은 TypeScript 오류가 된다.

```ts
env.PORT // number
env.UNKNOWN_KEY // TypeScript 오류
```

`runtimeEnv`는 `Bun.env`나 `process.env`처럼 넓은 객체를 받을 수 있으므로 키 누락을 타입 레벨에서 완전히 보장하지 않는다. 이 경우 누락은 앱 시작 시 Zod 검증으로 실패한다.

`runtimeEnvStrict`는 스키마 키를 명시적으로 나열하게 해 Next.js 앱에서 더 엄격한 사용을 가능하게 한다. 다만 TypeScript 타입은 런타임 환경 자체의 실제 존재를 증명하지 않는다. 최종 보장은 항상 Zod 런타임 검증이다.

## 문서 업데이트

구현 시작 시 `/docs/env-package.md`에 시작 항목을 남긴다. 구현 완료 시 같은 문서에 실제 API, 적용 범위, 검증 결과를 기록한다.

`BACKEND.md`는 API 앱 환경 변수 파싱이 `@workspace/env`를 사용한다는 점을 반영한다. Next.js 앱에서 사용하게 되는 시점에는 `FRONTEND.md`에 서버/클라이언트 env 파일 분리 규칙을 추가한다.

## 테스트 전략

`packages/env` 테스트:

- 유효한 env를 Zod 스키마 타입으로 반환한다.
- Zod coercion과 default를 적용한다.
- 기본값으로 빈 문자열을 `undefined`로 정규화한다.
- `emptyStringAsUndefined: false`일 때 빈 문자열을 유지한다.
- 검증 실패 시 `EnvParseError`를 던진다.
- 오류 메시지에 환경 변수 값이 포함되지 않는다.
- `onValidationError`가 기본 오류 처리를 대체한다.
- 반환 객체가 얕게 freeze된다.

`apps/api` 테스트:

- 기존 `parseApiEnv` 테스트가 새 패키지를 통해 계속 통과한다.
- 필수 환경 변수 누락 시 시작 단계에서 실패한다.
- 기본값이 있는 선택 환경 변수는 기존 동작을 유지한다.

## 검증 대상

구현 완료 시 가능한 범위에서 다음 명령을 실행한다.

```bash
bun --filter @workspace/env test
bun --filter @workspace/env typecheck
bun --filter @workspace/env lint
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
git diff --check
bun lefthook run pre-commit
```

루트 검증에서 기존 실패가 남아 있으면 변경 파일과 관련 패키지를 별도로 검증하고 완료 보고에 원인을 명시한다.
