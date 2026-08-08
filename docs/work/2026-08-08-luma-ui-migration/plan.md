# Luma UI 전체 전환 계획

## 문서 상태

- 상태: 전체 source·registry·Astro 통합 완료, 최종 검증 중
- 구현 상태: 0단계부터 7단계까지 완료, 8단계 전체 upstream 이관 완료
- 기준 애플리케이션 커밋: `232a14e1a6b890bdacd60709f55a3b5a8c441c9a`
- 기준 대상 UI 커밋: `010ddc4421d0d2875c858f3cec69a4a93dbf2f28`

이 문서는 현재 프로젝트를 [`ui/`](../../../ui/)의 Luma 디자인 시스템으로 전환하는 순서와 완료 기준을 정의한다.

실행 기준선은 [`baseline.md`](./baseline.md)에 기록한다.

변경 단위와 제거 대상은 [`migration-ledger.md`](./migration-ledger.md)에서 추적한다.

## 2026-08-09 범위 확장

선택적 source vendoring 결정을 폐기했습니다.

대상 UI commit의 Git 추적 파일 355개를 `.git` metadata만 제외하고 신규 `apps/ui` Astro 앱으로 이관했습니다.

원본 Markdown 13개를 모두 같은 앱에 이관했습니다.

전체 registry UI, block source와 hook을 `packages/shared/ui`에도 이관했습니다.

별도 upstream lockfile과 Oxfmt 설정은 root 단일 소유 계약을 지키기 위해 비활성 snapshot으로 보존했습니다.

## 용어

