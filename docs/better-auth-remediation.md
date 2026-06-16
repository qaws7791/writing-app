# Better Auth 인증 개선 기록

## 2026-06-16 시작

- 목표: 학습자 API와 관리자 API의 인증 경계를 Better Auth `1.6.11` 권장 흐름에 맞춘다.
- 범위:
  - Better Auth Drizzle adapter schema 매핑을 명시한다.
  - 보호 API 세션 검증을 직접 DB 토큰 조회가 아닌 `auth.api.getSession({ headers })` 기반으로 바꾼다.
  - Better Auth session cookie를 브라우저 JavaScript에서 읽지 않는 구조로 정리한다.
  - 로그아웃과 관리자 로그인 경로를 Better Auth endpoint 계약에 맞춘다.
  - 관리자 인증은 Google/OAuth 없이 ID/password credential 계정만 허용한다.
- 원칙: 세션 쿠키는 httpOnly 상태를 유지하고, 브라우저 요청은 `credentials: "include"`로 쿠키를 전달한다.

## 2026-06-16 완료

- 학습자 Better Auth Drizzle adapter schema에 `user`, `session`, `account`, `verification` model key를 명시했다.
- 학습자와 관리자 보호 API의 세션 확인을 `auth.api.getSession({ headers })` 기반으로 바꿨다.
- 프론트엔드 API 클라이언트는 Better Auth 세션 쿠키를 Bearer 헤더로 변환하지 않고, 서버에서 읽은 쿠키 값은 `Cookie` 헤더로 전달하며 브라우저 요청은 `credentials: "include"`를 사용한다.
- 로그아웃은 Better Auth `POST /api/auth/sign-out` endpoint를 호출한 뒤 안전한 내부 경로로 이동한다.
- 어드민 Better Auth Drizzle adapter schema는 `admin_user`, `admin_session`, `admin_account`, `admin_verification` model key를 명시해 `modelName`과 실제 테이블 매핑을 일치시킨다.
- 어드민 API는 `socialProviders`를 열지 않고 email/password credential 로그인만 허용한다.
- 어드민 웹 로그인 화면은 Google 링크를 제거하고 `POST /api/auth/sign-in/email`을 `credentials: "include"`로 직접 호출한다.
- 최초 관리자 시드는 `admin_account.providerId = "credential"` 계정을 함께 만들고, 기존 비밀번호는 `ADMIN_SEED_RESET_PASSWORD=true`일 때만 갱신한다.
- 어드민 API 환경 정규화는 `ADMIN_BETTER_AUTH_SECRET`을 공통 `BETTER_AUTH_SECRET`보다 우선한다.
