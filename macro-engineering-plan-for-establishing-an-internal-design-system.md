# 내부 디자인 시스템 구축을 위한 거시적 엔지니어링 계획

heroui v3의 아키텍처를 기반으로 사내 모노레포 `packages/ui`에 **약 46개 컴포넌트로 축소된 단일 디자인 시스템 패키지**를 구축합니다. heroui v3가 `@heroui/styles`(프레임워크 무관 CSS)와 `@heroui/react`(React 행위 계층) 2개 패키지로 분리한 것과 달리, 우리는 React + Tailwind CSS v4 전용이라는 제약 하에 **하나의 내부 패키지로 통합**하여 개발 경험과 유지보수 효율을 극대화합니다. 이 문서는 세부 구현이 아닌 **아키텍처 의사결정, 설계 원칙, 단계별 로드맵**을 다룹니다.

---

## 1. 프로젝트 목표와 범위

### 핵심 목표

이 프로젝트의 첫 번째 목표는 **heroui v3의 검증된 디자인 토큰과 접근성 기반 위에, 우리 제품에 필요한 46개 컴포넌트만 포함하는 경량 디자인 시스템**을 만드는 것입니다. heroui v3가 75개 이상 컴포넌트를 제공하는 범용 라이브러리라면, 우리 시스템은 불필요한 컴포넌트(Calendar, Color 시리즈, Slider, Table 등 약 30개)를 제거하여 번들 크기와 인지 부하를 줄입니다.

두 번째 목표는 **개발자 경험(DX) 최적화**입니다. heroui v3의 2-패키지 분리 구조는 프레임워크 무관성이라는 범용성에서 비롯되지만, 우리는 React 전용이므로 styles와 react를 단일 패키지로 통합하여 `import { Button } from "@acme/ui"` 한 줄이면 스타일과 행위가 모두 포함되는 구조를 지향합니다.

세 번째 목표는 **heroui 업스트림 추적 가능성 유지**입니다. heroui v3의 패턴, 네이밍 컨벤션, 토큰 체계를 최대한 보존하여 업스트림 업데이트를 선택적으로 반영할 수 있는 구조를 유지합니다.

### 범위 정의

채택 대상은 **46개 컴포넌트**이며, 이를 4개 티어로 분류합니다.

- **Tier 0 — 프리미티브 (20개)**: Button, CloseButton, ToggleButton, Input, TextArea, Label, Description, ErrorMessage, FieldError, Checkbox, Link, Separator, Spinner, Badge, Chip, Avatar, Skeleton, Surface, ScrollShadow, Form
- **Tier 1 — 기본 합성 (20개)**: Card, Switch, Meter, ProgressBar, Popover, Tooltip, Modal, Tabs, Toolbar, ListBox, SearchField, TextField, Fieldset, RadioGroup, CheckboxGroup, ButtonGroup, ToggleButtonGroup, InputGroup, Alert, Toast
- **Tier 2 — 복합 (5개)**: AlertDialog, Select, ComboBox, Dropdown, TagGroup
- **Tier 3 — 고수준 (1개)**: Autocomplete

제외 컴포넌트(Accordion, Breadcrumbs, Calendar, Color 시리즈, DateField/Picker, Drawer, InputOTP, Kbd, NumberField, Pagination, ProgressCircle, RangeCalendar, Slider, Table, TimeField)는 향후 필요 시 동일 패턴으로 추가할 수 있도록 확장 지점만 확보합니다.

---

## 2. heroui v3 원본 아키텍처 분석

### 2-패키지 분리의 원리

heroui v3는 v2의 **~60개 개별 패키지 구조**(`@heroui/button`, `@heroui/modal` 등)에서 **2개 패키지**로 통합되었습니다. 이 구조 변경의 핵심 동기를 이해하는 것이 우리 설계의 출발점입니다.

**`@heroui/styles`**는 프레임워크 무관한 CSS 전용 패키지로, BEM 클래스 기반 CSS 파일(`button.css`, `modal.css` 등)과 `tailwind-variants`의 `tv()` 함수로 정의된 variant 함수(`buttonVariants`, `modalVariants` 등)를 export합니다. 이 패키지만으로 plain HTML에서 `<button class="button button--primary button--lg">` 형태로 사용할 수 있습니다.

**`@heroui/react`**는 React Aria Components를 래핑한 행위 계층으로, `@heroui/styles`의 variant 함수를 import하여 React 컴포넌트의 `className`에 적용합니다. 모든 variant 함수를 re-export하므로 소비자는 `@heroui/react`만 import해도 됩니다.

