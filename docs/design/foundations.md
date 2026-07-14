# 디자인 파운데이션

이 문서는 색상, 타이포그래피, 스페이싱, radius, shadow, motion의 현재 기준이다. 새 UI는 이 값을 먼저 사용하고, 새 토큰이 필요하면 구현 전에 이 문서를 갱신한다.

## 적용 범위

- 공통 컴포넌트 토큰: `packages/ui/src/styles/`
- 학습자 앱 스타일: `apps/web/src/app/globals.css`
- 어드민 앱 스타일: `apps/admin/src/app/globals.css`

학습자 앱과 어드민 앱은 같은 제품 시각 언어를 사용한다. 색상, radius, font, motion의 기준은 `packages/ui`에 두고, 각 앱의 `globals.css`는 화면별 조합과 레이아웃 보정만 담당한다.

## 토큰 구조

`@workspace/ui`는 Tailwind CSS 4, Base UI 기반 primitive, 글결 제품 토큰을 사용한다. 토큰은 `packages/ui/src/styles/tokens/` 아래 reference, semantic, component, radius, motion으로 분리하고, `globals.css`가 entrypoint다.

## Semantic Color

| semantic token       | 라이트    | 다크      | 용도                          |
| -------------------- | --------- | --------- | ----------------------------- |
| `bg-canvas`          | `#fdfbf7` | `#1b1916` | 공통 앱 배경                  |
| `bg-surface`         | `#f4efe6` | `#262320` | 카드, 패널, 칩                |
| `bg-surface-hover`   | `#eae2d3` | `#332f2a` | hover, 낮은 selected          |
| `bg-elevated`        | `#ffffff` | `#211f1c` | input, popover 같은 높은 표면 |
| `fg-default`         | `#2a2621` | `#f4efe6` | 기본 텍스트                   |
| `fg-muted`           | `#524d47` | `#a89f92` | 보조 텍스트                   |
| `fg-subtle`          | `#8c857a` | `#7f766b` | placeholder, 낮은 metadata    |
| `action-primary-bg`  | `#2a2621` | `#f4efe6` | 주요 행동 배경                |
| `action-primary-fg`  | `#fdfbf7` | `#2a2621` | 주요 행동 텍스트              |
| `action-selected-bg` | `#ffc800` | `#ffc800` | 선택, 강조 fill               |
| `action-selected-fg` | `#2a2621` | `#2a2621` | 선택, 강조 위 텍스트          |
| `success-bg`         | `#52d86a` | `#1e5b30` | 성공 fill                     |
| `success-fg`         | `#084d1c` | `#6fe588` | 성공 텍스트                   |
| `danger-bg`          | `#ffada7` | `#6e2a22` | 위험 fill                     |
| `danger-fg`          | `#8b1d0f` | `#ffada7` | 위험 텍스트                   |
| `info-bg`            | `#dbeafe` | `#1e3a5f` | 정보 fill                     |
| `info-fg`            | `#1d4ed8` | `#bfdbfe` | 정보 텍스트                   |

기존 `cream`, `surface`, `charcoal`, `primary`, `destructive` 이름은 migration alias다. 새 구현은 `bg-*`, `fg-*`, `action-*`, `success-*`, `danger-*`, `info-*` 의미 토큰을 먼저 사용한다.

의미 토큰은 같은 이름의 CSS 변수로 공개한다. 예를 들어 `danger-bg`는
`--danger-bg`, `fg-default`는 `--fg-default`로 참조한다. Tailwind 색상
namespace에는 역할 토큰과 기존 호환 API를 함께 연결한다. 따라서
`bg-danger`, `text-danger-foreground`, `border-danger-fg`, `bg-fg-default`는
모두 실제 CSS를 생성하며 각각 `danger-bg`, `danger-fg`, `fg-default`를
참조한다.

공용 Sidebar는 별도 색상 체계를 만들지 않는다. 배경은 `surface`와
`surface-hover`, 전경은 `foreground`, 경계는 `border`, 포커스는 `focus`
토큰을 조합한다.

## 제품 색상 규칙

- 밝은 노랑, 민트, 코랄은 fill로 사용하고 텍스트는 진한 대응 `fg` 토큰을 사용한다.
- `text-primary`, `text-destructive`처럼 legacy fill 색상을 텍스트로 쓰는 패턴은 새 코드에 추가하지 않는다.
- 선택 상태는 `action-selected-*`, 주요 행동은 `action-primary-*`로 분리한다.
- 신규 색상은 임의 hex보다 먼저 semantic token 조합으로 해결한다.
- app JSX에서 raw hex를 새로 추가하지 않는다. 이미지, SVG asset, 계산된 chart series만 예외다.

## 타이포그래피

