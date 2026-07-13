# ADR-0008: 관리자 비밀번호 전용 인증

## 상태

승인

## 맥락

관리자 운영 환경에서 TOTP MFA 등록, 인증 앱 운영, 복구 코드 및 step-up 재인증은 요구되지 않는다. 이 기능은 owner의 정상 로그인과 로컬 개발 환경을 불필요하게 복잡하게 만들었다.

## 결정

- 관리자 인증은 Better Auth email/password 로그인만 사용한다.
- `owner`와 `operator` 역할은 유지한다.
- 변경성 관리자 route와 application use case는 기존처럼 owner 역할을 이중 검증한다.
- TOTP MFA, 복구 코드, step-up 인증 API·UI·세션 상태·DB schema를 제거한다.
- 비밀번호 변경 성공 시 모든 관리자 session을 폐기하는 동작은 유지한다.

## 결과

- owner는 로그인 직후 자신의 역할 권한 범위에서 변경성 작업을 수행할 수 있다.
- operator의 변경성 작업은 계속 `FORBIDDEN`으로 거부된다.
- 기존 DB의 MFA secret과 복구 코드 hash는 migration에서 삭제되며 복구할 수 없다.