### v2에서 v3로의 핵심 변화

heroui v3는 단순 버전 업이 아닌 **완전한 재작성**입니다. 이 변화를 정확히 이해해야 우리 시스템의 설계 근거가 명확해집니다.

| 관점 | v2 | v3 |
|------|----|----|
| React Aria 통합 | 저수준 훅(`useButton` 등) | React Aria Components (고수준 컴포넌트) |
| 컴포넌트 패턴 | 단일 Props 기반 모놀리식 | **Compound Component** (Radix UI 스타일 dot notation) |
| 애니메이션 | Framer Motion (JS 런타임) | **CSS transitions/keyframes** (JS 의존성 제거) |
| 스타일링 | Tailwind v3 플러그인 필수 | **Tailwind v4 CSS-first** (플러그인 불필요) |
| 색상 체계 | HSL | **OKLCH** (지각적 균일성) |
| 출력 포맷 | ESM + CJS | **ESM 전용** |
| Provider | `HeroUIProvider` 필수 | **Provider 불필요** (CSS 변수 기반) |
| 빌드 도구 | tsup (컴포넌트별) | **Custom Rollup** (통합 빌드) |

### 컴포넌트 내부 구조 패턴

heroui v3의 각 컴포넌트는 `packages/react/src/components/` 내에서 다음 구조를 따릅니다.

```
button/
├── button.tsx              # React Aria 래핑, "use client" 지시문
├── button.styles.ts        # tv() variant 정의 → BEM 클래스 매핑
├── button.stories.tsx      # Storybook CSF 스토리
└── index.ts                # 배럴 export
```

**Button의 핵심 래핑 패턴**(실제 v3 소스 기반):

```tsx
"use client";
import type { ButtonVariants } from "@heroui/styles";
import { buttonVariants } from "@heroui/styles";
import { Button as ButtonPrimitive } from "react-aria-components";
import { composeTwRenderProps } from "../../utils";

interface ButtonRootProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive>, ButtonVariants {}

const ButtonRoot = ({ className, size, variant, ...rest }: ButtonRootProps) => {
  const styles = buttonVariants({ size, variant });
  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="button"
      {...rest}
    />
  );
};
```

이 패턴에서 주목할 점은 세 가지입니다. 첫째, **Props 타입이 React Aria 원본 Props와 variant 타입의 교차**입니다. 둘째, **`composeTwRenderProps`**가 React Aria의 render prop 기반 className과 variant 스타일을 합성합니다. 셋째, **`data-slot` 속성**이 CSS 선택자 후크를 제공합니다.

---

## 3. 단일 패키지 통합 아키텍처

### 왜 단일 패키지인가

heroui의 2-패키지 분리는 Vue, Svelte, plain HTML 등 다양한 프레임워크 지원을 위한 것입니다. 우리는 **React 전용**이므로 이 분리가 불필요한 복잡성을 추가합니다. 단일 패키지로 통합하면 다음을 얻습니다.

- **Import 경로 단순화**: `import { Button, buttonVariants } from "@acme/ui"`
- **빌드 파이프라인 단순화**: 하나의 빌드 태스크, 하나의 exports map
- **의존성 관리 단순화**: 소비자 앱이 하나의 패키지만 설치
- **Colocation 강화**: variant 정의, React 컴포넌트, 스토리, 테스트가 같은 디렉토리에 위치

단, heroui의 variant 함수와 CSS 파일은 **우리 패키지 내 별도 계층으로 보존**하여 관심사 분리 원칙은 유지합니다.

### 전체 레이어 구조

