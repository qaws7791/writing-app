# UI 패키지 구현 및 Web 앱 리팩토링 계획

> **목표**: `packages/ui`를 MD3 기반 공용 컴포넌트 라이브러리로 재구축하고, `apps/web`의 인라인 UI를 공용 컴포넌트로 교체한다.
> **원칙**: 모든 작업 단위는 원자적 커밋 — 빌드 깨짐 없이 독립적으로 머지 가능해야 한다.

---

## 현재 상태 요약

### packages/ui (현재)

- shadcn/base-vega 기반 33개 컴포넌트 (Button, Card, Dialog, Drawer, Tabs, Badge, Input, Textarea, Switch 등)
- `@base-ui/react` + CVA + Tailwind CSS v4 + `cn()` 유틸리티
- globals.css: oklch 기반 shadcn 토큰 + MD3 색상 토큰 혼재
- 스토리북: `apps/storybook/src/stories/` 에 31개 스토리 존재 (패키지와 분리)

### apps/web에서의 @workspace/ui 사용 현황

- **사용 중인 컴포넌트 (3개)**: Drawer, DropdownMenu, Tabs
- **미사용 (30+ 컴포넌트)**: Button, Card, Input, Textarea, Badge, Skeleton, Spinner, Dialog 등
- **인라인 구현**: 버튼, 카드, 인풋, 체크박스, 스위치, 스피너, 프로그레스 바 등 모두 각 view에서 Tailwind로 직접 구현

### 설계 문서 (ui-package-design.md) 목표 구조

- `packages/ui`: MD3 기반 공용 원자 컴포넌트 (domain-agnostic)
- `apps/web/src/features/**/components/`: 앱 전용 비즈니스 컴포넌트
- 새로 추가 필요: NavigationBar, TopAppBar, FAB, Chip, LinearProgress, CircularProgress, BottomSheet, Snackbar 등

---

## 구현 방침

필요한 경우 ui-package-design.md를 참고하세요.

### 디자인 토큰

- MD3 색상 체계를 기본으로 사용 (기존 shadcn oklch 토큰은 호환성 유지)
- `@theme inline` 블록에 MD3 시맨틱 색상 매핑 유지

### State Layer (MD3)

- `color-mix()` CSS 함수로 구현
- hover: `color-mix(in srgb, var(--md-on-surface) 8%, transparent)`
- pressed: `color-mix(in srgb, var(--md-on-surface) 12%, transparent)`
- focus: `color-mix(in srgb, var(--md-on-surface) 12%, transparent)`
- dragged: `color-mix(in srgb, var(--md-on-surface) 16%, transparent)`

### Motion

- `motion` 라이브러리 사용 (`import { motion } from "motion/react"`)
- MD3 모션 토큰 (duration, easing)을 CSS 변수로 정의
- 컴포넌트별 진입/퇴장 애니메이션에 `motion` 컴포넌트 활용

### 스토리북

- 스토리 파일은 컴포넌트와 같은 위치(colocation)에 배치
  - 예: `packages/ui/src/components/button/button.stories.tsx`
- `apps/storybook/.storybook/main.ts`의 stories 경로에 `packages/ui` 추가
- 기존 `apps/storybook/src/stories/` 스토리는 점진적 마이그레이션

### 원자적 커밋 규칙

- 각 작업은 `bun lefthook run pre-commit` (lint + format) 통과
- 타입 체크 (`bun turbo typecheck`) 통과
- 빌드 (`bun turbo build`) 통과
- 컴포넌트 구현 + 스토리 = 하나의 커밋 단위

---

## Phase 0: 정리 — 미사용 코드 제거 및 인프라 준비

### 0-1. packages/ui 미사용 코드 정리

현재 33개 컴포넌트 중 실제 사용되는 것은 3개(Drawer, DropdownMenu, Tabs)이며, 나머지는 shadcn 기본 생성물이다. MD3 기반으로 재작성할 컴포넌트와 유지할 컴포넌트를 구분한다.

**유지 (MD3로 점진적 교체 예정이나 당장 삭제하지 않음)**:

- `drawer.tsx` — apps/web에서 활발히 사용 중. BottomSheet 구현 시 교체
- `dropdown-menu.tsx` — apps/web에서 사용 중. Menu 구현 시 교체
- `tabs.tsx` — apps/web에서 사용 중. MD3 Tabs 구현 시 교체
- `lib/utils.ts` — cn() 유틸리티. 계속 사용

**삭제 대상 (apps/web에서 미사용)**:

