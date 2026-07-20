# 인증·권한 정책

## 목적

이 문서는 사용자 역할, 접근 정책과 권한 변경 절차를 정의한다. 현재 인증 handler, session, cookie, middleware, endpoint와 schema는 API source와 contracts가 소유한다.

## 역할과 접근

| 역할          | 허용 목적                                           | 금지                                |
| ------------- | --------------------------------------------------- | ----------------------------------- |
| 비인증 사용자 | 공개 정보 확인과 자기 인증 시작                     | 보호된 학습·운영 데이터 접근        |
| 학습자        | 자신의 프로필, 학습 콘텐츠와 진행 관리              | 다른 사용자의 데이터·운영 기능 접근 |
| 운영자        | 일상적인 콘텐츠·사용자·분석 조회와 허용된 운영 작업 | owner 전용의 파괴적·권한 변경 작업  |
| owner         | 운영 정책상 필요한 관리 작업                        | 자기 권한 우회와 감사 불가능한 변경 |

## 정책 원칙

- 학습자 인증과 관리자 인증은 credential, session, cookie, 권한 해석과 감사 수명을 분리한다.
- 모든 보호 요청은 현재 session과 필요한 역할을 서버에서 다시 검증한다.
- UI의 메뉴 숨김은 보안 경계가 아니며, command와 query 모두 서버 인가를 거친다.
- 권한이 없는 요청은 존재 여부나 내부 상태를 불필요하게 노출하지 않는 안정된 오류로 거부한다.
- test-only 인증은 production에서 활성화할 수 없다.

## 권한 변경 절차

1. 제품 운영 정책과 최소 권한 원칙에 맞는지 확인한다.
2. 역할·권한 policy, route middleware, application authorization과 UI 표현을 함께 검토한다.
3. 비인증, 허용 역할, 거부 역할, session 만료와 credential 변경 후 session 폐기 경로를 테스트한다.
4. owner 범위, 데이터 삭제 또는 외부 영향이 있으면 감사·rollback 절차와 ADR 필요성을 판단한다.

## 현재 구현 탐색

현재 endpoint, 인증 provider, cookie 속성, middleware 배치와 role source는 [사실별 권위 지도](../authority-map.md)의 API·인증 권위 소스에서 확인한다.