```
┌─────────────────────────────────────────────────┐
│  소비자 앱 (apps/web)                            │
│  @import "@acme/ui/styles" in global CSS        │
│  import { Button } from "@acme/ui"              │
├─────────────────────────────────────────────────┤
│  packages/ui                                     │
│  ┌───────────────────────────────────────────┐  │
│  │ Layer 4: Stories & Tests (colocation)      │  │
│  │ *.stories.tsx, *.test.tsx                  │  │
│  ├───────────────────────────────────────────┤  │
│  │ Layer 3: Components                        │  │
│  │ React Aria Components 래핑 + variant 적용  │  │
│  ├───────────────────────────────────────────┤  │
│  │ Layer 2: Variants                          │  │
│  │ tv() 기반 variant 함수 (*.styles.ts)      │  │
│  ├───────────────────────────────────────────┤  │
│  │ Layer 1: Styles (CSS)                      │  │
│  │ BEM 컴포넌트 CSS, @theme, 유틸리티        │  │
│  ├───────────────────────────────────────────┤  │
│  │ Layer 0: Design Tokens                     │  │
│  │ OKLCH CSS 변수, 의미론적 색상, 반경 스케일 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 폴더 구조 제안

```
packages/ui/
├── package.json
├── tsconfig.json
├── rollup.config.ts          # 또는 tsup.config.ts
│
├── src/
│   ├── index.ts              # 메인 배럴 export (컴포넌트 + variant 함수 + 유틸)
│   │
│   ├── styles/               # Layer 0-1: 디자인 토큰 + 컴포넌트 CSS
│   │   ├── index.css         # 메인 CSS 엔트리 (@import 체인)
│   │   ├── tokens/
│   │   │   ├── variables.css # 기본 토큰 (OKLCH 시맨틱 색상, 반경, 간격)
│   │   │   └── theme.css     # @theme inline 블록 (Tailwind v4 연동)
│   │   ├── base/
│   │   │   └── base.css      # 리셋, 타이포그래피, 스크롤바 기본값
│   │   └── components/       # 컴포넌트별 BEM CSS
│   │       ├── button.css
│   │       ├── modal.css
│   │       └── ...
│   │
│   ├── components/           # Layer 2-3: variant + React 컴포넌트
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   ├── button.styles.ts
│   │   │   ├── button.stories.tsx
│   │   │   ├── button.test.tsx
│   │   │   └── index.ts
│   │   ├── modal/
│   │   │   ├── modal.tsx
│   │   │   ├── modal.styles.ts
│   │   │   ├── modal.stories.tsx
│   │   │   ├── modal.test.tsx
│   │   │   └── index.ts
│   │   └── ...
│   │
│   └── utils/                # 공유 유틸리티
│       ├── compose.ts        # composeTwRenderProps, composeSlotClassName
│       ├── types.ts          # 공유 타입 정의
│       └── index.ts
│
├── .storybook/               # 스토리북 설정 (또는 모노레포 루트 참조)
│   ├── main.ts
│   └── preview.ts
│
└── README.md
```

**설계 의사결정 근거:**

`src/styles/`가 heroui의 `@heroui/styles` 역할을 흡수합니다. CSS 파일들은 소비자 앱이 `@import "@acme/ui/styles"` 형태로 직접 참조하므로, 번들러가 CSS와 JS를 독립적으로 처리할 수 있습니다. `src/components/` 내부에서 `.styles.ts`와 `.tsx`를 같은 디렉토리에 colocation하되, styles 파일은 순수 JS(variant 함수)이고 CSS 파일은 `src/styles/components/`에 위치시킵니다. 이렇게 분리하면 **CSS는 정적 자산으로, variant 함수는 JS 번들로** 각각 최적의 경로로 소비됩니다.

---

## 4. Tailwind v4 통합과 디자인 토큰 전략

### heroui 디자인 토큰 수용 방식

heroui v3의 디자인 토큰 체계를 **그대로 수용**합니다. 이 체계는 3계층 CSS 변수 구조를 따릅니다.

**1계층 — 기초 색상** (변하지 않는 원시값):

```css
:root {
  --white: oklch(100% 0 0);
  --black: oklch(0% 0 0);
  --snow: oklch(0.9911 0 0);
  --eclipse: oklch(0.2103 0.0059 285.89);
}
```

**2계층 — 의미론적 토큰** (라이트/다크 모드에 따라 교체):

```css
:root {
  --background: oklch(0.9702 0 0);
  --foreground: var(--eclipse);
  --accent: oklch(0.6204 0.195 253.83);
  --accent-foreground: var(--snow);
  --success: oklch(0.7329 0.1935 150.81);
  --warning: oklch(0.7819 0.1585 72.33);
  --danger: oklch(0.6532 0.2328 25.74);
  --surface: var(--white);
  --overlay: var(--white);
  --muted: oklch(0.5517 0.0138 285.94);
  --radius: 0.5rem;
  --field-background: var(--white);
  --field-border: transparent;
  --field-radius: calc(var(--radius) * 1.5);
}

