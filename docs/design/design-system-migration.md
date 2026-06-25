# 디자인 시스템 이관 계획

## 목적

이 문서는 `packages-ui-design-system-analysis.md`의 Phase 0부터 Phase 7까지를 실제 작업 기준으로 옮긴 이관 문서다. 긴 분석서는 판단 근거로 두고, 이 문서는 변경 중 확인해야 하는 실행 계약과 완료 상태를 관리한다.

## 핵심 원칙

- 하나의 파운데이션을 공유하고 앱별 밀도만 다르게 둔다.
- `packages/ui`는 도메인 비의존 UI 계약만 소유한다.
- web은 `comfortable`, admin은 `compact` 밀도를 root에서 선택한다.
- 색상은 원시 팔레트가 아니라 의미 토큰과 컴포넌트 토큰으로 사용한다.
- 접근성 난도가 높은 overlay, menu, disclosure, segmented selection은 `packages/ui`에서 Base UI 기반으로 제공한다.
- 기존 `cream`, `surface`, `charcoal` 같은 이름은 이관 중 호환 alias로만 유지하고 제거 일정을 문서화한다.

## Phase 0 기준선과 동결

### 현재 상태

- 대표 화면 visual baseline은 아직 없다.
- 신규 `admin-*` 디자인 class와 신규 정적 inline typography를 막는 자동 규칙은 아직 없다.
- PR 템플릿에 migration checklist를 추가한다.
- 공용화 범위와 naming은 ADR로 기록한다.

### 동결 규칙

- 새 전역 `admin-*` 디자인 class를 추가하지 않는다. 필요한 경우 `packages/ui` primitive 또는 app-local 조합 class로 해결한다.
- 새 정적 `style={{ fontSize, lineHeight, letterSpacing }}`를 추가하지 않는다. 동적 계산값과 SVG geometry는 예외다.
- 새 raw hex는 앱 소스에 추가하지 않는다. 디자인 토큰, asset, chart series처럼 사용 이유가 분명한 경우만 예외다.
- 새 수동 dialog, menu, accordion, segmented control을 만들지 않는다.
- app feature는 도메인 조립을 유지하고, UI 표현 계약만 `packages/ui`로 이동한다.

## Phase 1 Foundation

- reference, semantic, component token을 분리한다.
- light/dark theme를 정리한다.
- density token을 도입한다.
- typography, spacing, radius, elevation, motion, z-index token을 둔다.
- `text-primary`, `text-destructive` 대비 오류를 우선 수정한다.
- 제품과 Storybook font stack을 맞추고 원격 font import 제거 계획을 남긴다.

## Phase 2 핵심 Primitive

- Button API는 명확한 variant 이름을 제공하되 기존 `default` 호환 alias를 유지한다.
- Surface, Field, Badge, Alert, Callout, Spinner, Separator, Avatar를 추가한다.
- Input, Textarea, NativeSelect, Card, Progress는 token과 접근성 계약을 보강한다.
- admin login과 web route notice를 pilot 대상으로 둔다.

## Phase 3 접근성 Primitive

- AlertDialog, Dialog, DropdownMenu, Popover, Tooltip을 Base UI 기반으로 추가한다.
- Accordion과 SegmentedControl, ToggleGroup을 추가했다.
- web account menu, curriculum, theme control, lesson exit, admin destructive dialog를 pilot 대상으로 둔다.

### 현재 상태

- `Accordion`은 Base UI의 expanded state와 trigger/panel 관계를 유지하고, 커리큘럼 disclosure 이관의 기준 primitive로 둔다.
- `SegmentedControl`은 단일 선택 컨트롤로 문자열 `value`를 노출하고, 내부에서 Base UI ToggleGroup 배열 상태로 변환한다.
- `ToggleGroup`은 다중 선택 토큰, 태그, 검토 범위 같은 컨트롤을 위해 배열 `value` 계약을 그대로 노출한다.
- Dialog, menu, popover 계열 overlay는 pilot 화면을 정한 뒤 별도 작업 단위로 추가한다.

## Phase 4 Admin Pattern

- PageHeader, SectionHeader, FilterToolbar, DataTable을 제공하기 시작했다.
- StatCard, StatGrid, EmptyState를 제공하기 시작했다.
- Pagination, DetailList, ActionGroup, ListItem, SplitPane은 실제 이관 화면과 함께 추가한다.
- 이관 순서는 dashboard, courses, users, resources, analytics/settings, chat, course editor 순서를 따른다.

### 현재 상태

- `AdminHeader`는 `PageHeader`를 사용하는 호환 래퍼로 남겼다.
- dashboard metric card는 `StatGrid`와 `StatCard`를 사용하는 pilot으로 이관했다.
- courses/users/resources의 toolbar와 table은 다음 pilot에서 `FilterToolbar`와 `DataTable`로 바꾼다.

## Phase 5 Web 기본 화면

- semantic typography와 layout token을 적용한다.
- profile stat과 theme control을 공용 primitive 조합으로 바꾸기 시작했다.
- home stat, course card, auth page, route notice를 공용 primitive 조합으로 바꾼다.
- raw progress 구현과 local `cx` helper를 제거한다.

### 현재 상태

- profile 학습 요약은 `StatGrid`와 `StatCard`를 사용한다.
- profile theme control은 `SegmentedControl`을 사용하고 raw inline color와 local `cx` helper를 제거했다.
- home, course detail, auth, route notice는 다음 pilot으로 남긴다.

## Phase 6 Lesson Experience

- LessonPrimaryButton은 Button으로 대체한다.
- progress header는 Progress로 대체하기 시작했다.
- sticky footer는 StickyActionBar로 대체한다.
- rich text와 callout, choice, token, character counter, feedback 표현을 generic pattern으로 분리한다.
- 정답 정책과 세션 저장 로직은 앱에 남긴다.

### 현재 상태

- `LessonProgressHeader`의 수동 progressbar는 공용 `Progress` primitive로 대체했다.
- `LessonPrimaryButton`, sticky footer, step renderer의 선택지/feedback 표현은 다음 단위로 남긴다.

## Phase 7 정리와 강제

- compatibility alias 제거 일정을 확정한다.
- dead CSS와 class/style assertion test를 정리한다.
- Storybook visual regression CI를 적용한다.
- architecture lint를 경고에서 오류로 승격하기 시작했다.

### 현재 상태

- `bun run check:design-system-guardrails`를 추가하고 root `bun run lint`에 연결했다.
- 현재 기준선보다 `admin-*` class, 앱 inline typography style, 앱 raw hex color가 늘어나면 실패한다.
- 기준선은 이관이 진행될 때마다 낮춘다.

## 작업 체크리스트

| Phase | 완료 기준                                           | 상태    |
| ----- | --------------------------------------------------- | ------- |
| 0     | PR checklist, ADR, baseline 계획                    | 완료    |
| 1     | token Storybook, contrast test, compatibility alias | 완료    |
| 2     | P0 primitive story와 interaction test               | 완료    |
| 3     | 수동 dialog/menu/disclosure pilot 제거              | 진행 중 |
| 4     | admin 전역 CSS 주요 class 제거                      | 진행 중 |
| 5     | web inline typography와 raw progress 축소           | 진행 중 |
| 6     | lesson UI pattern 분리                              | 진행 중 |
| 7     | alias 제거 계획과 lint 강제                         | 진행 중 |
