# 디자인 파운데이션

이 문서는 색상, 타이포그래피, 스페이싱, radius, shadow, motion의 현재 기준이다. 새 UI는 이 값을 먼저 사용하고, 새 토큰이 필요하면 구현 전에 이 문서를 갱신한다.

## 적용 범위

- 공통 컴포넌트 토큰: `packages/ui/src/styles/globals.css`
- 학습자 앱 스타일: `apps/web/src/app/globals.css`
- 어드민 앱 스타일: `apps/admin/src/app/globals.css`

학습자 앱과 어드민 앱은 같은 제품 시각 언어를 사용한다. 색상, radius, font, motion의 기준은 `packages/ui`에 두고, 각 앱의 `globals.css`는 화면별 조합과 레이아웃 보정만 담당한다.

## 공통 토큰

`@workspace/ui`는 Tailwind CSS 4, Base UI 기반 primitive, Kwep 프로토타입에서 검증된 제품 토큰을 사용한다.

| 토큰            | 라이트    | 다크      | 용도             |
| --------------- | --------- | --------- | ---------------- |
| `--background`  | `#fdfbf7` | `#1b1916` | 공통 앱 배경     |
| `--foreground`  | `#2a2621` | `#f4efe6` | 기본 텍스트      |
| `--card`        | `#f4efe6` | `#262320` | 공통 카드        |
| `--primary`     | `#2a2621` | `#f4efe6` | 공통 주요 행동   |
| `--destructive` | `#ffada7` | `#6e2a22` | 삭제, 실패, 위험 |
| `--ring`        | `#2a2621` | `#f4efe6` | 포커스 ring      |

공통 큰 radius 기준은 `--radius: 2.5rem`이다. 작은 입력과 표 내부 요소는 `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`의 고정 파생 값을 사용하고, 주요 카드와 CTA는 `rounded-4xl` 이상을 사용한다.

## 제품 색상

학습자 앱과 어드민 앱은 같은 제품 토큰을 사용한다.

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

제품 텍스트와 토큰은 색상 이름이 의미를 가진다. 신규 색상은 임의 hex보다 먼저 위 토큰의 조합으로 해결한다.

## 타이포그래피

- 공통 UI, 학습자 앱, 어드민 앱은 Pretendard를 우선 사용한다.
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
| 어드민 H1           | `32px`, line-height `1.2`                                |
| 어드민 섹션 제목    | `20px`에서 `24px`                                        |
| 어드민 본문, 테이블 | `14px`에서 `16px`                                        |

## 스페이싱과 레이아웃

- 학습자 앱 본문 최대 폭은 `max-w-6xl`, 상세/레슨은 `max-w-3xl` 또는 `max-w-2xl`을 사용한다.
- 학습자 앱 페이지 padding은 모바일 `px-5` 또는 `px-6`, 데스크톱 `md:px-10` 또는 `md:px-12`를 기준으로 한다.
- 학습자 카드 내부 padding은 `p-4`, `p-6`, `p-7`, `p-8`, `md:p-10`을 사용한다.
- 어드민 shell은 256px sidebar와 본문 1fr flex/grid 구성을 사용한다.
- 어드민 본문은 `max-w-6xl`, 모바일 `px-5`, 데스크톱 `md:px-10`, `py-8`을 기준으로 한다.
- 어드민 패널 간격은 20px에서 24px을 기본으로 한다.

## Radius

| 이름                 | 값        | 용도                        |
| -------------------- | --------- | --------------------------- |
| 공통 `rounded-md`    | `0.75rem` | 작은 입력, 표 내부 요소     |
| 공통 `rounded-lg`    | `1rem`    | 작은 버튼, 보조 패널        |
| 공통 `rounded-2xl`   | `1rem`    | 작은 카드, 썸네일           |
| 공통 `rounded-3xl`   | `1.5rem`  | 큰 입력, 보조 CTA           |
| 학습자 `rounded-4xl` | `2.5rem`  | 주요 학습 카드, CTA, dialog |
| 학습자 `rounded-5xl` | `3.5rem`  | 랜딩 프레임, 완료 카드      |
| pill                 | `999px`   | CTA, 칩, 진행률, 상태 pill  |

어드민도 학습자 앱과 같은 큰 radius와 pill 형태를 사용한다. 표 내부 셀, 작은 입력, 인라인 필터처럼 밀도가 필요한 곳만 작은 radius를 사용한다.

## Shadow와 Border

- `@workspace/ui`의 `Card`와 앱 패널은 shadow보다 색상 면, radius, 얇은 charcoal alpha border로 구분한다.
- Dialog shadow는 `0 20px 45px rgb(42 38 33 / 0.16)`을 기준으로 사용한다.

## Motion

- 학습자 앱의 기본 누름 반응은 `.btn-squish`를 사용한다. active 상태에서 `scale(0.96)`으로 눌림을 표현한다.
- 콘텐츠 진입은 `.an-fi`의 `0.4s cubic-bezier(0.16, 1, 0.3, 1)` fade-up을 사용한다.
- 랜딩 장식 요소는 marquee와 pebble float을 사용할 수 있으나, 레슨 본문과 CTA 안정성을 해치면 제거한다.
- `prefers-reduced-motion` 대응은 현재 미구현이다. 새 복잡한 motion을 추가할 때 함께 반영한다.
