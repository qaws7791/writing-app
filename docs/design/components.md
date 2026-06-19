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
| `default`     | 주요 행동                    |
| `outline`     | 보조 행동, 확장 메뉴 trigger |
| `secondary`   | 낮은 강조의 보조 행동        |
| `ghost`       | 표면 없는 보조 행동          |
| `destructive` | 삭제, 실패, 위험 행동        |
| `link`        | 텍스트 링크형 행동           |

### Size

| size      | 기준        |
| --------- | ----------- |
| `xs`      | 높이 24px   |
| `sm`      | 높이 32px   |
| `default` | 높이 36px   |
| `lg`      | 높이 40px   |
| `icon-xs` | 24px 정사각 |
| `icon-sm` | 32px 정사각 |
| `icon`    | 36px 정사각 |
| `icon-lg` | 40px 정사각 |

아이콘은 `data-icon="inline-start"` 또는 `data-icon="inline-end"`로 padding 보정을 받는다.

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

## Input

구현 위치: `packages/ui/src/components/ui/input.tsx`

- 높이 36px.
- `bg-input/50`, `rounded-md`, `focus-visible:ring-3`을 사용한다.
- invalid 상태는 `aria-invalid="true"`로 표시한다.
- placeholder만으로 필드 이름을 대신하지 않는다. 보이는 label 또는 `aria-label`을 제공한다.

## Progress

구현 위치: `packages/ui/src/components/ui/progress.tsx`

구조는 `Progress`, `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`다. 학습 진행률이나 코스 완료율을 표시할 때 사용한다. 레슨 몰입 화면처럼 앱 고유 레이아웃과 색상 처리가 필요한 경우 앱 전용 progressbar를 사용할 수 있다.

## Icon

구현 위치: `packages/ui/src/components/icons.tsx`

기본 아이콘 라이브러리는 `lucide-react`다. 새 아이콘이 필요하면 먼저 `lucide-react` export를 추가한다. 직접 SVG를 추가할 때는 lucide와 같은 stroke 규칙을 유지하고, 장식 아이콘은 `aria-hidden="true"`를 지정한다.
여러 화면에서 반복되는 브랜드형 아이콘은 앱 파일에 직접 SVG helper를 두지 않고 `@workspace/ui/components/icons`에서 가져온다. 화면 의미가 강한 도메인 전용 그림이나 외부 브랜드 로고만 앱 내부에 둘 수 있다.

## 학습자 앱 컴포넌트

### AppShell

구현 위치: `apps/web/src/components/layout/app-shell.tsx`

- 배경은 `bg-cream`, 텍스트는 `text-charcoal`.
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
- `global-nav.tsx`는 외부 import 호환성을 위해 `MobileNav`를 re-export한다.

### LessonShell

구현 위치: `apps/web/src/features/lessons/lesson-shell.tsx`

- 전체 viewport를 차지하는 몰입형 shell이다.
- 상단 진행 헤더와 하단 행동 영역은 `shrink-0`으로 고정한다.
- 중앙 `main`만 `overflow-y-auto`로 스크롤한다.
- 하단 CTA는 콘텐츠 transform 조상 내부에 넣지 않는다.

### LessonPrimaryButton

- 너비 100%, padding `py-5`, radius `rounded-4xl`.
- variant는 `primary`, `secondary`, `correct`, `wrong`이다.
- disabled는 opacity와 cursor로 명확히 표시한다.

## 어드민 앱 컴포넌트

### AdminShell

구현 위치: `apps/admin/src/components/admin-shell.tsx`

- 264px 사이드바와 본문 1fr grid.
- 사이드바는 sticky 100vh.
- 본문 padding은 `28px 32px 48px`.

### AdminSidebar

구현 위치: `apps/admin/src/components/admin-sidebar.tsx`

- 주요 메뉴: 대시보드, 콘텐츠 관리, 사용자 관리, 분석, 운영 설정.
- 아이콘은 `lucide-react`를 사용한다.
- 활성 링크는 `aria-current="page"`와 `.is-active`를 함께 사용한다.

### AdminHeader

구현 위치: `apps/admin/src/components/admin-header.tsx`

- 모든 어드민 주요 화면 상단에 둔다.
- 제목, 설명, 관리자 세션 pill을 포함한다.

### Admin Panel

CSS class: `.admin-panel`

- 1px border, 8px radius, 흰색 배경, 18px padding.
- 반복 업무 화면의 기본 표면이다.

### Admin Toolbar

CSS class: `.admin-toolbar`

- 검색, select filter, 페이지 크기, 주요 행동을 한 줄 grid로 배치한다.
- label 안의 span은 12px bold 보조 라벨이다.
- 모바일 대응이 필요해지면 grid를 1열로 접는 규칙을 먼저 추가한다.

### Admin Table

CSS class: `.admin-table`, `.admin-table-wrap`

- horizontal overflow를 허용한다.
- 최소 너비는 760px이다.
- `th`는 12px, `td`는 14px 기준이다.
- 첫 열은 제목과 보조 식별자를 세로로 보여준다.

### Admin Dialog

CSS class: `.admin-dialog-backdrop`, `.admin-dialog`

- 위험 작업 확인에 사용한다.
- `role="dialog"`와 `aria-labelledby`를 제공한다.
- 현재 focus trap은 구현되어 있지 않다. 복잡한 dialog가 늘어나면 Base UI dialog primitive 도입을 우선 검토한다.