- [ ] `alert-dialog.tsx` — 미사용
- [ ] `avatar.tsx` — 미사용
- [ ] `badge.tsx` — 미사용
- [ ] `button.tsx` + `button.styles.ts` — 미사용 (MD3 Button으로 재작성)
- [ ] `button-group.tsx` — 미사용
- [ ] `card.tsx` — 미사용
- [ ] `dialog.tsx` — 미사용 (MD3 Dialog로 재작성)
- [ ] `empty.tsx` — 미사용
- [ ] `field.tsx` — 미사용
- [ ] `input.tsx` — 미사용
- [ ] `input-group.tsx` — 미사용
- [ ] `item.tsx` — 미사용
- [ ] `kbd.tsx` — 미사용
- [ ] `label.tsx` — 미사용
- [ ] `popover.tsx` — 미사용
- [ ] `scroll-area.tsx` — 미사용
- [ ] `select.tsx` — 미사용
- [ ] `separator.tsx` — 미사용
- [ ] `skeleton.tsx` — 미사용
- [ ] `slider.tsx` — 미사용
- [ ] `sonner.tsx` — 미사용
- [ ] `spinner.tsx` — 미사용
- [ ] `switch.tsx` — 미사용
- [ ] `textarea.tsx` — 미사용
- [ ] `toggle.tsx` — 미사용
- [ ] `toggle-group.tsx` — 미사용
- [ ] `toolbar.tsx` — 미사용
- [ ] `tooltip.tsx` — 미사용

**삭제할 스토리북 파일 (apps/storybook/src/stories/)**:

- [ ] 삭제된 컴포넌트에 대응하는 스토리 파일 전체 제거
- [ ] `apps/storybook/src/stories/lib/shadcn-story.ts` — shadcn 전용 유틸이므로 제거

**삭제할 기타 파일**:

- [ ] `packages/ui/components.json` — shadcn CLI 설정. MD3 재구축 후 불필요
- [ ] `packages/ui/src/styles/light.tokens.json` — Figma 토큰 export. globals.css에 통합 완료
- [ ] `packages/ui/src/styles/dark.tokens.json` — 동일

**커밋**: `UI 패키지 미사용 shadcn 컴포넌트 및 관련 스토리 정리`

### 0-2. 의존성 정리 및 추가

**제거할 의존성**:

- [ ] `tw-animate-css` — shadcn 애니메이션 유틸. motion으로 대체
- [ ] `vaul` — Drawer 컴포넌트 삭제 시 함께 제거 (0-1에서 유지하므로 Drawer 교체 시 제거)
- [ ] `shadcn` — CLI 도구. 더 이상 자동 생성하지 않으므로 제거
- [ ] `sonner` — packages/ui에서 제거 (apps/web에서 직접 사용 가능)
- [ ] `zod` — UI 패키지에서 불필요

**추가할 의존성**:

- [ ] `motion` — MD3 모션 구현

**커밋**: `UI 패키지 의존성 정리 및 motion 추가`

### 0-3. 스토리북 설정 변경 — colocation 지원

**변경 사항**:

1. `apps/storybook/.storybook/main.ts`: stories 경로에 packages/ui 추가

   ```ts
   stories: [
     "../src/**/*.stories.@(ts|tsx)",
     "../../../packages/ui/src/**/*.stories.@(ts|tsx)",
   ],
   ```

2. `apps/storybook/package.json`: `motion` 의존성 추가 (스토리에서 사용)

**커밋**: `스토리북 설정 변경 — packages/ui 컴포넌트 colocation 스토리 지원`

### 0-4. 컴포넌트 디렉터리 구조 전환

현재 `packages/ui/src/components/` 아래 flat 파일 구조를 폴더 구조로 전환한다.
유지 중인 컴포넌트(drawer, dropdown-menu, tabs)를 폴더 구조로 이동.

```
packages/ui/src/components/
├── drawer/
│   ├── drawer.tsx
│   └── index.ts
├── dropdown-menu/
│   ├── dropdown-menu.tsx
│   └── index.ts
├── tabs/
│   ├── tabs.tsx
│   └── index.ts
└── .gitkeep (제거)
```

**package.json exports 업데이트**:

```json
"./components/*": "./src/components/*/index.ts"
```

**apps/web import 경로 변경 없음** — 기존 `@workspace/ui/components/drawer` 그대로 유지.
단, export 경로가 `*.tsx` → `*/index.ts`로 바뀌므로 package.json exports 수정 필요.

**커밋**: `UI 패키지 컴포넌트 디렉터리 구조를 폴더 기반으로 전환`

---

## Phase 1: 핵심 인프라 — globals.css 및 기초 컴포넌트

### 1-1. globals.css 재구축

현재 globals.css는 shadcn oklch 토큰과 MD3 hex 토큰이 혼재한다. 설계 문서 기준으로 정리한다.

**변경 사항**:

- [ ] 사용하지 않는 shadcn 전용 토큰 정리 (chart-*, sidebar-* 등)
- [ ] MD3 State Layer 유틸리티 추가 (color-mix 기반)
- [ ] MD3 Motion 토큰 CSS 변수 추가