.dark, [data-theme="dark"] {
  --background: oklch(12% 0.005 285.823);
  --foreground: oklch(0.9911 0 0);
  --surface: oklch(0.2103 0.0059 285.89);
  /* ... 모든 색상 교체 */
}
```

**3계층 — 계산된 파생 변수** (`@theme inline`으로 Tailwind v4에 등록):

```css
@theme inline {
  --color-background: var(--background);
  --color-accent: var(--accent);
  --color-accent-hover: color-mix(in oklab, var(--accent) 90%, var(--accent-foreground) 10%);
  --color-accent-soft: color-mix(in oklab, var(--color-accent) 15%, transparent);
  --color-surface-secondary: color-mix(in oklab, var(--surface) 94%, var(--surface-foreground) 6%);
  --radius-sm: calc(var(--radius) * 0.5);
  --radius-lg: calc(var(--radius) * 1);
  --radius-xl: calc(var(--radius) * 1.5);
}
```

이 구조의 핵심은 **하나의 변수(예: `--accent`)를 변경하면 hover, soft, 파생 변수가 자동 재계산**된다는 것입니다. `color-mix(in oklab, ...)` 함수가 이를 가능하게 합니다. 커스텀 테마 적용은 `[data-theme="ocean"]` 선택자 아래에서 2계층 변수만 재정의하면 됩니다.

### 소비자 앱의 토큰 주입 방식

소비자 앱(예: `apps/web`)이 우리 패키지의 Tailwind 토큰을 사용하려면 **CSS import 방식**을 채택합니다. Tailwind v4는 `tailwind.config.js` 대신 CSS 파일 내 `@import`와 `@theme` 지시문을 사용하므로, 소비자 앱의 글로벌 CSS에서 다음과 같이 설정합니다.

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";
@import "@acme/ui/styles";          /* 토큰 + 테마 + 컴포넌트 CSS */
@source "../../../packages/ui/src"; /* Tailwind가 UI 패키지 클래스를 스캔 */
```

`@source` 지시문은 Tailwind v4가 `packages/ui/src/` 내의 클래스명을 content scanning 대상에 포함하도록 합니다. 이것은 Tailwind v4의 preset 또는 plugin 방식보다 **단순하고 직관적**입니다. 내부 패키지이므로 소스 경로를 직접 지정할 수 있어 이 방식이 가능합니다.

`@acme/ui/styles`는 `package.json`의 `exports` 필드를 통해 `./src/styles/index.css`를 가리킵니다.

### tailwind-variants와 Tailwind v4 호환성

**tailwind-variants v3.x**(최신 v3.2.2)는 **Tailwind CSS v4와 호환**됩니다. 단, `tailwind-merge` v3.x를 함께 사용해야 합니다. 주요 주의사항은 두 가지입니다.

첫째, **`responsiveVariants` 기능이 제거**되었습니다. Tailwind v4가 `config.content.transform`을 더 이상 지원하지 않으므로, 반응형 변형은 수동으로 `className="sm:text-sm md:text-base"` 형태로 적용해야 합니다.

둘째, **variant 함수가 BEM 클래스명을 반환**합니다. `buttonVariants({ variant: "primary", size: "lg" })`는 `"button button--primary button--lg"` 문자열을 반환하고, 이 클래스들은 `src/styles/components/button.css`에 정의된 CSS 규칙과 매칭됩니다.

---

## 5. 컴포넌트 구현 패턴 가이드라인

### 표준 래핑 패턴

모든 컴포넌트는 다음 패턴을 엄격히 따릅니다. heroui v3의 실제 소스 코드에서 추출한 규칙입니다.

**규칙 1 — 파일 분리**: `.tsx` 파일에는 React 로직과 React Aria 래핑만 포함합니다. 스타일 정의(variant 함수)는 반드시 `.styles.ts` 파일에 분리합니다.

**규칙 2 — Props 타입 합성**: `ComponentPropsWithRef<typeof Primitive>`와 variant 타입의 intersection으로 정의합니다. 이를 통해 React Aria의 모든 Props(접근성, 이벤트 핸들링)가 자동으로 포함됩니다.

**규칙 3 — Compound Component 패턴**: Radix UI 스타일의 dot notation을 따릅니다. Root 컴포넌트가 Context를 생성하고, 하위 컴포넌트들이 이를 소비합니다.

**규칙 4 — className 합성**: render prop 기반 컴포넌트에는 `composeTwRenderProps(className, styles)`, 문자열 전용 컴포넌트에는 직접 `slots?.label({className})`을 사용합니다.

**규칙 5 — data-slot 속성**: 모든 컴포넌트의 루트 엘리먼트에 `data-slot` 속성을 부여하여 CSS 선택자 후크를 제공합니다.

**규칙 6 — "use client" 지시문**: RSC 호환성을 위해 모든 컴포넌트 파일 최상단에 선언합니다.

