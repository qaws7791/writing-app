# Better Auth 공식 스키마 전환

- 작업 시작: 2026-06-16
- 기준 문서: Better Auth 설치 문서와 Database Core Schema 문서

## 목표

직접 구현한 학습자 Google OAuth 처리와 커스텀 인증 테이블명을 제거하고 Better Auth 런타임과 공식 core schema를 기준으로 인증 경계를 정리한다.

서비스 사용자가 보는 로그인, 세션 유지, 보호 API 접근 흐름은 유지한다.

## 시작 시점 확인

- 학습자 인증 DB 테이블은 `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications` 이름을 사용한다.
- 학습자 Google OAuth route는 Google authorization URL, state cookie, token 교환, 세션 저장을 직접 처리한다.
- Better Auth 공식 core schema는 `user`, `session`, `account`, `verification` 테이블을 기준으로 한다.
- `account` 테이블은 `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password` 필드를 포함한다.

## 완료 기준

- 학습자 인증 endpoint는 Hono의 `/api/auth/*`에서 Better Auth handler가 직접 처리한다.
- 학습자 인증 테이블은 `user`, `session`, `account`, `verification` 이름과 공식 core schema 컬럼을 사용한다.
- 관리자 인증 테이블은 플랫폼 사용자 테이블과 충돌하지 않도록 `admin_user`, `admin_session`, `admin_account`, `admin_verification` 이름을 쓰며, 컬럼 형태는 Better Auth core schema를 따른다.
- 기존 보호 API의 Bearer token 경계는 유지하되, Better Auth가 서명한 세션 쿠키 값에서 실제 세션 token을 읽는다.