```css
/* State Layer 유틸리티 (MD3) */
@utility state-layer-hover {
  background-color: color-mix(in srgb, currentColor 8%, transparent);
}
@utility state-layer-pressed {
  background-color: color-mix(in srgb, currentColor 12%, transparent);
}
@utility state-layer-focus {
  background-color: color-mix(in srgb, currentColor 12%, transparent);
}
@utility state-layer-dragged {
  background-color: color-mix(in srgb, currentColor 16%, transparent);
}
```

```css
/* MD3 Motion 토큰 */
:root {
  /* Duration */
  --md-duration-short1: 50ms;
  --md-duration-short2: 100ms;
  --md-duration-short3: 150ms;
  --md-duration-short4: 200ms;
  --md-duration-medium1: 250ms;
  --md-duration-medium2: 300ms;
  --md-duration-medium3: 350ms;
  --md-duration-medium4: 400ms;
  --md-duration-long1: 450ms;
  --md-duration-long2: 500ms;
  --md-duration-long3: 550ms;
  --md-duration-long4: 600ms;
  --md-duration-extra-long1: 700ms;
  --md-duration-extra-long2: 800ms;
  --md-duration-extra-long3: 900ms;
  --md-duration-extra-long4: 1000ms;

  /* Easing */
  --md-easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --md-easing-standard-decelerate: cubic-bezier(0, 0, 0, 1);
  --md-easing-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);
  --md-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --md-easing-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --md-easing-legacy: cubic-bezier(0.4, 0, 0.2, 1);
  --md-easing-legacy-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --md-easing-legacy-accelerate: cubic-bezier(0.4, 0, 1, 1);
  --md-easing-linear: cubic-bezier(0, 0, 1, 1);
}
```

- [ ] `@theme inline` 블록에 motion 토큰 Tailwind 매핑 추가
- [ ] `@import "tw-animate-css"` 제거 (vaul 삭제 후)
- [ ] `@import "shadcn/tailwind.css"` 제거 여부 검토 (shadcn 유틸이 남아있는 컴포넌트 확인)
- [ ] `@source` 경로 정리

**커밋**: `globals.css MD3 인프라 토큰 추가 — state layer, motion, shape`

### 1-2. Button 컴포넌트

MD3 Button variants를 구현한다. 기존 shadcn Button과는 완전히 다른 설계.

```
packages/ui/src/components/button/
├── button.tsx
├── button.types.ts
├── button.stories.tsx
└── index.ts
```

**스펙**:

- variants: `filled` | `tonal` | `outlined` | `text` | `elevated`
- sizes: `sm` (32px) | `md` (40px) | `lg` (48px)
- states: default | hovered | focused | pressed | disabled | loading
- props: `leadingIcon`, `trailingIcon`, `loading`, `disabled`
- State Layer: `color-mix()` 기반 hover/pressed/focus 오버레이
- Motion: 상태 전환 시 `motion` 라이브러리로 ripple 또는 scale 효과
- 접근성: focus-visible 링, disabled 시 aria-disabled, 로딩 시 aria-busy

**커밋**: `Button 컴포넌트 구현 (MD3 filled/tonal/outlined/text/elevated)`

### 1-3. IconButton 컴포넌트

```
packages/ui/src/components/icon-button/
├── icon-button.tsx
├── icon-button.stories.tsx
└── index.ts
```

**스펙**:

- variants: `standard` | `filled` | `tonal` | `outlined`
- sizes: `sm` (32px) | `md` (40px) | `lg` (48px)
- toggle: boolean — 토글 가능한 icon button
- State Layer: color-mix() 기반

**커밋**: `IconButton 컴포넌트 구현 (MD3 standard/filled/tonal/outlined)`

### 1-4. TopAppBar 컴포넌트

```
packages/ui/src/components/top-app-bar/
├── top-app-bar.tsx
├── top-app-bar.stories.tsx
└── index.ts
```

**스펙**:

- variants: `center-aligned` | `small` | `medium` | `large`
- props: `title`, `navigationIcon`, `actions[]`, `scrollBehavior`
- scrollBehavior: `fixed` | `scroll` | `compress`

**커밋**: `TopAppBar 컴포넌트 구현 (MD3 center-aligned/small/medium/large)`

### 1-5. Skeleton 컴포넌트

```
packages/ui/src/components/skeleton/
├── skeleton.tsx
├── skeleton.stories.tsx
└── index.ts
```

**스펙**:

- variants: `text` | `rectangular` | `circular`
- props: `width`, `height`, `size` (circular 전용)
- 애니메이션: pulse (CSS animation 유지)

**커밋**: `Skeleton 컴포넌트 구현 (text/rectangular/circular)`

