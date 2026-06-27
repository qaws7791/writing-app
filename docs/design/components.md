# 컴포넌트 스펙

이 문서는 공유 UI와 앱별 주요 컴포넌트의 현재 스펙이다. 공통 컴포넌트는 `packages/ui`를 우선하고, 앱별 조합은 각 앱의 feature 또는 component 폴더에 둔다.

## 공통 원칙

- 버튼, 카드, 입력, 진행률처럼 여러 앱에서 반복되는 primitive는 `@workspace/ui`를 우선 사용한다.
- 라우팅, 데이터 조회, 앱 전용 상태가 섞인 컴포넌트는 각 앱에 둔다.
- 목적지가 있는 UI는 버튼처럼 보여도 `Link`를 사용한다.
- 화면 텍스트와 `aria-label`은 한국어로 작성한다.
- destructive 동작은 즉시 실행하지 않고 확인 dialog를 거친다.
- 컴포넌트와 스타일 import 경계는 `@workspace/ui`, `@workspace/ui/styles`, `@workspace/ui/components/icons`, `@workspace/ui/components/ui/*`, `@workspace/ui/lib/utils`를 우선 사용한다. 호환 entrypoint와 설정 entrypoint는 `packages/ui/README.md`를 따른다.
- 앱 `tsconfig.json`은 `packages/ui/src` 내부를 직접 가리키는 source alias를 만들지 않는다. 공유 UI 소비는 `@workspace/ui` package export map을 통한다.

## Button

구현 위치: `packages/ui/src/components/ui/button.tsx`

기반은 `@base-ui/react/button`이다.

### Variant

| variant       | 용도                         |
| ------------- | ---------------------------- |
| `solid`       | 주요 행동                    |
| `default`     | 기존 호출 호환용 주요 행동   |
| `outline`     | 보조 행동, 확장 메뉴 trigger |
| `secondary`   | 낮은 강조의 보조 행동        |
| `ghost`       | 표면 없는 보조 행동          |
| `destructive` | 삭제, 실패, 위험 행동        |
| `link`        | 텍스트 링크형 행동           |

### Size

| size      | 기준        |
| --------- | ----------- |
| `xs`      | 높이 28px   |
| `sm`      | 높이 36px   |
| `default` | 높이 44px   |
| `lg`      | 높이 48px   |
| `icon-xs` | 28px 정사각 |
| `icon-sm` | 36px 정사각 |
| `icon`    | 44px 정사각 |
| `icon-lg` | 48px 정사각 |

아이콘은 `data-icon="inline-start"` 또는 `data-icon="inline-end"`로 padding 보정을 받는다.
버튼은 기본적으로 `rounded-control`, `font-bold`, `.btn-squish`를 사용하고 텍스트 줄바꿈을 허용하지 않는다. 높이와 padding은 root의 density token을 따른다.

## Card

구현 위치: `packages/ui/src/components/ui/card.tsx`

현재 `Card`는 `variant` prop을 갖지 않는다. 과거 Material Design 3식 variant 실험 기록은 정식 계약으로 유지하지 않는다.

### 구조

