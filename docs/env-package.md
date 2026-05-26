# 환경 변수 파싱 패키지

## 2026-05-26 시작

- `packages/env`에 Zod 기반 환경 변수 파싱 패키지 `@workspace/env`를 추가한다.
- 첫 구현의 공개 API는 `parseEnv`, `EnvParseError`, `formatEnvIssues`, `RawEnv`로 제한한다.
- `runtimeEnv`와 `runtimeEnvStrict` 중 하나를 입력받아 검증된 불변 환경 변수 객체를 반환한다.
- 빈 문자열은 기본적으로 `undefined`로 정규화한다.
- 서버/클라이언트 환경 변수 분리, client prefix 검증, preset, 비동기 secret 로딩, 검증 건너뛰기는 범위에 포함하지 않는다.
- 첫 적용 대상은 `apps/api/src/env.ts`다.

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