### 1-6. Card 컴포넌트

```
packages/ui/src/components/card/
├── card.tsx
├── card.stories.tsx
└── index.ts
```

**스펙**:

- variants: `elevated` | `filled` | `outlined`
- interactive: boolean — 클릭 가능한 카드 (state layer 포함)
- MD3 surface color + elevation 매핑

**커밋**: `Card 컴포넌트 구현 (MD3 elevated/filled/outlined)`

### 1-7. Divider 컴포넌트

```
packages/ui/src/components/divider/
├── divider.tsx
├── divider.stories.tsx
└── index.ts
```

**스펙**:

- orientation: `horizontal` | `vertical`
- variant: `full-width` | `inset` | `middle-inset`

**커밋**: `Divider 컴포넌트 구현`

### 1-8. Badge 컴포넌트

```
packages/ui/src/components/badge/
├── badge.tsx
├── badge.stories.tsx
└── index.ts
```

**스펙**:

- MD3 Badge: 작은 원형 알림 표시자
- variants: `small` (dot) | `large` (숫자 포함)
- props: `count`, `max`, `showZero`, `invisible`

**커밋**: `Badge 컴포넌트 구현 (MD3 small/large)`

### 1-9. NavigationBar 컴포넌트

기존 `apps/web/src/foundation/ui/bottom-nav.tsx` 의 MD3 버전.

```
packages/ui/src/components/navigation-bar/
├── navigation-bar.tsx
├── nav-item.tsx
├── navigation-bar.stories.tsx
└── index.ts
```

**스펙**:

- 하단 고정 탭 바
- NavItem: icon, label, badge, active state
- Active indicator: MD3 pill 형태 (filled pill behind icon)
- Glassmorphism 배경 유지
- safe-area-inset-bottom 지원

**커밋**: `NavigationBar 컴포넌트 구현 (MD3 하단 네비게이션 바)`

---

## Phase 2: 세션 및 입력 컴포넌트

### 2-1. LinearProgress 컴포넌트

```
packages/ui/src/components/progress/
├── linear-progress.tsx
├── circular-progress.tsx
├── linear-progress.stories.tsx
├── circular-progress.stories.tsx
└── index.ts
```

**스펙 (LinearProgress)**:

- props: `value` (0-100), `indeterminate`
- MD3 스타일: track + indicator, rounded caps
- Motion: value 변경 시 부드러운 애니메이션

**스펙 (CircularProgress)**:

- props: `value`, `size`, `indeterminate`

**커밋**: `Progress 컴포넌트 구현 (LinearProgress + CircularProgress)`

### 2-2. Tabs 컴포넌트 (MD3 재작성)

기존 shadcn Tabs를 유지하면서 MD3 스타일의 새 Tabs를 구현한다.
기존 Tabs 사용처를 새 Tabs로 교체한 후 구 Tabs를 제거한다.

```
packages/ui/src/components/tabs/  (기존 폴더 교체)
├── tabs.tsx
├── tab.tsx
├── tab-list.tsx
├── tab-panel.tsx
├── tabs.stories.tsx
└── index.ts
```

**스펙**:

- variants: `primary` (underline indicator) | `secondary` (pill indicator)
- `@base-ui/react/tabs` 래핑
- scrollable: boolean
- MD3 active indicator 애니메이션

**커밋**: `Tabs 컴포넌트 MD3 재작성 (primary/secondary variants)`

### 2-3. BottomSheet 컴포넌트

기존 Drawer(vaul)를 MD3 BottomSheet로 교체한다.

```
packages/ui/src/components/bottom-sheet/
├── bottom-sheet.tsx
├── bottom-sheet.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/dialog` 기반 (모달 오버레이 + 하단 슬라이드)
- props: `open`, `onClose`, `title`, `description`, `dismissible`, `overlay`
- Drag handle 지원
- Motion: 진입/퇴장 슬라이드 애니메이션 (`motion`)
- snapPoints는 CSS max-height로 단순 구현

**커밋**: `BottomSheet 컴포넌트 구현 (MD3 하단 시트)`

### 2-4. Dialog 컴포넌트 (MD3 재작성)

```
packages/ui/src/components/dialog/
├── dialog.tsx
├── dialog.stories.tsx
└── index.ts
```

**스펙**:

- variants: `basic` | `full-screen`
- `@base-ui/react/dialog` 래핑
- props: `open`, `onClose`, `title`, `description`
- actions: primary, secondary, destructive
- Motion: 진입/퇴장 fade + scale

**커밋**: `Dialog 컴포넌트 MD3 재작성`

### 2-5. TextField / Textarea 컴포넌트

```
packages/ui/src/components/text-field/
├── text-field.tsx
├── textarea.tsx
├── text-field.stories.tsx
└── index.ts
```