- 공통 UI, 학습자 앱, 어드민 앱, Storybook은 `pretendard@1.3.9` 패키지의 동적 서브셋 WOFF2를 self-host하고 `Pretendard Variable`을 우선 사용한다. 외부 폰트 CDN 요청은 허용하지 않으며 `font-display: swap`으로 시스템 폰트 fallback 뒤 교체한다. Pretendard는 SIL Open Font License 1.1을 따른다.
- 모든 문서와 사용자 노출 텍스트는 한국어를 기본으로 한다.
- letter spacing은 기본 0을 유지한다. 라벨성 uppercase 또는 작은 eyebrow에 한해 현재 구현처럼 `0.06em`에서 `0.08em`을 허용한다.

## 글자 크기 기준

새 UI는 semantic text token을 우선 사용한다.

| 토큰         | 기준                                  | 용도                     |
| ------------ | ------------------------------------- | ------------------------ |
| `display-lg` | `clamp(3rem, 6vw, 4.25rem)` / `1.05`  | 랜딩 hero                |
| `display-md` | `clamp(2.5rem, 5vw, 3.75rem)` / `1.1` | 랜딩 section             |
| `heading-xl` | `2.5rem` / `1.2`                      | 코스 상세, 완료 화면     |
| `heading-lg` | `2rem` / `1.2`                        | 페이지 제목              |
| `heading-md` | `1.625rem` / `1.3`                    | 레슨 활동 제목           |
| `heading-sm` | `1.5rem` / `1.3`                      | 섹션 제목                |
| `title-lg`   | `1.25rem` / `1.35`                    | 카드 제목, admin section |
| `title-md`   | `1.125rem` / `1.4`                    | 작은 카드 제목           |
| `body-lg`    | `1.125rem` / `1.65`                   | 설명, 리치 텍스트        |
| `body-md`    | `1rem` / `1.6`                        | 기본 본문                |
| `body-sm`    | `0.9375rem` / `1.55`                  | admin table, 보조 본문   |
| `label-md`   | `0.875rem` / `1.4`                    | field label, CTA 보조    |
| `label-sm`   | `0.8125rem` / `1.4`                   | metadata                 |
| `caption`    | `0.75rem` / `1.4`                     | 시간, ID, 표 부가 정보   |

## 스페이싱과 레이아웃

- 학습자 앱 본문 최대 폭은 `max-w-6xl`, 상세/레슨은 `max-w-3xl` 또는 `max-w-2xl`을 사용한다.
- 학습자 앱 페이지 padding은 모바일 `px-5` 또는 `px-6`, 데스크톱 `md:px-10` 또는 `md:px-12`를 기준으로 한다.
- 어드민 shell은 256px sidebar와 본문 1fr flex/grid 구성을 사용한다.
- 어드민 본문은 `max-w-6xl`, 모바일 `px-5`, 데스크톱 `md:px-10`, `py-8`을 기준으로 한다.

## Radius

| 이름      | comfortable |    compact | 용도             |
| --------- | ----------: | ---------: | ---------------- |
| `control` |    `1.5rem` | `0.875rem` | input, button    |
| `card`    |      `2rem` |  `1.25rem` | card, list item  |
| `panel`   |    `2.5rem` |   `1.5rem` | 큰 section       |
| `dialog`  |      `2rem` |   `1.5rem` | overlay          |
| `pill`    |     `999px` |    `999px` | badge, segmented |

기존 `rounded-4xl`, `rounded-5xl`은 migration alias로 유지한다.

## Shadow와 Border

- `@workspace/ui`의 `Card`와 앱 패널은 shadow보다 색상 면, radius, 얇은 charcoal alpha border로 구분한다.
- Input, Textarea, `SelectTrigger variant="outlined"` 같은 form control은 배경 fill 없이 `border-field-border`로 구분한다.
- Dialog shadow는 `0 20px 45px rgb(42 38 33 / 0.16)`을 기준으로 사용한다.
- focus ring은 `border-focus` semantic token을 사용한다.

## Motion

- Button의 기본 누름 반응은 `buttonVariants`가 소유한다. active 상태에서 `scale(0.96)`으로 눌림을 표현하되 disabled, 열려 있는 disclosure trigger에는 적용하지 않는다. 호출부는 `.btn-squish`를 직접 사용하지 않는다.
- 콘텐츠 진입은 `.an-fi`의 `0.4s cubic-bezier(0.16, 1, 0.3, 1)` fade-up을 사용한다.
- 랜딩 장식 요소는 marquee와 pebble float을 사용할 수 있으나, 레슨 본문과 CTA 안정성을 해치면 제거한다.
- 공용 motion token은 `prefers-reduced-motion`에서 duration을 1ms로 낮추고 press scale을 1로 둔다.
