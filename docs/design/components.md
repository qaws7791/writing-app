# 컴포넌트 스펙

이 문서는 공유 UI와 앱별 주요 컴포넌트의 현재 스펙이다. 공통 컴포넌트는 `packages/shared/ui`를 우선하고, 앱별 조합은 각 앱의 feature 또는 component 폴더에 둔다.

공유 UI의 시각 기반과 primitive API는 Luma의 paper, ink와 semantic state 계약을 따른다.

## 공통 원칙

- 버튼, 카드, 입력, 진행률처럼 여러 앱에서 반복되는 primitive는 `@workspace/ui`를 우선 사용한다.
- 라우팅, 데이터 조회, 앱 전용 상태가 섞인 컴포넌트는 각 앱에 둔다.
- 컴포넌트는 `background`, `foreground`, `card`, `surface`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`과 semantic state token을 사용한다.
- 한 작업 영역은 Primary 행동 하나만 강하게 표시한다.
- 오류, 성공, 주의와 정보 상태는 색상 외에 text, icon, shape 또는 semantic 중 하나 이상을 함께 사용한다.
- 목적지가 있는 UI는 버튼처럼 보여도 `Link`를 사용한다.
- 화면 텍스트와 `aria-label`은 한국어로 작성한다.
- destructive 동작은 즉시 실행하지 않고 확인 dialog를 거친다.
- 컴포넌트와 스타일 import 경계는 `@workspace/ui/styles`, `@workspace/ui/blocks/*`, `@workspace/ui/components/icons`, `@workspace/ui/components/primitives/*`, `@workspace/ui/components/learning/*`, `@workspace/ui/hooks/*`, `@workspace/ui/lib/*`의 좁은 subpath를 사용한다. `@workspace/ui/styles`는 token과 공통 style만 제공하며 Tailwind/PostCSS 실행은 각 앱 Adapter가 소유한다. 공개 entrypoint는 `packages/shared/ui/README.md`를 따른다.
- 앱 source는 공유 UI를 `@workspace/ui/*` package export map으로 가져온다. 앱 build adapter의 `#ui/*` mapping은 source 상태의 공유 UI 내부 import만 해석한다.
- `packages/shared/ui` 소스는 `@/`를 사용하지 않는다. 공유 UI 내부 참조는 `#ui/*` private alias를 사용하고, 앱 소스는 `@/`를 유지한다.

## `@workspace/ui` 단일 소스

UI·block·hook·utils source는 `packages/shared/ui`만 소유한다. `apps/ui`는 그 패키지를 소비하는 내부 Astro 문서다.

Block은 조합과 상태 표현 예제다. 제품 화면은 fixture, 임시 link와 local state를 production data flow로 사용하지 않는다.

## Button

구현 위치: `packages/shared/ui/src/components/primitives/button.tsx`

기반은 `@base-ui/react/button`이다.

### Variant

| variant       | 용도                                    |
| ------------- | --------------------------------------- |
| `default`     | 한 작업 영역의 Primary 행동             |
| `outline`     | 카드 위의 보조 행동과 확장 메뉴 trigger |
| `secondary`   | 낮은 강조의 보조 행동                   |
| `ghost`       | 표면 없는 보조 행동                     |
| `destructive` | 삭제와 되돌리기 어려운 위험 행동        |
| `link`        | 문장 안의 텍스트 링크형 행동            |

### Size

| size      | 기준        |
| --------- | ----------- |
| `xs`      | 높이 28px   |
| `sm`      | 높이 36px   |
| `default` | 높이 40px   |
| `lg`      | 높이 48px   |
| `icon-xs` | 28px 정사각 |
| `icon-sm` | 36px 정사각 |
| `icon`    | 40px 정사각 |
| `icon-lg` | 48px 정사각 |

아이콘은 `data-icon="inline-start"` 또는 `data-icon="inline-end"`로 padding 보정을 받는다.

버튼과 버튼처럼 보이는 링크·trigger는 `buttonVariants`를 재사용한다.

Button은 `rounded-2xl`, 125ms press motion과 3px focus ring을 하나의 계약으로 제공한다.

정답, 오답과 성공 상태는 일반 Button variant로 표현하지 않는다. 레슨 채점 오버레이 CTA만 `success`·`warning` variant를 사용한다. 그 밖의 상태 메시지는 semantic surface를 사용한다.

## Card

구현 위치: `packages/shared/ui/src/components/primitives/card.tsx`

Card 표면은 `card`, `card-foreground`, `border`와 elevation token을 사용한다.

`variant`는 `surface`, `muted`, `frame`, `plain`을 제공한다.

### Variant

| variant   | 스타일 및 용도                                                                |
| --------- | ----------------------------------------------------------------------------- |
| `surface` | `border-border/80`, `bg-card`, `shadow-xs`를 사용해 독립된 콘텐츠를 띄운다.   |
| `muted`   | `border-border/50`, `bg-muted`를 사용해 낮은 강조와 부드러운 경계를 제공한다. |
| `frame`   | `border-border`, `bg-transparent`를 사용해 윤곽만 표시한다.                   |
| `plain`   | 테두리와 배경 없이 열린 배치를 제공한다.                                      |

### 구조

- `Card`
- `CardHeader`
- `CardEyebrow`
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
| `lg`      | 내부 spacing 32px |

`CardTitle`은 시각 title wrapper다. 의미 있는 제목 계층은 `CardTitle` 안에 `h1`, `h2` 또는 `h3`를 배치한다.

## Carousel

구현 위치: `packages/shared/ui/src/components/primitives/carousel.tsx`

기반은 Embla Carousel이다. 공개 구조는 `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `CarouselProgress`, `CarouselControls`다. 가로 카드 스트립처럼 한 줄 overflow 탐색에 사용한다.

기본 옵션은 `align: "start"`, `containScroll: "trimSnaps"`, loop 없음이다. 슬라이드 간격은 24px이다. 터치 스와이프와 데스크톱 마우스 드래그를 모두 허용한다. `prefers-reduced-motion` 또는 `data-motion="reduced"`이면 스크롤 duration은 0이다.

이전·다음 버튼은 `Button` `size="icon-lg"`(48px), `variant="secondary"`다. 두 버튼은 2px 간격의 분할 필이다. 바깥 모서리는 50%, 안쪽 모서리는 `md` radius다. 아이콘은 24px다. 접근 이름은 `이전 카드`, `다음 카드`다. `CarouselProgress`는 `muted` 트랙 위에 `foreground` 인디케이터를 옮긴다. 한 화면에 모든 슬라이드가 보이면 `CarouselControls`와 `CarouselProgress`를 숨긴다.

슬라이드 안 `Link`는 `useCarouselClickGuard`로 드래그 후 클릭 이동을 막는다. 키보드 사용자는 카드 `Link` Tab 이동과 이전·다음 버튼, 포커스된 캐러셀의 방향키로 탐색한다.

## Field

구현 위치: `packages/shared/ui/src/components/primitives/field.tsx`

구성은 `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldSeparator`, `FieldContent`, `FieldTitle`이다.

`Field`는 `vertical`, `horizontal`, `responsive` orientation을 제공한다.

`Field`는 label, description과 error를 자동으로 연결하지 않는다. 호출자는 `htmlFor`, `id`, `aria-describedby`, `aria-invalid`를 명시한다. `FieldError`는 `role="alert"`를 사용한다.

## Input

구현 위치: `packages/shared/ui/src/components/primitives/input.tsx`

- 높이는 40px이다.
- `bg-input`, `border-border`, `rounded-2xl`, hover/focus surface와 `focus-visible:ring-3`을 사용한다.
- invalid 상태는 `aria-invalid="true"`로 표시한다.
- placeholder만으로 필드 이름을 대신하지 않는다. 보이는 label 또는 `aria-label`을 제공한다.

## Select

구현 위치: `packages/shared/ui/src/components/primitives/select.tsx`

- 기반은 `@base-ui/react/select`다.
- `SelectTrigger`는 Input과 같은 Luma field surface를 사용한다.
- `SelectTrigger`의 `size="default"` 높이는 40px이다.
- `SelectTrigger`의 `size="sm"` 높이는 36px이다.
- `SelectContent`는 trigger 너비에 맞추고 선택 항목과 키보드 탐색을 제공한다.
- client interaction이 필요한 필터와 정렬에 사용한다.
- 단순 `GET` 제출만 필요한 Server Component는 native `select`를 사용할 수 있다.
- native `select`는 Luma field token과 focus ring을 사용해야 한다.
- 복잡한 combobox나 다중 선택이 필요해지면 Base UI 기반 별도 primitive를 추가한다.

## Textarea

구현 위치: `packages/shared/ui/src/components/primitives/textarea.tsx`

- Input과 동일한 Luma field surface를 사용한다.
- 최소 높이는 96px이다.
- `rounded-2xl`과 3px focus ring을 사용한다.
- 긴 본문 편집처럼 화면별 높이가 필요한 경우 `className`으로 `min-h-*`를 조정한다.
- placeholder만으로 필드 이름을 대신하지 않는다. 보이는 label 또는 `aria-label`을 제공한다.

## Progress

구현 위치: `packages/shared/ui/src/components/primitives/progress.tsx`

구조는 `Progress`, `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`다. 학습 진행률이나 코스 완료율을 표시할 때 사용한다. `Progress`는 8px `secondary` track과 `primary` indicator를 자동으로 렌더링한다. indicator 전환 시간은 500ms다. 완료 시점을 알 수 없는 작업은 `value={null}`로 표시한다. 불확정 indicator는 `animate-breathe`를 사용한다. 호출부는 track이나 indicator의 색을 덮어쓰지 않는다.

## Badge

구현 위치: `packages/shared/ui/src/components/primitives/badge.tsx`

`Badge`는 domain status를 직접 해석하지 않는다. app은 domain status를 `variant`로 변환해 전달한다.

지원 variant는 `default`, `secondary`, `destructive`, `success`, `warning`, `info`, `purple`, `outline`, `ghost`, `link`다.

## Accordion

구현 위치: `packages/shared/ui/src/components/primitives/accordion.tsx`

기반은 `@base-ui/react/accordion`이다. 공개 구조는 `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`다. 수동 disclosure 구현 대신 사용한다. `value`와 `defaultValue`는 Base UI 계약에 맞춰 문자열 배열로 전달한다. 여러 패널을 동시에 열어야 하면 `multiple`을 명시한다.

패널 높이 전환은 Base UI의 `--accordion-panel-height`와 `data-starting-style` / `data-ending-style` CSS transition을 사용한다. Enter는 `--motion-duration-enter`(320ms)와 `ease-quiet`, exit는 `--motion-duration-overlay`(220ms)와 `ease-quiet-in`이다. 패널 내용은 같은 타이밍으로 opacity와 작은 translateY를 함께 전환한다. Chevron은 overlay duration으로 회전한다. `prefers-reduced-motion`은 motion token이 처리한다.

## Tabs

구현 위치: `packages/shared/ui/src/components/primitives/tabs.tsx`

기반은 `@base-ui/react/tabs`다. 구조는 `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`이다. 한 화면에서 관련 섹션을 전환할 때 사용하며, `role="tablist"` / `tab` / `tabpanel`과 키보드 탐색은 Base UI 계약을 따른다. 라우팅이나 URL 복원이 필요한 필터는 `Link` pill을 쓰고, 클라이언트 상태 전환만 필요한 경우 `Tabs`를 쓴다.

### Variant

| `TabsList` variant | 용도                                                       |
| ------------------ | ---------------------------------------------------------- |
| `default`          | 학습자 화면의 섹션 전환. surface 트랙 + elevated 활성 pill |
| `line`             | 밀도가 높은 화면의 밑줄 탭                                 |

### `default` 스타일

- `TabsList`는 `rounded-2xl`, `bg-muted`, `p-1` 트랙을 사용한다.
- `TabsTrigger`는 기본 높이 36px와 모바일 이후 높이 32px를 사용한다.
- 활성 indicator는 `bg-card`, `shadow-sm`, `rounded-xl`을 사용한다. 선택된 pill은 트랙보다 밝다.
- indicator 전환 시간은 200ms다.
- reduced motion에서는 indicator 전환을 제거한다.
- focus는 `focus-visible:ring-2`를 사용한다.

### `line` 스타일

- 활성 탭은 `text-foreground`로 표시한다.
- foreground 밑줄은 `Tabs.Indicator`가 슬라이드한다.
- 비활성 탭은 `text-muted-foreground`를 사용한다.

## DropdownMenu

구현 위치: `packages/shared/ui/src/components/primitives/dropdown-menu.tsx`

기반은 `@base-ui/react/menu`다. 계정 메뉴처럼 trigger와 메뉴 항목이 필요한 경우 사용한다. 기본 항목은 `DropdownMenuItem`을 사용한다. 위험 항목은 `variant="destructive"`를 명시한다. 체크 항목, 라디오 항목과 하위 메뉴는 전용 primitive를 사용한다. 링크 항목은 `DropdownMenuItem`의 `render`에 `Link`를 전달해 menuitem 의미를 유지한다.

## Dialog

구현 위치: `packages/shared/ui/src/components/primitives/dialog.tsx`

기반은 `@base-ui/react/dialog`다. 일반 설정과 정보 입력처럼 사용자의 확인이 필요한 overlay에 사용한다. 패널은 `rounded-4xl`, `bg-popover`, 28px padding을 사용한다. 닫기 버튼의 접근 가능한 이름은 `닫기`다. 위험한 전이는 일반 Dialog 대신 AlertDialog를 사용한다.

## Drawer

구현 위치: `packages/shared/ui/src/components/primitives/drawer.tsx`

기반은 `@base-ui/react/drawer`다. 스와이프와 스냅 높이가 필요한 가장자리 패널에 사용한다. 제스처가 필요 없으면 Sheet 또는 Dialog를 사용한다. `swipeDirection`은 `down`, `up`, `left`, `right`다. 세로 스냅은 `snapPoints`에 뷰포트 비율(0–1) 또는 px·rem 값을 둔다. 본문과 동시에 조작하려면 `modal={false}`와 `disablePointerDismissal`을 함께 쓴다. 모달 overlay는 스크롤된 iOS Safari 뷰포트를 덮기 위해 positioned `body`가 필요하다. 닫기 버튼의 접근 가능한 이름은 `닫기`다.

## Sheet

구현 위치: `packages/shared/ui/src/components/primitives/sheet.tsx`

기반은 `@base-ui/react/dialog`다. 설정, 필터, 세부 정보처럼 화면 가장자리 또는 중앙에서 여는 보조 패널에 사용한다. `side`는 `top`, `right`, `bottom`, `left`, `center`다. `center`는 화면 중앙에 두며 패널은 `rounded-4xl`과 `bg-popover`를 사용한다. Header와 Footer anatomy를 유지한다.

## Popover

구현 위치: `packages/shared/ui/src/components/primitives/popover.tsx`

기반은 `@base-ui/react/popover`다. 짧은 보조 정보와 작은 비모달 조작 표면에 사용한다. 패널은 `rounded-3xl`, `bg-popover`, 16px padding을 사용한다. 복잡한 작업 흐름은 Dialog로 분리한다.

## AlertDialog

구현 위치: `packages/shared/ui/src/components/primitives/alert-dialog.tsx`

기반은 `@base-ui/react/alert-dialog`다. 레슨 나가기와 삭제 확인처럼 사용자의 확인이 필요한 전이에 사용한다. controlled `open`, `onOpenChange`를 지원한다. 패널은 `rounded-4xl`, `bg-popover`, 28px padding을 사용한다. `size="default"`는 데스크톱에서 최대 448px다. `size="sm"`은 최대 320px다. `AlertDialogCancel`은 기본 `outline` variant다. 삭제와 보관처럼 되돌릴 수 없는 작업은 `AlertDialogAction`에 `variant="destructive"`를 명시한다.

## Alert

구현 위치: `packages/shared/ui/src/components/primitives/alert.tsx`

`Alert`는 상태 메시지다. 일반 안내는 기본 variant를 사용한다. 오류는 `variant="destructive"`와 `role="alert"`를 함께 사용한다. 처리 완료처럼 즉시 끼어들 필요가 없는 결과는 `role="status"`를 사용한다.

## Lesson과 학습 상태

구현 위치:

- `packages/shared/ui/src/components/learning/lesson.tsx`
- `packages/shared/ui/src/components/learning/step.tsx`
- `packages/shared/ui/src/components/learning/insight.tsx`
- `packages/shared/ui/src/components/learning/prose.tsx`
- `packages/shared/ui/src/components/learning/compare.tsx`
- `packages/shared/ui/src/components/learning/choice.tsx`
- `packages/shared/ui/src/components/learning/verdict.tsx`
- `packages/shared/ui/src/components/learning/token.tsx`
- `packages/shared/ui/src/components/learning/segment.tsx`
- `packages/shared/ui/src/components/learning/sortable.tsx`
- `packages/shared/ui/src/components/learning/pair.tsx`
- `packages/shared/ui/src/components/learning/classify.tsx`
- `packages/shared/ui/src/components/learning/compose.tsx`
- `packages/shared/ui/src/components/learning/coaching.tsx`

`Lesson`은 진행 헤더, 중앙 스크롤 본문과 하단 행동을 같은 `max-w-2xl` 열에 배치한다. 나가기 아이콘은 hit area를 유지한 채 글리프를 본문 왼쪽 엣지에 광학 정렬한다. 진행 헤더의 닫기·진행 막대·단계 수는 같은 행 높이에서 세로 중앙을 맞춘다. 하단 `LessonFooter`는 상단 구분선 없이 본문과 이어지며 모바일 safe area inset을 반영한다. 완료 화면은 같은 `max-w-2xl` 열 폭을 유지한다. `Step`은 각 학습 활동의 제목, 본문과 보조 상태를 조합한다. `StepEyebrow`는 한국어에 Latin `uppercase`와 과도한 letter-spacing을 쓰지 않는다. 제목 아래에 사용법 문구를 두지 않는다. 클릭·터치 가능한 선택 타일·칩·카드는 `shadow-xs`로 조작 가능함을 드러낸다. 채점 평가와 해설은 하단 `LessonFeedback` 오버레이가 담당한다. `LessonFeedback` 배경은 레슨 shell 전체 너비이고, 문구와 CTA는 헤더·본문과 같은 `max-w-2xl` 열과 같은 수평 패딩을 쓴다.

선택형 상태는 `Choice`, `Verdict`, `Token`과 `Segment`의 `data-state`로 표현한다. 확인 전 `selected`·`active`는 `info` 톤온톤으로 표시하고, 확인 전 `success`는 쓰지 않는다. `TRUE_FALSE`는 본문 주장 아래 1행 2열 O·X 버튼인 `Verdict`를 사용한다. 대기 상태의 O·X에 정답·오답 색을 입히지 않는다. 이동형 상태는 `Sortable`, `Pair`와 `Classify`로 표현한다. `CATEGORIZE`는 남은 항목 쟁반과 카테고리 바구니로 담는다. 바구니 헤더와 `MATCH` 짝은 `series-1`~`series-4`와 점으로 정체를 구분한다. 채점 후에도 정체 색은 점·바구니 헤더·연결선에 남기고, 정오답은 항목 본문에만 올린다. `ERROR_CORRECT`의 오류 구간 선택은 `Segment intent="fault"`의 `warning` 톤을 쓴다. `COMPARE` 분석은 `Insight tone="think"`의 `info` 톤을 쓴다. 서술형 상태는 `Compose`와 `Coaching`으로 표현한다. 앱은 서버 evaluation을 이 상태로 변환하며 공유 UI는 정답을 계산하지 않는다.

## Spinner와 Separator

구현 위치:

- `packages/shared/ui/src/components/primitives/spinner.tsx`
- `packages/shared/ui/src/components/primitives/separator.tsx`

`Spinner`는 기본 `role="status"`와 `aria-label="로딩 중"`을 제공한다. 호출자는 더 구체적인 `aria-label`을 전달할 수 있다. 장식 spinner는 `aria-hidden="true"`를 사용한다. 장식 spinner에는 `status` role을 제공하지 않는다. `Separator`는 기본 decorative다. 의미 있는 구분선은 `decorative={false}`를 사용한다.

## Table과 Empty

구현 위치:

- `packages/shared/ui/src/components/primitives/table.tsx`
- `packages/shared/ui/src/components/primitives/empty.tsx`

`Table`은 native table 의미를 유지한다. container는 좁은 화면에서 가로 스크롤을 제공한다. 호출자는 caption 또는 `aria-label`을 제공해야 한다. `TableHead`에는 `scope="col"` 또는 `scope="row"`를 지정한다.

`Empty` variant는 `default`, `frame`, `compact`다. `EmptyMedia` variant는 `default`, `icon`, `sheets`다. `sheets`는 새 콘텐츠 생성을 안내하는 상태에 사용한다. 도메인 제목, 설명과 행동은 호출자가 전달한다.

## Page와 Admin Pattern

어드민 화면 제목은 앱 전용 `apps/admin/src/shared/ui/admin-page-header.tsx`가 조합한다. 이 컴포넌트는 제목, 설명과 선택적 action 영역만 제공한다.

반복 지표와 독립 콘텐츠는 `Card` anatomy로 구성한다. 검색과 선택 필터는 native `GET` form 안에서 `Field`, `Input`, `Select`와 `Button`을 조합한다. Server Component 경계가 필요한 단순 선택 필터는 native `select`를 사용할 수 있다. 목록은 공유 `Table`을 `Card` 안에 배치한다. 빈 상태는 `Empty`를 사용하거나 table의 전체 열을 차지하는 명시적 행으로 표시한다.

## Guardrail

이전 디자인 class, 앱 inline typography style와 미정의 semantic color alias는 사용하지 않는다. UI source의 raw color는 reference token 정의 밖에서 사용하지 않는다. 이 기준은 공용 primitive, token의 공개 표면과 코드 리뷰로 유지한다.

## Icon

구현 위치:

- `packages/shared/ui/src/components/icons.tsx`
- `packages/shared/ui/src/components/icons/`

기본 아이콘 라이브러리는 `@hugeicons/react`와 `@hugeicons/core-free-icons`다. 공유 UI는 각 icon data를 package subpath에서 직접 가져온다. 앱은 `@workspace/ui/components/icons` 또는 용도별 `@workspace/ui/components/icons/*-icons` 경로를 사용한다. 앱은 Hugeicons package를 직접 가져오지 않는다.

route 초기 shell은 `control-icons`, `navigation-icons`, `action-icons` 모듈을 사용한다. 이 경로는 사용하지 않는 전체 icon 집합이 초기 chunk에 포함되는 문제를 방지한다. 장식 아이콘은 `aria-hidden="true"`를 지정한다. 화면 의미가 강한 도메인 전용 그림과 외부 브랜드 로고만 앱 내부에 둘 수 있다.

## 학습자 앱 컴포넌트

### AppShell

구현 위치: `apps/web/src/app/(learner)/app/_views/app-shell.tsx`

- 배경은 `bg-background`, 텍스트는 `text-foreground`.
- 데스크톱 상단 `GlobalNav`와 모바일 하단 `MobileNav`를 포함한다.
- 본문은 `max-w-6xl`, `px-4 md:px-12`, `pb-24`를 사용한다.
- 레슨과 작성 세션은 몰입형 route group으로 분리되어 `AppShell`을 사용하지 않는다.

### GlobalNav와 MobileNav

구현 위치:

- `apps/web/src/app/(learner)/app/_views/global-nav.tsx`: Server Component 기반 데스크톱 상단 nav 조립
- `apps/web/src/app/(learner)/app/_views/global-nav-links.tsx`: 현재 경로에 반응하는 최소 Client Component 링크 목록
- `apps/web/src/app/(learner)/app/_views/global-nav-routes.ts`: route 경로, 메뉴 항목, 활성 상태 정책
- `apps/web/src/app/(learner)/app/_views/global-nav-brand.tsx`: 브랜드 홈 링크
- `apps/web/src/app/(learner)/app/_views/global-nav-account-menu.tsx`: 계정 메뉴와 열림 상태
- `apps/web/src/app/(learner)/app/_views/mobile-nav.tsx`: 모바일 하단 nav

- 상단 `GlobalNav`는 하단 테두리를 두지 않으며, 모바일 `h-14`, 데스크톱 `h-20`의 반응형 높이와 `gap-6 sm:gap-10`의 브랜드 간격을 가진다.
- 상단 브랜드는 `글결.`이며 데스크톱 강조 타이포그래피(`text-xl font-bold tracking-tight`)를 적용한다.
- `GlobalNavLinks`는 `14px medium`(`text-sm font-medium`), 항목 간 `6px` 간격(`gap-1.5`), 최소 너비(`min-w-12`)를 적용하여 1글자 탭의 클릭 접근성을 보장한다.
- `홈`, `배우기`, `쓰기`, `프로필`의 활성 상태는 `aria-current="page"`로 표시한다.
- `/app` 홈은 정확히 `/app`에서만 활성화한다.
- `/app/courses`와 하위 상세는 `배우기`가 활성화된다.
- `/app/writing`과 하위 카탈로그·작성 세션에서는 `쓰기`가 활성화된다.
- 계정 메뉴는 `DropdownMenu`를 사용하고, `프로필`, `로그아웃` 항목은 menuitem 의미를 따른다.
- 이모지만 표시하는 계정 메뉴 trigger의 접근성 이름은 `계정 메뉴`로 제공한다.
- 계정 메뉴 드롭다운은 `bg-popover`, `border-border`, `rounded-3xl`과 elevation token을 사용한다. 트리거 우측(`align="end"`, `sideOffset={12}`)에 정렬한다.
- 메뉴 항목은 공유 `DropdownMenuItem`을 사용한다. `프로필`은 `UserIcon`, `로그아웃`은 `LogOutIcon`을 함께 표시하고, 로그아웃은 `variant="destructive"`로 구분한다.
- `global-nav.tsx`는 외부 import 호환성을 위해 `MobileNav`를 re-export한다.

### LessonShell

구현 위치: `apps/web/src/features/lesson-session/ui/lesson-shell.tsx`

- 전체 viewport를 차지하는 몰입형 shell이다.
- 공유 `Lesson`, `LessonHeader`, `LessonBody`와 `LessonFooter`를 조합한다.
- 상단 진행 헤더와 하단 행동 영역은 스크롤 영역 밖에 둔다.
- 중앙 `main`만 `overflow-y-auto`로 스크롤한다.
- 하단 CTA는 `LessonActions` 안의 `Button`을 사용한다.
- 하단 `LessonFooter`는 상단 구분선 없이 본문과 이어지며 모바일 safe area inset을 반영한다.
- 정답과 오답 피드백은 `LessonFeedback` 오버레이가 담당한다. 정답은 `success`, 오답은 `warning` 톤온톤을 사용한다.
- `LessonFeedback` 배경은 shell 전체 너비이고, 문구와 CTA는 본문과 같은 `max-w-2xl` 열을 쓴다.
- 나가기 확인은 `AlertDialog`를 사용한다. 확인 action은 `default` variant다.
- markdown 본문은 `MarkdownContent`가 `ReactMarkdown` 결과를 `ProseBody` 안에 렌더링한다.
- `ORDER`와 `COMPARE` renderer는 동적 경계로 분리한다. 이 경계는 drag-and-drop과 Tabs 코드를 해당 활동에서만 불러온다.

### WritingStudioShell

구현 위치: `packages/shared/ui/src/components/learning/writing-studio-shell.tsx`

- 전체 viewport를 사용하는 몰입 화면이다.
- 글로벌 내비게이션을 포함하지 않는다.
- 본문은 `bg-background` Canvas를 뷰포트 가장자리까지 채운다. 헤더·본문·푸터 사이 구분선은 두지 않는다.
- 평시 chrome은 본문 열 위에 떠 있는 분리된 pill 클러스터다. 왼쪽은 나가기·과제 제목과 저장 점, 가운데는 `lg` 이상에서 글자 수, 오른쪽은 과제/결과 패널 트리거와 점검 버튼이다.
- 본문은 `Compose`, `ComposeCanvas`와 `ComposeMeter`를 사용한다. 읽기 폭은 가운데 `max-w-3xl`이다. 입력 중 포커스는 control `ring-3`이 아니라 캐럿으로 전달한다.
- 과제 브리프와 점검 개요는 한 번에 하나만 여는 패널이다. `lg` 미만은 Base UI Drawer 바텀시트다. `lg` 이상은 본문 오른쪽 도킹 패널이다. 열린 동안 본문을 입력할 수 있다. 패널 안을 카드로 다시 감싸지 않는다. 플로팅 chrome은 열린 패널을 가리지 않는다.
- `lg` 미만 Drawer는 `modal={false}`와 `disablePointerDismissal`을 쓰고, `showSwipeHandle`로 높이를 `간단히` 24% · `나누기` 40% · `읽기` 75% 스냅에 맞춘다. 스와이프 핸들 아래로 내리면 닫힌다. X 버튼은 두지 않는다. `lg` 이상은 오른쪽 가로 분할과 패널 안 닫기를 유지한다.
- 브리프는 `WritingBrief` anatomy를 사용한다. 점검 개요는 `FeedbackSummary`와 `Insight`를 사용한다. 고칠 일은 `ComposeCanvas` 본문 마크가 1차 표면이다. 연이은 마크는 `highlight-*` 형광펜으로 구간을 나누고, 열린 문장은 더 진한 같은 색 배경으로 표시한다.
- 저장 충돌과 실패는 `Insight tone="incorrect"`로 표시한다.
- `lg` 미만은 상단 왼쪽·오른쪽 클러스터와 하단 글자 수·점검 클러스터를 나눈다. 하단은 소프트 키보드 위로 올린다. 열린 Drawer는 키보드가 열리면 한 줄 미리보기로 접힌다. 키보드가 없을 때 높이는 Drawer `snapPoints`의 `간단히`·`나누기`·`읽기`다.

### CompareStepView와 Insight

구현 위치: `packages/shared/ui/src/components/learning/compare-step-view.tsx`

- 버전 전환은 `CompareVersions`, `CompareVersionList`, `CompareVersion`과 `ComparePanel`을 사용한다.
- 비교 분석은 `Insight tone="think"`를 사용한다.
- 버전 control은 Tabs keyboard 계약을 유지한다.
- compare·reading·write 등 정보 제시형 스텝 CTA 라벨은 「이해했어요」다.

## 어드민 앱 컴포넌트

어드민 앱은 학습자 앱과 동일한 `@workspace/ui` 제품 토큰과 primitive를 사용한다. 어드민 화면의 도메인 조립은 앱 feature에 남기고, 색상·radius·font·motion 기준은 `packages/shared/ui`에서 가져온다.

### AdminShell

구현 위치: `apps/admin/src/app/(admin)/_views/admin-shell.tsx`

- `@workspace/ui`의 `SidebarProvider`, `Sidebar`, `SidebarInset`로 셸을 구성한다.
- sticky 셸 헤더는 `SidebarTrigger`와 페이지 제목 또는 breadcrumb를 표시한다.
- 페이지 제목과 breadcrumb는 pathname 기본값과 `useAdminShellChrome` override로 셸이 소유한다.
- 본문은 전폭이며 `@container/admin-shell` 기준 패딩·간격을 사용한다.
- 좁은 화면에서는 `Sidebar` 내장 Sheet와 헤더의 `SidebarTrigger`로 메뉴를 연다.
- 사이드바 화면 이동 중에는 현재 본문을 유지한다.
- 세션의 관리자 이름과 이메일은 아바타 없이 사이드바 하단 프로필 메뉴 trigger에 표시한다.

### AdminSidebar

구현 위치: `apps/admin/src/app/(admin)/_views/admin-sidebar.tsx`

- 상단 브랜드는 「글결 어드민」 텍스트를 유지한다.
- 대시보드는 그룹 라벨 없이 최상단 메뉴로 둔다.
- 나머지 메뉴는 그룹 라벨을 둔다: 콘텐츠(콘텐츠 관리), 학습자(사용자 관리), 인사이트(분석), 시스템(감사 이력).
- 설정·에이전트 메뉴는 포함하지 않는다.
- 내부 QA 라우트는 주요 메뉴에 포함하지 않는다.
- 아이콘은 `@workspace/ui/components/icons/navigation-icons`에서 가져온다.
- 활성 링크는 `aria-current="page"`와 `SidebarMenuButton` active 상태로 표시한다.
- 화면 이동이 150ms 이상 걸리면 대상 링크 안에 고정 크기 `이동 중` 상태를 표시한다.
- 프로필 메뉴는 앱 이동, 시스템·라이트·다크 테마 선택과 어드민 로그아웃을 제공한다.

### Admin Page Header

구현 위치: `apps/admin/src/shared/ui/admin-page-header.tsx`

- 페이지 제목은 셸 헤더가 담당한다.
- `AdminPageHeader`는 설명과 액션만 렌더한다.
- 공유 package는 앱의 페이지 구조를 소유하지 않는다.

### Admin Card

구현 위치: `packages/shared/ui/src/components/primitives/card.tsx`

- 반복 업무 화면의 독립 표면은 `Card` anatomy로 구성한다.
- 화면별 grid, flex와 spacing 조합은 feature component에 둔다.

### Admin Filter

구현 위치: 각 목록 feature의 `GET` form

- client interaction이 필요한 필터는 `Field`, `Input`, `Select`와 `Button`을 조합한다.
- 단순 `GET` 제출만 필요한 선택 필터는 native `select`를 사용할 수 있다.
- 복원 가능한 필터 상태는 URL query에 보존한다.

### Admin Data Table

구현 위치: `packages/shared/ui/src/components/primitives/table.tsx`

- 표는 `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`와 `TableCell`을 사용한다.
- table semantic은 앱이 유지하고, `th scope="col"`과 caption 또는 `aria-label`을 제공한다.
- 좁은 화면에서도 열과 작업을 숨기지 않고 table 최소 폭과 수평 스크롤을 유지한다.
- 첫 열의 제목, 보조 식별자, thumbnail 조립은 feature component가 담당한다.

### Admin Status와 Dialog

구현 위치:

- `packages/shared/ui/src/components/primitives/badge.tsx`
- `packages/shared/ui/src/components/primitives/alert.tsx`
- `packages/shared/ui/src/components/primitives/alert-dialog.tsx`

- 콘텐츠와 사용자 상태는 app-local `StatusBadge`가 Luma `Badge` variant로 표시한다.
- 오류와 성공 메시지는 `Alert`를 사용하고, 오류는 `role="alert"`, 처리 완료는 `role="status"`로 노출한다.
- 위험 작업 확인은 `AlertDialog`를 사용한다. 비동기 destructive action은 자동 close action 대신 footer 안의 `Button variant="destructive"`로 실행한다.