**스펙**:

- variants: `filled` | `outlined`
- states: default | focused | error | disabled
- props: `label`, `placeholder`, `helperText`, `errorText`, `leadingIcon`, `trailingIcon`, `maxLength`, `showCount`
- `@base-ui/react/field` + `@base-ui/react/input` 래핑

**커밋**: `TextField/Textarea 컴포넌트 구현 (MD3 filled/outlined)`

### 2-6. Checkbox 컴포넌트

```
packages/ui/src/components/checkbox/
├── checkbox.tsx
├── checkbox.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/checkbox` 래핑
- MD3 체크박스 스타일 (filled square, checkmark, indeterminate)
- props: `checked`, `onCheckedChange`, `indeterminate`, `disabled`

**커밋**: `Checkbox 컴포넌트 구현`

### 2-7. Radio / RadioGroup 컴포넌트

```
packages/ui/src/components/radio/
├── radio.tsx
├── radio-group.tsx
├── radio.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/radio-group` 래핑
- MD3 라디오 스타일 (filled circle indicator)

**커밋**: `Radio/RadioGroup 컴포넌트 구현`

### 2-8. Switch 컴포넌트 (MD3 재작성)

```
packages/ui/src/components/switch/
├── switch.tsx
├── switch.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/switch` 래핑
- MD3 스위치 스타일 (thumb + track, 아이콘 옵션)
- sizes: `sm` | `md`

**커밋**: `Switch 컴포넌트 MD3 재작성`

---

## Phase 3: 풍부한 인터랙션 컴포넌트

### 3-1. Chip 컴포넌트

```
packages/ui/src/components/chip/
├── chip.tsx
├── chip.stories.tsx
└── index.ts
```

**스펙**:

- variants: `assist` | `filter` | `input` | `suggestion`
- props: `selected`, `onSelect`, `leadingIcon`, `trailingIcon`, `onDelete`
- State Layer: color-mix() 기반

**커밋**: `Chip 컴포넌트 구현 (MD3 assist/filter/input/suggestion)`

### 3-2. Snackbar 컴포넌트

```
packages/ui/src/components/snackbar/
├── snackbar.tsx
├── snackbar-provider.tsx
├── use-snackbar.ts
├── snackbar.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/toast` 래핑 (또는 portal 기반 커스텀)
- `useSnackbar()` 훅: `toast()`, `toast.error()`, `toast.success()`
- props: `message`, `action`, `duration`, `onClose`
- Motion: 하단에서 슬라이드 업

**커밋**: `Snackbar 컴포넌트 및 useSnackbar 훅 구현`

### 3-3. Menu 컴포넌트

기존 DropdownMenu를 MD3 Menu로 교체한다.

```
packages/ui/src/components/menu/
├── menu.tsx
├── menu-item.tsx
├── menu.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/menu` 래핑
- MenuItem: icon, label, trailing text, divider, destructive
- MD3 메뉴 스타일 (elevation-2, rounded-extra-small)

**커밋**: `Menu 컴포넌트 구현 (MD3)`

### 3-4. FAB 컴포넌트

```
packages/ui/src/components/fab/
├── fab.tsx
├── fab.stories.tsx
└── index.ts
```

**스펙**:

- variants: `surface` | `primary` | `secondary` | `tertiary`
- sizes: `sm` | `md` | `lg`
- extended: boolean (아이콘 + 텍스트)
- MD3 elevation + state layer

**커밋**: `FAB 컴포넌트 구현 (MD3 surface/primary/secondary/tertiary)`

### 3-5. Tooltip 컴포넌트

```
packages/ui/src/components/tooltip/
├── tooltip.tsx
├── tooltip.stories.tsx
└── index.ts
```

**스펙**:

- `@base-ui/react/tooltip` 래핑
- MD3 plain tooltip 스타일

**커밋**: `Tooltip 컴포넌트 구현 (MD3)`

### 3-6. Avatar 컴포넌트

```
packages/ui/src/components/avatar/
├── avatar.tsx
├── avatar.stories.tsx
└── index.ts
```

**스펙**:

- 이미지 + fallback (이니셜)
- sizes: `sm` | `md` | `lg`

**커밋**: `Avatar 컴포넌트 구현`

### 3-7. List / ListItem 컴포넌트

```
packages/ui/src/components/list/
├── list.tsx
├── list-item.tsx
├── list.stories.tsx
└── index.ts
```

**스펙**:

- MD3 List 스타일
- ListItem: leadingContent, headlineText, supportingText, trailingContent

**커밋**: `List/ListItem 컴포넌트 구현 (MD3)`

---

## Phase 4: 레이아웃 및 유틸리티

### 4-1. ScrollArea 컴포넌트

```
packages/ui/src/components/scroll-area/
├── scroll-area.tsx
├── scroll-area.stories.tsx
└── index.ts
```