- `Card`
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardAction`
- `CardContent`
- `CardFooter`

### Size

| size      | 기준              |
| --------- | ----------------- |
| `default` | 내부 spacing 24px |
| `sm`      | 내부 spacing 16px |

`CardTitle`은 `as` prop으로 `div`, `h1`, `h2`, `h3`를 받을 수 있다. 의미 있는 제목 계층이 필요하면 적절한 heading을 선택한다.

## Surface

구현 위치: `packages/ui/src/components/ui/surface.tsx`

`Surface`는 anatomy가 없는 일반 표면이다. admin panel, 간단한 목록 컨테이너, web의 반복 표면을 흡수한다. `variant`는 `default`, `elevated`, `panel`만 제공하고, padding은 `size`와 density token을 따른다.

## Field

구현 위치: `packages/ui/src/components/ui/field.tsx`

구성은 `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FormSection`이다. `Field`는 label과 description, error를 자동으로 연결하지 않는다. 호출자가 `htmlFor`, `id`, `aria-describedby`, `aria-invalid`를 명시해 관계를 드러낸다. `FieldError`는 `role="alert"`를 사용한다.

## Input

구현 위치: `packages/ui/src/components/ui/input.tsx`

- 높이는 density token의 `control-height-md`를 따른다.
- `bg-bg-elevated`, `rounded-control`, `border-border-default`, `focus-visible:ring-3`을 사용한다.
- invalid 상태는 `aria-invalid="true"`로 표시한다.
- placeholder만으로 필드 이름을 대신하지 않는다. 보이는 label 또는 `aria-label`을 제공한다.

## Select

구현 위치: `packages/ui/src/components/ui/select.tsx`

- native `select`를 감싼 primitive다.
- 높이는 density token의 `control-height-md`를 따른다.
- `bg-bg-elevated`, `rounded-control`, `border-border-default`, `focus-visible:ring-3`을 사용한다.
- 라우팅이나 데이터 정책이 없는 필터, 정렬, 페이지 크기 선택에 사용한다.
- 복잡한 combobox나 다중 선택이 필요해지면 Base UI 기반 별도 primitive를 추가한다.

## Textarea

구현 위치: `packages/ui/src/components/ui/textarea.tsx`

- 최소 높이 96px.
- `bg-bg-elevated`, `rounded-control`, `border-border-default`, `focus-visible:ring-3`을 사용한다.
- 긴 본문 편집처럼 화면별 높이가 필요한 경우 `className`으로 `min-h-*`를 조정한다.
- placeholder만으로 필드 이름을 대신하지 않는다. 보이는 label 또는 `aria-label`을 제공한다.

## Progress

구현 위치: `packages/ui/src/components/ui/progress.tsx`

구조는 `Progress`, `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`다. 학습 진행률이나 코스 완료율을 표시할 때 사용한다. indicator는 `bg-progress-indicator`를 사용하고, track은 `bg-progress-track` (`#cac7c0`)을 사용하여 카드 등 다양한 배경 위에 배치되더라도 비텍스트 대비를 확보한다. 레슨 몰입 화면처럼 앱 고유 레이아웃과 색상 처리가 필요한 경우 앱 전용 progressbar를 임시로 유지할 수 있으나 Phase 6에서 공용 `Progress`로 이관한다.

## Badge

구현 위치: `packages/ui/src/components/ui/badge.tsx`

`Badge`는 domain status를 직접 해석하지 않는다. app이 상태를 `tone`으로 변환해 전달한다. 지원 tone은 `neutral`, `success`, `danger`, `info`, `selected`다.

## Accordion

구현 위치: `packages/ui/src/components/ui/accordion.tsx`

기반은 `@base-ui/react/accordion`이다. 구조는 `Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionPanel`이다. 수동 disclosure 구현 대신 사용하며, `value`와 `defaultValue`는 Base UI 계약에 맞춰 문자열 배열로 전달한다. 여러 패널을 동시에 열어야 하면 `multiple`을 명시한다.

## DropdownMenu

구현 위치: `packages/ui/src/components/ui/dropdown-menu.tsx`

기반은 `@base-ui/react/menu`다. 계정 메뉴처럼 trigger와 메뉴 항목이 필요한 경우 사용한다. 구조는 `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLinkItem`, `DropdownMenuSeparator`다. 항목 tone은 `neutral`, `danger`만 제공한다. 링크 항목도 메뉴 안에서는 `role="menuitem"` 의미를 따른다.

## AlertDialog

구현 위치: `packages/ui/src/components/ui/alert-dialog.tsx`

기반은 `@base-ui/react/alert-dialog`다. 레슨 나가기, 삭제 확인처럼 사용자의 확인이 필요한 위험 전이에 사용한다. controlled `open`, `onOpenChange`를 지원하며 구조는 `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`이다. 위험 확인 action은 `variant="destructive"`를 명시한다.

## SegmentedControl과 ToggleGroup

구현 위치:

- `packages/ui/src/components/ui/segmented-control.tsx`
- `packages/ui/src/components/ui/toggle-group.tsx`

`SegmentedControl`은 테마, 보기 방식, 범주처럼 하나의 값을 고르는 컨트롤이다. 호출자는 `value`, `defaultValue`, `onValueChange`를 문자열 단위로 다룬다. `ToggleGroup`은 태그나 검토 범위처럼 여러 값을 동시에 고르는 컨트롤을 위해 Base UI의 배열 `value` 계약을 그대로 노출한다.

## Alert와 Callout

구현 위치:

- `packages/ui/src/components/ui/alert.tsx`
- `packages/ui/src/components/ui/callout.tsx`

`Alert`는 상태 메시지이고 기본 role은 `status`다. 오류처럼 assertive announcement가 필요한 경우 호출자가 role을 바꾼다. `Callout`은 본문 안의 참고, 설명, 안내 표면이며 사용자 문자열을 포함하지 않는다.

## StickyActionBar, RichText, ChoiceCard

구현 위치:

