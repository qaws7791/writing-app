# 관리자 MFA와 step-up 인증 (폐기됨)

이 문서는 과거 owner 관리자 MFA 등록, 로그인 복구, 민감 작업의 최근 재인증 경계를 기록한다. 현재 정책은 [ADR-0008](adr/ADR-0008-admin-password-only-auth.md)을 따른다.

## 작업 상태

- 기준일: 2026-07-12
- 상태: 2026-07-14 폐기

MFA와 step-up은 더 이상 제공하지 않는다. 아래 내용은 구현 당시의 역사 기록이다.

## 보안 목표

- owner의 고권한 변경은 비밀번호만 확인한 세션으로 실행하지 않는다.
- MFA 등록 여부와 최근 MFA 검증 여부를 transport와 `AdminActor` application 경계에서 모두 확인한다.
- MFA 등록, TOTP 로그인, 복구 코드 로그인, step-up 만료와 재인증을 사용자가 완료할 수 있는 경로를 제공한다.
- 등록되지 않았거나 오래된 인증 보증은 누락을 성공으로 해석하지 않고 명시적으로 거부한다.

## 검증 계획

- DB migration과 Better Auth plugin schema가 기존 DB와 신규 DB에서 일치하는지 검증한다.
- owner·operator, MFA 미등록·등록, 최근·만료 세션의 route와 application 권한 매트릭스를 고정한다.
- 로그인 2차 인증, 복구 코드, 등록 완료, step-up 만료 안내와 재인증 UI 상태를 검증한다.

## 구현 계약

- Better Auth의 관리자 user에 `two_factor_enabled`, 관리자 전용 `admin_two_factor` table을 연결한다.
- owner 비밀번호 로그인은 MFA가 활성화되어 있으면 완전한 session을 발급하지 않고 10분짜리 2차 인증 challenge를 발급한다.
- MFA 미등록 owner activation session은 `/session`과 `/api/auth/two-factor/*`만 사용할 수 있다.
- owner 변경의 step-up 유효 시간은 session 생성 후 10분이다. 만료 시 로그인 화면에서 비밀번호와 TOTP를 다시 확인한다.
- 복구 코드 원문은 등록 직후 한 번만 표시한다. DB에는 `admin_mfa_recovery_code.code_hash`만 저장하고 사용 시 `used_at`을 원자적으로 기록한다.
- 복구 성공은 TOTP 설정과 해당 owner의 모든 session을 삭제한다. 같은 복구 코드는 재사용할 수 없다.
- 비밀번호 변경은 Better Auth의 `revokeOtherSessions`를 항상 활성화한다. 성공 응답 뒤 서버가 Better Auth가 교체 발급한 현재 session까지 DB에서 삭제하고 session cookie를 만료한다.

## 권한 매트릭스

| 주체·보증                           | 조회·operator 작업 | owner 변경         | MFA 등록  |
| ----------------------------------- | ------------------ | ------------------ | --------- |
| operator 비밀번호 session           | 허용               | 거부               | 의무 아님 |
| owner MFA 미등록 activation session | 거부               | 거부               | 허용      |
| owner MFA 등록·step-up 만료         | 조회 허용          | `STEP_UP_REQUIRED` | 완료      |
| owner 최근 TOTP session             | 허용               | 허용               | 완료      |