**커밋**: `ScrollArea 컴포넌트 구현`

### 4-2. MarkdownRenderer 컴포넌트

현재 `apps/web/src/views/session-detail-view/markdown-renderer.tsx`를 추출.

```
packages/ui/src/components/markdown/
├── markdown-renderer.tsx
├── inline-markdown.tsx
├── markdown.stories.tsx
└── index.ts
```

**커밋**: `MarkdownRenderer 컴포넌트를 UI 패키지로 추출`

### 4-3. Spinner / LoadingIndicator 컴포넌트

```
packages/ui/src/components/loading-indicator/
├── loading-indicator.tsx
├── loading-indicator.stories.tsx
└── index.ts
```

**커밋**: `LoadingIndicator 컴포넌트 구현`

### 4-4. hooks 구현

```
packages/ui/src/hooks/
├── use-media-query.ts
├── use-disclosure.ts
└── index.ts
```

**커밋**: `UI 훅 구현 (useMediaQuery, useDisclosure)`

### 4-5. 레거시 컴포넌트 제거

Phase 1~4 완료 후, 0-1에서 유지했던 레거시 컴포넌트를 제거한다.

- [ ] `drawer/` 폴더 삭제 (BottomSheet로 교체 완료 후)
- [ ] `dropdown-menu/` 폴더 삭제 (Menu로 교체 완료 후)
- [ ] `tabs/` (MD3 Tabs로 교체 완료 후 — 이미 같은 경로에서 재작성)
- [ ] `vaul` 의존성 제거
- [ ] `@import "shadcn/tailwind.css"` 제거 가능 여부 확인 후 제거

**커밋**: `레거시 shadcn 컴포넌트 및 vaul 의존성 제거`

### 4-6. index.ts 공개 API 정리

`packages/ui/src/index.ts` 또는 package.json exports에서 모든 공용 컴포넌트를 re-export.

**커밋**: `UI 패키지 공개 API 정리`

---

## Phase 5: 비즈니스 컴포넌트 추출

views에 인라인으로 존재하는 비즈니스 로직 결합 컴포넌트를 `features/**/components/`로 추출한다.

### 5-1. Journey 비즈니스 컴포넌트

```
apps/web/src/features/journeys/components/
├── journey-card.tsx           ← journeys-view, home-view에서 추출
├── journey-hero.tsx           ← journey-detail-view에서 추출
├── journey-progress-card.tsx  ← journey-detail-view에서 추출
├── progress-segments.tsx      ← journey-detail-view에서 추출
├── session-card.tsx           ← journey-detail-view에서 추출
└── index.ts
```

**커밋**: `Journey 비즈니스 컴포넌트 추출 (JourneyCard, SessionCard 등)`

### 5-2. Session 비즈니스 컴포넌트

```
apps/web/src/features/sessions/components/
├── session-header.tsx         ← session-detail-view에서 추출
├── session-cta-bar.tsx        ← session-detail-view에서 추출
└── index.ts
```

**커밋**: `Session 비즈니스 컴포넌트 추출 (SessionHeader, SessionCtaBar)`

### 5-3. Writing 비즈니스 컴포넌트

```
apps/web/src/features/writings/components/
├── writing-card.tsx           ← writing-list-view에서 추출
├── writing-word-count.tsx     ← writing-editor-view에서 추출
├── prompt-banner.tsx          ← writing-editor-view에서 추출
└── index.ts
```

**커밋**: `Writing 비즈니스 컴포넌트 추출 (WritingCard, PromptBanner 등)`

### 5-4. Prompt 비즈니스 컴포넌트

```
apps/web/src/features/prompts/components/
├── prompt-card.tsx            ← prompt-archive-view에서 추출
├── prompt-category-chips.tsx  ← prompt-archive-view에서 추출
└── index.ts
```

**커밋**: `Prompt 비즈니스 컴포넌트 추출 (PromptCard, PromptCategoryChips)`

### 5-5. Home 비즈니스 컴포넌트

```
apps/web/src/features/home/components/
├── greeting-section.tsx       ← home-view에서 추출
├── writing-suggestion-card.tsx ← home-view에서 추출
└── index.ts
```

**커밋**: `Home 비즈니스 컴포넌트 추출 (GreetingSection, WritingSuggestionCard)`

### 5-6. Profile 비즈니스 컴포넌트

```
apps/web/src/features/users/components/
├── profile-header.tsx         ← profile-view에서 추출
├── stats-cards.tsx            ← profile-view에서 추출
├── setting-row.tsx            ← profile-view에서 추출
├── setting-section.tsx        ← profile-view에서 추출
├── theme-switcher.tsx         ← profile-view에서 추출
└── index.ts
```

