# Storybook 실행 명세

이 문서는 `storybook-complete-story-design.md`의 실행 상태를 추적한다. 긴 설계 문서는 최종 목표와 story 카탈로그로 두고, 이 문서는 현재 구현된 Storybook 앱의 계약을 기록한다.

## 현재 목표

- Storybook을 디자인 시스템의 실행 가능한 명세로 운영한다.
- `Getting Started`, `Foundations`, `Components`, `Patterns`, `Interactions`, `Recipes`, `Quality` 순서로 사이드바를 정렬한다.
- theme, density, motion을 toolbar global로 제공한다.
- public component가 추가될 때 필수 story 묶음을 함께 추가한다.

## 구현 상태

- `apps/storybook/.storybook/main.ts`는 MDX와 `packages/ui` colocated story, Storybook 앱 story를 함께 읽는다.
- `preview.tsx`는 theme, density, motion global을 적용한다.
- custom viewport는 `mobile-sm`, `mobile-lg`, `tablet`, `desktop`, `wide`를 제공한다.
- Getting Started 문서 9개를 추가했다.
- Storybook 전용 helper block은 `apps/storybook/src/blocks`에 둔다.

## 다음 작업

- P0 component story를 독립 파일로 분리한다.
- Foundation story를 Color, Typography, Spacing, Motion 단위로 확장한다.
- recipe와 quality matrix를 추가한다.
