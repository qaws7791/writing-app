# Storybook 실행 명세

Storybook은 디자인 시스템의 실행 가능한 명세다. story source와 앱 설정의 권위 소스는 `apps/storybook`이며 이 문서는 영구적인 작성·검증 계약을 설명한다.

## 정보 구조

- 사이드바는 단일 `Getting Started/Welcome` 안내 뒤에 `Foundations`, `Components`, `Patterns`, `Recipes`, `Quality` 순서로 정렬한다.
- theme과 motion을 toolbar global로 제공한다.
- custom viewport는 `mobile-sm`, `mobile-lg`, `tablet`, `desktop`, `wide`를 제공한다.
- Foundation story는 Color, Typography, Spacing, Motion 단위로 나눈다.
- Components story는 Actions, Forms, Surfaces, Feedback, Data Display, Disclosure, Selection 범주로 나눈다.
- Patterns, Recipes와 Quality는 조합 예시와 검증 체크리스트를 제공한다.

## 소유 경계

- story는 `apps/storybook/src/stories`, MDX 문서는 `apps/storybook/src/docs`에 둔다.
- 둘 이상의 문서나 story에서 쓰는 Storybook helper block은 `apps/storybook/src/blocks`에 둔다. 한 story에서만 쓰는 얇은 layout wrapper는 소비 지점에 둔다.
- `packages/shared/ui`에는 story 파일을 두지 않는다.
- `apps/storybook/.storybook/main.ts`가 MDX와 story source를 수집한다.
- `apps/storybook/.storybook/preview.tsx`가 theme과 motion global을 적용한다.

## 스타일 빌드 경계

- `apps/storybook/src/styles.css`가 Tailwind, typography, animation, dark variant와 Storybook·공유 UI source scan을 직접 선언한다.
- `apps/storybook/postcss.config.mjs`는 앱 로컬 `@tailwindcss/postcss` 설정이며 `packages/shared/ui` 설정을 재노출하지 않는다.
- Tailwind, PostCSS, `@tailwindcss/typography`, `tw-animate-css`는 Storybook의 직접 개발 의존성이다.
- 공유 전역 스타일은 `@import`를 `@plugin`보다 먼저 선언한다.

## Story 작성 계약

- public component를 추가하거나 상태·variant를 바꾸면 같은 변경에서 해당 범주의 story를 갱신한다.
- 기본 상태뿐 아니라 disabled, loading, error, empty, keyboard interaction과 접근성 상태 중 적용 가능한 항목을 포함한다.
- 제품 화면 조합은 primitive story와 분리해 Pattern 또는 Recipe에 둔다.
- story는 저장소 상대 import와 workspace 공개 Interface만 사용하며 로컬 절대 경로에 의존하지 않는다.

## 검증

```bash
bun --filter @workspace/storybook test:stories
bun --filter @workspace/storybook build
```

- interaction test는 사용자 동작과 상태 전이를 검증한다.
- 접근성 검사는 Storybook test runner의 a11y 계약을 따른다.
- production CSS 검사는 typography, animation, semantic token과 custom utility sentinel을 web·admin과 함께 확인한다.
- 시각 회귀가 필요한 제품 흐름은 저장소가 관리하는 Playwright screenshot 기준선을 사용한다.
