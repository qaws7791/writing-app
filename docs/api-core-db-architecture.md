# API-core-DB 아키텍처 개편

## 2026-06-18 시작

- 학습자 API 런타임 의존성 방향은 `apps/api -> packages/core -> packages/db`로 고정한다.
- `apps/api`는 Hono routing, middleware, 인증 헤더 전달, HTTP request/response mapping, 에러 매핑만 담당한다.
- `packages/core`는 도메인 규칙, 유스케이스, repository port와 구현, transaction 경계, DB query, Better Auth profile onboarding, OpenAI feedback adapter를 담당한다.
- `packages/db`는 core를 모르는 Drizzle SQLite client, schema, migration, seed primitive만 제공한다.
- 이번 범위에서는 `apps/admin-api`를 같은 방향으로 정리하지 않는다.

## 2026-06-18 완료

- `apps/api`의 DB, Drizzle, OpenAI, Better Auth 영속성 조립을 `packages/core`의 `createLearnerApiCore`로 이동했다.
- 학습자 API route dependency는 repository 구현 대신 core service와 reader interface를 받는다.
- learner auth, onboarding, session resolver, OpenAI feedback provider adapter는 `packages/core`로 이동했다.
- content, learning, AI feedback, admin Drizzle repository 구현은 `packages/core`로 이동했다.
- `packages/db`는 persisted enum 값, client, schema, migration, seed, content archive policy만 제공하고 `@workspace/core`를 import하지 않는다.
- package manifest는 `apps/api -> packages/core -> packages/db` 방향에 맞춰 조정했다.
