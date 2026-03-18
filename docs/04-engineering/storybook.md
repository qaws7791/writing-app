# Storybook

## 역할

`apps/storybook`은 `@workspace/ui`를 검증하고 시각적으로 점검하는 워크벤치입니다.

## 책임

- 공용 컴포넌트의 상태 확인
- 디자인 시스템 토큰과 패턴 검증
- 접근성 점검 보조

## 현재 스택

- Storybook 10
- React
- Vite 기반 런타임
- `@storybook/addon-a11y`

## 운영 원칙

- 공용 UI 변경은 가능하면 Storybook 시나리오와 함께 검증합니다.
- 제품 고유 화면 대신 재사용 가능한 UI 조합과 패턴을 우선 다룹니다.