### Compound Component 구현 예시 (Modal)

복합 컴포넌트의 대표적 사용 패턴입니다.

```tsx
<Modal>
  <Button>열기</Button>             {/* Trigger */}
  <Modal.Backdrop>
    <Modal.Container placement="center" size="md">
      <Modal.Dialog>
        {({ close }) => (
          <>
            <Modal.Header>
              <Modal.Heading>제목</Modal.Heading>
            </Modal.Header>
            <Modal.Body>본문 내용</Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={close}>취소</Button>
              <Button variant="solid">확인</Button>
            </Modal.Footer>
          </>
        )}
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```

이 패턴에서 각 하위 컴포넌트(`Modal.Header`, `Modal.Body` 등)는 **독립적으로 스타일링 가능**하며, Context를 통해 부모의 variant(size, placement 등)를 상속받습니다. `Modal.Dialog`의 children은 `close` 함수를 받는 render prop을 지원합니다.

### Variant 확장 패턴

소비자가 기존 variant를 확장할 때는 `tv()`의 `extend` 옵션을 사용합니다.

```ts
import { tv, buttonVariants } from "@acme/ui";

const myButtonVariants = tv({
  extend: buttonVariants,
  base: "font-semibold shadow-md",
  variants: {
    intent: { brand: "bg-brand-500 text-white" },
  },
  defaultVariants: { variant: "primary" },
});
```

---

## 6. 컴포넌트 의존성 그래프와 채택 매핑

### 핵심 의존성 맵

heroui v3의 compound component 패턴에서 대부분의 의존성은 **구성적(compositional)**입니다. 즉, 코드 레벨에서 import하는 것이 아니라 사용자가 JSX에서 조합합니다. 이 특성은 컴포넌트 간 결합도를 낮추지만, 사용 패턴 레벨에서의 의존성은 존재합니다.

**가장 많이 의존되는 컴포넌트** (fan-in 순):

| 컴포넌트 | 의존하는 컴포넌트 수 | 주요 소비자 |
|----------|---------------------|------------|
| **Label** | 15+ | TextField, SearchField, Select, ComboBox, RadioGroup, CheckboxGroup, Switch, Meter, ProgressBar, Fieldset, InputGroup 등 |
| **Button** | 8+ | AlertDialog, Modal, Popover, Tooltip, Dropdown, Toast, Toolbar, ButtonGroup |
| **Description** | 10+ | TextField, SearchField, Select, ComboBox, TagGroup, CheckboxGroup, RadioGroup, Fieldset 등 |
| **FieldError** | 7+ | TextField, SearchField, ComboBox, CheckboxGroup, RadioGroup 등 |
| **Separator** | 5+ | Tabs, Toolbar, ButtonGroup, ListBox, Select, Dropdown |
| **ListBox** | 3 | Select, ComboBox, Autocomplete (Tier 2-3의 핵심 의존) |

### 복합 컴포넌트의 구성 관계

```
Autocomplete ──→ SearchField + ListBox + Label + Description + FieldError
ComboBox ──────→ Input + ListBox + Label + Description
Select ────────→ ListBox + Label + Description + Separator + Spinner
AlertDialog ───→ Button + CloseButton (Modal과 유사한 오버레이 패턴)
Dropdown ──────→ Button + Label + Separator (내부 Menu 사용)
TagGroup ──────→ Label + Description + ErrorMessage (Tag 하위 컴포넌트 포함)
```

### React Aria Components 매핑

각 컴포넌트가 래핑하는 React Aria Components 원본입니다.

- **오버레이**: Modal→RAC Modal+Dialog, AlertDialog→RAC DialogTrigger+Dialog, Popover→RAC Popover, Tooltip→RAC Tooltip
- **폼**: TextField→RAC TextField, SearchField→RAC SearchField, Select→RAC Select, ComboBox→RAC ComboBox, Checkbox→RAC Checkbox, RadioGroup→RAC RadioGroup, Switch→RAC Switch
- **리스트**: ListBox→RAC ListBox, TagGroup→RAC TagGroup, Dropdown→RAC MenuTrigger+Menu
- **내비게이션/레이아웃**: Link→RAC Link, Tabs→RAC Tabs, Separator→RAC Separator, Toolbar→RAC Toolbar
- **피드백**: Meter→RAC Meter, ProgressBar→RAC ProgressBar

---

## 7. 의존성 및 빌드 파이프라인