| 용어       | 의미                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| 대상 UI    | [`qaws7791/ui`](https://github.com/qaws7791/ui)의 Luma registry 소스와 디자인 계약 |
| 공유 UI    | [`packages/shared/ui`](../../../packages/shared/ui/)와 `@workspace/ui` import 경계 |
| 예제 block | 대상 UI의 `registry:block` 항목                                                    |
| 호환 계층  | 전환 중인 소비자를 위해 기존 API를 새 토큰이나 새 컴포넌트에 연결하는 임시 코드    |

## 목표

모든 사용자 화면은 대상 UI의 토큰, primitive, 학습 컴포넌트와 조합 규칙을 사용해야 한다.

기존 route, API, 인증, 권한, 데이터 상태와 서버 채점 규칙은 유지해야 한다.

공유 UI는 전환 후에도 애플리케이션과 UI 구현 사이의 단일 소유 경계여야 한다.

## 핵심 결정

1. 공유 UI의 package 이름과 공개 import 경계를 유지한다.
2. 대상 UI의 전체 registry UI, block source와 hook을 공유 UI에 vendoring한다.
3. 각 source import를 공유 UI의 `#ui/*` 내부 alias로 변환한다.
4. 애플리케이션은 `@workspace/ui/components/*` 경로만 사용한다.
5. [`ui/package.json`](../../../ui/package.json)은 `private`이고 package export를 제공하지 않으므로 `ui/`를 runtime workspace dependency로 연결하지 않는다.
6. 예제 block source는 공유 UI와 Astro registry 앱에 모두 보존한다.
7. 예제 block의 fixture, local state, 임시 link와 client-side 채점은 제품 data flow에 연결하지 않는다.
8. 전환은 독립적으로 배포하고 되돌릴 수 있는 8개 단계로 나눈다.
9. 중첩 Git 저장소의 `.git` metadata는 제외하고 모든 Git 추적 source를 `apps/ui`에 포함한다.

이 방식은 [shadcn registry의 source distribution 방식](https://ui.shadcn.com/docs/registry/getting-started)을 따른다.

## 범위

### 포함 범위

- 공유 UI의 토큰, style, primitive와 공개 export
- 학습 단계, 집중형 글쓰기와 관리자 전용 UI 조합
- 웹, 관리자와 Storybook의 UI 소비 코드
- icon 체계
- UI 관련 직접 dependency와 lockfile
- 화면별 접근성, 반응형 layout, theme와 motion 상태
- UI authority 문서와 Storybook 계약

### 제외 범위

- API schema와 database schema
- 인증과 권한 정책
- route와 URL 계약
- 서버 채점 정책
- 학습 콘텐츠와 문구 정책
- 분석 지표의 계산 규칙
- UI 전환과 무관한 refactor

## 조사 기준선

| 항목                  | 현재 프로젝트                       | 대상 UI                               | 계획에 미치는 영향                           |
| --------------------- | ----------------------------------- | ------------------------------------- | -------------------------------------------- |
| 배포 형태             | 공유 workspace package              | source registry와 문서용 Astro 앱     | source vendoring이 필요하다.                 |
| 공유 컴포넌트         | 비테스트 컴포넌트 파일 43개         | UI 항목 115개와 예제 block 20개       | 전체 source를 이관하고 제품 소비는 분리한다. |
| 같은 이름의 primitive | 20개                                | 20개 모두 API 차이가 있다.            | 파일 덮어쓰기를 금지한다.                    |
| UI 소비 범위          | 웹, 관리자와 Storybook의 파일 108개 | 직접 소비자가 없다.                   | 소비자 단위 migration ledger가 필요하다.     |
| CSS 변수              | 현재 310개                          | 대상 111개                            | 의미가 같은 변수는 56개뿐이다.               |
| icon                  | Lucide                              | Hugeicons                             | icon 전환을 별도 단계로 관리한다.            |
| 학습 단계             | 10종                                | 대응 가능한 학습 컴포넌트를 제공한다. | 서버 상태를 유지한 채 view만 교체한다.       |
| 예제 데이터           | 실제 route와 server state           | fixture와 local state                 | 예제 block을 product code로 사용하지 않는다. |

기준선 수치는 위 두 기준 커밋에서 산출한 작업용 snapshot이다.

## 수용 기준 비교

구현자는 각 행의 처리 기준을 충족한 뒤 해당 단계의 코드를 merge해야 한다.

| 기준         | 현재 계약                                                     | 대상 UI 차이                                            | 처리 기준                                                                                                         |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 소유 경계    | 공유 UI가 primitive와 순수 domain view를 소유한다.            | 대상 UI는 registry source 경로를 사용한다.              | source를 공유 UI 내부로 이동한다. 앱 source는 package export만 사용하고 build adapter만 private alias를 해석한다. |
| 시각 기반    | cream, charcoal, yellow, coral과 mint 중심이다.               | warm paper, ink와 절제된 accent 중심이다.               | [`foundations.md`](../../design/foundations.md)를 먼저 갱신하고 Luma semantic token으로 교체한다.                 |
| 컴포넌트 API | 기존 variant와 size를 사용한다.                               | 같은 이름도 prop과 slot이 다르다.                       | 소비자를 같은 변경 단위에서 수정한다.                                                                             |
| 제품 동작    | route와 server state가 화면을 결정한다.                       | 예제 block은 local state와 fixture를 사용한다.          | 기존 container와 data flow를 유지한다.                                                                            |
| 학습 채점    | 서버 응답이 정답과 feedback을 확정한다.                       | 예제 block 일부가 client에서 결과를 계산한다.           | target view는 서버 결과만 표시한다.                                                                               |
| React 경계   | Server Component를 기본으로 사용한다.                         | 대상 interactive component는 client directive를 가진다. | client boundary를 interactive leaf에만 둔다.                                                                      |
| 접근성       | [`accessibility.md`](../../design/accessibility.md)를 따른다. | 대상 UI는 추가 contrast와 transparency 상태를 정의한다. | keyboard, 320 px, 200% zoom, reduced motion, forced colors와 reduced transparency를 검증한다.                     |
| Storybook    | 공개 공유 컴포넌트의 상태 계약을 문서화한다.                  | 대상 UI의 state와 slot이 더 많다.                       | 공개 API의 필수 상태를 story와 interaction으로 기록한다.                                                          |
| 번들         | route별 gzip 예산이 있다.                                     | icon, drag-and-drop와 chart dependency가 달라진다.      | 직접 import와 route 분리를 유지하고 예산 상향으로 실패를 숨기지 않는다.                                           |
| provenance   | 현재 공유 UI가 source를 소유한다.                             | 대상 UI는 tag가 없는 registry source다.                 | commit SHA, 원본 경로, license와 수정 내용을 기록한다.                                                            |

## 컴포넌트 전환 규칙

| 현재 영역                                                  | 대상 UI                                        | 처리 방식                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 전역 style                                                 | base token과 Luma theme                        | demo preset과 문서 사이트 utility를 제외하고 semantic token만 반영한다.                       |
| `button`, `dialog`, `select` 등 이름이 같은 primitive 20개 | 같은 이름의 Luma primitive                     | 기존 소비자를 조사한 뒤 source와 소비자를 함께 교체한다.                                      |
| `surface`, `page-header`, `section-header`                 | card, field, separator와 layout composition    | 임시 호환 계층을 거친 뒤 Luma 조합으로 교체한다.                                              |
| `filter-toolbar`, `stat-card`                              | field, select, table, card와 chart composition | 관리자 화면 단위로 재조합한다.                                                                |
| `sticky-action-bar`                                        | lesson footer 또는 app-owned composition       | route 동작은 app에 남기고 시각 구조만 교체한다.                                               |
| `theme-selector`                                           | dropdown, button과 theme state                 | theme state는 app에 남기고 control만 교체한다.                                                |
| `markdown-content`                                         | prose                                          | 기존 `react-markdown` renderer를 `ProseBody` 내부에 유지한다.                                 |
| `csp-provider`, 안전한 navigation helper                   | 대상 항목 없음                                 | 비시각 infrastructure로 유지한다.                                                             |
| 기존 상태별 button variant                                 | button과 insight                               | `correct`, `wrong`, `ink`, `solid`, `white` variant를 제거하고 상태는 `Insight`에서 표현한다. |
| Lucide icon                                                | Hugeicons                                      | 공유 icon entry를 먼저 바꾸고 direct import를 제거한다.                                       |

호환 계층은 아직 이전하지 않은 실제 소비자가 있는 동안에만 유지한다.

각 호환 계층은 제거 조건과 남은 소비자 수를 migration ledger에 기록해야 한다.

## 학습 단계 대응표

| 학습 단계         | 대상 UI 조합                   | 보존해야 하는 계약                |
| ----------------- | ------------------------------ | --------------------------------- |
| `READING`         | `Step` + `Prose`               | 읽기 완료 상태                    |
| `COMPARE`         | `Step` + `Compare` + `Insight` | 비교 기준과 서버 feedback         |
| `MULTIPLE_CHOICE` | `Choice` + `Insight`           | 단일 또는 복수 선택 규칙          |
| `FILL_BLANK`      | `Token` + `Insight`            | 입력 순서와 서버 채점 결과        |
| `SELECT`          | `Segment` + `Insight`          | 선택 가능 범위와 잠금 상태        |
| `ORDER`           | `Sortable` + `Insight`         | pointer와 keyboard 순서 변경      |
| `WRITE`           | `Compose`                      | 초안 저장과 제출 상태             |
| `AI_FEEDBACK`     | `Coaching`                     | loading, ready, error와 제한 상태 |
| `MATCH`           | `Pair` + `Insight`             | 연결 상태와 keyboard 조작         |
| `CATEGORIZE`      | `Classify` + `Insight`         | 항목 이동과 범주 상태             |

학습 단계 전환은 learner lesson과 admin learner-step preview를 같은 변경 단위로 처리한다.

## 화면 전환 순서

| 단계 | 화면                                       | 대상 참조                                                           | 핵심 보존 항목                                                  |
| ---- | ------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| 3    | `SCR-001`, `SCR-002`, `SCR-101`            | landing composition, `login-social`, `login-workspace`              | 인증 handler, server redirect와 landing의 Server Component 경계 |
| 3    | `SCR-003`, `SCR-004`, `SCR-005`, `SCR-007` | `home-learner`, `learn-catalog`, `course-detail`, `profile-learner` | 실제 course, progress와 profile data                            |
| 4    | `SCR-006`                                  | `lesson-session`의 anatomy와 학습 primitive                         | 서버 채점, 재시도와 완료 전이                                   |
| 5    | `SCR-008`, `SCR-009`, `SCR-010`            | `Compose`, `Coaching`, `Insight`, `Prose`                           | 자동 저장, AI 상태와 draft lifecycle                            |
| 6    | `SCR-102`, `SCR-103`, `SCR-104`            | `home-admin`, `courses-admin`, `course-admin`                       | 권한, filter, pagination과 curriculum mutation                  |
| 6    | `SCR-105`, `SCR-106`                       | `users-admin`, `user-admin`                                         | 검색, learner 상태와 상세 이력                                  |
| 6    | `SCR-107`, `SCR-108`                       | `admin-analytics`, `audit-admin`                                    | chart lazy loading, query state와 audit data                    |

각 화면의 최종 계약은 [`docs/design/screens`](../../design/screens/)의 문서를 따른다.

## 실행 단계

### 0. 출처와 기준선 고정

1. 대상 UI commit SHA와 원본 registry 경로를 provenance 문서에 기록한다.
2. 선택할 component와 dependency allowlist를 만든다.
3. 대상 UI의 MIT license와 third-party notice를 검토한다.
4. Hugeicons의 실제 배포 license를 lockfile과 package metadata에서 확인한다.
5. 기존 Storybook screenshot과 route bundle 크기를 기록한다.
6. 모든 공개 공유 UI import와 legacy token 소비자를 migration ledger에 기록한다.
7. registry의 `YOUR_GITHUB_ID` placeholder를 배포 URL로 사용하지 않는다.

완료 기준은 출처, license, 소비자와 기준선이 모두 추적 가능한 상태이다.

### 1. Luma 기반과 임시 token bridge 도입

1. [`foundations.md`](../../design/foundations.md)와 [`components.md`](../../design/components.md)를 Luma 계약으로 갱신한다.
2. 대상 UI의 semantic token과 theme layer를 공유 UI style에 반영한다.
3. 기존 token을 Luma token에 연결하는 임시 alias를 만든다.
4. 임시 alias에 독립적인 색상 값을 추가하지 않는다.
5. 대상 문서 사이트의 demo preset과 site utility를 제외한다.
6. 기존 Pretendard 로딩 경계를 유지한다.
7. Storybook foundations를 light와 dark theme로 갱신한다.

완료 기준은 기존 화면이 build되고 신규 Luma primitive가 같은 token source를 사용하는 상태이다.

### 2. 핵심 primitive와 icon 교체

1. `utils`, `button`, `field`, `input`, `textarea`, `label`, `card`, `badge`, `separator`를 먼저 교체한다.
2. dialog 계열과 menu 계열을 다음 변경 단위에서 교체한다.
3. `select`, `tabs`, `accordion`, `popover`, `progress`, `table`, `empty`, `spinner`를 마지막 primitive 변경 단위에서 교체한다.
4. 각 primitive 변경은 해당 소비자와 story를 포함한다.
5. Hugeicons를 공유 UI의 직접 dependency로 추가한다.
6. app과 story의 direct icon import를 공유 UI 경계로 이동한다.
7. `use client`는 interaction이 필요한 primitive에만 둔다.

완료 기준은 대상 primitive API를 사용하는 소비자만 남고 직접 Lucide import가 없는 상태이다.

### 3. 공통 shell, 인증과 일반 learner 화면 교체

1. 공통 header, navigation, surface와 section composition을 교체한다.
2. 인증 화면 2개와 landing을 교체한다.
3. learner home, catalog, course detail과 profile을 교체한다.
4. mobile navigation과 focus restoration을 검증한다.
5. loading, empty, partial, stale, offline와 permission 상태를 화면별로 검증한다.

완료 기준은 표의 3단계 화면이 Luma token과 primitive만 사용하는 상태이다.

### 4. 학습 단계 교체

1. `Step`, `Lesson`, `Insight`와 `Prose` shell을 먼저 연결한다.
2. 선택형 학습 단계를 `Choice`, `Token`과 `Segment`로 교체한다.
3. 이동형 학습 단계를 `Sortable`, `Pair`와 `Classify`로 교체한다.
4. 서술형 학습 단계를 `Compare`, `Compose`와 `Coaching`으로 교체한다.
5. server grading adapter가 대상 component state를 계산하도록 한다.
6. admin preview도 같은 공유 학습 component를 사용하도록 교체한다.
7. pointer 없이 모든 이동형 단계를 완료할 수 있는지 검증한다.

완료 기준은 10개 단계와 admin preview가 같은 UI 계약을 사용하고 client-side 정답 계산이 없는 상태이다.

### 5. 집중형 글쓰기 화면 교체

1. draft editor를 `Compose` anatomy로 교체한다.
2. AI feedback을 `Coaching`과 `Insight` 상태로 교체한다.
3. reflection과 제출 결과를 `Prose`와 card composition으로 교체한다.
4. 자동 저장, 재시도, 제한과 복구 동작을 유지한다.

완료 기준은 `SCR-008`부터 `SCR-010`까지의 상태 전이가 기존 계약과 일치하는 상태이다.

### 6. 관리자 화면 교체

1. admin shell과 dashboard를 교체한다.
2. course와 learner list를 Luma table과 filter composition으로 교체한다.
3. course와 learner detail을 교체한다.
4. analytics chart wrapper를 Luma token에 맞춘다.
5. audit 화면을 교체한다.
6. search parameter와 server pagination을 유지한다.

완료 기준은 `SCR-102`부터 `SCR-108`까지의 권한과 데이터 동작이 유지되는 상태이다.

### 7. 호환 계층 제거와 계약 확정

1. migration ledger의 남은 소비자 수가 0인지 확인한다.
2. legacy token alias와 legacy button variant를 제거한다.
3. 사용하지 않는 기존 component와 dependency를 제거한다.
4. 앱 source의 `#ui/*` import가 0개인지 확인한다. build adapter의 `#ui/*` mapping은 source package 내부 import 해석에만 사용한다.
5. Storybook의 legacy story를 제거한다.
6. 디자인, Storybook과 frontend authority 문서를 최종 구현에 맞춘다.
7. 완료된 작업 디렉터리를 `docs/archive`로 이동한다.

완료 기준은 아래 전체 완료 기준과 검증 기준을 모두 충족한 상태이다.

## 권장 merge 단위

| 순서 | 변경 단위             | 포함 범위                                            |
| ---- | --------------------- | ---------------------------------------------------- |
| 0    | 출처와 기준선         | provenance, license, allowlist와 migration ledger    |
| 1    | 디자인 기반           | authority 문서, token, theme와 Storybook foundations |
| 2-A  | 정적 primitive        | utility, form, card, badge와 separator               |
| 2-B  | interactive primitive | dialog, menu, select, tabs, accordion와 popover      |
| 2-C  | data display와 icon   | progress, table, empty, spinner와 Hugeicons          |
| 3-A  | 공통 shell과 인증     | landing, learner login과 admin login                 |
| 3-B  | 일반 learner 화면     | home, catalog, course detail과 profile               |
| 4-A  | 학습 shell            | lesson, step, prose, reading과 compare               |
| 4-B  | 선택형 학습           | choice, token과 segment                              |
| 4-C  | 이동형 학습           | sortable, pair와 classify                            |
| 4-D  | 서술형 학습           | compose, coaching와 admin preview                    |
| 5    | 집중형 글쓰기         | draft, AI feedback과 reflection                      |
| 6-A  | 관리자 shell          | navigation과 dashboard                               |
| 6-B  | course 관리           | course list, detail과 curriculum                     |
| 6-C  | learner 관리          | learner list와 detail                                |
| 6-D  | 관리자 관찰 화면      | analytics와 audit                                    |
| 7    | 제거와 확정           | 호환 계층, legacy source, dependency와 문서 정리     |

각 변경 단위는 자체 검증을 통과한 뒤 다음 변경 단위와 독립적으로 merge할 수 있어야 한다.

## dependency 계획

| dependency                                                                   | 계획                                                                    | 도입 조건                                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `@hugeicons/core-free-icons`, `@hugeicons/react`                             | 공유 UI의 직접 dependency로 추가한다.                                   | 2단계에서 icon 소비자를 함께 이전한다.                         |
| `@dnd-kit/dom`, `@dnd-kit/react`                                             | 학습 단계에서만 추가한다.                                               | `Sortable`의 keyboard와 pointer 검증을 통과한다.               |
| `recharts`                                                                   | 프로젝트가 소유한 version과 dynamic boundary를 유지한다.                | 대상 chart source가 기존 version에서 통과해야 한다.            |
| `shadcn`                                                                     | registry CLI와 문서 앱 dependency를 runtime graph에 복사하지 않는다.    | 필요한 CSS 규칙만 출처 표시와 함께 vendoring한다.              |
| `@shadcn/react`                                                              | 기본 전환에서는 추가하지 않는다.                                        | 실제 product가 `message-scroller`를 채택할 때 별도로 검토한다. |
| `@tanstack/react-table`, `cmdk`, `date-fns`, `react-day-picker`, `input-otp` | 기본 전환에서는 추가하지 않는다.                                        | 기존 화면의 실제 기능이 해당 component를 요구해야 한다.        |
| Tailwind                                                                     | 현재 catalog version에서 먼저 검증한다.                                 | 호환 실패가 재현될 때만 별도 dependency 변경으로 갱신한다.     |
| Bun                                                                          | root [`package.json`](../../../package.json)의 권위 version을 유지한다. | source vendoring에 runtime 상향이 필요하지 않아야 한다.        |
| Lucide                                                                       | 최종 소비자 제거 후 삭제한다.                                           | repository import 검색 결과가 0이어야 한다.                    |

대상 UI의 도구 graph와 애플리케이션의 runtime graph를 분리한다.

선택한 runtime dependency는 root graph에서 `audit:production`과 `audit:full`을 다시 실행한다.

## 위험 관리

| 위험                                                                       | 결과                                                                                     | 예방 또는 대응                                                                                      |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| registry URL에 `YOUR_GITHUB_ID` placeholder가 남아 있다.                   | 설치 시점마다 다른 source를 받거나 설치가 실패할 수 있다.                                | 기준 commit의 local source와 파일 allowlist를 사용한다.                                             |
| 대상 UI에 release tag가 없다.                                              | upstream 변경을 재현하기 어렵다.                                                         | commit SHA와 원본 경로를 provenance 문서에 고정한다.                                                |
| 2026-08-08 대상 도구 graph audit에 고위험 1건, 중간 3건과 낮음 1건이 있다. | 전체 도구 graph를 복사하면 알려진 `nanoid` 또는 `hono` 취약 dependency가 들어올 수 있다. | Astro, registry CLI와 MCP 도구를 추가하지 않고 선택한 runtime dependency만 root에서 다시 audit한다. |
| 같은 이름의 primitive 20개에 API 차이가 있다.                              | 단순 덮어쓰기는 compile 오류 또는 상태 표현 회귀를 만든다.                               | component source와 모든 해당 소비자를 같은 변경 단위에서 수정한다.                                  |
| token 이름의 공통 부분이 작다.                                             | 기존 token과 Luma token이 혼재할 수 있다.                                                | 하나의 값 source를 쓰는 임시 alias를 사용하고 7단계에서 삭제한다.                                   |
| drag-and-drop와 chart dependency가 route chunk에 포함될 수 있다.           | learner 또는 admin route가 bundle 예산을 초과할 수 있다.                                 | 직접 import, lazy boundary와 route bundle 검사를 유지한다.                                          |
| 예제 block이 fixture와 local state를 포함한다.                             | 실제 데이터, 권한 또는 서버 채점이 우회될 수 있다.                                       | 예제 block은 anatomy 참조로만 사용하고 기존 container를 유지한다.                                   |

## 검증 계획

### 변경 단위 검증

각 source 변경 단계는 다음 명령을 모두 통과해야 한다.

```sh
bun run ci:static
bun run ci:tests
bun run build
bun run check:route-bundles
```

UI가 변경된 단계는 다음 검증을 추가한다.

```sh
bun run test:ui-docs
bun --filter @workspace/ui-registry build
bun run test:e2e:pr
```

최종 단계는 다음 검증을 추가한다.

```sh
bun run test:e2e:release
bun run test:performance:lighthouse
bun run audit:production
bun run audit:full
```

### 수동 시각 검증

1. 각 화면을 mobile과 desktop viewport에서 확인한다.
2. 각 화면을 light와 dark theme에서 확인한다.
3. 320 px viewport에서 horizontal page scroll이 없는지 확인한다.
4. 200% zoom에서 content와 action이 손실되지 않는지 확인한다.
5. keyboard만으로 모든 control과 학습 단계를 완료한다.
6. focus indicator와 focus restoration을 확인한다.
7. reduced motion에서 비필수 transition이 제거되는지 확인한다.
8. forced colors와 increased contrast에서 상태 구분이 유지되는지 확인한다.
9. reduced transparency에서 backdrop 의존 표면이 불투명해지는지 확인한다.
10. loading, empty, partial, stale, offline, permission과 error 상태를 확인한다.

## rollback 기준

1. 각 단계는 하나 이상의 독립 merge 단위로 구성한다.
2. 각 merge 단위는 build 가능한 상태로 끝나야 한다.
3. 기존 API는 실제 소비자가 남아 있는 동안만 호환 계층으로 유지한다.
4. 단계 실패 시 해당 단계의 merge 단위만 revert한다.
5. route, schema와 server policy 변경을 UI merge 단위에 포함하지 않는다.
6. bundle 예산 실패를 예산 상향으로 해결하지 않는다.

## 전체 완료 기준

- 18개 화면이 대상 UI의 token과 composition을 사용한다.
- 10개 학습 단계가 대상 학습 component를 사용한다.
- 모든 server grading과 data state 계약이 유지된다.
- legacy color token과 radius token 소비자가 0개이다.
- legacy button variant 소비자가 0개이다.
- Lucide import가 0개이다.
- 앱 source의 `#ui/*` import가 0개이다.
- 예제 block의 fixture와 local state가 product code에 없다.
- 공개 공유 UI component마다 요구 상태를 설명하는 story가 있다.
- route bundle이 기존 예산을 통과한다.
- target commit, license와 수정 이력이 추적 가능하다.
- 필수 자동 검증과 수동 시각 검증이 모두 통과한다.
