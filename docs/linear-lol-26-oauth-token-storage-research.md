# Linear LOL-26 OAuth 토큰 평문 저장 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-26 토큰 평문 저장 문제`
- 조사 범위: 학습자 Google OAuth route, 인증 DB schema, 세션 해석 경계, 관련 문서
- 목표: `auth_accounts.access_token`, `refresh_token`, `id_token` 평문 저장 지적이 현재 코드 기준으로 재현되는지 확인하고, 해결 필요성을 판단한다.

## 관찰

- `packages/db/src/schema/auth.schema.ts`의 `authAccounts`는 `accessToken`, `refreshToken`, `idToken`을 nullable text 컬럼으로 둔다.
- `packages/db/src/schema/admin-auth.schema.ts`의 `adminAuthAccounts`도 같은 토큰 컬럼을 가진다.
- `packages/db/src/migrations/0000-kwep-baseline.sql`도 `auth_accounts`와 `admin_auth_accounts`에 `access_token`, `refresh_token`, `id_token` text 컬럼을 만든다.
- `apps/api/src/routes/google-oauth.route.ts`는 Google callback에서 token endpoint 응답을 받은 뒤 `readGoogleUserInfo` 호출에 `accessToken`을 사용한다.
- 같은 route의 `upsertGoogleUser`는 `authAccounts`에 `accessToken`, `refreshToken`, `idToken`을 그대로 저장하고, 충돌 시에도 같은 값을 업데이트한다.
- `apps/api/src/auth/auth.ts`의 세션 해석은 `auth_sessions.token`과 `auth_users`, `learner_profiles`만 조회한다.
- `rg` 기준으로 저장된 `authAccounts.accessToken`, `refreshToken`, `idToken`을 다시 읽어 Google API 호출, refresh, account linking 등에 사용하는 코드가 없다.
- Google authorization 요청 scope는 `openid email profile`이고 `access_type=offline`을 요청하지 않는다. 일반 흐름에서는 refresh token이 없을 가능성이 크지만, 코드가 refresh token을 받으면 그대로 저장한다.
- 관리자 인증은 현재 이메일/password 시드 경로가 중심이고, `adminAuthAccounts` 토큰 컬럼에 실제 OAuth 토큰을 쓰는 코드는 보이지 않는다.
- 토큰 암호화를 위한 키, AES-GCM helper, 암복호화 경계는 현재 없다.

## 판단

이슈는 타당하며 해결이 필요하다.

- 실제 학습자 Google OAuth callback은 Google access token과 id token, 존재할 경우 refresh token을 평문으로 DB에 저장한다.
- 현재 제품 기능은 로그인 인증과 내부 세션 발급만 필요로 하며, 저장된 OAuth 토큰을 이후에 사용하지 않는다.
- 사용하지 않는 외부 provider token을 저장하는 것은 DB 유출 시 피해 범위를 불필요하게 키운다.
- 이 경우 우선 해결책은 토큰 암호화가 아니라 저장하지 않는 것이다. 암호화는 “나중에 Google API를 지속 호출해야 한다”는 명확한 요구가 있을 때 키 관리, rotation, nonce 저장, 복호화 실패 처리까지 포함해 별도 설계로 다뤄야 한다.
- schema 컬럼은 Better Auth 계열 account 계약 또는 향후 호환성 때문에 당장 제거하지 않아도 된다. 다만 현재 custom Google OAuth route에서는 값을 `null`로 저장하는 것이 더 작고 안전하다.

## 권장 해결 방향

1. `apps/api/src/routes/google-oauth.route.ts`의 `upsertGoogleUser`에서 `authAccounts` 저장 값 중 `accessToken`, `refreshToken`, `idToken`을 모두 `null`로 둔다.
2. Google userinfo 조회에는 callback 처리 중 받은 access token만 메모리에서 사용하고 DB에 남기지 않는다.
3. 테스트에 “Google callback 후 account row에 provider token을 저장하지 않는다”는 회귀 케이스를 추가한다.
4. schema 컬럼 제거는 별도 마이그레이션 이슈로 분리한다. 기존 데이터 삭제, Better Auth 호환성, 운영 데이터 migration 범위가 함께 필요하다.
5. 향후 Google Calendar, Drive 같은 provider API 연동이 생기면 그때 OAuth token 저장 요구를 새로 정의하고, envelope encryption 또는 KMS 기반 암호화 설계를 별도 문서로 만든다.

## 2026-06-15 실행 완료

- LOL-26은 현재 코드에서 재현되는 실제 보안 문제다.
- 즉시 권장되는 수정은 “암호화해서 저장”이 아니라 “현재 필요 없는 provider token을 저장하지 않기”다.
- `apps/api/src/routes/google-oauth.route.test.ts`에 Google callback 후 provider token을 DB 저장 값에 남기지 않는 회귀 테스트를 추가했다.
- `apps/api/src/routes/google-oauth.route.ts`의 `upsertGoogleUser`는 `accessToken`, `refreshToken`, `idToken`을 insert/update 모두 `null`로 저장한다.
- Google userinfo 조회는 callback 처리 중 받은 access token만 메모리에서 사용하고 DB에 남기지 않는다.