### 핵심 의존성

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "dependencies": {
    "react-aria-components": "^1.x",
    "tailwind-variants": "^3.2.0",
    "tailwind-merge": "^3.x"
  }
}
```

**의사결정 근거**: `react`와 `tailwindcss`는 소비자 앱이 이미 설치하고 있으므로 peerDependencies로 지정합니다. `react-aria-components`는 접근성 기반이므로 직접 의존성으로 포함합니다. `tailwind-variants`와 `tailwind-merge`는 variant 함수 실행에 필요한 런타임 의존성입니다.

### 빌드 전략

heroui v3는 Custom Rollup을 사용하지만, 내부 패키지라는 특성을 고려하여 **두 가지 접근을 비교 평가**해야 합니다.

**옵션 A — 번들 빌드 (Rollup/tsup)**: `src/`를 ESM으로 컴파일하여 `dist/`에 출력합니다. 소비자 앱은 빌드된 결과물을 import합니다. Tree-shaking은 exports map의 subpath를 통해 지원합니다.

**옵션 B — 소스 직접 참조**: 모노레포 내부 패키지이므로, 소비자 앱의 번들러(Next.js의 경우 `transpilePackages`)가 직접 `src/`를 트랜스파일합니다. 별도 빌드 단계가 필요 없으며 개발 시 HMR이 즉각 반영됩니다.

**권장안: 옵션 B를 기본으로, 옵션 A를 점진적으로 도입합니다.** 초기에는 모노레포 내부에서만 소비되므로 소스 직접 참조가 DX를 극대화합니다. 향후 외부 배포가 필요해지면 Rollup 빌드를 추가합니다.

소스 직접 참조 시 `package.json` 설정 예시:

```json
{
  "name": "@acme/ui",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/index.css",
    "./components/*": "./src/components/*/index.ts"
  },
  "sideEffects": ["*.css"]
}
```

### Tree-shaking을 위한 Exports Map

subpath exports를 정의하여 컴포넌트 단위 import를 지원합니다. 소비자는 필요에 따라 두 가지 import 패턴을 사용할 수 있습니다.

```tsx
// 1) 배럴 import (간편, tree-shaking은 번들러에 위임)
import { Button, Modal, Select } from "@acme/ui";

