# 유저 스토리 목록

## 목적

유저 스토리는 사용자가 어떤 목표를 왜 달성하려는지 설명한다. 하나의 유저 스토리는 독립적인 사용자 가치를 가져야 하며, 인수 기준은 해당 스토리가 완료됐다고 판단할 수 있는 조건으로 제한한다.

## 작성 기준

- ID는 고정 자릿수를 사용하지 않는다.
- 파일명은 ID와 짧은 제목을 케밥 케이스로 쓴다.
- 플랫폼 유저 스토리의 주 사용자는 학습자다.
- 어드민 유저 스토리의 주 사용자는 소유자 관리자다.
- 요구사항, 화면 명세, API, 데이터 세부 규칙은 관련 문서로 연결한다.
- 하나의 파일은 하나의 유저 스토리만 담는다.

## ID 규칙

| 접두사   | 의미                             |
| -------- | -------------------------------- |
| `US-LRN` | 플랫폼 학습자 유저 스토리        |
| `US-ADM` | 어드민 소유자 관리자 유저 스토리 |

## 플랫폼

| ID                                                                 | 제목                     | 주 사용자 | 관련 요구사항 | 관련 화면                       | 상태 |
| ------------------------------------------------------------------ | ------------------------ | --------- | ------------- | ------------------------------- | ---- |
| [US-LRN-1](./platform/us-lrn-1-learner-authentication.md)          | 학습자 인증              | 학습자    | `REQ-LRN-1`   | `SCR-002`                       | 기준 |
| [US-LRN-2](./platform/us-lrn-2-continue-learning.md)               | 이어서 학습              | 학습자    | `REQ-LRN-2`   | `SCR-003`, `SCR-006`            | 기준 |
| [US-LRN-3](./platform/us-lrn-3-start-first-course.md)              | 첫 코스 선택             | 학습자    | `REQ-LRN-3`   | `SCR-003`, `SCR-004`, `SCR-005` | 기준 |
| [US-LRN-4](./platform/us-lrn-4-view-course-detail.md)              | 코스 상세 확인           | 학습자    | `REQ-LRN-3`   | `SCR-005`                       | 기준 |
| [US-LRN-5](./platform/us-lrn-5-complete-lesson-steps.md)           | 레슨 스텝 완료           | 학습자    | `REQ-LRN-4`   | `SCR-006`                       | 기준 |
| [US-LRN-6](./platform/us-lrn-6-submit-writing-answer.md)           | 쓰기 답변 제출           | 학습자    | `REQ-LRN-5`   | `SCR-006`                       | 기준 |
| [US-LRN-7](./platform/us-lrn-7-receive-ai-coaching.md)             | AI 코칭 받기             | 학습자    | `REQ-LRN-6`   | `SCR-006`                       | 기준 |
| [US-LRN-8](./platform/us-lrn-8-manage-profile.md)                  | 프로필 확인과 계정 관리  | 학습자    | `REQ-LRN-7`   | `SCR-007`                       | 기준 |
| [US-LRN-9](./platform/us-lrn-9-understand-product-before-login.md) | 로그인 전 제품 이해      | 학습자    | `REQ-LRN-8`   | `SCR-001`                       | 기준 |
| [US-LRN-10](./platform/us-lrn-10-navigate-learner-app.md)          | 학습자 앱 주요 화면 이동 | 학습자    | `REQ-LRN-9`   | `SCR-003`, `SCR-004`, `SCR-007` | 기준 |
| [US-LRN-11](./platform/us-lrn-11-solve-checkable-activities.md)    | 정답 확인형 활동 풀이    | 학습자    | `REQ-LRN-10`  | `SCR-006`                       | 기준 |

## 어드민

| ID                                                     | 제목                  | 주 사용자     | 관련 요구사항 | 관련 화면                                  | 상태 |
| ------------------------------------------------------ | --------------------- | ------------- | ------------- | ------------------------------------------ | ---- |
| [US-ADM-1](./admin/us-adm-1-admin-login.md)            | 어드민 로그인         | 소유자 관리자 | `REQ-ADM-1`   | `SCR-101`                                  | 기준 |
| [US-ADM-2](./admin/us-adm-2-view-product-status.md)    | 제품 상태 조회        | 소유자 관리자 | `REQ-ADM-2`   | `SCR-102`, `SCR-107`                       | 기준 |
| [US-ADM-3](./admin/us-adm-3-operate-content.md)        | 콘텐츠 운영           | 소유자 관리자 | `REQ-ADM-3`   | `SCR-103`, `SCR-104`                       | 기준 |
| [US-ADM-4](./admin/us-adm-4-operate-users.md)          | 사용자 운영           | 소유자 관리자 | `REQ-ADM-4`   | `SCR-105`, `SCR-106`                       | 기준 |
| [US-ADM-6](./admin/us-adm-6-navigate-admin-console.md) | 어드민 주요 메뉴 이동 | 소유자 관리자 | `REQ-ADM-6`   | `SCR-102`, `SCR-103`, `SCR-105`, `SCR-107` | 기준 |
