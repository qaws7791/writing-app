# 디자인 문서 인덱스

## 목적

이 문서는 디자인 문서의 진입점이다. 사용자는 여기에서 제품 화면, 정보 구조, 컴포넌트, 시각 기준, 접근성, 에셋 정책의 위치를 찾는다.

## 탐색 순서

1. 제품의 전체 디자인 방향은 `design-brief.md`에서 확인한다.
2. 라우트와 화면 구조는 `ia-spec.md`와 `screens/` 문서에서 확인한다.
3. 구현에 필요한 공통 기준은 `foundations.md`, `components.md`, `patterns.md`에서 확인한다.
4. 품질 기준은 `accessibility.md`, `assets.md`, `text-localization-policy.md`에서 확인한다.
5. 공유 UI의 격리된 예제와 검증 기준은 `storybook.md`에서 확인한다.

## 디렉토리 지도

| 경로                   | 목적                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `docs/design/`         | 디자인 방향, 정보 구조, UI 구성 요소, 접근성, 에셋 기준을 관리한다.                  |
| `docs/design/screens/` | 학습자와 어드민의 개별 화면별 목적, 라우트, 정보 구조, 상태, 접근성 기준을 관리한다. |

## 파일 지도

| 파일                                       | 목적                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `_index.md`                                | 디자인 문서 전체의 진입점과 탐색 지도를 제공한다.                                     |
| `design-brief.md`                          | 제품 정체성, 브랜드 톤, 아트 디렉션, 앱별 디자인 방향을 정의한다.                     |
| `ia-spec.md`                               | 학습자 앱과 어드민 앱의 라우트, 네비게이션, 사이트맵을 정의한다.                      |
| `foundations.md`                           | 색상, 타이포그래피, 간격, radius, shadow, motion 같은 디자인 토큰 기준을 정의한다.    |
| `components.md`                            | Button, Card, Input, Progress, Shell, Admin Table 같은 공통 컴포넌트 기준을 정의한다. |
| `patterns.md`                              | 학습자와 어드민 화면에서 반복되는 UI 패턴과 상태 표현 방식을 정의한다.                |
| `accessibility.md`                         | 키보드 탐색, 레슨 접근성, Form, motion, 언어 기준을 정의한다.                         |
| `assets.md`                                | 아이콘, 이미지, SVG, 어드민 에셋, 파일 관리 기준을 정의한다.                          |
| `text-localization-policy.md`              | 화면 문구의 한국어 현지화 원칙, 적용 범위, 예외, 구현 규칙을 정의한다.                |
| `storybook.md`                             | 공유 UI 스토리의 작성, interaction과 접근성 검증 기준을 정의한다.                     |
| `screens/SCR-001-learner-landing.md`       | 학습자 랜딩 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                 |
| `screens/SCR-002-learner-login.md`         | 학습자 로그인 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.               |
| `screens/SCR-003-learner-home.md`          | 학습 홈 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                     |
| `screens/SCR-004-learner-courses.md`       | 코스 목록 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                   |
| `screens/SCR-005-learner-course-detail.md` | 코스 상세 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                   |
| `screens/SCR-006-learner-lesson.md`        | 레슨 진행 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                   |
| `screens/SCR-007-learner-profile.md`       | 프로필 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                      |
| `screens/SCR-101-admin-login.md`           | 관리자 로그인 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.               |
| `screens/SCR-102-admin-dashboard.md`       | 어드민 대시보드 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.             |
| `screens/SCR-103-admin-courses.md`         | 콘텐츠 관리 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                 |
| `screens/SCR-104-admin-course-detail.md`   | 코스 편집 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                   |
| `screens/SCR-105-admin-users.md`           | 사용자 관리 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                 |
| `screens/SCR-106-admin-user-detail.md`     | 사용자 상세 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                 |
| `screens/SCR-107-admin-analytics.md`       | 분석 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                        |
| `screens/SCR-108-admin-audit.md`           | 감사 이력 화면의 목적, 정보 구조, UI 기준, 상태, 접근성을 정의한다.                   |

## 관리 기준

새 화면을 추가하면 `ia-spec.md`, 관련 `screens/SCR-*.md`, 제품의 관련 유저 스토리와 요구사항을 함께 확인한다. 컴포넌트나 패턴을 바꾸면 개별 화면 문서보다 공통 기준 문서를 먼저 갱신한다.
