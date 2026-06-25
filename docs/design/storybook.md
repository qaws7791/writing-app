# Storybook 실행 명세

이 문서는 `storybook-complete-story-design.md`의 실행 상태를 추적한다. 긴 설계 문서는 최종 목표와 story 카탈로그로 두고, 이 문서는 현재 구현된 Storybook 앱의 계약을 기록한다.

## 현재 목표

- Storybook을 디자인 시스템의 실행 가능한 명세로 운영한다.
- `Getting Started`, `Foundations`, `Components`, `Patterns`, `Interactions`, `Recipes`, `Quality` 순서로 사이드바를 정렬한다.
- theme, density, motion을 toolbar global로 제공한다.
- public component가 추가될 때 필수 story 묶음을 함께 추가한다.

## 구현 상태

- `apps/storybook/.storybook/main.ts`는 MDX와 Storybook 앱 story를 함께 읽는다.
- `packages/ui`에는 story 파일을 두지 않고, 디자인 시스템 문서는 `apps/storybook`에서 관리한다.
- `preview.tsx`는 theme, density, motion global을 적용한다.
- custom viewport는 `mobile-sm`, `mobile-lg`, `tablet`, `desktop`, `wide`를 제공한다.
- Getting Started 문서 9개를 추가했다.
- Storybook 전용 helper block은 `apps/storybook/src/blocks`에 둔다.
- Foundation story는 Color, Typography, Spacing, Motion 단위로 분리했다.
- Components story는 Actions, Forms, Surfaces, Feedback, Data Display, Disclosure, Selection 범주로 확장했다.
- `Components/Interactions/Web Patterns`는 `DropdownMenu`, `AlertDialog`, `StickyActionBar`, `RichText`, `ChoiceCard`의 web 이관용 public primitive와 interaction을 검증한다.
- Patterns, Recipes, Quality 항목은 조합 예시와 검증 체크리스트를 제공한다.
- 기존 `Components/Current UI` 갤러리는 `Migration/CurrentBaseline`으로 이동했다.

## 다음 작업

- 새 public component를 추가할 때 동일한 범주의 story를 함께 추가한다.
- `packages/ui`에 story 파일을 추가하지 않는다. Storybook 문서는 `apps/storybook/src/stories`에 둔다.
