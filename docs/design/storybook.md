# Storybook 실행 명세

이 문서는 `storybook-complete-story-design.md`의 실행 상태를 추적한다. 긴 설계 문서는 최종 목표와 story 카탈로그로 두고, 이 문서는 현재 구현된 Storybook 앱의 계약을 기록한다.

2026-07-13 변경 단위 5 단계 9를 완료했다. Storybook은 자체 Tailwind Adapter, 직접 의존성, 명시적 source scan을 소유하며 compiled CSS·시각 회귀 계약으로 이 경계를 검증한다.

## 현재 목표

- Storybook을 디자인 시스템의 실행 가능한 명세로 운영한다.
- `Getting Started`, `Foundations`, `Components`, `Patterns`, `Interactions`, `Recipes`, `Quality` 순서로 사이드바를 정렬한다.
- theme, density, motion을 toolbar global로 제공한다.
- public component가 추가될 때 필수 story 묶음을 함께 추가한다.

## 구현 상태

- `apps/storybook/.storybook/main.ts`는 MDX와 Storybook 앱 story를 함께 읽는다.
- Storybook의 Tailwind/PostCSS 빌드 의존성은 `apps/storybook/package.json`에서 직접 선언해 Bun isolated install에서도 독립적으로 해석한다.
- `packages/ui`에는 story 파일을 두지 않고, 디자인 시스템 문서는 `apps/storybook`에서 관리한다.
- `preview.tsx`는 theme, density, motion global을 적용한다.
- custom viewport는 `mobile-sm`, `mobile-lg`, `tablet`, `desktop`, `wide`를 제공한다.
- Getting Started 문서 9개를 추가했다.
- Storybook 전용 helper block은 `apps/storybook/src/blocks`에 둔다.
- Foundation story는 Color, Typography, Spacing, Motion 단위로 분리했다.
- Components story는 Actions, Forms, Surfaces, Feedback, Data Display, Disclosure, Selection 범주로 확장했다.
- Patterns, Recipes, Quality 항목은 조합 예시와 검증 체크리스트를 제공한다.
- 기존 `Components/Current UI` 갤러리는 `Migration/CurrentBaseline`으로 이동했다.

## 다음 작업

- 새 public component를 추가할 때 동일한 범주의 story를 함께 추가한다.
- `packages/ui`에 story 파일을 추가하지 않는다. Storybook 문서는 `apps/storybook/src/stories`에 둔다.

## UI style build Seam (2026-07-13)

- `styles.css`가 Tailwind, typography, animation, dark variant와 Storybook·공유 UI source glob을 직접 선언한다.
- `postcss.config.mjs`는 앱 로컬 `@tailwindcss/postcss` 설정이며 `packages/ui` 설정을 재노출하지 않는다.
- `@tailwindcss/typography`, `tw-animate-css`, Tailwind, PostCSS는 Storybook의 직접 개발 의존성이다.
- production CSS의 typography, animation, semantic token, custom utility sentinel을 web·admin과 함께 검사한다.
- 테스트 인증 학습 화면의 Typography·Markdown·Dialog는 Playwright screenshot 기준선으로 시각 회귀를 검출한다.

## 이전 빌드 안정화 (2026-07-11)

- `@tailwindcss/typography`를 Storybook의 직접 개발 의존성으로 선언해 Bun isolated install에서 스타일 플러그인을 결정적으로 해석한다.
- 공유 전역 스타일은 모든 `@import`를 `@plugin`보다 먼저 선언해 PostCSS import 순서 경고를 방지한다.
- `bun --filter @workspace/storybook build`와 `bun run build -- --force`로 Storybook 단독 빌드와 전체 워크스페이스 빌드를 검증했다.

## 완료된 작업 (2026-06-30)

- CSF 3.0 포맷을 사용하여 핵심 UI 컴포넌트의 스토리북 스토리 보강 및 신규 생성 완료:
  - **Input** (보강): [input.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/forms/input.stories.tsx) (With Label, With Button, With Text, File 업로드 등 shadcn/ui 공식 문서 수준의 복합 예제 추가)
  - **Textarea** (보강): [textarea.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/forms/textarea.stories.tsx) (With Label, With Text, With Button 등 폼 연동 및 버튼 배치 복합 예제 추가)
  - **Toggle** (신규 생성): [toggle.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/selection/toggle.stories.tsx) (Default, Outline, Sizes, With Icon, Disabled, Controlled 토글 등 다양한 상태 예제 추가)
  - **Toggle Group** (신규 생성): [toggle-group.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/selection/toggle-group.stories.tsx) (Single/Multiple 선택, Outline 변형, Sizes, Spacing, 수직/수평 정렬, 비활성화 등 `@base-ui/react` 기반 속성 검증)
  - **Avatar** (신규 생성): [avatar.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/data-display/avatar.stories.tsx) (Default 이미지, Sizes, Fallback 텍스트, Badge, AvatarGroup 및 카운트 조합 예제 추가)
  - **Card** (보강): [card.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/surfaces/card.stories.tsx) (LoginForm 설정 카드, Card Grid 레이아웃 등의 복합 조합 예제 추가)
  - **Table** (신규 생성): [table.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/data-display/table.stories.tsx) (Default 송장 테이블, Zebra/Striped 스타일 등 복합 데이터 디스플레이 예제 추가)
  - **Accordion** (보강): [accordion.stories.tsx](file:///d:/Code/Github/writing-app/writing-app/apps/storybook/src/stories/components/disclosure/accordion.stories.tsx) (비활성화 상태의 아이템 처리(Lock 아이콘), 아이콘이 추가된 FAQ 커스텀 레이아웃 추가)
  - **Web Patterns 및 스크린샷 스크립트 정리** (2026-06-30): 불필요한 `web-patterns.stories.tsx` 스토리 및 더 이상 사용하지 않는 [screenshot.ts](file:///d:/Code/Github/writing-app/writing-app/scripts/screenshot.ts) 파일을 삭제하고 관련 문서/설정을 정리함.
