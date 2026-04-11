---
title: "Storybook 운영 가이드"
description: "apps/storybook 역할과 운영 원칙. @workspace/ui 컴포넌트의 시각적 검증과 접근성 점검을 담당합니다."
---

## 역할

`apps/storybook`은 `@workspace/ui` 패키지를 검증하고 시각적으로 점검하는 워크벤치입니다.
제품 화면 프리뷰가 아닌, 공용 컴포넌트와 디자인 패턴의 격리 테스트 환경입니다.

## 책임

- 공용 컴포넌트의 상태별 시각 확인 (default, hover, disabled, error 등)
- 디자인 토큰과 패턴 검증 (색상, 타이포그래피, 간격)
- 접근성 점검 보조 (addon-a11y)

## 기술 스택

| 구성      | 버전/라이브러리       |
| --------- | --------------------- |
| Storybook | 10                    |
| Runtime   | Vite                  |
| Framework | React                 |
| Addon     | @storybook/addon-a11y |

## 개발 명령

```bash
# 루트에서 실행
bun storybook        # 개발 서버 시작
bun build:storybook  # 정적 빌드
```

## 운영 원칙

- `@workspace/ui`의 공용 컴포넌트 변경 시, 관련 스토리와 함께 검증합니다.
- 제품 고유 화면(로그인, 홈 등)보다 재사용 가능한 UI 조합과 패턴을 우선 다룹니다.
- 스토리는 컴포넌트의 실제 사용 시나리오를 반영해야 합니다.

## 관련 문서

- UI 패키지 가이드 → [[../04-engineering/frontend-architecture-guide|프론트엔드 아키텍처 가이드]]
- 로컬 개발 환경 → [[local-development|로컬 개발 가이드]]
