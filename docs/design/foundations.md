# 디자인 파운데이션

이 문서는 Luma 색상, 타이포그래피, 스페이싱, radius, elevation과 motion의 제품 기준을 정의한다.

새 UI는 이 계약을 먼저 사용해야 한다.

새 의미 역할은 구현 전에 이 문서에 추가해야 한다.

## 적용 범위

- 공통 token과 primitive: `packages/shared/ui/src/styles/`
- 학습자 앱 조합: `apps/web/src/app/globals.css`
- 관리자 앱 조합: `apps/admin/src/app/globals.css`
- UI 문서 조합과 demo preset: `apps/ui/src/styles/global.css`
- 실행 가능한 표본: Astro UI 문서 `/docs/foundations/*`

학습자 앱과 관리자 앱은 같은 Luma 시각 언어를 사용한다.

각 앱의 전역 CSS는 `@workspace/ui/styles`를 소비하고 Tailwind 실행과 앱 전용 layout만 소유한다.

## Luma 원칙

- 따뜻한 paper와 ink 뉴트럴을 기본으로 사용한다.
- 콘텐츠는 Canvas에 직접 놓을 수 있어야 한다.
- Surface는 관계를 설명할 때만 사용한다.
- Border와 elevation은 구조를 설명하는 최소 강도로 사용한다.
- Control은 중간 radius를 기본으로 사용한다.
- Pill은 badge, chip, tag와 작은 segment에만 사용한다.
- 한 작업 영역은 한 개의 Primary 행동만 강조한다.
- 상태는 색상 외에 text, icon, shape와 semantic 중 하나 이상을 함께 사용한다.

## Token 소유권

정확한 runtime 값은 다음 파일이 소유한다.

- `packages/shared/ui/src/styles/tokens/reference.css`
- `packages/shared/ui/src/styles/tokens/semantic.css`
- `packages/shared/ui/src/styles/tokens/motion.css`
- `packages/shared/ui/src/styles/globals.css`

이 문서는 token의 의미와 사용 규칙을 소유한다.

Astro UI 문서 `/docs/foundations/color`는 runtime 값을 해석해서 보여 준다.

## Semantic Color

| token                               | 용도                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `background`, `foreground`          | 앱 Canvas와 기본 text                                  |
| `card`, `card-foreground`           | 독립 콘텐츠 Surface                                    |
| `popover`, `popover-foreground`     | menu, popover와 dialog Surface                         |
| `surface`, `surface-foreground`     | 낮은 강조의 구조 Surface                               |
| `primary`, `primary-foreground`     | 한 작업 영역의 Primary 행동                            |
| `secondary`, `secondary-foreground` | Primary를 보조하는 행동과 Surface                      |
| `muted`, `muted-foreground`         | 후퇴한 정보와 metadata                                 |
| `accent`, `accent-foreground`       | selected, hover와 조용한 강조                          |
| `destructive`                       | 실제 위험과 오류                                       |
| `success`                           | 성공과 완료                                            |
| `warning`                           | 주의와 확인 필요                                       |
| `info`                              | 중립 정보                                              |
| `purple`                            | provenance 또는 별도 의미가 정의된 특수 상태           |
| `border`, `input`, `ring`           | 구조 경계, 입력 경계와 focus indicator                 |
| `selection`, `selection-foreground` | text selection과 선택 상태                             |
| `chart-1`부터 `chart-5`             | 순서가 있는 중립 chart 계열                            |
| `series-1`부터 `series-4`           | 병렬 항목 정체. 평가 상태와 겹치지 않는 낮은 채도 구분 |

상태 token은 단독 text 또는 낮은 opacity Surface와 조합한다.

넓은 원색 상태 Surface를 기본값으로 사용하지 않는다.

확인 전 선택은 `info` 톤온톤으로 표시한다. `success`는 확인 후 정답에만 쓴다.

`series-*`는 카테고리·짝처럼 같은 종류의 병렬 항목을 구분할 때만 쓴다. 점·라벨 등 비색 단서와 함께 쓰고, 정답·오답·선택 상태에는 쓰지 않는다.

상태 token은 단독 text 또는 낮은 opacity Surface와 조합한다.

넓은 원색 상태 Surface를 기본값으로 사용하지 않는다.

Sidebar token은 같은 paper, ink, surface와 focus 계열을 사용한다.

Sidebar는 별도 브랜드 색상 체계를 만들지 않는다.

