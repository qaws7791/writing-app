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
- 현재 스토리 소스는 `packages/ui/src/**/*.stories.tsx`만 Storybook에서 수집합니다. `apps/storybook` 내부에는 독립 스토리 디렉터리를 두지 않습니다.

## 런타임 주의사항

- `.storybook/manager.ts`에서 Storybook manager theme 색상은 hex 또는 rgb 계열 값만 사용합니다.
- `storybook/theming` 내부에서 `polished`를 사용하므로 `oklch(...)`를 직접 넣으면 `parseToRgb` 런타임 오류로 manager가 흰 화면이 될 수 있습니다.
- 정적 결과물은 `bunx serve` 대신 `http-server`로 서빙합니다. `serve`는 Storybook의 `iframe.html?id=...` 요청을 `/iframe`으로 리다이렉트하면서 query를 잃어 `No Preview`를 만들 수 있습니다.
- Storybook Vite 빌드는 워크스페이스 소스와 외부 UI 패키지의 최상위 `"use client"` 지시문을 번들 단계에서 제거합니다. 이는 Storybook이 React Server Component 경계를 사용하지 않기 때문이며, Next.js 앱 런타임용 소스 파일은 변경하지 않습니다.
- 정적 빌드에서는 `packages/ui/src`의 공유 런타임과 Storybook 자체 런타임, `react`, `react-aria`, `motion`, `axe-core` 등 주요 의존성을 별도 청크로 분리합니다. `chunkSizeWarningLimit`은 사용자 코드 청크가 아니라 Storybook이 생성하는 `vite-inject-mocker-entry.js`까지 포함해 1200으로 맞춥니다.

## 관련 문서

- UI 패키지 가이드 → [[../04-engineering/frontend-architecture-guide|프론트엔드 아키텍처 가이드]]
- 로컬 개발 환경 → [[local-development|로컬 개발 가이드]]
