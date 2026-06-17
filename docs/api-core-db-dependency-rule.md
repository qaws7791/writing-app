# API-core-DB 의존성 lint 규칙

## 2026-06-18 시작

- 목표: 학습자 API 앱과 `packages/core`, `packages/db`의 의존성 방향을 `apps/api -> packages/core -> packages/db`로 oxlint에서 강제한다.
- `apps/api`는 `@workspace/db`와 Drizzle 구현 패키지를 직접 import하지 못해야 한다.
- `packages/db`는 `@workspace/core`를 import하지 못해야 한다.
- 우선 custom workspace oxlint rule 테스트를 추가하고, 실패를 확인한 뒤 최소 구현으로 rule을 연결한다.

## 2026-06-18 완료

- `scripts/oxlint/workspace-rules.mjs`에 `workspace/no-invalid-workspace-dependency` rule을 추가했다.
- rule은 import/export/dynamic import의 module specifier를 검사한다.
- `apps/api/**`에서 `@workspace/db`, `@workspace/db/*`, `drizzle-orm`, `drizzle-orm/*` import를 error로 보고한다.
- `packages/db/**`에서 `@workspace/core`, `@workspace/core/*` import를 error로 보고한다.
- `.oxlintrc.json`에서 새 rule을 error로 활성화했다.
- `scripts/oxlint/workspace-rules.test.mjs`에 RuleTester 기반 회귀 테스트를 추가했다.
- 현재 전체 lint는 새 rule이 기존 의존성 위반을 검출하면서 실패한다. 후속 작업에서 API와 DB 패키지의 실제 import 방향을 정리해야 한다.

## 2026-06-18 의존성 정리 완료

- `apps/api`에서 `@workspace/db`, Drizzle, OpenAI SDK 직접 import를 제거했다.
- `packages/db`에서 `@workspace/core` import를 제거했다.
- repository 구현과 학습자 API 런타임 조립은 `packages/core`로 이동했다.
- 전체 `bun run lint` 기준으로 `workspace/no-invalid-workspace-dependency` 위반이 없어졌다.
