# 요구사항 목록

## 목적

요구사항은 유저 스토리를 구현 가능한 제품 규칙으로 바꾼 문서다. 개발자는 이 문서에서 기능, 화면, 데이터, 권한, 오류, 비범위를 확인하고 상세 구현 계약은 엔지니어링 문서와 코드에서 확인한다.

## 작성 기준

- ID는 고정 자릿수를 사용하지 않는다.
- 파일명은 ID와 짧은 제목을 케밥 케이스로 쓴다.
- 요구사항은 실제 코드나 함수명을 장황하게 적지 않는다.
- API, 데이터, 권한, 오류는 구현 판단이 가능한 수준으로만 적는다.
- 하나의 파일은 밀접하게 연결된 요구사항 묶음 하나만 담는다.

## ID 규칙

| 접두사    | 의미                          |
| --------- | ----------------------------- |
| `REQ-LRN` | 플랫폼 학습자 요구사항        |
| `REQ-ADM` | 어드민 소유자 관리자 요구사항 |

## 플랫폼

| ID                                                          | 제목                 | 출처 유저 스토리       | 관련 화면                       | 상태 |
| ----------------------------------------------------------- | -------------------- | ---------------------- | ------------------------------- | ---- |
| [REQ-LRN-1](./platform/req-lrn-1-learner-authentication.md) | 학습자 인증          | `US-LRN-1`             | `SCR-002`                       | 기준 |
| [REQ-LRN-2](./platform/req-lrn-2-continue-learning.md)      | 이어서 학습          | `US-LRN-2`             | `SCR-003`, `SCR-006`            | 기준 |
| [REQ-LRN-3](./platform/req-lrn-3-course-discovery.md)       | 코스 탐색과 시작     | `US-LRN-3`, `US-LRN-4` | `SCR-003`, `SCR-004`, `SCR-005` | 기준 |
| [REQ-LRN-4](./platform/req-lrn-4-lesson-progression.md)     | 레슨 진행            | `US-LRN-5`             | `SCR-006`                       | 기준 |
| [REQ-LRN-5](./platform/req-lrn-5-writing-answer.md)         | 쓰기 답변            | `US-LRN-6`             | `SCR-006`                       | 기준 |
| [REQ-LRN-6](./platform/req-lrn-6-ai-coaching.md)            | AI 코칭              | `US-LRN-7`             | `SCR-006`                       | 기준 |
| [REQ-LRN-7](./platform/req-lrn-7-profile-account.md)        | 프로필과 계정 관리   | `US-LRN-8`             | `SCR-007`                       | 기준 |
| [REQ-LRN-8](./platform/req-lrn-8-public-landing.md)         | 공개 랜딩            | `US-LRN-9`             | `SCR-001`                       | 기준 |
| [REQ-LRN-9](./platform/req-lrn-9-learner-navigation.md)     | 학습자 앱 내비게이션 | `US-LRN-10`            | `SCR-003`, `SCR-004`, `SCR-007` | 기준 |
| [REQ-LRN-10](./platform/req-lrn-10-checkable-activities.md) | 정답 확인형 활동     | `US-LRN-11`            | `SCR-006`                       | 기준 |

## 어드민

| ID                                                    | 제목              | 출처 유저 스토리 | 관련 화면                                  | 상태 |
| ----------------------------------------------------- | ----------------- | ---------------- | ------------------------------------------ | ---- |
| [REQ-ADM-1](./admin/req-adm-1-admin-login.md)         | 어드민 로그인     | `US-ADM-1`       | `SCR-101`                                  | 기준 |
| [REQ-ADM-2](./admin/req-adm-2-dashboard-analytics.md) | 운영 지표와 분석  | `US-ADM-2`       | `SCR-102`, `SCR-107`                       | 기준 |
| [REQ-ADM-3](./admin/req-adm-3-content-operations.md)  | 콘텐츠 운영       | `US-ADM-3`       | `SCR-103`, `SCR-104`                       | 기준 |
| [REQ-ADM-4](./admin/req-adm-4-user-operations.md)     | 사용자 운영       | `US-ADM-4`       | `SCR-105`, `SCR-106`                       | 기준 |
| [REQ-ADM-6](./admin/req-adm-6-admin-navigation.md)    | 어드민 내비게이션 | `US-ADM-6`       | `SCR-102`, `SCR-103`, `SCR-105`, `SCR-107` | 기준 |