- `packages/ui/src/components/ui/sticky-action-bar.tsx`
- `packages/ui/src/components/ui/rich-text.tsx`
- `packages/ui/src/components/ui/choice-card.tsx`

`StickyActionBar`는 모바일 safe-area를 포함한 하단 고정 행동 영역이다. tone은 `default`, `success`, `danger`만 제공한다. `RichText`는 markdown parser가 아니라 ReactMarkdown 결과물을 감싸는 token 기반 prose wrapper다. markdown parsing과 remark/rehype 정책은 앱이 소유한다. `ChoiceCard`와 `ChoiceCardGroup`은 레슨 선택형 UI의 generic button/card이며 상태는 `idle`, `selected`, `correct`, `wrong`, `disabled`만 받는다.

## Spinner, Separator, Avatar

구현 위치:

- `packages/ui/src/components/ui/spinner.tsx`
- `packages/ui/src/components/ui/separator.tsx`
- `packages/ui/src/components/ui/avatar.tsx`

`Spinner`는 caller가 `label`을 제공할 때만 접근 가능한 `status`가 된다. label이 없으면 장식으로 처리한다. `Separator`는 기본 decorative이고, 의미 있는 구분선이 필요할 때 `decorative={false}`를 사용한다. `Avatar`는 image와 fallback anatomy만 제공한다.

## Page와 Admin Pattern

구현 위치:

- `packages/ui/src/components/ui/page-header.tsx`
- `packages/ui/src/components/ui/section-header.tsx`
- `packages/ui/src/components/ui/stat-card.tsx`
- `packages/ui/src/components/ui/filter-toolbar.tsx`
- `packages/ui/src/components/ui/data-table.tsx`
- `packages/ui/src/components/ui/empty-state.tsx`

`PageHeader`와 `SectionHeader`는 제목, 설명, 선택적 action 영역만 제공한다. `StatGrid`와 `StatCard`는 dashboard 지표 같은 반복 metric에 사용한다. `FilterToolbar`는 검색과 select filter를 배치하는 form이고, `FilterToolbarField`와 `FilterToolbarLabel`을 함께 사용한다. `DataTableContainer`와 `DataTable`은 horizontal overflow와 기본 table cell 스타일만 제공한다. `EmptyState`는 결과 없음과 초기 상태를 표현하며, 도메인 메시지는 호출자가 전달한다.

`StatGrid`와 `StatCard`는 어드민 전용이 아니다. 학습자 프로필의 완료 레슨, 연속 학습일처럼 숫자 지표를 반복해 보여주는 web 화면에서도 같은 primitive를 사용한다.

## Guardrail

`bun run check:design-system-guardrails`는 legacy admin 디자인 class, 앱 inline typography style, 앱 raw hex color가 현재 이관 기준선보다 늘어나지 않는지 검사한다. 이 검사는 root `bun run lint`에 포함한다. 2026-06-25 admin 이관 이후 legacy admin 디자인 class 기준선은 0이다.

## Icon

구현 위치: `packages/ui/src/components/icons.tsx`

기본 아이콘 라이브러리는 `lucide-react`다. 새 아이콘이 필요하면 먼저 `lucide-react` export를 추가한다. 직접 SVG를 추가할 때는 lucide와 같은 stroke 규칙을 유지하고, 장식 아이콘은 `aria-hidden="true"`를 지정한다.
여러 화면에서 반복되는 브랜드형 아이콘은 앱 파일에 직접 SVG helper를 두지 않고 `@workspace/ui/components/icons`에서 가져온다. 화면 의미가 강한 도메인 전용 그림이나 외부 브랜드 로고만 앱 내부에 둘 수 있다.

## 학습자 앱 컴포넌트

### AppShell

구현 위치: `apps/web/src/components/layout/app-shell.tsx`

- 배경은 `bg-bg-canvas`, 텍스트는 `text-fg-default`.
- 데스크톱 상단 `GlobalNav`와 모바일 하단 `MobileNav`를 포함한다.
- 본문은 `max-w-6xl`, `px-5 md:px-10`, `pb-24`를 사용한다.
- `/app/lesson`은 몰입형 route group으로 분리되어 `AppShell`을 사용하지 않는다.

### GlobalNav와 MobileNav

구현 위치:

- `apps/web/src/components/layout/global-nav.tsx`: 데스크톱 상단 nav 조립
- `apps/web/src/components/layout/global-nav-routes.ts`: route 경로, 메뉴 항목, 활성 상태 정책
- `apps/web/src/components/layout/global-nav-brand.tsx`: 브랜드 홈 링크
- `apps/web/src/components/layout/global-nav-account-menu.tsx`: 계정 메뉴와 열림 상태
- `apps/web/src/components/layout/mobile-nav.tsx`: 모바일 하단 nav