**커밋**: `Profile 비즈니스 컴포넌트 추출 (ProfileHeader, ThemeSwitcher 등)`

---

## Phase 6: Web 앱 리팩토링 — 공용 컴포넌트 적용

각 view를 공용 컴포넌트 + 비즈니스 컴포넌트로 리팩토링한다.
**원칙**: view 파일은 조립(composition)만 담당하며, UI 프리미티브를 직접 구현하지 않는다.

### 6-1. BottomNav → NavigationBar 교체

- [ ] `apps/web/src/foundation/ui/bottom-nav.tsx` → NavigationBar 사용으로 교체
- [ ] `(tabs)/layout.tsx` 업데이트

**커밋**: `BottomNav를 NavigationBar 공용 컴포넌트로 교체`

### 6-2. home-view 리팩토링

- [ ] 인라인 버튼 → Button 컴포넌트
- [ ] 인라인 카드 → Card 컴포넌트 + JourneyCard 비즈니스 컴포넌트
- [ ] 인라인 스켈레톤 → Skeleton 컴포넌트
- [ ] 인라인 스피너 → LoadingIndicator

**커밋**: `home-view UI 컴포넌트 리팩토링`

### 6-3. journeys-view / my-journeys-view / journey-archive-view 리팩토링

- [ ] 인라인 탭 → Tabs 컴포넌트
- [ ] 인라인 여정 카드 → JourneyCard 비즈니스 컴포넌트
- [ ] 인라인 칩 → Chip 컴포넌트
- [ ] 인라인 버튼 → Button 컴포넌트

**커밋**: `여정 목록 뷰 UI 컴포넌트 리팩토링`

### 6-4. journey-detail-view 리팩토링

- [ ] 인라인 헤더 → TopAppBar
- [ ] 인라인 세션 카드 → SessionCard 비즈니스 컴포넌트
- [ ] 진행률 바 → LinearProgress
- [ ] 인라인 버튼 → Button

**커밋**: `journey-detail-view UI 컴포넌트 리팩토링`

### 6-5. session-detail-view 리팩토링

- [ ] 세션 헤더 → SessionHeader (TopAppBar + LinearProgress)
- [ ] 하단 CTA → SessionCtaBar (Button)
- [ ] 각 스텝 컴포넌트 내부 인라인 UI:
  - MultipleChoiceStep: 선택지 → Checkbox/Radio 기반
  - WritingStep/ShortAnswerStep/RewritingStep: 인라인 textarea → Textarea
  - IntroStep: 키워드 → Chip
  - AI steps: 로딩 → CircularProgress + LoadingIndicator

**커밋**: `session-detail-view UI 컴포넌트 리팩토링`

### 6-6. writing-list-view 리팩토링

- [ ] 인라인 글 카드 → WritingCard 비즈니스 컴포넌트
- [ ] 인라인 검색 바 → TextField
- [ ] FAB 버튼 → FAB 컴포넌트
- [ ] DropdownMenu → Menu 교체
- [ ] 인라인 스피너 → LoadingIndicator

**커밋**: `writing-list-view UI 컴포넌트 리팩토링`

### 6-7. writing-editor-view 리팩토링

- [ ] 헤더 버튼들 → IconButton
- [ ] 글감 배너 → PromptBanner 비즈니스 컴포넌트
- [ ] Drawer(vaul 기반) → BottomSheet
- [ ] 단어 수 → WritingWordCount 비즈니스 컴포넌트

**커밋**: `writing-editor-view UI 컴포넌트 리팩토링`

### 6-8. writing-detail-view / writing-entry-view 리팩토링

- [ ] 인라인 버튼 → Button / IconButton
- [ ] 인라인 카드 → Card
- [ ] 로딩 상태 → Skeleton / LoadingIndicator

**커밋**: `writing-detail/entry-view UI 컴포넌트 리팩토링`

### 6-9. prompt-archive-view / prompt-detail-view 리팩토링

- [ ] 인라인 글감 카드 → PromptCard 비즈니스 컴포넌트
- [ ] 카테고리 칩 → PromptCategoryChips (Chip 기반)
- [ ] Drawer → BottomSheet

**커밋**: `prompt 뷰 UI 컴포넌트 리팩토링`

### 6-10. profile-view 리팩토링

- [ ] 프로필 헤더 → ProfileHeader (Avatar)
- [ ] 통계 카드 → StatsCards (Card)
- [ ] 설정 행 → SettingRow (ListItem 기반)
- [ ] 테마 스위처 → ThemeSwitcher (Button group)
- [ ] 인라인 switch → Switch

**커밋**: `profile-view UI 컴포넌트 리팩토링`

### 6-11. prompt-bottom-sheet 리팩토링

- [ ] Drawer(vaul) → BottomSheet
- [ ] 인라인 카테고리 칩 → Chip

