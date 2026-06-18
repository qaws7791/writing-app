# 디자인 파운데이션

이 문서는 색상, 타이포그래피, 스페이싱, radius, shadow, motion의 현재 기준이다. 새 UI는 이 값을 먼저 사용하고, 새 토큰이 필요하면 구현 전에 이 문서를 갱신한다.

## 적용 범위

- 공통 컴포넌트 토큰: `packages/ui/src/styles/globals.css`
- 학습자 앱 토큰: `apps/web/src/app/globals.css`
- 어드민 앱 스타일: `apps/admin/src/app/globals.css`

## 공통 토큰

`@workspace/ui`는 Tailwind CSS 4와 shadcn 계열 semantic token을 사용한다.

| 토큰            | 라이트                  | 다크                    | 용도             |
| --------------- | ----------------------- | ----------------------- | ---------------- |
| `--background`  | `oklch(0.99 0.004 250)` | `oklch(0.17 0.02 260)`  | 공통 앱 배경     |
| `--foreground`  | `oklch(0.2 0.025 260)`  | `oklch(0.95 0.006 250)` | 기본 텍스트      |
| `--card`        | `oklch(1 0 0)`          | `oklch(0.21 0.025 260)` | 공통 카드        |
| `--primary`     | `oklch(0.45 0.11 175)`  | `oklch(0.72 0.12 175)`  | 공통 주요 행동   |
| `--destructive` | `oklch(0.57 0.2 27)`    | `oklch(0.69 0.18 23)`   | 삭제, 실패, 위험 |
| `--ring`        | `oklch(0.58 0.12 175)`  | `oklch(0.72 0.12 175)`  | 포커스 ring      |

공통 radius 기준은 `--radius: 0.5rem`이다. `sm`, `md`, `lg`, `xl`은 이 값에서 파생한다.

## 학습자 색상

학습자 앱은 별도 제품 토큰을 사용한다.

| 토큰            | 라이트    | 다크      | 용도                           |
| --------------- | --------- | --------- | ------------------------------ |
| `cream`         | `#fdfbf7` | `#1b1916` | 앱 배경, 레슨 배경             |
| `surface`       | `#f4efe6` | `#262320` | 카드, 칩, 내비게이션 활성 배경 |
| `surface-hover` | `#eae2d3` | `#332f2a` | hover, inactive selected 후보  |
| `charcoal`      | `#2a2621` | `#f4efe6` | 본문, 기본 CTA                 |
| `primary`       | `#ffc800` | `#ffc800` | 핵심 강조, 진행률, avatar      |
| `coral`         | `#ff7a6b` | `#ff8c7f` | 오답, 경고성 피드백            |
| `mint`          | `#34c759` | `#3dd968` | 정답, 긍정 피드백              |
| `muted`         | `#524d47` | `#a89f92` | 보조 텍스트                    |

학습자 텍스트와 토큰은 색상 이름이 의미를 가진다. 신규 색상은 임의 hex보다 먼저 위 토큰의 조합으로 해결한다.

## 어드민 색상

어드민은 현재 CSS class 기반 색상을 사용한다. 신규 어드민 UI는 아래 값을 유지하고, 반복이 늘어나면 token화한다.

| 값                                         | 용도                                |
| ------------------------------------------ | ----------------------------------- |
| `#f7f8fb`, `#f8fafc`, `#f1f5f9`            | 앱 배경과 hover 배경                |
| `#ffffff`                                  | 패널, 사이드바, 입력 배경           |
| `#172033`, `#111827`, `#0f172a`            | 제목과 강한 텍스트                  |
| `#475569`, `#64748b`, `#94a3b8`            | 본문 보조 텍스트                    |
| `#dde3ea`, `#e5ebf1`, `#cbd5e1`            | border, table divider, input border |
| `#0f766e`, `#115e59`, `#ccfbf1`            | 주요 행동, 활성 nav, 막대 차트      |
| `#e11d48`, `#be123c`, `#fff1f2`            | 위험 행동과 오류                    |
| `#10b981`, `#bbf7d0`, `#f0fdf4`, `#166534` | 성공 상태                           |

