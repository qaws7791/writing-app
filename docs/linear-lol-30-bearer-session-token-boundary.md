# Linear LOL-30 Bearer 세션 토큰 경계 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-30 Bearer 토큰으로 사용자 ID를 넣으면 로그인된다`
- 조사 범위: 학습자 API 세션 resolver, 관리자 API 세션 resolver, 세션 테이블 조회 경계, 테스트 실행 런타임
- 목표: `Authorization: Bearer <사용자 ID>`가 세션 토큰 없이 인증되는지 확인하고, 실제 세션 테이블 토큰만 인증 경계로 인정하도록 좁힌다.

## 판단

이슈는 타당하다.

- `apps/api/src/auth/auth.ts`의 `createBearerSessionResolver`는 `auth_sessions.token`으로 세션을 찾지 못하면 같은 문자열을 `auth_users.id`로 다시 조회했다.
- `apps/admin-api/src/auth/admin-auth.ts`의 `createAdminBearerSessionResolver`도 `admin_auth_sessions.token` 조회 실패 후 `admin_auth_users.id`를 fallback으로 조회했다.
- 사용자 ID와 관리자 ID는 세션 식별자가 아니며, fixture, URL, 로그, 화면에 노출될 수 있다.
- 따라서 Bearer 토큰은 세션 테이블의 유효하고 만료되지 않은 토큰과 일치할 때만 인증되어야 한다.

## 2026-06-15 완료

- 학습자 API resolver에서 사용자 ID fallback 조회를 제거했다.
- 관리자 API resolver에서 관리자 ID fallback 조회를 제거했다.
- 두 resolver 모두 유효한 세션 토큰은 기존처럼 통과하고, 사용자 ID 또는 관리자 ID 문자열은 `null`로 거절하는 테스트를 추가했다.
- resolver와 테스트는 필요한 DB client/schema만 import하도록 좁혀, `@workspace/db` 루트 export를 통한 불필요한 core import를 피했다.
- resolver 테스트는 fake DB를 사용하는 단위 테스트로 작성해 기본 `bun --filter ... test` 경로에서 실행되게 했다.

## 검증

- `bun --filter @workspace/api test src/auth/auth.test.ts`
- `bun --filter @workspace/admin-api test src/auth/admin-auth.test.ts`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/admin-api typecheck`
