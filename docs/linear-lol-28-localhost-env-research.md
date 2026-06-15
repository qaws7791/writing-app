# LOL-28 로컬호스트와 환경 변수 관리 조사

## 개요

- Linear 이슈: `LOL-28`
- 제목: 하드코딩된 로컬호스트와 환경변수 관리
- 조사일: 2026-06-15
- 결론: 문제 제기는 타당하다. `localhost` 문자열 전체가 문제는 아니지만, 런타임 기본값과 문서화된 로컬 표준 포트가 불일치하는 지점이 있고 일부 테스트가 오래된 기본값을 고정하고 있다.

## 확인한 현상

현재 문서와 예시 환경 파일은 로컬 실행 기준을 다음처럼 제시한다.

- 학습자 웹: `http://localhost:3000`
- 학습자 API: `http://localhost:4000`
- 어드민 웹: `http://localhost:3001`
- 어드민 API: `http://localhost:4001`

하지만 실행 코드의 기본값에는 이전 포트로 보이는 값이 남아 있다.

- `packages/env/src/parse-env.ts`
  - `API_PORT` 기본값: `3001`
  - `ADMIN_API_PORT` 기본값: `3002`
  - `ADMIN_ORIGIN` 기본값: `http://localhost:3003`
- `apps/web/src/lib/api/get-server-writing-app-api.ts`
  - `WEB_API_BASE_URL`이 없으면 `http://localhost:3001`
- `apps/web/src/lib/api/get-browser-writing-app-api.ts`
  - `NEXT_PUBLIC_API_BASE_URL`이 없으면 `http://localhost:3001`
- `apps/admin/src/lib/api/get-server-admin-api.ts`
  - `ADMIN_API_BASE_URL`이 없으면 `http://localhost:3002`
- `apps/admin-api/src/app.ts`
  - `adminOrigin` 의존성이 없으면 `http://localhost:3003`

반면 `apps/api/.env.example`, `apps/web/.env.example`, `apps/admin-api/.env.example`, `apps/admin/.env.example`, `docs/operations-environment.md`는 `4000`, `4001`, `3001` 조합을 기준으로 한다.

## 타당한 문제

환경 변수가 빠진 로컬 실행이나 테스트 fixture가 실제 런타임 기본값을 사용하면 문서화된 표준 포트와 다른 서버로 붙을 수 있다. 특히 `apps/web`은 `.env`가 없으면 API를 `4000`이 아니라 `3001`로 호출하므로, 현재 어드민 웹 포트와 충돌한다.

`packages/env`의 기본 포트가 문서와 달라서 `parseApiEnv()`와 `parseAdminApiEnv()`도 입력이 비어 있을 때 각각 `3001`, `3002`, `http://localhost:3003`을 만든다. `apps/api/src/env.test.ts`와 `apps/admin-api/src/env.test.ts`는 이 값을 기대값으로 고정하고 있어, 오래된 기본값이 테스트로 보호되는 상태다.

## 반례와 제외할 범위

테스트의 모든 `localhost` 문자열을 제거할 필요는 없다. 예를 들어 CORS preflight 테스트에서 `Origin: http://localhost:3000`을 넣고 `access-control-allow-origin`을 검증하는 것은 동작 명세를 드러내는 fixture다.

문서의 스모크 테스트 URL, 과거 작업 계획, 브라우저 캡처 스크립트에 남은 `localhost`도 운영 설정 주입 문제와는 성격이 다르다. 이 이슈의 핵심은 문자열 존재 자체가 아니라, 런타임 기본값과 현재 환경 변수 계약이 분산되고 불일치한다는 점이다.

## 권장 조치

우선 문서와 `.env.example`을 기준으로 런타임 기본값을 정리한다.

- `packages/env/src/parse-env.ts`의 `API_PORT` 기본값을 `4000`으로 맞춘다.
- `packages/env/src/parse-env.ts`의 `ADMIN_API_PORT` 기본값을 `4001`로 맞춘다.
- `packages/env/src/parse-env.ts`의 `ADMIN_ORIGIN` 기본값을 `http://localhost:3001`로 맞춘다.
- `apps/web` API client fallback은 `http://localhost:4000`으로 맞추거나, 환경 변수가 없을 때 명시적으로 실패하도록 결정한다.
- `apps/admin` API client fallback은 `http://localhost:4001`로 맞추거나, 환경 변수가 없을 때 명시적으로 실패하도록 결정한다.
- `apps/admin-api/src/app.ts`와 테스트 의존성의 `adminOrigin` fallback은 `http://localhost:3001`로 맞춘다.
- 관련 테스트 기대값을 새 계약에 맞게 갱신한다.

운영 안전성을 더 높이려면 Next.js 앱도 서버 전용 env parser를 두고, API base URL이 없을 때 암묵적 localhost fallback에 의존하지 않는 방향을 검토한다. 다만 이 단계는 변경 범위가 넓어질 수 있으므로, 먼저 현재 로컬 표준 포트와 fallback을 일치시키는 작은 변경이 적절하다.

## 검증

- `bun --filter @workspace/env test`: 통과, 1 file / 4 tests
- `bun --filter @workspace/api test -- env.test.ts`: 통과, 1 file / 2 tests
- `bun --filter @workspace/admin-api test -- env.test.ts`: 통과, 1 file / 2 tests

현재 테스트 통과는 문제가 없다는 뜻이 아니라, 기존 기본값이 테스트에 반영되어 있음을 확인한 결과다.

## 구현 계획

- 계획 문서: `docs/superpowers/plans/2026-06-15-lol-28-local-runtime-defaults.md`
- 방향: `@workspace/env`에 로컬 런타임 기본값을 중앙화하고, 앱과 테스트는 해당 계약을 import한다.
- 재발 방지: `bun run check:localhost-literals`로 `apps/**`, `packages/**`의 원시 `http://localhost:*` URL을 검사한다.

## 구현 완료

- 완료일: 2026-06-15
- `packages/env/src/local-runtime-defaults.ts`에 로컬 런타임 포트와 URL 생성 규칙을 중앙화했다.
- `apps/**`와 `packages/**` 실행 코드 및 테스트는 로컬 URL literal 대신 `@workspace/env`의 중앙 계약을 참조한다.
- `scripts/check-localhost-literals.ts`와 `check:localhost-literals` script를 추가해 원시 `http://localhost:*` URL 재도입을 검사한다.
- 검증: `bun run check:localhost-literals`, `bun --filter @workspace/env test`, `bun --filter @workspace/api test`, `bun --filter @workspace/admin-api test`, `bun --filter @workspace/web test -- auth-navigation.test.ts`, 영향 패키지 typecheck, `bun lefthook run pre-commit`.