## 타이포그래피

- 학습자 앱은 Pretendard를 우선 사용한다.
- 공통 UI는 Inter, system UI fallback을 사용한다.
- 모든 문서와 사용자 노출 텍스트는 한국어를 기본으로 한다.
- letter spacing은 기본 0을 유지한다. 라벨성 uppercase 또는 작은 eyebrow에 한해 현재 구현처럼 `0.06em`에서 `0.08em`을 허용한다.

## 글자 크기 기준

| 맥락                | 기준                                                     |
| ------------------- | -------------------------------------------------------- |
| 학습자 랜딩 H1      | `clamp(2.5rem, 6vw, 4.25rem)`                            |
| 학습자 섹션 제목    | `clamp(2rem, 4vw, 3rem)`                                 |
| 학습자 화면 H1      | `2.25rem`에서 `2.5rem`                                   |
| 학습자 카드 제목    | `1rem`에서 `1.5rem`                                      |
| 학습자 본문         | `0.9375rem`에서 `1.125rem`, line-height `1.45`에서 `1.6` |
| 어드민 H1           | `26px`, line-height `1.25`                               |
| 어드민 섹션 제목    | `17px`에서 `18px`                                        |
| 어드민 본문, 테이블 | `13px`에서 `14px`                                        |

## 스페이싱과 레이아웃

- 학습자 앱 본문 최대 폭은 `max-w-6xl`, 상세/레슨은 `max-w-3xl` 또는 `max-w-2xl`을 사용한다.
- 학습자 앱 페이지 padding은 모바일 `px-5` 또는 `px-6`, 데스크톱 `md:px-10` 또는 `md:px-12`를 기준으로 한다.
- 학습자 카드 내부 padding은 `p-4`, `p-6`, `p-7`, `p-8`, `md:p-10`을 사용한다.
- 어드민 shell은 `264px minmax(0, 1fr)` 2열 grid다.
- 어드민 본문 padding은 `28px 32px 48px`이다.
- 어드민 패널 간격은 16px을 기본으로 한다.

## Radius

| 이름                 | 값                     | 용도                        |
| -------------------- | ---------------------- | --------------------------- |
| 공통 `rounded-md`    | `calc(--radius - 2px)` | 입력                        |
| 공통 `rounded-lg`    | `0.5rem`               | 버튼, 카드, 어드민 패널     |
| 학습자 `rounded-2xl` | Tailwind 기본          | 작은 카드, 썸네일           |
| 학습자 `rounded-4xl` | `2.5rem`               | 주요 학습 카드, CTA, dialog |
| 학습자 `rounded-5xl` | `3.5rem`               | 랜딩 프레임, 완료 카드      |
| pill                 | `999px`                | CTA, 칩, 진행률, 상태 pill  |

어드민은 8px radius를 기본으로 유지한다. 학습자 앱의 큰 radius를 어드민에 가져오지 않는다.

## Shadow와 Border

- `@workspace/ui`의 `Card`는 `shadow-md`와 `ring-foreground/5`를 사용한다.
- 학습자 앱의 대부분 표면은 shadow보다 색상 면과 radius로 구분한다.
- 어드민은 `1px` border로 패널, 테이블, 입력, dialog를 구분한다.
- Dialog shadow는 어드민 기준 `0 20px 45px rgb(15 23 42 / 0.22)`를 사용한다.

## Motion

- 학습자 앱의 기본 누름 반응은 `.btn-squish`를 사용한다. active 상태에서 `scale(0.96)`으로 눌림을 표현한다.
- 콘텐츠 진입은 `.an-fi`의 `0.4s cubic-bezier(0.16, 1, 0.3, 1)` fade-up을 사용한다.
- 랜딩 장식 요소는 marquee와 pebble float을 사용할 수 있으나, 레슨 본문과 CTA 안정성을 해치면 제거한다.
- `prefers-reduced-motion` 대응은 현재 미구현이다. 새 복잡한 motion을 추가할 때 함께 반영한다.
