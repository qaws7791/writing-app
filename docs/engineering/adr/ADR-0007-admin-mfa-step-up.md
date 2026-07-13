# ADR-0007: owner 관리자 TOTP MFA와 step-up 경계

## 상태

ADR-0008로 대체됨

2026-07-14에 TOTP MFA, 복구 코드와 step-up 인증을 제거했다. 이 문서는 당시 결정을 보존하는 역사 기록이다.

## 맥락

owner는 비밀번호 한 단계만으로 사용자 상태 변경·삭제, 운영 설정 변경, 콘텐츠 초기화 같은 고위험 작업을 실행할 수 있었다. 세션 생성 시각을 이용한 fresh-session 경계도 없었고 인증 앱 분실 시 안전한 복구 정책도 정의되어 있지 않았다.

## 결정

- owner의 두 번째 인증 요소는 Better Auth `twoFactor` plugin의 TOTP를 사용한다.
- owner가 MFA를 등록하지 않은 비밀번호 세션은 activation 세션으로 취급한다. `/session`과 MFA 등록 endpoint 외 관리자 API를 사용할 수 없다.
- operator는 MFA 의무 대상이 아니며 기존 조회·자료실 운영 범위를 유지한다. owner 전용 변경 권한은 얻지 않는다.
- owner 변경은 TOTP 검증으로 생성된 지 10분 이내인 세션만 허용한다. transport middleware와 `AdminActor.authenticationAssurance` application 정책이 같은 결정을 각각 검증한다.
- 신뢰 기기 기능은 사용하지 않는다. 10분이 지나면 비밀번호와 TOTP로 다시 로그인해 새 세션을 만든다.
- 복구 코드는 16byte 난수 10개를 발급하고 SHA-256 해시만 별도 행에 저장한다. 성공한 코드는 한 번만 소비하며 MFA 설정과 모든 관리자 세션을 폐기한다. 복구 후 owner는 MFA를 다시 등록해야 한다.
- API 경계에서 비밀번호 변경 요청의 `revokeOtherSessions`를 항상 `true`로 강제한다. Better Auth adapter가 비밀번호를 갱신한 뒤 서버 인증 handler가 새로 교체된 session까지 다시 삭제하고 session cookie를 만료한다.

## 결과

- 비밀번호 탈취만으로 owner 완전 세션이나 고위험 변경을 수행할 수 없다.
- MFA 등록과 step-up 누락은 각각 `MFA_ENROLLMENT_REQUIRED`, `STEP_UP_REQUIRED`로 관찰 가능하다.
- 인증 앱 분실 복구는 계정 비밀번호와 미사용 복구 코드가 모두 필요하고, 복구 성공 뒤 기존 세션을 재사용할 수 없다.