// 2) Subpath import (명시적 tree-shaking 보장)
import { Button } from "@acme/ui/components/button";
import { Modal } from "@acme/ui/components/modal";
```

---

## 8. 단계별 구축 로드맵

### Phase 0 — 기반 인프라 (1~2주)

패키지 스캐폴딩과 토큰/테마 기반을 구축합니다. 어떤 컴포넌트도 구현하기 전에 이 단계가 완료되어야 합니다.

- `packages/ui` 패키지 생성, `package.json` 초기 설정
- `src/styles/` 디렉토리에 heroui v3의 디자인 토큰(variables.css, theme.css, base.css) 이식
- Tailwind v4 `@theme inline` 블록으로 토큰을 Tailwind 유틸리티에 등록
- 소비자 앱에서 `@import "@acme/ui/styles"` 동작 확인
- `src/utils/compose.ts` 유틸리티 함수 구현 (`composeTwRenderProps`, `composeSlotClassName`)
- Storybook 설정 (Vite 기반, `@storybook/react-vite`)
- Vitest 설정, ESLint/Prettier 규칙 적용
- TypeScript 설정 (strict mode, path aliases)

### Phase 1 — Tier 0 프리미티브 (2~3주)

모든 상위 컴포넌트의 빌딩 블록이 되는 **20개 프리미티브**를 구현합니다. 이 단계의 순서는 의존성 fan-in에 따라 결정합니다.

1. **최우선 (fan-in 최대)**: Label, Button, Description, FieldError, ErrorMessage, Separator
2. **폼 입력 기초**: Input, TextArea, Checkbox, Form
3. **기타 프리미티브**: CloseButton, ToggleButton, Link, Spinner, Badge, Chip, Avatar, Skeleton, Surface, ScrollShadow

각 컴포넌트에 대해 `.tsx` + `.styles.ts` + `.stories.tsx` + `.test.tsx` 4개 파일을 작성합니다. Phase 1 완료 시 Storybook에서 **모든 프리미티브의 variant를 시각적으로 검증**할 수 있어야 합니다.

### Phase 2 — Tier 1 기본 합성 (3~4주)

Tier 0 컴포넌트를 조합하는 **20개 기본 합성 컴포넌트**를 구현합니다.

1. **오버레이 기초 (필수 선행)**: Popover, Modal, Tooltip, Toast
2. **폼 필드**: TextField, SearchField, InputGroup, Fieldset, RadioGroup, CheckboxGroup, Switch
3. **피드백/표시**: Card, Alert, Meter, ProgressBar, Tabs
4. **그룹 컨테이너**: ButtonGroup, ToggleButtonGroup, Toolbar, ListBox

**ListBox는 Phase 3의 핵심 의존성**이므로 이 단계에서 반드시 완성해야 합니다.

### Phase 3 — Tier 2-3 복합 컴포넌트 (2~3주)

가장 복잡한 **6개 복합 컴포넌트**를 구현합니다.

1. **Tier 2**: Select, ComboBox, Dropdown, AlertDialog, TagGroup
2. **Tier 3**: Autocomplete (SearchField + ListBox 조합 필요)

이 단계에서는 **컴포넌트 간 조합이 올바르게 동작하는지** 통합 테스트를 강화합니다.

### Phase 4 — 안정화 및 문서화 (1~2주)

- 전체 컴포넌트 시각 회귀 테스트 기준선 설정
- 접근성 감사 (axe-core 기반 자동화 + 수동 스크린 리더 테스트)
- 내부 문서 작성 (컴포넌트 카탈로그, 사용 가이드, 기여 가이드)
- 소비자 앱 마이그레이션 파일럿

**총 예상 기간: 9~14주** (팀 규모와 병렬 작업 수준에 따라 변동)

---

## 9. 품질 보증 전략

### 테스트 계층

**단위 테스트 (Vitest + React Testing Library)**: 각 컴포넌트의 variant 렌더링, Props 전달, 이벤트 핸들링, Context 전파를 검증합니다. heroui v3와 동일하게 `pnpm test button` 형태로 컴포넌트 단위 실행을 지원합니다.

**접근성 테스트 (axe-core + jest-axe)**: 모든 컴포넌트에 대해 `expect(container).toHaveNoViolations()` 단언을 포함합니다. React Aria Components가 ARIA 패턴을 보장하지만, 우리 래핑 레이어에서 의도치 않게 접근성을 훼손하지 않았는지 확인합니다.

**시각 회귀 테스트**: Storybook의 각 스토리를 기준으로 Chromatic 또는 Playwright의 visual comparison을 적용합니다. 특히 다크 모드, 사이즈 변형, 비활성 상태 등 모든 variant 조합을 커버합니다.

**타입 안전성**: `tsc --noEmit`으로 전체 패키지의 타입 정합성을 CI에서 검증합니다. variant 함수의 Props 타입과 React Aria Props의 교차 타입이 올바르게 추론되는지가 핵심입니다.

### Storybook 전략

각 컴포넌트의 `.stories.tsx`는 다음을 포함합니다.

- **Default**: 기본 Props로 렌더링된 기본 스토리
- **Variants**: 모든 variant(size, color, state) 조합을 그리드로 보여주는 매트릭스 스토리
- **Playground**: Controls 패널에서 모든 Props를 동적으로 조작할 수 있는 인터랙티브 스토리
- **Composition**: 다른 컴포넌트와 조합된 실제 사용 패턴 스토리 (예: Select 내부의 ListBox)

스토리 title은 heroui v3 컨벤션을 따라 `"Components/Button"` 형식으로 통일합니다.

---

## 10. 배포 및 버전 관리

내부 패키지이므로 npm 퍼블리시가 아닌 **모노레포 내 workspace 참조**가 기본입니다. 소비자 앱은 `"@acme/ui": "workspace:*"`로 의존성을 선언합니다.

**버전 관리는 Changesets를 채택합니다.** heroui v3가 최근 bumpp로 전환했지만, 이는 단일 팀이 2개 패키지를 관리하는 상황에 최적화된 선택입니다. 우리는 여러 팀이 모노레포를 공유하는 환경이므로, Changesets의 **PR 단위 변경 설명**과 **자동 CHANGELOG 생성**이 더 적합합니다.

CI 파이프라인은 `Build → Typecheck → Lint → Test → Storybook Build` 순서로 실행합니다. PR마다 Storybook을 preview 배포하여 시각적 리뷰를 가능하게 합니다.

---

## 11. 리스크 및 오픈 이슈

### 높은 리스크

**heroui v3의 초기 안정성**: v3.0.0이 2026년 3월에 출시되어 아직 **2개월 미만**의 안정화 기간을 거쳤습니다. 실제 사용 중 발견되는 버그나 API 변경이 우리 시스템에 영향을 줄 수 있습니다. 이를 완화하기 위해 heroui 소스를 직접 복사(fork)하되, 업스트림 커밋을 주기적으로 검토하여 선택적으로 반영하는 전략을 취합니다.

**tailwind-variants responsiveVariants 제거**: Tailwind v4에서 이 기능이 사라졌으므로, 반응형 variant를 className에서 직접 제어해야 합니다. 컴포넌트가 반응형 동작을 내장해야 하는 경우(예: Modal의 모바일 대응) CSS 미디어 쿼리로 처리합니다.

### 중간 리스크

**BEM CSS와 Tailwind 유틸리티의 우선순위 충돌**: 컴포넌트의 BEM 클래스(`button--primary`)에 `@apply`로 적용된 스타일과 사용자가 인라인으로 추가한 Tailwind 유틸리티 간 cascade 우선순위가 예측과 다를 수 있습니다. Tailwind v4의 `@layer components`를 활용하여 **컴포넌트 스타일은 components 레이어에, 사용자 오버라이드는 utilities 레이어에** 배치하면 이 문제를 해결합니다.

**React Aria Components 버전 업데이트**: React Aria Components의 메이저 업데이트가 우리 래핑 레이어를 깨뜨릴 수 있습니다. `peerDependencies`로 버전 범위를 제한하고, 업데이트 시 전체 테스트 스위트로 호환성을 검증합니다.

### 오픈 이슈

- **SSR/RSC 호환성 검증**: `"use client"` 지시문이 모든 컴포넌트에 필요한지, Next.js App Router 환경에서 소스 직접 참조 방식이 정상 동작하는지 초기 스파이크에서 확인해야 합니다.
- **CSS 번들 크기 최적화**: 46개 컴포넌트의 CSS를 하나의 `index.css`로 묶을지, 컴포넌트별 selective import를 지원할지 결정해야 합니다. 초기에는 전체 import으로 시작하고, 번들 크기가 문제가 되면 selective import를 도입합니다.
- **다크 모드 전환 메커니즘**: heroui v3는 `.dark` 클래스 또는 `[data-theme="dark"]` 속성을 사용합니다. 소비자 앱의 기존 다크 모드 전환 방식과의 통합 방안을 정의해야 합니다.

---

## 12. 제외 컴포넌트 처리 방침

현재 제외된 약 30개 컴포넌트(Accordion, Calendar, Color 시리즈, DateField/Picker, Drawer, Slider, Table 등)는 다음 기준을 충족할 때 추가를 검토합니다.

- **제품 요구**: 실제 제품 기능에서 해당 컴포넌트가 필요해진 경우
- **구현 비용**: 기존 패턴(tv + RAC 래핑 + BEM CSS)으로 일관되게 구현 가능한 경우
- **의존성 영향**: 새 컴포넌트 추가가 기존 컴포넌트의 API나 번들에 영향을 주지 않는 경우

추가 시에는 같은 4-파일 구조(`.tsx`, `.styles.ts`, `.stories.tsx`, `.test.tsx`)를 따르며, Tier 분류에 따라 의존 컴포넌트가 이미 구현되어 있는지 확인한 후 진행합니다. heroui v3 업스트림 소스를 참조하되, 우리 패턴에 맞게 적응시킵니다.

---

## 결론

이 계획의 핵심은 **heroui v3의 검증된 기반(OKLCH 토큰, React Aria Components, BEM CSS, compound component 패턴)을 그대로 수용하면서, 우리 환경에 불필요한 복잡성(2-패키지 분리, 75개 컴포넌트, 프레임워크 무관 추상화)을 제거**하는 데 있습니다.

가장 중요한 아키텍처 의사결정 세 가지를 요약하면 다음과 같습니다. 첫째, **단일 패키지 통합**은 React 전용이라는 제약을 DX 이점으로 전환합니다. 둘째, **소스 직접 참조** 방식은 내부 패키지 특성을 활용하여 빌드 오버헤드를 제거합니다. 셋째, **heroui 토큰 체계 전체 수용**은 커스텀 토큰 설계의 비용과 리스크를 회피하면서도, CSS 변수 오버라이드를 통한 브랜딩 유연성을 확보합니다.

Phase 0의 기반 인프라와 Phase 1의 프리미티브 구현이 전체 프로젝트의 성패를 결정합니다. 이 두 단계에서 토큰 주입 경로, RAC 래핑 패턴, Storybook 워크플로가 검증되면, Phase 2~3는 확립된 패턴의 반복 적용으로 예측 가능하게 진행됩니다.