**커밋**: `prompt-bottom-sheet를 BottomSheet 컴포넌트로 교체`

---

## Phase 7: 정리 및 검증

### 7-1. 전체 빌드 및 린트 검증

- [ ] `bun turbo build` 전체 통과
- [ ] `bun turbo typecheck` 전체 통과
- [ ] `bun turbo lint` 전체 통과
- [ ] `bun lefthook run pre-commit` 통과

**커밋**: (필요 시 수정 커밋)

### 7-2. 스토리북 빌드 검증

- [ ] `bun --filter storybook build` 통과
- [ ] 모든 스토리 렌더링 확인

### 7-3. E2E 테스트 검증

- [ ] 기존 E2E 테스트 통과 확인 (`bun run test:e2e`)

### 7-4. 문서 업데이트

- [ ] `/docs/04-engineering/frontend-architecture-guide.md` 업데이트
- [ ] `packages/ui/AGENTS.md` 업데이트 (MD3 기반 설명)
- [ ] `ui-package-design.md` 최종 상태 반영

**커밋**: `문서 업데이트 — UI 패키지 아키텍처 반영`

---

## 전체 진행 상태 트래커

| Phase | 작업 | 상태 |
|-------|------|------|
| **0-1** | packages/ui 미사용 코드 정리 | ⬜ |
| **0-2** | 의존성 정리 및 motion 추가 | ⬜ |
| **0-3** | 스토리북 colocation 설정 | ⬜ |
| **0-4** | 컴포넌트 디렉터리 폴더 구조 전환 | ⬜ |
| **1-1** | globals.css 재구축 | ⬜ |
| **1-2** | Button | ⬜ |
| **1-3** | IconButton | ⬜ |
| **1-4** | TopAppBar | ⬜ |
| **1-5** | Skeleton | ⬜ |
| **1-6** | Card | ⬜ |
| **1-7** | Divider | ⬜ |
| **1-8** | Badge | ⬜ |
| **1-9** | NavigationBar | ⬜ |
| **2-1** | LinearProgress + CircularProgress | ⬜ |
| **2-2** | Tabs (MD3 재작성) | ⬜ |
| **2-3** | BottomSheet | ⬜ |
| **2-4** | Dialog (MD3 재작성) | ⬜ |
| **2-5** | TextField / Textarea | ⬜ |
| **2-6** | Checkbox | ⬜ |
| **2-7** | Radio / RadioGroup | ⬜ |
| **2-8** | Switch (MD3 재작성) | ⬜ |
| **3-1** | Chip | ⬜ |
| **3-2** | Snackbar | ⬜ |
| **3-3** | Menu | ⬜ |
| **3-4** | FAB | ⬜ |
| **3-5** | Tooltip | ⬜ |
| **3-6** | Avatar | ⬜ |
| **3-7** | List / ListItem | ⬜ |
| **4-1** | ScrollArea | ⬜ |
| **4-2** | MarkdownRenderer | ⬜ |
| **4-3** | LoadingIndicator | ⬜ |
| **4-4** | hooks (useMediaQuery, useDisclosure) | ⬜ |
| **4-5** | 레거시 컴포넌트 제거 | ⬜ |
| **4-6** | index.ts 공개 API 정리 | ⬜ |
| **5-1** | Journey 비즈니스 컴포넌트 | ⬜ |
| **5-2** | Session 비즈니스 컴포넌트 | ⬜ |
| **5-3** | Writing 비즈니스 컴포넌트 | ⬜ |
| **5-4** | Prompt 비즈니스 컴포넌트 | ⬜ |
| **5-5** | Home 비즈니스 컴포넌트 | ⬜ |
| **5-6** | Profile 비즈니스 컴포넌트 | ⬜ |
| **6-1** | BottomNav → NavigationBar | ✅ |
| **6-2** | home-view 리팩토링 | ✅ |
| **6-3** | 여정 목록 뷰 리팩토링 | ✅ |
| **6-4** | journey-detail-view 리팩토링 | ✅ |
| **6-5** | session-detail-view 리팩토링 | ✅ |
| **6-6** | writing-list-view 리팩토링 | ✅ |
| **6-7** | writing-editor-view 리팩토링 | ✅ |
| **6-8** | writing-detail/entry-view 리팩토링 | ✅ |
| **6-9** | prompt 뷰 리팩토링 | ✅ |
| **6-10** | profile-view 리팩토링 | ✅ |
| **6-11** | prompt-bottom-sheet 리팩토링 | ✅ |
| **7-1** | 전체 빌드/린트 검증 | ⬜ |
| **7-2** | 스토리북 빌드 검증 | ⬜ |
| **7-3** | E2E 테스트 검증 | ⬜ |
| **7-4** | 문서 업데이트 | ⬜ |