## 타이포그래피

Pretendard Variable과 시스템 font stack을 사용한다.

외부 font CDN 요청은 금지한다.

| 역할     | 크기 / line-height | weight  | 용도                       |
| -------- | ------------------ | ------- | -------------------------- |
| Display  | 40 / 48 px         | 600–700 | 짧은 제품 또는 페이지 표제 |
| Heading  | 32 / 40 px         | 600–700 | 주요 section 제목          |
| Title    | 24 / 32 px         | 600     | 화면 또는 panel 제목       |
| Subtitle | 18 / 28 px         | 500–600 | 콘텐츠 group 제목          |
| Body     | 16 / 26 px         | 400–500 | 읽기와 설명                |
| Label    | 14 / 20 px         | 500–600 | control과 row 제목         |
| Meta     | 12 / 18 px         | 500     | 날짜, 상태와 보조 정보     |

본문은 일반적으로 45자에서 75자 폭을 사용한다.

한국어 본문은 과도한 음수 letter spacing을 사용하지 않는다.

표, 시간과 counter의 숫자는 tabular numerals를 사용한다.

## Spacing

기본 spacing scale은 4, 6, 8, 12, 16, 20, 24, 32, 40, 48과 64 px이다.

서로 다른 section의 간격은 section 내부 요소의 간격보다 커야 한다.

화면 밀도는 고정된 control 크기와 spacing scale 안에서 layout 조합으로 조정한다.

## Radius

| token        |    값 | 대표 용도               |
| ------------ | ----: | ----------------------- |
| `radius-sm`  |  6 px | 작은 내부 요소          |
| `radius-md`  |  8 px | 조밀한 row와 작은 input |
| `radius-lg`  | 10 px | 기본 control            |
| `radius-xl`  | 14 px | menu와 작은 Surface     |
| `radius-2xl` | 18 px | panel과 media           |
| `radius-3xl` | 22 px | 큰 Surface              |
| `radius-4xl` | 26 px | card와 modal            |
| `radius-5xl` | 32 px | 큰 editorial Surface    |

## Control 크기

| 크기      |  높이 |
| --------- | ----: |
| `xs`      | 28 px |
| `sm`      | 36 px |
| `default` | 40 px |
| `lg`      | 48 px |

일반 주요 control은 가능한 40×40 CSS px 이상의 pointer target을 제공한다.

## Border와 elevation

- 기본 구조 경계는 낮은 대비의 1 px `border`를 사용한다.
- Input은 `input` 경계를 사용한다.
- Focus indicator는 `ring`을 사용한다.
- Light theme의 elevation은 멀어지는 거리를 표현하는 낮은 shadow를 사용한다.
- Dark theme의 elevation은 넓은 shadow보다 얇은 상단 highlight를 우선한다.
- Dark theme의 바깥 그림자는 인접 spacing을 잠식하지 않을 만큼 상자에 붙인다.
- Dark theme의 상단 inset highlight는 상자 안에서만 그린다.
- 한 화면의 elevation 단계는 가능한 세 단계 이하로 유지한다.
- 클릭·터치 가능한 버튼과 타일 카드는 작은 elevation(`shadow-xs`)으로 조작 가능함을 드러낸다. 채점 후 잠긴 항목에는 이 그림자를 쓰지 않는다.

## Motion

| 범위                   |    duration |
| ---------------------- | ----------: |
| press와 hover          |   80–140 ms |
| 작은 상태 전환         |  120–180 ms |
| menu, popover와 dialog |  160–240 ms |
| composed entrance      | 최대 320 ms |

Enter와 이동은 `cubic-bezier(0.32, 0.72, 0, 1)`을 사용한다.

Exit는 `cubic-bezier(0.62, 0.04, 0.86, 0.4)`을 사용한다.

Motion은 layout shift를 만들거나 입력을 지연시키면 안 된다.

## 사용자 설정

- `prefers-color-scheme`에서 light와 dark theme를 제공한다.
- `prefers-reduced-motion`에서 비필수 이동과 반복 animation을 제거한다.
- `prefers-contrast: more`에서 text, border와 focus 대비를 강화한다.
- `forced-colors: active`에서 색상 이미지 없이 상태를 구분한다.
- `prefers-reduced-transparency`를 지원하는 환경에서 blur와 투명도를 제거한다.
- 투명 Surface는 항상 불투명 fallback을 먼저 제공한다.