- 상단 브랜드는 `글결.`이다.
- `홈`, `배우기`, `프로필`의 활성 상태는 `aria-current="page"`로 표시한다.
- `/app` 홈은 정확히 `/app`에서만 활성화한다.
- `/app/courses`와 하위 상세는 `배우기`가 활성화된다.
- 계정 메뉴는 `DropdownMenu`를 사용하고, `프로필`, `로그아웃` 항목은 menuitem 의미를 따른다.
- `global-nav.tsx`는 외부 import 호환성을 위해 `MobileNav`를 re-export한다.

### LessonShell

구현 위치: `apps/web/src/features/lessons/lesson-shell.tsx`

- 전체 viewport를 차지하는 몰입형 shell이다.
- 상단 진행 헤더와 하단 행동 영역은 `shrink-0`으로 고정한다.
- 중앙 `main`만 `overflow-y-auto`로 스크롤한다.
- 하단 CTA와 정답 피드백은 `StickyActionBar`, `Callout`, `Button` 조합을 사용한다.
- 나가기 확인은 `AlertDialog`를 사용한다.
- 선택형 레슨 UI는 `ChoiceCard`, markdown 본문은 `RichText`를 사용한다.

## 어드민 앱 컴포넌트

어드민 앱은 학습자 앱과 동일한 `@workspace/ui` 제품 토큰과 primitive를 사용한다. 어드민 화면의 도메인 조립은 앱 feature에 남기고, 색상·radius·font·motion 기준은 `packages/ui`에서 가져온다.

### AdminShell

구현 위치: `apps/admin/src/components/admin-shell.tsx`

- 256px 사이드바와 본문 1fr 구성을 사용한다.
- 사이드바와 본문은 semantic Tailwind class와 공용 토큰을 사용한다.
- 본문은 `max-w-6xl`, `px-5 md:px-10`, `py-8`을 사용한다.

### AdminSidebar

구현 위치: `apps/admin/src/components/admin-sidebar.tsx`

- 주요 메뉴: 대시보드, 강의 관리, 사용자 관리, 분석, 자료실, AI 채팅, 운영 설정.
- 내부 QA 라우트는 주요 메뉴에 포함하지 않는다.
- 아이콘은 `@workspace/ui/components/icons`에서 가져온다.
- 활성 링크는 `aria-current="page"`와 `action-primary-*` semantic token으로 표시한다.

### Admin Page Header

구현 위치: `packages/ui/src/components/ui/page-header.tsx`

- 모든 어드민 주요 화면은 `PageHeader`를 직접 사용한다.
- 앱 전용 `AdminHeader` 래퍼는 유지하지 않는다.

### Admin Surface

구현 위치: `packages/ui/src/components/ui/surface.tsx`

- 반복 업무 화면의 기본 표면은 `Surface variant="panel"`이다.
- 화면별 grid, flex, spacing 조합은 feature component의 semantic utility class로 둔다.

### Admin Filter

구현 위치: `packages/ui/src/components/ui/filter-toolbar.tsx`

- 목록 화면의 검색, select filter, 페이지 크기, 주요 행동은 `FilterToolbar`에 둔다.
- 각 필드는 `FilterToolbarField`와 `FilterToolbarLabel`을 사용한다.

### Admin Data Table

구현 위치: `packages/ui/src/components/ui/data-table.tsx`

- 표는 `DataTableContainer`와 `DataTable`을 사용한다.
- table semantic은 앱이 유지하고, `th scope="col"`과 caption 또는 `aria-label`을 제공한다.
- 첫 열의 제목, 보조 식별자, thumbnail 조립은 feature component가 담당한다.

### Admin Status와 Dialog

구현 위치:

- `packages/ui/src/components/ui/badge.tsx`
- `packages/ui/src/components/ui/alert.tsx`
- `packages/ui/src/components/ui/alert-dialog.tsx`

- 콘텐츠와 사용자 상태는 app-local `StatusBadge`가 Kwep 어드민 기준의 중립 `Badge`로 표시한다.
- 오류와 성공 메시지는 `Alert`를 사용하고, 오류는 `role="alert"`, 처리 완료는 `role="status"`로 노출한다.
- 위험 작업 확인은 `AlertDialog`를 사용한다. 비동기 destructive action은 자동 close action 대신 footer 안의 `Button variant="destructive"`로 실행한다.
