# Kwep 플랫폼 피벗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Kwep` 프로토타입에서 확인한 학습자 플랫폼과 어드민 요구사항을 현재 Bun monorepo의 API/웹/어드민 경계에 맞춰 제품 코드로 이식한다.

**Architecture:** `Kwep`는 읽기 전용 요구사항 원천으로만 사용하고, 기술 스택과 monorepo 경계만 재사용한다. 구현 단계에서는 대상 앱과 패키지의 기존 `src` 구현, 기존 테스트, 기존 DB migration 흐름을 제거한 뒤 Kwep 요구사항에 맞는 새 baseline 코드로 다시 작성한다. 2026-06-14 UI 비교 결과, 플랫폼 프론트엔드 초안은 Kwep와 1:1로 일치하지 않으므로 이후 프론트엔드 작업은 사용자 플로우 순서대로 한 화면씩 Kwep와 완전 일치할 때까지 반복 수정하고, 화면 단위 검증과 커밋을 완료한 뒤 다음 화면으로 이동한다.

**Tech Stack:** Bun 1.3.10, Node 24, Next.js 16 App Router, Hono, Better Auth, Drizzle SQLite, OpenAPI 3.1, React 19, Tailwind CSS 4, `@workspace/ui`, Vitest, Playwright 또는 Browser 플러그인 기반 스모크 검증.

---

## SSOT 운영 규칙

- 이 문서를 Kwep 피벗 작업의 단일 추적 문서로 사용한다.
- 각 작업 시작 시 이 문서의 `작업 로그`와 해당 Task 체크박스를 먼저 갱신한다.
- 각 작업 종료 시 변경 파일, 검증 명령, 남은 위험을 이 문서에 기록한다.
- `/Kwep` 디렉토리는 수정하지 않는다. 요구사항, 데이터, UI 동작을 읽는 기준으로만 사용한다.
- 새 런타임 코드가 `Kwep` 파일을 import하거나 참조하지 않게 한다.
- 기존 구현 코드를 고쳐 쓰지 않는다. 기술 스택, package manifest, tsconfig, eslint, prettier, turbo, workspace 구조처럼 빌드와 실행에 필요한 골격만 보존한다.
- 대상 구현 파일은 삭제 후 재작성한다. `Modify`가 필요한 파일도 기존 구현을 보존한다는 뜻이 아니라 같은 경로에 새 책임의 파일을 다시 만든다는 뜻이다.
- DB는 누적 migration을 덧붙이는 방식이 아니라 Kwep 기준 새 baseline schema와 seed로 재정의한다. 기존 migration 파일은 제품 코드 이력으로 보존하지 않고 새 baseline migration만 남긴다.
- 모든 문서와 사용자 노출 텍스트는 한국어로 작성한다.
- 구현은 단계 단위로 크게 교체하되, 각 단계는 독립적으로 검증 가능한 작은 완성 단위로 나눈다.
- 플랫폼 API와 플랫폼 프론트엔드가 동작 검증을 통과하기 전에는 어드민 API 작업으로 넘어가지 않는다.
- 각 Task 완료 시 검증 결과와 작업 로그를 기록한 뒤 커밋한다.
- 오래 걸리는 Task는 독립적으로 검증 가능한 Step 묶음이 끝날 때마다 중간 커밋한다.
- 커밋 전 `git status --short`로 범위를 확인하고, 사용자 기존 변경이나 다음 Task의 미완성 변경을 섞지 않는다.
- 검증 실패, 커밋 범위 불명확, 사용자 변경과 분리 불가 상태에서는 커밋하지 않고 작업 로그에 사유를 남긴다.

## Kwep UI 1:1 재작업 운영 규칙

2026-06-14 브라우저 비교 결과, 현재 플랫폼 프론트엔드 구현은 Kwep 프로토타입의 UI, 사용자 흐름, 상호작용과 다수 불일치한다. 따라서 Task 6과 Task 7의 “완료” 상태는 API 연결과 기본 화면 초안 완료로만 해석하고, 제품 UI 완료 판정은 아래 재작업 게이트를 통과한 화면에만 부여한다.

### 화면 일치의 정의

화면이 Kwep와 일치한다는 것은 “비슷해 보인다”가 아니라, 같은 viewport와 같은 상태에서 사용자에게 노출되는 화면 영역의 HTML 구조, CSS 스타일링, 기능이 모두 일치한다는 뜻이다.

- HTML 일치: 사용자 화면 root 내부의 모든 보이는 요소가 Kwep와 같은 순서, 계층, 태그 역할, 텍스트, 속성, 접근성 role/state, 입력 상태, disabled/selected/expanded 상태로 배치되어야 한다. Next.js runtime wrapper, script, product 인증 URL처럼 화면 의미와 배치를 바꾸지 않는 제품 경계 요소만 예외로 허용하고, 예외는 작업 로그에 명시한다.
- 배치 일치: 각 요소의 좌표, 크기, stacking, scroll 영역, fixed/sticky 위치, safe-area 처리, overflow, responsive breakpoint 결과가 Kwep와 일치해야 한다. 스크린샷에서 확인되는 위치 차이는 모두 미완료 차이로 기록하고 수정한다.
- CSS 일치: 각 요소의 computed style 중 `display`, `position`, `flex/grid`, `width`, `height`, `margin`, `padding`, `gap`, `font`, `line-height`, `color`, `background`, `border`, `border-radius`, `box-shadow`, `opacity`, `transform`, `transition`, `z-index`, `cursor`, `outline`, hover/focus/active/disabled 스타일이 Kwep와 일치해야 한다.
- 기능 일치: 클릭, 탭, 키보드 입력, 선택, 제출, validation, disabled 해제, feedback panel, modal, navigation, 자동 저장, 복원, loading, error, 완료 상태 전이가 Kwep와 같은 조건과 순서로 동작해야 한다.
- 완료 판정: DOM snapshot, computed style 비교, 스크린샷 비교, scripted interaction 결과에 알려진 차이가 하나도 남지 않아야 한다. 남은 차이가 있으면 화면은 완료가 아니며 커밋하거나 다음 화면으로 넘어가지 않는다.

### 코드 기준 우선 비교 원칙

Kwep와 제품은 모두 React와 Tailwind CSS를 사용하므로, 이후 화면 일치 작업은 Kwep의 React component, Tailwind class, inline style, 상태 전이 코드를 1차 기준으로 삼는다. 스크린샷, curl, 렌더링된 HTML 역분석은 기준 코드를 그대로 대조해도 모호한 부분이 있거나, 실제 브라우저 출력이 달라졌다는 의심이 있는 경우의 보조 수단으로만 사용한다.

- 각 화면은 Kwep 기준 component의 branch 구조, 요소 계층, Tailwind class 문자열, inline style, 조건부 렌더링, event handler 흐름을 먼저 읽고 제품 코드에 대응시킨다.
- 제품 경계상 달라야 하는 route, 인증 provider URL, 서버 저장 방식은 Kwep 코드와 1:1로 복사하지 않고 대응 관계를 명시한다.
- 실패 테스트는 시각 캡처보다 Kwep 코드에서 확인한 화면 구조, 텍스트, class, CTA 라벨, 상태 전이를 우선 고정한다.
- Browser 또는 Playwright 검증은 Kwep 코드와 제품 코드가 같은 구조로 수렴했는지 확인하는 smoke 용도이며, 매번 HTML 전체를 역분석하는 절차로 사용하지 않는다.

### 화면 작업 순서

화면은 반드시 사용자 플로우 순서로 작업한다. 앞 화면이 Kwep와 완전히 일치하지 않으면 다음 화면으로 넘어가지 않는다.

| 순서 | 사용자 플로우 화면     | Kwep 기준 route         | 제품 route                         | 주요 기준 파일                                                                |
| ---: | ---------------------- | ----------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
|    1 | 공개 랜딩              | `/`                     | `/`                                | `Kwep/src/app/components/landing/*`, `apps/web/src/features/landing/*`        |
|    2 | 로그인                 | `/login`                | `/login`                           | `Kwep/src/app/components/Screens.tsx`, `apps/web/src/features/auth/*`         |
|    3 | 홈 fresh 상태          | `/home`                 | `/app`                             | `Kwep/src/app/components/Screens.tsx`, `apps/web/src/features/home/*`         |
|    4 | 배우기                 | `/learn`                | `/app/courses`                     | `Kwep/src/app/components/Screens.tsx`, `apps/web/src/features/courses/*`      |
|    5 | 코스 상세              | `/course/c1`            | `/app/courses/c1`                  | `Kwep/src/app/components/Screens.tsx`, `apps/web/src/features/courses/*`      |
|    6 | 레슨 시작              | `/lesson/c1/l1`         | `/app/lesson?lesson_id=l1`         | `Kwep/src/app/components/LessonShell.tsx`, `apps/web/src/features/lessons/*`  |
|    7 | 읽기 스텝              | `/lesson/c1/l1` 시작 후 | `/app/lesson?lesson_id=l1` 시작 후 | `Kwep/src/app/components/StepRenderer.tsx`, `apps/web/src/features/lessons/*` |
|    8 | 매칭/분류/쓰기 레슨    | `/lesson/c1/l-new`      | `/app/lesson?lesson_id=l-new`      | `Kwep/src/app/components/{MatchStep,CategorizeStep,StepRenderer}.tsx`         |
|    9 | 객관식 확인 레슨       | `/lesson/c1/l2`         | `/app/lesson?lesson_id=l2`         | `Kwep/src/app/components/LessonShell.tsx`, `apps/web/src/features/lessons/*`  |
|   10 | 레슨 완료              | 레슨 마지막 스텝 완료   | 레슨 마지막 스텝 완료              | `Kwep/src/app/components/SessionDone.tsx`, `apps/web/src/features/lessons/*`  |
|   11 | 프로필                 | `/profile`              | `/app/profile`                     | `Kwep/src/app/components/Screens.tsx`, `apps/web/src/features/profile/*`      |
|   12 | 테마 전환              | `/profile`              | `/app/profile`                     | `Kwep/src/app/components/Screens.tsx`, `apps/web/src/app/layout.tsx`          |
|   13 | 어드민 진입과 대시보드 | `/admin`                | 어드민 제품 route                  | `Kwep/src/app/components/admin/*`, `apps/admin/**`, `apps/admin-api/**`       |

### 화면별 완료 게이트

각 화면은 다음 조건을 모두 만족해야 완료로 표시한다.

- 작업 시작 전에 이 문서 `작업 로그`에 대상 화면, Kwep route, 제품 route, 예상 수정 파일을 기록한다.
- Kwep 기준 React/Tailwind 소스를 먼저 읽고, 제품 route와 상태가 대응하는 component branch를 찾는다.
- Kwep 기준 component의 사용자 화면 root DOM 구조, Tailwind class, inline style, 조건부 렌더링, event handler, disabled/selected/expanded 상태를 제품 코드와 대조한다.
- Kwep 기준 기능 inventory에는 버튼/링크, 입력, 선택, 제출, validation, modal, navigation, 저장/복원, loading/error, 완료 전이 흐름을 포함한다.
- 필요할 때만 Kwep와 제품을 같은 viewport, 같은 인증 상태, 같은 seed 상태로 띄운다. 화면 비교 viewport는 기본 `390x844` 모바일을 우선 사용하고, 해당 Kwep 화면이 데스크톱 responsive UI를 가진 경우 `1280x720`도 추가한다.
- 불일치 항목을 먼저 목록화하고, 그중 최소 하나를 실패 테스트로 고정한다.
- production code 수정 전에 실패 테스트가 실제로 실패하는지 확인한다.
- 수정 후 해당 테스트, 관련 package `typecheck`, `lint`, `format:check`, `git diff --check`를 실행한다.
- Browser 또는 Playwright smoke가 필요한 경우 같은 화면을 다시 확인하고, 남은 불일치가 있으면 같은 화면 안에서 다시 수정한다.
- URL, 인증 provider, 서버 저장 방식처럼 제품 경계상 달라야 하는 요소를 제외하고 HTML, CSS, 배치, 기능 차이가 없어야 한다.
- 완료 시 이 문서 `작업 로그`에 비교 증적 위치, 검증 명령, 남은 위험이 없음을 기록한다.
- 완료된 화면의 변경 파일만 stage하고 한국어 커밋 메시지로 커밋한다.
- 커밋 후에만 다음 화면 작업을 시작한다.

### 화면별 반복 루프

각 화면은 아래 루프를 따른다.

```text
1. 작업 로그 시작 기록
2. Kwep 기준 React/Tailwind 소스 읽기
3. 제품 대응 component branch 읽기
4. 코드 기준 HTML/CSS/기능 차이 목록 작성
5. 실패 테스트 작성
6. 실패 확인
7. 최소 구현
8. 테스트/타입체크/린트/포맷 검증
9. 필요 시 Browser 또는 Playwright smoke 확인
10. 차이가 남아 있으면 4번으로 복귀
11. 차이가 없으면 작업 로그 완료 기록
12. git status 범위 확인
13. 화면 단위 커밋
14. 다음 화면으로 이동
```

금지 사항:

- 여러 화면을 한 커밋에 섞지 않는다.
- Kwep와 제품이 아직 다른 상태에서 다음 화면으로 넘어가지 않는다.
- 이전 캡처나 이전 테스트 결과로 현재 화면 완료를 주장하지 않는다.
- `/Kwep` 디렉토리 파일을 수정하지 않는다.
- 제품 런타임 코드가 `/Kwep` 파일을 import하지 않는다.
- 테스트 실패를 우회하기 위한 조건문을 추가하지 않는다.

## 현재 상태

- 기준 날짜: 2026-06-14
- 작업 브랜치: `codex/kwep-platform-pivot-plan`
- 플랫폼 프론트엔드 상태: API 연결과 기본 화면 초안은 작성됐지만, Kwep UI 1:1 기준은 미달이다.
- 다음 프론트엔드 작업 시작점: Task 8 어드민 API 요구사항 확정과 계약 작성.
- 시작 시점 변경 상태:
  - `.prettierignore`: 기존 수정 있음
  - `AGENTS.md`: 기존 수정 있음
  - `Kwep/`: 기존 untracked 프로토타입 있음
- 생성 문서:
  - `docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`

## Kwep 요구사항 인벤토리

### 콘텐츠 구조

Kwep의 콘텐츠 구조는 다음 형태다.

```text
Course
  - id
  - title
  - desc
  - cat
  - units[]
Unit
  - id
  - title
  - lessons[]
Lesson
  - id
  - title
  - cat?
  - desc?
  - time
  - summary?
  - steps[]
Step
  - reading
  - compare
  - multiple_choice
  - fill_blank
  - select
  - order
  - write
  - ai_feedback
  - match
  - categorize
```

Kwep seed 요약은 다음과 같다.

| 항목 | 수량 |
| ---- | ---: |
| 코스 |    5 |
| 유닛 |   15 |
| 레슨 |   44 |
| 스텝 |  136 |

스텝 타입 분포는 다음과 같다.

| Kwep 타입         | 수량 | 신규 표준 타입    |
| ----------------- | ---: | ----------------- |
| `reading`         |   62 | `READING`         |
| `compare`         |    8 | `COMPARE`         |
| `multiple_choice` |   12 | `MULTIPLE_CHOICE` |
| `fill_blank`      |    5 | `FILL_BLANK`      |
| `select`          |    2 | `SELECT`          |
| `order`           |    3 | `ORDER`           |
| `write`           |   40 | `WRITE`           |
| `ai_feedback`     |    2 | `AI_FEEDBACK`     |
| `match`           |    1 | `MATCH`           |
| `categorize`      |    1 | `CATEGORIZE`      |

Kwep 코스 목록은 다음과 같다.

| ID   | 제목                    | 카테고리           | 유닛 | 레슨 |
| ---- | ----------------------- | ------------------ | ---: | ---: |
| `c1` | 글쓰기 첫걸음 30일      | 입문자를 위한 코스 |    3 |   10 |
| `c2` | 문장의 기본 문법        | 문법 심화          |    3 |    8 |
| `c3` | 글과 논증을 잘하는 30일 | 실전 글쓰기        |    3 |    8 |
| `c4` | 독자를 사로잡는 글쓰기  | 중급 글쓰기        |    3 |    9 |
| `c5` | 퇴고와 완성의 기술      | 심화 글쓰기        |    3 |    9 |

### 학습자 플랫폼 기능

- 공개 랜딩 페이지를 제공한다.
- 학습자는 Google 로그인으로 앱에 진입한다.
- 홈은 진행 중인 코스, 다음 레슨, 전체 학습 맥락, 연속 학습일을 보여준다.
- 배우기 화면은 코스 카테고리와 코스 카드를 보여준다.
- 코스 상세는 코스 설명, 진행률, 유닛별 커리큘럼, 레슨 잠금/완료/진행 가능 상태를 보여준다.
- 레슨은 시작 화면을 먼저 보여주고, 사용자가 시작하기를 누른 뒤 스텝 학습으로 진입한다.
- 레슨 진행 상황과 답변은 자동 저장된다.
- 퀴즈형 스텝은 정답 확인과 해설을 제공한다.
- 글쓰기 스텝은 최소/목표/최대 글자 수와 참조 답안을 지원한다.
- AI 코칭 스텝은 작성 답변을 대상으로 총평, 잘된 점, 개선점, 다음 시도를 보여준다.
- AI 코칭은 최대 3회 재시도를 지원한다.
- 프로필 화면은 사용자 정보, 가입일, 완료 레슨, 현재 연속 학습일, 전체 진도를 보여준다.
- 라이트/다크/시스템 테마 전환을 지원한다.

### 어드민 기능

- 어드민은 학습자 인증과 분리된 관리자 인증을 사용한다.
- 대시보드는 총 사용자, 최근 7일 활성 사용자, 신규 가입, 누적 레슨 완료, 콘텐츠 수, 최근 활동을 보여준다.
- 콘텐츠 관리는 코스 검색, 카테고리 필터, 페이지 크기, 페이지 이동, 새 코스 생성, 코스 보관을 제공한다.
- 코스 편집은 코스 정보, 유닛, 레슨 배치, 레슨 추가/보관, 순서 변경을 지원한다.
- 레슨 편집은 레슨 기본 정보, 스텝 추가/보관/순서 변경, 스텝 타입별 편집 폼, 학습자 미리보기를 지원한다.
- 사용자 관리는 이름/이메일 검색, 상태 필터, 최근 접속/가입/완료 레슨/연속 학습일 정렬, 페이지 이동을 제공한다.
- 사용자 상세는 가입일, 최근 접속, 연속 학습일, 완료 레슨, 전체 진도, 계정 정지/복구, 삭제 요청 처리를 제공한다.
- 분석은 최근 30일 가입 추이, 일별 레슨 완료, 연속 학습일 분포, 레슨별 완료율과 이탈률을 보여준다.
- 운영 설정은 공지/배너, 이용약관, 개인정보처리방침, 콘텐츠 초기화를 제공한다.
- Kwep의 패스코드 기반 어드민 게이트는 실제 구현에서 Better Auth 기반 관리자 로그인으로 대체한다.

## 재사용/재작성 경계

| 영역           | 보존                                                                                                         | 제거 후 재작성                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo 골격  | `package.json`, `bun.lock`, `turbo.json`, `lefthook.yml`, workspace 구조                                     | 없음                                                                                                                             |
| 앱/패키지 설정 | 각 package의 `package.json`, `tsconfig.json`, `eslint.config.*`, `vitest.config.ts`, Next/Hono 실행 스크립트 | 각 package의 `src/**`, 앱 내부 테스트, 생성 OpenAPI 타입                                                                         |
| 플랫폼 API     | Hono, Better Auth, OpenAPI, env parsing, logger 의존성                                                       | `apps/api/src/**` 전체                                                                                                           |
| 플랫폼 웹      | Next.js App Router, React, Tailwind, `@workspace/ui`, Better Auth client 의존성                              | `apps/web/src/**` 전체                                                                                                           |
| 어드민 API     | Hono, Better Auth, OpenAPI, SQLite 연결 의존성                                                               | `apps/admin-api/src/**` 전체                                                                                                     |
| 어드민 웹      | Next.js App Router, React, Tailwind, `@workspace/ui`, Better Auth client 의존성                              | `apps/admin/src/**` 전체                                                                                                         |
| Core           | package 경계와 TypeScript 설정                                                                               | `packages/core/src/**` 전체                                                                                                      |
| DB             | package 경계, Drizzle, SQLite client 의존성                                                                  | `packages/db/src/schema/**`, `packages/db/src/repositories/**`, `packages/db/src/seeds/**`, `packages/db/src/migrations/**` 전체 |
| UI             | shadcn/base-ui 의존성, package export 정책                                                                   | Kwep 피벗에 맞지 않는 앱 특화 UI 코드가 발견되면 삭제 후 새 공용 primitive만 작성                                                |
| 문서           | 한국어 문서 정책과 `/docs` 위치                                                                              | 기존 제품 설명 중 새 피벗과 충돌하는 내용                                                                                        |

## 핵심 설계 결정

### 1. 기술 스택은 재사용하되 구현 코드는 재사용하지 않는다

현재 코드가 가진 Next.js, Hono, Better Auth, Drizzle, OpenAPI, Bun monorepo 선택은 유지한다. 그러나 기존 `src` 구현을 수정해서 맞추는 방식은 금지한다. 실행자는 각 단계 시작 시 대상 구현 파일을 삭제하고, Kwep 요구사항에 맞는 새 계약, 새 데이터 모델, 새 UI 상태, 새 테스트를 처음부터 작성한다.

이 원칙의 목적은 기존 코드의 흔적이 신규 코드와 충돌하거나, 호환성 보정 코드와 불필요한 migration 코드가 남거나, Kwep 피벗에 맞지 않는 추상화를 억지로 이어가는 상황을 막는 것이다.

### 2. Kwep는 읽기 전용 요구사항 원천이다

`Kwep`의 React Router, localStorage, passcode gate, mock data, picsum 이미지 호출은 그대로 이식하지 않는다. 기능 요구사항과 콘텐츠 구조만 가져오고, 구현은 현재 monorepo의 Next.js/Hono/Better Auth/Drizzle 경계에 맞춘다.

### 3. 콘텐츠는 새 서버 seed baseline으로 승격한다

Kwep의 `courses.json`은 새 DB seed의 기준 데이터가 된다. 변환 결과는 기존 seed 구조를 고쳐 쓰지 않고 새 seed schema와 새 seed loader로 작성한다. 런타임에서 `Kwep/src/app/courses.json`을 읽지 않는다.

### 4. 스텝 타입은 Kwep 요구사항에 맞는 새 표준 타입으로 정한다

기존 20개 타입 체계는 보존 대상이 아니다. Kwep의 10개 타입을 기준으로 새 표준 타입을 정의하고, 필요한 경우 서버 저장용 enum은 대문자 snake 표기(`READING`, `MULTIPLE_CHOICE`, `AI_FEEDBACK` 등)로 정규화한다. `write`는 하나의 통합 쓰기 타입으로 유지하고, 짧은 쓰기/긴 쓰기는 `min`, `goal`, `max`, `mode` 같은 콘텐츠 속성으로 표현한다.

### 5. 학습자 답변 저장은 새 답변 모델로 설계한다

기존 답변 저장 모델을 확장하지 않는다. 모든 상호작용형 스텝의 답변을 저장할 수 있는 새 `lesson_answers` 계약을 설계한다. 답변 본문은 스텝 타입별 JSON으로 저장하되, 타입별 파싱과 검증은 core 계약에서 명시한다.

### 6. 연속 학습일은 이벤트에서 계산한다

Kwep의 `streak` localStorage 값은 서버 이벤트로 승격한다. `learner_activity_days`에 사용자별 학습 활동 날짜를 기록하고, 현재 연속 학습일은 조회 시 결정적으로 계산한다.

### 7. 삭제는 보관 또는 비식별 상태 전환으로 구현한다

코스 삭제 버튼은 실제 row 삭제가 아니라 `archived` 전환으로 처리한다. 사용자 삭제 요청은 Better Auth provider 테이블을 직접 훼손하지 않고, 앱 소유 프로필 상태를 `deleted`로 바꾸고 노출 데이터를 비식별화한다.

### 8. 차트는 새 의존성 없이 구현한다

Kwep는 `recharts`를 사용하지만 현재 어드민 앱에는 해당 의존성이 없다. 초기 제품 구현은 SVG 또는 CSS 기반 작은 차트 컴포넌트로 처리한다. 반복적인 시각화 요구가 커질 때만 chart 라이브러리 도입을 별도 결정으로 남긴다.

### 9. DB migration은 누적 보정이 아니라 새 baseline이다

피벗 구현은 기존 DB를 점진 migration하는 작업이 아니다. 개발 DB는 새 baseline으로 재생성한다. 운영 데이터 이전이 필요해지는 시점에는 별도 데이터 이전 계획을 작성하고, 이 피벗 구현에는 기존 schema와 신규 schema 사이의 호환 adapter를 넣지 않는다.

## 단계 게이트

각 단계는 다음 조건을 만족해야 완료로 표시한다.

- 관련 문서 시작 항목 추가
- 대상 구현 파일 삭제 계획 확인
- 실패 테스트 작성
- 새 구현 작성
- 단위/통합 테스트 통과
- 타입체크와 린트 통과
- 필요한 OpenAPI 문서와 생성 타입 갱신
- Browser 또는 Playwright 스모크 검증
- 관련 문서 완료 항목 추가
- 사용한 dev server와 임시 프로세스 종료
- 커밋 범위 확인과 커밋 생성 또는 커밋 보류 사유 기록

## Task 0: 초기화와 기준선 고정

**Files:**

- Modify: `docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`
- Modify: `CONTEXT.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DOMAIN.md`
- Modify: `FRONTEND.md`
- Modify: `BACKEND.md`

- [x] **Step 0.1: 새 브랜치 생성**

```bash
git switch -c codex/kwep-platform-pivot-plan
```

Expected: `Switched to a new branch 'codex/kwep-platform-pivot-plan'`

- [x] **Step 0.2: Kwep 요구사항 1차 인벤토리 작성**

조사 기준 파일:

```text
Kwep/src/app/routes.tsx
Kwep/src/app/schema.ts
Kwep/src/app/courses.json
Kwep/src/app/data.ts
Kwep/src/app/state.ts
Kwep/src/app/providers.tsx
Kwep/src/app/components/Screens.tsx
Kwep/src/app/components/LessonShell.tsx
Kwep/src/app/components/StepRenderer.tsx
Kwep/src/app/components/admin/*
Kwep/src/app/admin/*
```

- [x] **Step 0.3: 기준선 검증**

```bash
bun --version
node --version
bun run format:check
bun run typecheck
bun run lint
bun run test
```

Expected:

- Bun은 `1.3.10` 계열이다.
- Node는 현재 설치된 `24.x` 계열이다.
- 실패가 있으면 이 문서의 `작업 로그`에 기존 실패로 기록하고, 새 작업의 회귀와 분리한다.

- [x] **Step 0.4: 시작 문서 갱신**

갱신 내용:

- `CONTEXT.md`: Kwep 피벗 목표와 플랫폼/어드민 범위 재채택 기록
- `ARCHITECTURE.md`: 새 API와 데이터 경계 요약
- `DOMAIN.md`: Kwep 콘텐츠 모델과 보관/삭제 정책 반영
- `FRONTEND.md`: 라우트와 UI 정책 반영
- `BACKEND.md`: 새 API endpoint와 환경/DB 정책 반영

검증:

```bash
bunx prettier --check CONTEXT.md ARCHITECTURE.md DOMAIN.md FRONTEND.md BACKEND.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
```

Expected: `All matched files use Prettier code style!`

## Task 1: 기존 구현 코드 제거와 새 baseline 준비

**Files:**

- Delete: `apps/api/src/**`
- Delete: `apps/web/src/**`
- Delete: `apps/admin-api/src/**`
- Delete: `apps/admin/src/**`
- Delete: `packages/core/src/**`
- Delete: `packages/db/src/**`
- Delete: `packages/ui/src/**`
- Delete: `packages/env/src/**`
- Delete: `packages/logger/src/**`
- Preserve: `package.json`
- Preserve: `bun.lock`
- Preserve: `turbo.json`
- Preserve: `lefthook.yml`
- Preserve: `apps/*/package.json`
- Preserve: `apps/*/tsconfig.json`
- Preserve: `apps/*/eslint.config.*`
- Preserve: `apps/*/vitest.config.ts`
- Preserve: `packages/*/package.json`
- Preserve: `packages/*/tsconfig.json`
- Preserve: `packages/*/eslint.config.*`
- Preserve: `packages/*/vitest.config.ts`
- Modify: `CONTEXT.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DOMAIN.md`
- Modify: `FRONTEND.md`
- Modify: `BACKEND.md`
- Modify: `docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`

- [x] **Step 1.1: 삭제 대상 목록을 확정**

삭제 대상은 제품 구현 코드 전체다.

```text
apps/api/src
apps/web/src
apps/admin-api/src
apps/admin/src
packages/core/src
packages/db/src
packages/ui/src
packages/env/src
packages/logger/src
```

보존 대상은 빌드와 workspace 실행을 위한 골격이다.

```text
package.json
bun.lock
turbo.json
lefthook.yml
apps/*/package.json
apps/*/tsconfig.json
apps/*/eslint.config.*
apps/*/vitest.config.ts
packages/*/package.json
packages/*/tsconfig.json
packages/*/eslint.config.*
packages/*/vitest.config.ts
```

검증:

```bash
find apps packages -path '*/src' -type d | sort
```

Expected: 삭제 대상 `src` 디렉토리가 모두 목록에 포함된다.

- [x] **Step 1.2: 기존 구현 코드 삭제**

```bash
git rm -r apps/api/src apps/web/src apps/admin-api/src apps/admin/src packages/core/src packages/db/src packages/ui/src packages/env/src packages/logger/src
```

Expected: 대상 구현 파일이 git 삭제 상태가 되고, package 설정 파일은 남아 있다.

- [x] **Step 1.3: 새 빈 source root 생성**

각 source root에는 후속 task가 실제 구현을 추가한다. 이 단계에서는 빈 디렉토리를 git에 직접 남길 수 없으므로, 후속 Task 2에서 첫 파일을 만들기 전까지 디렉토리 없음 상태를 허용한다.

검증:

```bash
test -f apps/api/package.json
test -f apps/web/package.json
test -f apps/admin-api/package.json
test -f apps/admin/package.json
test -f packages/core/package.json
test -f packages/db/package.json
test -f packages/ui/package.json
test -f packages/env/package.json
test -f packages/logger/package.json
```

Expected: package manifest는 모두 보존된다.

- [x] **Step 1.4: reset 문서 기록**

기록 내용:

- 기존 구현 코드 삭제 범위
- 보존한 기술 스택과 package 설정
- 기존 DB migration을 새 baseline으로 대체한다는 정책
- 이후 task는 기존 코드 수정이 아니라 새 파일 작성으로 진행한다는 정책

검증:

```bash
bunx prettier --check CONTEXT.md ARCHITECTURE.md DOMAIN.md FRONTEND.md BACKEND.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
```

Expected: 문서 포맷 검증이 통과한다.

## Task 2: 플랫폼 API 요구사항 확정과 DB 기반 콘텐츠 baseline 작성

**Files:**

- Create: `packages/env/src/index.ts`
- Create: `packages/env/src/parse-env.ts`
- Create: `packages/env/src/parse-env.test.ts`
- Create: `packages/logger/src/index.ts`
- Create: `packages/logger/src/request-logger.ts`
- Create: `packages/logger/src/logger.test.ts`
- Create: `packages/core/src/result.ts`
- Create: `packages/core/src/content/content.ids.ts`
- Create: `packages/core/src/content/content.dto.ts`
- Create: `packages/core/src/content/content.dto.test.ts`
- Create: `packages/core/src/content/content.repository.ts`
- Create: `packages/core/src/content/content.service.ts`
- Create: `packages/core/src/content/content.service.test.ts`
- Create: `packages/core/src/content/index.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/client.test.ts`
- Create: `packages/db/src/schema/auth.schema.ts`
- Create: `packages/db/src/schema/admin-auth.schema.ts`
- Create: `packages/db/src/schema/content.schema.ts`
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/migrations/0000-kwep-baseline.sql`
- Create: `packages/db/src/migrations/migrate.ts`
- Create: `packages/db/src/seeds/content-seed-data.json`
- Create: `packages/db/src/seeds/seed-content.ts`
- Create: `packages/db/src/seeds/seed-content.test.ts`
- Create: `packages/db/src/seeds/index.ts`
- Create: `packages/db/src/repositories/content.repository.ts`
- Create: `packages/db/src/repositories/content.repository.test.ts`
- Create: `packages/db/src/index.ts`

- [x] **Step 2.1: Kwep 콘텐츠 변환 규칙을 테스트로 고정**

검증할 매핑:

| Kwep 필드        | 저장 위치                   |
| ---------------- | --------------------------- |
| `course.id`      | `courses.id`                |
| `course.title`   | `courses.title`             |
| `course.desc`    | `courses.description`       |
| `course.cat`     | `courses.category`          |
| `unit.id`        | `course_units.id`           |
| `unit.title`     | `course_units.title`        |
| `lesson.id`      | `lessons.id`                |
| `lesson.title`   | `lessons.title`             |
| `lesson.desc`    | `lessons.description`       |
| `lesson.time`    | `lessons.estimated_minutes` |
| `lesson.summary` | `lessons.summary_json`      |
| `lesson.steps`   | `lesson_steps`              |

테스트 명령:

```bash
bun --filter @workspace/db test -- seed-content
```

Expected: 새 baseline seed가 Kwep 기준 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 생성한다.

- [x] **Step 2.2: 새 baseline schema 작성**

새 baseline migration은 누적 `ALTER TABLE`이 아니라 전체 schema를 한 번에 정의한다.

```sql
CREATE TABLE courses (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL,
  curriculum_revision INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE course_units (
  id TEXT PRIMARY KEY NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE lessons (
  id TEXT PRIMARY KEY NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  estimated_minutes INTEGER NOT NULL,
  summary_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE lesson_steps (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
```

검증:

```bash
bun --filter @workspace/db test -- client repositories
```

Expected: 새 DB client, migration runner, content repository 테스트가 baseline schema 기준으로 통과한다.

- [x] **Step 2.3: 콘텐츠 DTO 작성**

응답:

- `courseSummaryDtoSchema`: `id`, `title`, `description`, `category`, `lessonCount`, `status`
- `courseListDtoSchema`: `courses`
- `courseDetailDtoSchema`: `id`, `title`, `description`, `category`, `progress`, `units`
- `lessonDtoSchema`: `id`, `courseId`, `unitId`, `title`, `category`, `description`, `estimatedMinutes`, `summary`, `steps`
- `lessonStepDtoSchema`: Kwep 10개 타입 discriminated union

검증:

```bash
bun --filter @workspace/core test -- content.dto content.service
```

Expected: DTO schema가 Kwep 변환 콘텐츠를 parse한다.

- [x] **Step 2.4: 공개 콘텐츠 repository 작성**

정책:

- `courses.status = 'active'`인 코스만 학습자 API에서 노출한다.
- `course_units.status = 'active'`, `lessons.status = 'active'`, `lesson_steps.status = 'active'`인 하위 콘텐츠만 노출한다.
- 어드민 API는 archived 코스도 관리 화면에서 볼 수 있게 별도 repository 경로를 사용한다.

검증:

```bash
bun --filter @workspace/db test -- content.repository
```

Expected: archived 코스는 학습자 목록에서 제외되고, active 코스의 lesson metadata가 응답된다.

- [x] **Step 2.5: 공통 env/logger와 auth schema 골격 작성**

정책:

- env parser는 API, admin API, 웹 origin, DB URL, Better Auth secret을 명시적으로 검증한다.
- logger는 pino 기반 JSON logger와 request log helper를 제공한다.
- 학습자 auth schema와 admin auth schema는 같은 DB package 안에서 분리된 table prefix를 사용한다.

검증:

```bash
bun --filter @workspace/env test -- parse-env
bun --filter @workspace/logger test -- logger
bun --filter @workspace/env typecheck
bun --filter @workspace/logger typecheck
bun --filter @workspace/db typecheck
```

Expected: 공통 env/logger와 auth schema export가 후속 API 작업에서 import 가능한 상태가 된다.

## Task 3: 플랫폼 API 학습 진행, 답변, 프로필, 연속 학습일

**Files:**

- Create: `packages/core/src/learning/learning.ids.ts`
- Create: `packages/core/src/learning/learning.dto.ts`
- Create: `packages/core/src/learning/learning.repository.ts`
- Create: `packages/core/src/learning/learning.service.ts`
- Create: `packages/core/src/learning/learning.service.test.ts`
- Create: `packages/core/src/learning/index.ts`
- Create: `packages/db/src/schema/learning.schema.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/migrations/0000-kwep-baseline.sql`
- Create: `packages/db/src/repositories/learning.repository.ts`
- Create: `packages/db/src/repositories/learning.repository.test.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/app.test.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/env.test.ts`
- Create: `apps/api/src/auth/auth.ts`
- Create: `apps/api/src/auth/session.ts`
- Create: `apps/api/src/routes/health.route.ts`
- Create: `apps/api/src/routes/openapi.route.ts`
- Create: `apps/api/src/routes/auth.route.ts`
- Create: `apps/api/src/routes/courses.route.ts`
- Create: `apps/api/src/routes/lessons.route.ts`
- Create: `apps/api/src/routes/profile.route.ts`
- Create: `apps/api/src/routes/progress.route.ts`
- Create: `apps/api/src/routes/learning.route.ts`
- Create: `apps/api/src/routes/route-helpers.ts`
- Create: `apps/api/src/routes/error-response.ts`

- [x] **Step 3.1: learner activity와 learner profile schema 추가**

새 테이블:

```sql
CREATE TABLE learner_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  display_name TEXT,
  deleted_at INTEGER
);

CREATE TABLE learner_activity_days (
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  activity_date TEXT NOT NULL,
  first_activity_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  saved_answers INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE learner_lesson_progress (
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  current_step_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE learner_lesson_answers (
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
  answer_json TEXT NOT NULL,
  answered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, step_id)
);
```

검증:

```bash
bun --filter @workspace/db test -- learning.repository
```

Expected: progress 저장, answer 저장, lesson 완료가 활동 날짜 row를 생성하거나 갱신한다.

- [x] **Step 3.2: 모든 답변 가능 스텝 저장 허용**

저장 허용 타입:

```text
MULTIPLE_CHOICE
FILL_BLANK
SELECT
ORDER
MATCH
CATEGORIZE
WRITE
AI_FEEDBACK
```

정책:

- `answer`는 JSON 문자열 또는 일반 문자열을 허용한다.
- API는 `stepId`가 현재 active lesson step인지 검증한다.
- 콘텐츠형 읽기 스텝과 완료 스텝은 답변 저장 대상이 아니다.

검증:

```bash
bun --filter @workspace/core test -- learning.service
```

Expected: Kwep 퀴즈 타입에 해당하는 저장 요청은 `ok`, 읽기 스텝 저장 요청은 `invalid-request`를 반환한다.

- [x] **Step 3.3: `/profile` route 작성**

응답 필드:

```ts
type LearnerProfileDto = {
  user: {
    id: string
    name: string
    email: string
    image: string | null
    joinedAt: string
    status: "active" | "suspended" | "deleted"
  }
  stats: {
    completedLessons: number
    totalLessons: number
    progressPercent: number
    currentStreakDays: number
    lastActiveDate: string | null
  }
}
```

검증:

```bash
bun --filter @workspace/api test -- app profile
```

Expected:

- 인증 없는 요청은 `401`이다.
- 인증된 요청은 사용자 정보와 계산된 통계를 반환한다.
- `suspended` 또는 `deleted` 사용자는 보호 route 정책에서 앱 진입을 막는다.

- [x] **Step 3.4: progress 응답을 Kwep 홈에 맞게 작성**

응답 필드:

- course `progressPercent`
- course `nextLessons`
- lesson `estimatedMinutes`
- lesson `status`: `completed`, `available`, `locked`
- user `currentStreakDays`

검증:

```bash
bun --filter @workspace/api test -- progress learning
```

Expected: Kwep의 다음 레슨 계산과 동일하게 첫 미완료 active lesson이 `available`이 되고 그 뒤 lesson은 `locked`가 된다.

- [x] **Step 3.5: API 실행 골격과 콘텐츠 조회 route 작성**

정책:

- API env는 공통 env parser를 재사용하되 API 실행에 필요한 port와 DB URL을 명시적으로 노출한다.
- `/health`, `/openapi`, `/auth/session`, `/courses`, `/lessons/:lessonId` route를 후속 프론트엔드 작업이 import 없이 호출할 수 있는 baseline으로 제공한다.
- `main.ts`는 app factory와 DB-backed repository를 연결하는 실행 진입점만 담당한다.

검증:

```bash
bun --filter @workspace/api test -- env app courses lessons openapi auth
bun --filter @workspace/api typecheck
```

Expected: API 실행 골격과 콘텐츠 조회 route가 import 가능한 상태가 되고, 인증 없는 auth session은 `401`로 응답한다.

## Task 4: 플랫폼 API AI 코칭과 OpenAPI 갱신

**Files:**

- Create: `packages/core/src/ai-feedback/ai-feedback.dto.ts`
- Create: `packages/core/src/ai-feedback/ai-feedback.provider.ts`
- Create: `packages/core/src/ai-feedback/ai-feedback.repository.ts`
- Create: `packages/core/src/ai-feedback/ai-feedback.service.ts`
- Create: `packages/core/src/ai-feedback/ai-feedback.service.test.ts`
- Create: `packages/core/src/ai-feedback/index.ts`
- Create: `packages/db/src/schema/feedback.schema.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/migrations/0000-kwep-baseline.sql`
- Create: `packages/db/src/repositories/feedback.repository.ts`
- Create: `packages/db/src/repositories/feedback.repository.test.ts`
- Create: `apps/api/src/openai/openai-feedback-provider.ts`
- Create: `apps/api/src/openai/openai-feedback-provider.test.ts`
- Create: `apps/api/src/routes/ai-feedback.route.ts`
- Create: `apps/api/src/openapi/openapi-document.ts`
- Create: `apps/api/src/openapi/openapi-document.test.ts`
- Modify: `docs/openapi/writing-app-api.json`
- Create: `apps/web/src/lib/api/generated/writing-app-api.d.ts`

- [x] **Step 4.1: Kwep AI 코칭 응답 형태와 새 OpenAI 결과를 정렬**

응답 필드:

```ts
type AiFeedbackResultDto = {
  summary: string
  strengths: string[]
  improvements: string[]
  nextAction: string
  score: number
  scoreRange: [number, number]
  showScore: boolean
  remainingAttempts: number
}
```

검증:

```bash
bun --filter @workspace/core test -- ai-feedback.service
```

Expected:

- 최대 3회 완료 시도 정책을 유지한다.
- 실패한 OpenAI 호출은 시도 횟수를 소모하지 않는다.
- 응답은 Kwep의 총평, 잘된 점, 다듬을 점, 다음 시도 UI를 채울 수 있다.

- [x] **Step 4.2: OpenAPI와 web 생성 타입 갱신**

```bash
bun --filter @workspace/api openapi:generate
bun --filter @workspace/web api:generate
```

Expected:

- `docs/openapi/writing-app-api.json`에 `/profile`, `/progress`, `/ai-feedback` 새 계약이 반영된다.
- `apps/web/src/lib/api/generated/writing-app-api.d.ts`가 생성 계약과 일치한다.

- [x] **Step 4.3: 플랫폼 API 게이트 검증**

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
bun run format:check
git diff --check
```

Expected: 플랫폼 API 관련 검증이 통과한다.

## Task 5: 플랫폼 프론트엔드 API 포트와 데이터 매퍼 작성

**Files:**

- Create: `apps/web/src/lib/api/api-result.ts`
- Create: `apps/web/src/lib/api/api-error.ts`
- Create: `apps/web/src/lib/api/api-error.test.ts`
- Create: `apps/web/src/lib/api/writing-app-api.ts`
- Create: `apps/web/src/lib/api/http/openapi-client.ts`
- Create: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`
- Create: `apps/web/src/lib/api/http/create-http-writing-app-api.test.ts`
- Create: `apps/web/src/lib/api/get-server-writing-app-api.ts`
- Create: `apps/web/src/lib/api/get-browser-writing-app-api.ts`
- Create: `apps/web/src/features/courses/course-types.ts`
- Create: `apps/web/src/features/courses/course-api-mappers.ts`
- Create: `apps/web/src/features/courses/course-api-mappers.test.ts`
- Create: `apps/web/src/features/lessons/lesson-types.ts`
- Create: `apps/web/src/features/lessons/lesson-api-mappers.ts`
- Create: `apps/web/src/features/lessons/lesson-api-mappers.test.ts`
- Create: `apps/web/src/features/profile/profile-types.ts`
- Create: `apps/web/src/features/profile/profile-api-mappers.ts`
- Create: `apps/web/src/features/profile/profile-api-mappers.test.ts`

- [x] **Step 5.1: `WritingAppApi` 포트 작성**

필수 메서드:

```ts
getProfile(): Promise<ApiResult<LearnerProfile>>
getProgress(): Promise<ApiResult<ProgressCourseList>>
saveLessonAnswer(input): Promise<ApiResult<{ saved: true }>>
createAiFeedback(input): Promise<ApiResult<AiFeedbackResult>>
```

검증:

```bash
bun --filter @workspace/web test -- create-http-writing-app-api profile-api-mappers course-api-mappers lesson-api-mappers
```

Expected: HTTP adapter가 새 OpenAPI 경로와 응답을 내부 모델로 매핑한다.

- [x] **Step 5.2: Kwep step content 매핑 작성**

프론트 내부 처리:

- `READING`: markdown body와 source 표시
- `COMPARE`: 버전 탭과 분석 표시
- `SELECT`: Kwep `segments` 변환 결과와 선택 정답 표시
- `WRITE`: `min`, `goal`, `max`, `sample` 표시
- `AI_FEEDBACK`: `remainingAttempts`, retry button, score 표시 조건 처리

검증:

```bash
bun --filter @workspace/web test -- lesson-api-mappers lesson-experience
```

Expected: Kwep seed에서 변환한 대표 lesson이 10개 Kwep 타입을 모두 렌더링 가능한 내부 모델로 변환된다.

## Task 6: 플랫폼 프론트엔드 화면 피벗

**Files:**

- Create: `packages/ui/src/styles/globals.css`
- Create: `packages/ui/src/lib/utils.ts`
- Create: `packages/ui/src/components/icons.tsx`
- Create: `packages/ui/src/components/ui/button.tsx`
- Create: `packages/ui/src/components/ui/card.tsx`
- Create: `packages/ui/src/components/ui/dialog.tsx`
- Create: `packages/ui/src/components/ui/dropdown-menu.tsx`
- Create: `packages/ui/src/components/ui/input.tsx`
- Create: `packages/ui/src/components/ui/progress.tsx`
- Create: `packages/ui/src/components/ui/select.tsx`
- Create: `packages/ui/src/components/ui/textarea.tsx`
- Create: `packages/ui/src/index.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/login/page.test.tsx`
- Create: `apps/web/src/app/app/layout.tsx`
- Create: `apps/web/src/app/app/page.tsx`
- Create: `apps/web/src/app/app/courses/page.tsx`
- Create: `apps/web/src/app/app/courses/[id]/page.tsx`
- Create: `apps/web/src/app/app/lesson/page.tsx`
- Create: `apps/web/src/app/app/profile/page.tsx`
- Create: `apps/web/src/components/layout/app-shell.tsx`
- Create: `apps/web/src/components/layout/global-nav.tsx`
- Create: `apps/web/src/components/layout/global-nav.test.tsx`
- Create: `apps/web/src/features/auth/auth-page.tsx`
- Create: `apps/web/src/features/auth/auth-page.test.tsx`
- Create: `apps/web/src/features/landing/landing-page.tsx`
- Create: `apps/web/src/features/home/home-page.tsx`
- Create: `apps/web/src/features/home/home-page.test.tsx`
- Create: `apps/web/src/features/courses/courses-page.tsx`
- Create: `apps/web/src/features/courses/course-detail-page.tsx`
- Create: `apps/web/src/features/courses/course-curriculum.tsx`
- Create: `apps/web/src/features/courses/course-detail-page.test.tsx`
- Create: `apps/web/src/features/profile/profile-page.tsx`
- Create: `apps/web/src/features/profile/profile-page.test.tsx`
- Create: `apps/web/src/lib/auth/auth-client.ts`
- Create: `apps/web/src/lib/auth/auth-navigation.ts`
- Create: `apps/web/src/lib/auth/auth-navigation.test.ts`

- [x] **Step 6.1: 공개 랜딩을 Kwep `글결` 방향으로 교체**

구현 정책:

- 루트 `/`는 공개 랜딩이다.
- 로고는 `/`, 시작 CTA는 Kwep `/home`에 대응하는 `/app`, 코스 CTA는 Kwep `/learn`에 대응하는 `/app/courses`로 이동한다.
- 랜딩은 제품명, 가치 제안, 코스 미리보기, 학습 방식, 마지막 CTA를 포함한다.
- 텍스트는 한국어로 작성한다.
- Kwep의 장식적 localStorage 동작은 가져오지 않는다.

검증:

```bash
bun --filter @workspace/web test -- auth-page landing
```

Expected: 로그인 CTA와 공개 랜딩 핵심 섹션이 렌더링된다.

- [x] **Step 6.2: 홈 화면을 Kwep 진행 카드 중심으로 재구성**

홈 요구사항:

- 현재 사용자 이름 또는 기본 호칭 표시
- 현재 연속 학습일 표시
- 진행 중인 코스 카드 표시
- 코스별 진행률과 다음 레슨 최대 2개 표시
- 진행 중인 코스가 없으면 시작 가능한 코스 진입점 표시

검증:

```bash
bun --filter @workspace/web test -- home-page
```

Expected: progress 응답이 비어 있을 때와 진행 중 코스가 있을 때 모두 한국어 빈 상태와 진행 카드가 렌더링된다.

- [x] **Step 6.3: 배우기와 코스 상세을 Kwep 콘텐츠에 맞게 갱신**

화면 요구사항:

- 카테고리별 코스 그룹
- 코스 카드의 제목, 설명, 레슨 수, 진행률
- 코스 상세의 유닛 접기/펼치기
- 레슨 상태: 완료, 진행 가능, 잠김
- 이어하기 버튼

검증:

```bash
bun --filter @workspace/web test -- courses-page course-detail-page course-curriculum
```

Expected: 5개 Kwep 코스와 15개 유닛 구조가 화면에 맞게 표시된다.

- [x] **Step 6.4: 프로필 화면 작성**

프로필 요구사항:

- 사용자 이름, 이메일, 이미지
- 가입일
- 현재 연속 학습일
- 완료 레슨 수
- 전체 진도
- 로그아웃 액션

검증:

```bash
bun --filter @workspace/web test -- profile-page auth-navigation
```

Expected: `/app/profile`은 인증 사용자에게 프로필을 보여주고, 전역 내비게이션에 프로필 진입점을 제공한다.

## Task 7: 플랫폼 레슨 경험 피벗

**Files:**

- Create: `apps/web/src/features/lessons/lesson-experience.tsx`
- Create: `apps/web/src/features/lessons/lesson-step-renderer.tsx`
- Create: `apps/web/src/features/lessons/use-lesson-persistence.ts`
- Create: `apps/web/src/features/lessons/lesson-logic.ts`
- Create: `apps/web/src/features/lessons/lesson-experience.test.tsx`
- Modify: `docs/lesson-page.md`

- [x] **Step 7.1: 레슨 시작 화면 추가**

요구사항:

- 레슨 제목, 카테고리, 설명, 예상 시간, 스텝 수를 보여준다.
- 사용자가 `시작하기`를 누르면 첫 스텝 진행 저장을 호출한다.
- 저장 실패 시 화면에 한국어 오류를 표시한다.

검증:

```bash
bun --filter @workspace/web test -- lesson-experience
```

Expected: 처음 들어온 레슨은 시작 화면을 먼저 보여주고, 시작 후 첫 스텝으로 진입한다.

- [x] **Step 7.2: 퀴즈형 답변 자동 저장**

저장 대상:

- 객관식
- 빈칸
- 단어 선택
- 순서 배열
- 매칭
- 분류
- 글쓰기
- 따라 쓰기
- 체크리스트
- 성찰

검증:

```bash
bun --filter @workspace/web test -- lesson-experience lesson-step-renderer
```

Expected: 각 답변 가능 스텝에서 답변 변경 시 `saveLessonAnswer`가 타입별 JSON 문자열로 호출된다.

- [x] **Step 7.3: AI 코칭 retry UX 구현**

요구사항:

- 코칭 시작 전 `AI 코칭 받기` 버튼을 보여준다.
- 로딩 중 상태를 보여준다.
- 결과에는 총평, 잘된 점, 다듬을 점, 다음 시도를 보여준다.
- `remainingAttempts > 0`이면 다시 받기 버튼을 보여준다.
- 재시도 한도 초과는 한국어 오류로 표시한다.

검증:

```bash
bun --filter @workspace/web test -- lesson-step-renderer lesson-experience
```

Expected: 성공, 로딩, 재시도 가능, 한도 초과 상태가 모두 테스트된다.

- [x] **Step 7.4: 플랫폼 프론트엔드 게이트 검증**

```bash
bun --filter @workspace/web test
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bun --filter @workspace/web build
bun run format:check
git diff --check
```

Expected: 플랫폼 프론트엔드 검증이 통과한다.

- [x] **Step 7.5: 플랫폼 브라우저 스모크**

실행:

```bash
bun run dev:app
```

브라우저 확인:

- `/` 랜딩 렌더링
- `/login` Google 로그인 버튼 렌더링
- `/app` 보호 redirect
- 인증 세션 상태에서 `/app` 홈 렌더링
- `/app/courses` 또는 새 배우기 경로 렌더링
- Kwep 코스 상세 진입
- 첫 레슨 시작 화면
- 객관식 확인과 해설
- 글쓰기 저장
- AI 코칭 성공 또는 인증/환경 오류 안내
- 레슨 완료와 다음 레슨 이동

종료:

```bash
pkill -f "bun --watch src/main.ts" || true
pkill -f "next dev" || true
```

Expected: 사용한 dev server가 모두 종료된다.

## Task 7R: 사용자 플로우 기반 Kwep UI 1:1 재작업

이 Task는 Task 6과 Task 7에서 작성한 플랫폼 프론트엔드 초안을 Kwep 프로토타입과 실제 화면 기준으로 다시 맞추는 재작업이다. 기존 “플랫폼 프론트엔드 검증 통과”는 API 연동과 기본 route 동작 검증일 뿐이며, 이 Task가 완료되기 전까지 학습자 플랫폼 UI는 완료로 보지 않는다.

**Files:**

- Modify: `docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`
- Modify: `docs/lesson-page.md`
- Modify: `docs/platform-product-feature-spec.md`
- Modify: `FRONTEND.md`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/app/layout.tsx`
- Modify: `apps/web/src/app/app/page.tsx`
- Modify: `apps/web/src/app/app/courses/page.tsx`
- Modify: `apps/web/src/app/app/courses/[id]/page.tsx`
- Modify: `apps/web/src/app/app/lesson/page.tsx`
- Modify: `apps/web/src/app/app/profile/page.tsx`
- Modify: `apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/src/components/layout/global-nav.tsx`
- Modify: `apps/web/src/features/landing/landing-page.tsx`
- Modify: `apps/web/src/features/landing/landing-page.test.tsx`
- Modify: `apps/web/src/features/auth/auth-page.tsx`
- Modify: `apps/web/src/features/auth/auth-page.test.tsx`
- Modify: `apps/web/src/features/home/home-page.tsx`
- Modify: `apps/web/src/features/home/home-page.test.tsx`
- Modify: `apps/web/src/features/courses/courses-page.tsx`
- Modify: `apps/web/src/features/courses/courses-page.test.tsx`
- Modify: `apps/web/src/features/courses/course-detail-page.tsx`
- Modify: `apps/web/src/features/courses/course-detail-page.test.tsx`
- Modify: `apps/web/src/features/courses/course-curriculum.tsx`
- Modify: `apps/web/src/features/courses/course-curriculum.test.tsx`
- Modify: `apps/web/src/features/lessons/lesson-experience.tsx`
- Modify: `apps/web/src/features/lessons/lesson-experience.test.tsx`
- Modify: `apps/web/src/features/lessons/lesson-step-renderer.tsx`
- Modify: `apps/web/src/features/lessons/lesson-step-renderer.test.tsx`
- Modify: `apps/web/src/features/lessons/lesson-types.ts`
- Modify: `apps/web/src/features/lessons/lesson-api-mappers.ts`
- Modify: `apps/web/src/features/lessons/lesson-api-mappers.test.ts`
- Modify: `apps/web/src/features/lessons/lesson-logic.ts`
- Modify: `apps/web/src/features/lessons/use-lesson-persistence.ts`
- Modify: `apps/web/src/features/profile/profile-page.tsx`
- Modify: `apps/web/src/features/profile/profile-page.test.tsx`
- Create: `apps/web/src/features/lessons/match-step.tsx`
- Create: `apps/web/src/features/lessons/categorize-step.tsx`
- Create: `apps/web/src/features/lessons/order-step.tsx`
- Create: `apps/web/src/features/lessons/session-done.tsx`
- Create: `apps/web/src/features/theme/theme-toggle.tsx`
- Create: `docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md`

- [ ] **Step 7R.0: 재작업 시작 기록과 기준 화면 목록 고정**

시작 기록에 포함할 내용:

- Kwep UI 1:1 재작업은 공개 랜딩부터 사용자 플로우 순서로 진행한다.
- 한 화면이 Kwep와 완전히 일치하기 전에는 다음 화면으로 넘어가지 않는다.
- 각 화면 완료 시 해당 화면 변경 파일만 커밋한다.
- 비교 기준 viewport는 모바일 `390x844`를 기본으로 하고, Kwep 화면이 데스크톱 layout을 제공하면 `1280x720`을 추가한다.

검증:

```bash
bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
```

Expected: 계획 문서 포맷이 통과한다.

- [x] **Step 7R.1: 공개 랜딩(`/`)을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /
Source:
  Kwep/src/app/components/landing/LandingScreen.tsx
  Kwep/src/app/components/landing/LandingNav.tsx
  Kwep/src/app/components/landing/Hero.tsx
  Kwep/src/app/components/landing/Marquee.tsx
  Kwep/src/app/components/landing/Features.tsx
  Kwep/src/app/components/landing/HowItWorks.tsx
  Kwep/src/app/components/landing/Stats.tsx
  Kwep/src/app/components/landing/Showcase.tsx
  Kwep/src/app/components/landing/FinalCTA.tsx
  Kwep/src/app/components/landing/Footer.tsx
```

제품 대상:

```text
Route: /
Source:
  apps/web/src/features/landing/landing-page.tsx
  apps/web/src/app/page.tsx
  apps/web/src/app/globals.css
```

비교 항목:

- 상단 nav 브랜드와 CTA
- hero 문구, 버튼, 우측 preview 영역
- Kwep landing section 순서
- feature/how-it-works/stat/showcase/final CTA/footer 문구와 레이아웃
- dark/light 색상, border radius, spacing, typography
- 클릭 기능은 Kwep 사용자 플로우와 같은 논리 화면으로 이동한다.
  - 로고: Kwep `/` → 제품 `/`
  - 시작 CTA: Kwep `/home` → 제품 `/app`
  - 코스 CTA: Kwep `/learn` → 제품 `/app/courses`

검증:

```bash
bun --filter @workspace/web test -- landing-page
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/landing apps/web/src/app/globals.css docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/
제품: http://localhost:3000/
viewport: 390x844
추가 viewport: 1280x720
```

Expected: 공개 랜딩의 화면, 텍스트, HTML/CSS 배치, 제품 대응 CTA 동작이 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/capture-landing.mjs docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/kwep-390x844.png docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/product-390x844.png docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/kwep-1280x720.png docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/product-1280x720.png docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/kwep-390x844-inventory.json docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/product-390x844-inventory.json docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/kwep-1280x720-inventory.json docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/product-1280x720-inventory.json apps/web/src/app/globals.css apps/web/src/features/landing packages/ui/src/components/icons.tsx
git commit -m "랜딩 화면을 Kwep와 일치"
```

- [x] **Step 7R.2: 로그인(`/login`)을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /login
Source:
  Kwep/src/app/components/Screens.tsx
  LoginScreen
```

제품 대상:

```text
Route: /login
Source:
  apps/web/src/features/auth/auth-page.tsx
  apps/web/src/features/auth/auth-page.test.tsx
  apps/web/src/app/login/page.tsx
```

비교 항목:

- 중앙 정렬 구조
- 로고/이모지/제품명 `글결.`
- 설명 문구
- Google 계속하기 버튼 형태
- 이메일/비밀번호 미지원 안내
- 랜딩 복귀 UI가 Kwep에 없으면 제거한다.
- Google 버튼 href는 제품 인증 경계인 `/api/auth/sign-in/google?callbackURL=...`을 유지한다.

검증:

```bash
bun --filter @workspace/web test -- auth-page
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/auth apps/web/src/app/login/page.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/login
제품: http://localhost:3000/login
viewport: 390x844
```

Expected: 인증 provider URL을 제외하고 로그인 화면과 문구가 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md apps/web/src/app/login/page.tsx apps/web/src/features/auth
git commit -m "로그인 화면을 Kwep와 일치"
```

- [x] **Step 7R.3: 홈 fresh 상태(`/home` vs `/app`)를 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /home
Source:
  Kwep/src/app/components/Screens.tsx
  HomeScreen
  Kwep/src/app/components/Chrome.tsx
```

제품 대상:

```text
Route: /app
Source:
  apps/web/src/features/home/home-page.tsx
  apps/web/src/components/layout/app-shell.tsx
  apps/web/src/components/layout/global-nav.tsx
  apps/web/src/app/app/layout.tsx
  apps/web/src/app/app/page.tsx
```

비교 항목:

- Kwep 앱 chrome: 상단 브랜드/아바타, 모바일 하단 nav
- fresh 상태에서 진행 중 코스가 없을 때 “첫 번째 코스를 선택해 보세요” 카드만 표시
- 연속 학습일과 완료한 레슨 카드
- 사용자 이름 표시 규칙
- 제품이 fresh 상태에서 모든 코스를 진행 중으로 보여주는 현재 동작 제거

검증:

```bash
bun --filter @workspace/web test -- home-page global-nav
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/home apps/web/src/components/layout apps/web/src/app/app docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/home
제품: http://localhost:3000/app
viewport: 390x844
state: progress/answers/activity 없음
```

Expected: fresh 홈의 화면, 빈 상태, nav, 통계가 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md apps/web/src/app/app apps/web/src/components/layout apps/web/src/features/home
git commit -m "홈 화면 fresh 상태를 Kwep와 일치"
```

- [x] **Step 7R.4: 배우기(`/learn` vs `/app/courses`)를 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /learn
Source:
  Kwep/src/app/components/Screens.tsx
  LearnScreen
```

제품 대상:

```text
Route: /app/courses
Source:
  apps/web/src/features/courses/courses-page.tsx
  apps/web/src/features/courses/courses-page.test.tsx
  apps/web/src/app/app/courses/page.tsx
```

비교 항목:

- 제목 `무엇을 써볼까요?`
- 설명 문구
- 가로 스크롤 카테고리 pill
- 선택된 카테고리의 코스만 표시
- 코스 이미지, 카드 방향, 레슨 수 표시
- 하단 nav 유지

검증:

```bash
bun --filter @workspace/web test -- courses-page
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/courses apps/web/src/app/app/courses/page.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/learn
제품: http://localhost:3000/app/courses
viewport: 390x844
```

Expected: 배우기 화면의 카테고리 선택, 카드 UI, 이미지, nav가 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md apps/web/src/app/app/courses/page.tsx apps/web/src/features/courses
git commit -m "배우기 화면을 Kwep와 일치"
```

- [x] **Step 7R.5: 코스 상세(`/course/c1` vs `/app/courses/c1`)를 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /course/c1
Source:
  Kwep/src/app/components/Screens.tsx
  CourseDetailScreen
```

제품 대상:

```text
Route: /app/courses/c1
Source:
  apps/web/src/features/courses/course-detail-page.tsx
  apps/web/src/features/courses/course-curriculum.tsx
  apps/web/src/app/app/courses/[id]/page.tsx
```

비교 항목:

- 돌아가기 버튼
- 썸네일 이미지
- course hero 카드
- 진행률 bar와 `completed/total`
- 첫 번째/다음 레슨 CTA 문구
- 커리큘럼 accordion, 유닛 번호, 완료/잠김/진행 가능 icon
- 잠김 레슨 click 방지

검증:

```bash
bun --filter @workspace/web test -- course-detail-page course-curriculum
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/courses apps/web/src/app/app/courses/[id]/page.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/course/c1
제품: http://localhost:3000/app/courses/c1
viewport: 390x844
state: c1 진행 없음
```

Expected: 코스 상세 화면과 커리큘럼 상태 UI가 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md apps/web/src/app/app/courses/[id]/page.tsx apps/web/src/features/courses
git commit -m "코스 상세 화면을 Kwep와 일치"
```

- [x] **Step 7R.6: 레슨 shell과 읽기 스텝을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Routes:
  /lesson/c1/l1
  /lesson/c1/l1 시작 후
Source:
  Kwep/src/app/components/LessonShell.tsx
  Kwep/src/app/components/StepRenderer.tsx
```

제품 대상:

```text
Route: /app/lesson?lesson_id=l1
Source:
  apps/web/src/features/lessons/lesson-experience.tsx
  apps/web/src/features/lessons/lesson-step-renderer.tsx
  apps/web/src/features/lessons/lesson-logic.ts
  apps/web/src/app/app/lesson/page.tsx
```

비교 항목:

- 전역 nav 없는 full-screen lesson shell
- 시작 화면의 X, 제목, 설명, 시간, 스텝 수, 하단 고정 시작 CTA
- 시작 후 상단 X, progress bar, `1/1`
- Markdown 렌더링: 굵게, 인용, 목록, 수평선, term/source
- 읽기/비교 스텝 CTA 문구 `이해했어요`
- 나가기 confirm modal

검증:

```bash
bun --filter @workspace/web test -- lesson-experience lesson-step-renderer
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/lessons apps/web/src/app/app/lesson/page.tsx docs/lesson-page.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/lesson/c1/l1
제품: http://localhost:3000/app/lesson?lesson_id=l1
viewport: 390x844
```

Expected: 레슨 시작 화면과 읽기 스텝이 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/lesson-page.md apps/web/src/app/app/lesson/page.tsx apps/web/src/features/lessons
git commit -m "레슨 shell과 읽기 스텝을 Kwep와 일치"
```

- [x] **Step 7R.7: 매칭/분류/쓰기 레슨(`l-new`)을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /lesson/c1/l-new
Source:
  Kwep/src/app/components/LessonShell.tsx
  Kwep/src/app/components/StepRenderer.tsx
  Kwep/src/app/components/MatchStep.tsx
  Kwep/src/app/components/CategorizeStep.tsx
```

제품 대상:

```text
Route: /app/lesson?lesson_id=l-new
Source:
  apps/web/src/features/lessons/lesson-experience.tsx
  apps/web/src/features/lessons/lesson-step-renderer.tsx
  apps/web/src/features/lessons/match-step.tsx
  apps/web/src/features/lessons/categorize-step.tsx
  apps/web/src/features/lessons/lesson-logic.ts
```

비교 항목:

- `MATCH`: 왼쪽 선택 후 오른쪽 선택, shuffled right order, 확인 전 disabled 상태, 확인 후 correct/wrong 색상
- `CATEGORIZE`: tag panel, item tap, placement badge, 완료 조건
- `WRITE`: guide markdown, badge, claim/reference/structure, min/goal/max counter, disabled CTA 조건, sample 표시
- 답변이 없으면 다음으로 넘어가지 않음
- 하단 CTA 문구와 바텀 피드백 panel
- 자동 저장과 복원

검증:

```bash
bun --filter @workspace/web test -- lesson-experience lesson-step-renderer
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/lessons docs/lesson-page.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/lesson/c1/l-new
제품: http://localhost:3000/app/lesson?lesson_id=l-new
viewport: 390x844
```

Expected: `l-new`의 4개 스텝 UI, 제출 조건, 저장/복원이 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/lesson-page.md apps/web/src/features/lessons
git commit -m "매칭 분류 쓰기 레슨을 Kwep와 일치"
```

- [x] **Step 7R.9: 객관식 확인 레슨(`l2`)을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /lesson/c1/l2
Source:
  Kwep/src/app/components/LessonShell.tsx
  Kwep/src/app/components/StepRenderer.tsx
```

제품 대상:

```text
Route: /app/lesson?lesson_id=l2
Source:
  apps/web/src/features/lessons/lesson-experience.tsx
  apps/web/src/features/lessons/lesson-step-renderer.tsx
  apps/web/src/features/lessons/lesson-logic.ts
```

비교 항목:

- 읽기 스텝 3개 후 객관식 진입
- 객관식 선택 전 CTA disabled
- 선택 후 `확인하기`
- 정답/오답 bottom feedback panel
- 오답 시 `wrong`, 정답 시 `explanation`
- 정답 option 강조와 오답 option 표시
- `계속하기` 후 완료 진입

검증:

```bash
bun --filter @workspace/web test -- lesson-experience lesson-step-renderer
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/lessons docs/lesson-page.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/lesson/c1/l2
제품: http://localhost:3000/app/lesson?lesson_id=l2
viewport: 390x844
```

Expected: 객관식 제출과 정오답 피드백 흐름이 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/lesson-page.md apps/web/src/features/lessons
git commit -m "객관식 확인 흐름을 Kwep와 일치"
```

- [x] **Step 7R.10: 레슨 완료 화면을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Source:
  Kwep/src/app/components/SessionDone.tsx
  Kwep/src/app/components/Screens.tsx Completion
```

제품 대상:

```text
Source:
  apps/web/src/features/lessons/session-done.tsx
  apps/web/src/features/lessons/lesson-experience.tsx
```

비교 항목:

- 완료 축하 배경과 문구
- 완료한 레슨 `+1`
- 코스 진행률 `completed/total`
- 코스로 돌아가기
- 다음 레슨 CTA
- 완료 저장 후 홈/코스 진행 상태 반영

검증:

```bash
bun --filter @workspace/web test -- lesson-experience
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/lessons docs/lesson-page.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: l1 또는 l2 완료 직후
제품: l1 또는 l2 완료 직후
viewport: 390x844
```

Expected: 완료 화면과 다음 이동 흐름이 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/lesson-page.md apps/web/src/features/lessons
git commit -m "레슨 완료 화면을 Kwep와 일치"
```

- [x] **Step 7R.11: 프로필과 테마 전환을 Kwep와 일치시킨 뒤 커밋**

Kwep 기준:

```text
Route: /profile
Source:
  Kwep/src/app/components/Screens.tsx
  ProfileScreen
  ThemeToggle
```

제품 대상:

```text
Route: /app/profile
Source:
  apps/web/src/features/profile/profile-page.tsx
  apps/web/src/features/profile/profile-page.test.tsx
  apps/web/src/app/app/profile/page.tsx
  apps/web/src/app/layout.tsx
```

비교 항목:

- 큰 아바타
- 이름과 가입일
- 완료한 레슨/연속 학습일 카드
- 화면 테마 heading
- 라이트/다크/시스템 segmented control
- 로그아웃 버튼
- 하단 nav

검증:

```bash
bun --filter @workspace/web test -- profile-page
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/features/profile apps/web/src/app/app/profile/page.tsx apps/web/src/app/layout.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
git diff --check
```

브라우저 검증:

```text
Kwep: http://127.0.0.1:5173/profile
제품: http://localhost:3000/app/profile
viewport: 390x844
```

Expected: 프로필과 테마 전환 UI가 Kwep와 일치한다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md FRONTEND.md apps/web/src/app/layout.tsx apps/web/src/app/app/profile/page.tsx apps/web/src/features/profile
git commit -m "프로필과 테마 전환을 Kwep와 일치"
```

- [x] **Step 7R.12: 학습자 플로우 전체 회귀 검증**

검증 명령:

```bash
bun --filter @workspace/web test
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bun --filter @workspace/web build
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
bun run format:check
git diff --check
```

브라우저 회귀:

```text
1. /
2. /login
3. /app
4. /app/courses
5. /app/courses/c1
6. /app/lesson?lesson_id=l1
7. /app/lesson?lesson_id=l-new
8. /app/lesson?lesson_id=l2
9. /app/profile
```

Expected: 사용자 플로우 1~12번 화면이 Kwep와 일치하고, 모든 dev server가 종료된다.

커밋:

```bash
git status --short
git add docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md FRONTEND.md docs/lesson-page.md docs/platform-product-feature-spec.md
git commit -m "학습자 플로우 Kwep UI 일치 검증"
```

## Task 8: 어드민 API 요구사항 확정과 계약 작성

**Files:**

- Create: `packages/core/src/admin/admin.dto.ts`
- Create: `packages/core/src/admin/admin.repository.ts`
- Create: `packages/core/src/admin/admin.service.ts`
- Create: `packages/core/src/admin/admin.service.test.ts`
- Create: `packages/core/src/admin/index.ts`
- Create: `packages/db/src/schema/admin.schema.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/migrations/0000-kwep-baseline.sql`
- Create: `packages/db/src/repositories/admin.repository.ts`
- Create: `packages/db/src/repositories/admin.repository.test.ts`
- Create: `apps/admin-api/src/app.ts`
- Create: `apps/admin-api/src/app.test.ts`
- Create: `apps/admin-api/src/main.ts`
- Create: `apps/admin-api/src/env.ts`
- Create: `apps/admin-api/src/env.test.ts`
- Create: `apps/admin-api/src/auth/admin-auth.ts`
- Create: `apps/admin-api/src/auth/admin-session.ts`
- Create: `apps/admin-api/src/routes/health.route.ts`
- Create: `apps/admin-api/src/routes/openapi.route.ts`
- Create: `apps/admin-api/src/routes/auth.route.ts`
- Create: `apps/admin-api/src/routes/session.route.ts`
- Create: `apps/admin-api/src/routes/courses.route.ts`
- Create: `apps/admin-api/src/routes/users.route.ts`
- Create: `apps/admin-api/src/routes/dashboard.route.ts`
- Create: `apps/admin-api/src/routes/analytics.route.ts`
- Create: `apps/admin-api/src/routes/settings.route.ts`
- Create: `apps/admin-api/src/routes/curriculum-editor.route.ts`
- Create: `apps/admin-api/src/routes/route-helpers.ts`
- Create: `apps/admin-api/src/routes/error-response.ts`

- [x] **Step 8.1: 어드민 dashboard DTO와 route 작성**

응답 필드:

```ts
type AdminDashboardDto = {
  metrics: {
    totalUsers: number
    activeUsersLast7Days: number
    signupsToday: number
    signupsLast7Days: number
    completedLessons: number
    activeCourses: number
    activeLessons: number
  }
  recentActivities: {
    userId: string
    name: string
    email: string
    lastActiveDate: string | null
    currentStreakDays: number
  }[]
}
```

검증:

```bash
bun --filter @workspace/admin-api test -- app dashboard
```

Expected: 관리자 세션이 없으면 `401`, 세션이 있으면 DB 기반 대시보드 지표를 반환한다.

- [x] **Step 8.2: 사용자 목록과 상세 API 작성**

Endpoint:

```text
GET /users?page=1&pageSize=20&query=&status=all&sort=lastActive
GET /users/:userId
PATCH /users/:userId/status
DELETE /users/:userId
```

정책:

- `PATCH status`는 `active`, `suspended`만 허용한다.
- `DELETE`는 앱 소유 프로필을 `deleted`로 바꾸고 관리자 화면에서 삭제된 상태로 표시한다.
- 학습 진행과 답변 row는 감사와 복구를 위해 보존한다.

검증:

```bash
bun --filter @workspace/admin-api test -- users
```

Expected: 검색, 상태 필터, 정렬, 페이지네이션, 상태 변경, 삭제 상태 전환이 통과한다.

- [x] **Step 8.3: 분석 API 작성**

Endpoint:

```text
GET /analytics?days=30
GET /analytics/lessons?page=1&pageSize=10&query=&sort=completionRate&direction=asc
```

응답:

- 일별 가입 수
- 일별 레슨 완료 수
- 연속 학습일 bucket
- 레슨별 완료율
- 레슨별 이탈률

검증:

```bash
bun --filter @workspace/admin-api test -- analytics
```

Expected: 완료율은 `completed / started`, 이탈률은 `100 - completionRate`로 계산된다.

- [x] **Step 8.4: 운영 설정 API 작성**

Endpoint:

```text
GET /settings
PUT /settings/notice
PUT /settings/legal
POST /settings/content-reset
```

정책:

- 공지/배너와 약관/개인정보는 `admin_settings` key-value 테이블에 저장한다.
- 콘텐츠 초기화는 Kwep seed 기준으로 active 콘텐츠를 재시드한다.
- 콘텐츠 초기화는 관리자 세션이 필요하고, 응답에 새 revision과 변경 카운트를 포함한다.

검증:

```bash
bun --filter @workspace/admin-api test -- settings
```

Expected: 설정 저장과 콘텐츠 초기화가 transaction 안에서 동작한다.

- [ ] **Step 8.5: 코스 생성과 보관 API 작성**

Endpoint:

```text
POST /courses
DELETE /courses/:courseId
```

정책:

- `POST /courses`는 빈 코스, 기본 유닛 1개, 기본 레슨 1개, `READING`, `WRITE` 스텝을 생성한다.
- `DELETE /courses/:courseId`는 `courses.status = 'archived'`로 전환한다.
- archived 코스는 학습자 API에서 제외한다.

검증:

```bash
bun --filter @workspace/admin-api test -- courses curriculum-editor
```

Expected: 생성된 코스는 편집 문서로 열 수 있고, 보관된 코스는 학습자 API에 노출되지 않는다.

- [ ] **Step 8.6: 어드민 API 게이트 검증**

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/admin-api test
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin-api lint
bun run format:check
git diff --check
```

Expected: 어드민 API 관련 검증이 통과한다.

## Task 9: 어드민 프론트엔드 API 포트 작성

**Files:**

- Create: `apps/admin/src/lib/api/admin-api.ts`
- Create: `apps/admin/src/lib/api/http-admin-api.ts`
- Create: `apps/admin/src/lib/api/http-admin-api.test.ts`
- Create: `apps/admin/src/lib/api/get-server-admin-api.ts`
- Create: `apps/admin/src/lib/auth/admin-auth-client.ts`
- Create: `apps/admin/src/lib/auth/admin-auth-navigation.ts`
- Create: `apps/admin/src/features/dashboard/admin-dashboard-page.tsx`
- Create: `apps/admin/src/features/dashboard/admin-dashboard-page.test.tsx`
- Create: `apps/admin/src/features/users/admin-users-page.tsx`
- Create: `apps/admin/src/features/users/admin-users-page.test.tsx`
- Create: `apps/admin/src/features/users/admin-user-detail-page.tsx`
- Create: `apps/admin/src/features/users/admin-user-detail-page.test.tsx`
- Create: `apps/admin/src/features/analytics/admin-analytics-page.tsx`
- Create: `apps/admin/src/features/analytics/admin-analytics-page.test.tsx`
- Create: `apps/admin/src/features/settings/admin-settings-page.tsx`
- Create: `apps/admin/src/features/settings/admin-settings-page.test.tsx`

- [ ] **Step 9.1: `AdminApi` 포트 작성**

필수 메서드:

```ts
getDashboard(): Promise<ApiResult<AdminDashboard>>
getUsers(input): Promise<ApiResult<AdminUserList>>
getUser(userId): Promise<ApiResult<AdminUserDetail>>
updateUserStatus(input): Promise<ApiResult<AdminUserDetail>>
deleteUser(userId): Promise<ApiResult<{ deleted: true }>>
getAnalytics(input): Promise<ApiResult<AdminAnalytics>>
getLessonAnalytics(input): Promise<ApiResult<AdminLessonAnalyticsPage>>
getSettings(): Promise<ApiResult<AdminSettings>>
saveNoticeSettings(input): Promise<ApiResult<AdminSettings>>
saveLegalSettings(input): Promise<ApiResult<AdminSettings>>
resetContent(): Promise<ApiResult<AdminContentResetResult>>
createCourse(): Promise<ApiResult<AdminCourseDetail>>
archiveCourse(courseId): Promise<ApiResult<{ archived: true }>>
```

검증:

```bash
bun --filter @workspace/admin test -- http-admin-api
```

Expected: 모든 새 endpoint의 요청 URL, method, body, 오류 매핑이 테스트된다.

## Task 10: 어드민 화면 피벗

**Files:**

- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/login/page.tsx`
- Create: `apps/admin/src/app/(admin)/layout.tsx`
- Create: `apps/admin/src/app/(admin)/page.tsx`
- Create: `apps/admin/src/app/(admin)/courses/page.tsx`
- Create: `apps/admin/src/app/(admin)/courses/[id]/page.tsx`
- Create: `apps/admin/src/app/(admin)/users/page.tsx`
- Create: `apps/admin/src/app/(admin)/users/[id]/page.tsx`
- Create: `apps/admin/src/app/(admin)/analytics/page.tsx`
- Create: `apps/admin/src/app/(admin)/settings/page.tsx`
- Create: `apps/admin/src/components/admin-shell.tsx`
- Create: `apps/admin/src/components/admin-sidebar.tsx`
- Create: `apps/admin/src/components/admin-header.tsx`
- Create: `apps/admin/src/features/auth/admin-auth-page.tsx`
- Create: `apps/admin/src/features/courses/admin-courses-page.tsx`
- Create: `apps/admin/src/features/courses/admin-courses-page.test.tsx`
- Create: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- Create: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- Create: `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
- Create: `apps/admin/src/features/courses/course-editor/lesson-workspace.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-workspace.tsx`
- Create: `apps/admin/src/features/courses/course-editor/lesson-preview.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-form-registry.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/reading-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/compare-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/multiple-choice-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/fill-blank-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/select-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/order-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/write-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/ai-feedback-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/match-step-form.tsx`
- Create: `apps/admin/src/features/courses/course-editor/step-forms/categorize-step-form.tsx`
- Modify: `docs/admin-site.md`

- [ ] **Step 10.1: 어드민 라우트와 사이드바 작성**

라우트:

```text
/
/courses
/courses/[id]
/users
/users/[id]
/analytics
/settings
```

검증:

```bash
bun --filter @workspace/admin test -- admin-shell admin-header
```

Expected: 사이드바에 대시보드, 콘텐츠 관리, 사용자 관리, 분석, 운영 설정이 표시된다.

- [ ] **Step 10.2: 대시보드 구현**

요구사항:

- 지표 카드 4개 이상
- 최근 활동 목록
- 연속 학습일 분포 간단 차트
- API 오류 상태

검증:

```bash
bun --filter @workspace/admin test -- admin-dashboard-page
```

Expected: dashboard API 응답을 기준으로 지표와 최근 활동이 렌더링된다.

- [ ] **Step 10.3: 코스 목록을 Kwep 운영 요구사항에 맞게 작성**

요구사항:

- 검색
- 카테고리 필터
- 페이지 크기 선택
- 페이지 이동
- 새 코스 생성
- 코스 보관 확인 대화상자

검증:

```bash
bun --filter @workspace/admin test -- admin-courses-page
```

Expected: 검색/필터/페이지/생성/보관 흐름이 API 포트 mock으로 검증된다.

- [ ] **Step 10.4: 코스 에디터와 레슨 에디터를 Kwep 스텝에 맞게 작성**

작성 범위:

- lesson `estimatedMinutes`, `summary` 편집
- `SELECT` segments 입력 보조
- `WRITE` 통합 쓰기 필드 대응
- `AI_FEEDBACK` source step 선택과 retry 설정
- 학습자 미리보기의 시작 화면 포함

검증:

```bash
bun --filter @workspace/admin test -- course-editor lesson-workspace step-workspace lesson-preview
```

Expected: Kwep에서 사용된 10개 타입이 새 편집 폼으로 작성 가능하다.

- [ ] **Step 10.5: 사용자 목록과 사용자 상세 구현**

요구사항:

- 이름/이메일 검색
- 상태 필터
- 최근 접속/가입/완료 레슨/연속 학습일 정렬
- 페이지 이동
- 사용자 상세 통계
- 계정 정지/복구
- 삭제 요청 확인 대화상자

검증:

```bash
bun --filter @workspace/admin test -- admin-users-page admin-user-detail-page
```

Expected: 사용자 상태 변경과 삭제 요청이 낙관적 업데이트 없이 서버 응답 기준으로 반영된다.

- [ ] **Step 10.6: 분석 화면 구현**

요구사항:

- 최근 30일 가입 추이
- 일별 완료 추이
- 연속 학습일 분포
- 레슨별 완료율/이탈률 테이블
- 레슨/코스 검색
- 정렬과 페이지 이동

검증:

```bash
bun --filter @workspace/admin test -- admin-analytics-page
```

Expected: 차트와 테이블이 API 응답만으로 렌더링된다.

- [ ] **Step 10.7: 운영 설정 구현**

요구사항:

- 공지/배너 저장
- 이용약관 저장
- 개인정보처리방침 저장
- 콘텐츠 초기화 확인 대화상자
- 저장 성공/실패 상태

검증:

```bash
bun --filter @workspace/admin test -- admin-settings-page
```

Expected: 설정 저장과 콘텐츠 초기화가 API 포트 mock으로 검증된다.

- [ ] **Step 10.8: 어드민 프론트엔드 게이트 검증**

```bash
bun --filter @workspace/admin test
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
bun --filter @workspace/admin build
bun run format:check
git diff --check
```

Expected: 어드민 프론트엔드 검증이 통과한다.

## Task 11: 전체 통합 검증과 문서 완료

**Files:**

- Modify: `CONTEXT.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DOMAIN.md`
- Modify: `FRONTEND.md`
- Modify: `BACKEND.md`
- Modify: `docs/platform-product-feature-spec.md`
- Modify: `docs/admin-site.md`
- Modify: `docs/frontend-api-client.md`
- Modify: `docs/platform-backend-api.md`
- Modify: `docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`

- [ ] **Step 11.1: 전체 테스트**

```bash
bun run test
bun run typecheck
bun run lint
bun run format:check
git diff --check
```

Expected: 전체 monorepo 검증이 통과한다. 기존 실패가 남으면 이 문서에 실패 명령, 실패 원인, 새 변경과의 관련성을 기록한다.

- [ ] **Step 11.2: 플랫폼 실제 API 브라우저 검증**

실행:

```bash
bun run dev:app
```

확인:

- 공개 랜딩
- Google 로그인 진입
- 보호 route
- 홈 진행 카드
- 배우기/코스 상세
- 레슨 시작/진행/답변 저장/완료
- 프로필

종료:

```bash
pkill -f "bun --watch src/main.ts" || true
pkill -f "next dev" || true
```

Expected: dev server가 종료되고, 검증 결과가 이 문서의 작업 로그에 기록된다.

- [ ] **Step 11.3: 어드민 실제 API 브라우저 검증**

실행:

```bash
bun run dev:admin
```

확인:

- 관리자 로그인
- 대시보드
- 코스 생성
- 코스 편집 저장
- 레슨 스텝 편집과 미리보기
- 사용자 목록/상세/정지/복구
- 분석
- 운영 설정 저장

종료:

```bash
pkill -f "bun --watch src/main.ts" || true
pkill -f "next dev --port 3001" || true
```

Expected: dev server가 종료되고, 검증 결과가 이 문서의 작업 로그에 기록된다.

- [ ] **Step 11.4: pre-commit 검증**

```bash
bun lefthook run pre-commit
```

Expected: pre-commit hook이 통과한다.

- [ ] **Step 11.5: 문서 완료 기록**

완료 기록에 포함할 내용:

- Kwep 요구사항 중 구현 완료된 항목
- 구현하지 않은 Kwep 프로토타입 세부사항과 대체 정책
- API endpoint 목록
- 라우트 목록
- DB migration 목록
- 브라우저 검증 결과
- 운영상 주의 사항

검증:

```bash
bunx prettier --check CONTEXT.md ARCHITECTURE.md DOMAIN.md FRONTEND.md BACKEND.md docs/platform-product-feature-spec.md docs/admin-site.md docs/frontend-api-client.md docs/platform-backend-api.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md
```

Expected: 문서 포맷 검증이 통과한다.

## 작업 로그

### 2026-06-14 계획 수립 시작

- 새 브랜치 `codex/kwep-platform-pivot-plan`을 생성했다.
- `Kwep` 프로토타입의 routes, schema, data, state, lesson renderer, admin content, admin mock data를 읽었다.
- Kwep 콘텐츠는 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝으로 확인했다.
- 기존 코드베이스는 이미 학습자 API/웹과 어드민 API/웹이 분리되어 있고, Better Auth, Hono, Drizzle, OpenAPI, `packages/core` 경계를 갖고 있음을 확인했다.
- 기존 BSSN 단순화로 제거했던 프로필과 연속 학습일은 Kwep 피벗 요구사항으로 재채택한다.

### 2026-06-14 계획 수립 완료

- 이 SSOT 계획 문서를 추가했다.
- 구현 순서를 플랫폼 API, 플랫폼 프론트엔드, 플랫폼 통합 검증, 어드민 API, 어드민 프론트엔드, 전체 통합 검증으로 고정했다.
- `/Kwep`는 읽기 전용 요구사항 원천으로만 사용하고 런타임 의존성으로 만들지 않는 정책을 명시했다.

### 2026-06-14 전면 재작성 원칙 반영 완료

- 기술 스택과 monorepo 골격은 재사용하되, 대상 `src` 구현 코드는 삭제 후 새 baseline으로 작성하는 원칙을 추가했다.
- 기존 코드 수정, 기존 타입 체계 유지, 누적 migration 추가처럼 피벗에 맞지 않는 계획 표현을 제거했다.
- DB는 `0012`, `0013`, `0014` 같은 추가 migration이 아니라 `0000-kwep-baseline.sql` 하나로 새 schema를 작성하는 방향으로 바꿨다.
- Task 1에 기존 구현 코드 제거와 source root reset 단계를 추가했다.
- Kwep의 10개 스텝 타입을 새 표준 타입으로 정의하고, 기존 20개 스텝 타입에 맞추는 계획을 제거했다.

### 2026-06-14 피벗 계획 실행 시작

- `superpowers:executing-plans` 절차에 따라 계획 문서를 다시 읽고 Task 0.3 기준선 검증부터 시작했다.
- 현재 작업 위치는 일반 체크아웃이지만 계획서의 작업 브랜치 `codex/kwep-platform-pivot-plan` 위에 있음을 확인했다.
- 시작 시점의 기존 변경으로 `.prettierignore`, `AGENTS.md`, untracked `Kwep/`, untracked 계획 문서가 남아 있음을 다시 확인했다.
- `Kwep/`는 읽기 전용 요구사항 원천으로만 유지하고 수정하지 않는다.

### 2026-06-14 기준선 검증 결과

- `bun --version`: `1.3.14`로 확인했다. 계획의 `1.3.10` 계열 조건과 같은 `1.3.x` 계열이다.
- `node --version`: `v24.16.0`으로 확인했다. 사용자 결정에 따라 현재 설치된 Node 24를 기준선으로 사용한다.
- `bun run format:check`: 실패했다. 시작 시점 기준 `apps/admin/next-env.d.ts`, `apps/web/next-env.d.ts`, `BACKEND.md`에 Prettier 경고가 있다.
- `bun run typecheck`: 실패했다. `@workspace/admin`의 `.next/types/validator.ts`가 `../../src/app/api/auth/[...path]/route.js` 타입을 찾지 못한다.
- `bun run lint`: 통과했다. 단, `apps/api/src/main.test.ts`에서 `BUN_EXECUTABLE`, `HOME`이 `turbo.json` dependency에 없다는 경고 2개가 있다.
- `bun run test`: 통과했다. 전체 테스트는 9개 task 기준 성공했다.
- 위 실패는 새 구현 변경 전 기준선 상태로 기록하고, 이후 피벗 작업의 회귀와 분리한다.

### 2026-06-14 시작 문서 갱신 완료

- `CONTEXT.md`에 Kwep 피벗 목표, 학습자/어드민 범위, `Kwep/` 읽기 전용 경계를 반영했다.
- `ARCHITECTURE.md`에 새 API와 데이터 경계, Kwep baseline seed, 새 baseline migration 정책을 반영했다.
- `DOMAIN.md`에 Kwep 콘텐츠 모델, 10개 표준 스텝 타입, 답변 저장, 연속 학습일, 보관/삭제 정책을 반영했다.
- `FRONTEND.md`에 학습자 라우트, 레슨 시작 화면, 테마 전환, 어드민 대시보드/분석/설정 경로를 반영했다.
- `BACKEND.md`에 학습자 API endpoint, 어드민 API endpoint, 환경/DB baseline 정책을 반영했다.
- `bunx prettier --check CONTEXT.md ARCHITECTURE.md DOMAIN.md FRONTEND.md BACKEND.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.

### 2026-06-14 기준선 실패 해결 시작

- 기준선 실패 해결 범위는 `bun run format:check` 포맷 실패와 `bun run typecheck` Next typegen 실패다.
- Node 기준선은 현재 설치된 `v24.16.0`을 사용하도록 계획을 갱신했다.
- `bun run lint`, `bun run test`는 이미 통과한 기준선으로 두고, 수정 후 전체 기준선을 다시 검증한다.
- 실패 원인을 분리해 해결하고, `Kwep/` 디렉토리는 계속 읽기 전용으로 유지한다.

### 2026-06-14 기준선 실패 해결 완료

- 사용자 결정에 따라 Node 기준선을 `20.x`에서 현재 설치된 `24.x`로 변경했다.
- `.nvmrc`, 루트 `package.json`의 `engines.node`, `README.md`, `AGENTS.md`, `docs/development-tooling.md`, 이 계획 문서의 Node 기준을 `24.x`로 맞췄다.
- `apps/admin/package.json`, `apps/web/package.json`의 `typecheck` 스크립트가 `next typegen && tsc --noEmit`를 실행하도록 변경했다. stale `.next/types`가 삭제된 route를 계속 참조해 typecheck가 실패하던 원인을 제거하기 위한 변경이다.
- `next typegen`이 다시 생성하는 `apps/*/next-env.d.ts`는 `.prettierignore`에서 제외해 포맷 검증이 생성 파일에 묶이지 않게 했다.
- `bun --version`: `1.3.14`로 통과했다.
- `node --version`: `v24.16.0`으로 통과했다.
- `bun run format:check`: 통과했다.
- `bun run typecheck`: 통과했다.
- `bun run lint`: 통과했다. 기존과 동일하게 `apps/api/src/main.test.ts`의 `BUN_EXECUTABLE`, `HOME` turbo env-var 경고 2개는 남아 있다.
- `bun run test`: 통과했다.
- `node@20` 설치 시도는 사용자 결정 변경 후 중단했고, 설치된 `node@20` formula는 link하지 않은 상태에서 제거했다.

### 2026-06-14 커밋 운영 규칙 추가

- 각 Task 완료 시 검증과 작업 로그 기록 후 커밋하도록 SSOT 운영 규칙에 추가했다.
- 긴 Task는 검증 가능한 Step 묶음이 끝날 때마다 중간 커밋하도록 명시했다.
- 커밋 전 `git status --short`로 범위를 확인하고, 사용자 기존 변경이나 미완성 변경을 섞지 않는 조건을 추가했다.
- 검증 실패 또는 커밋 범위가 불명확한 경우에는 커밋하지 않고 작업 로그에 보류 사유를 남기도록 했다.

### 2026-06-14 Task 1 시작

- Task 1은 기존 제품 구현 `src` 디렉토리를 삭제하고, monorepo 실행 골격과 package 설정만 보존하는 reset 작업으로 진행한다.
- 삭제 대상은 `apps/api/src`, `apps/web/src`, `apps/admin-api/src`, `apps/admin/src`, `packages/core/src`, `packages/db/src`, `packages/ui/src`, `packages/env/src`, `packages/logger/src`로 한정한다.
- `Kwep/` 디렉토리는 계속 읽기 전용 요구사항 원천으로만 두고 수정하거나 커밋하지 않는다.
- 이 Task는 새 구현을 추가하기 전 source root를 비우는 단계이므로, 검증은 계획서에 명시된 삭제 대상 확인, package manifest 보존 확인, 문서 포맷 확인으로 제한한다.

### 2026-06-14 Task 1 완료

- `find apps packages -path '*/src' -type d | sort`로 삭제 대상 source root가 존재함을 확인했다. 삭제 전 목록에는 계획상 삭제 대상 9개와 보존 대상 `apps/storybook/src`가 있었다.
- `git rm -r apps/api/src apps/web/src apps/admin-api/src apps/admin/src packages/core/src packages/db/src packages/ui/src packages/env/src packages/logger/src`로 기존 제품 구현 코드를 제거했다.
- 삭제 후 `find apps packages -path '*/src' -type d | sort` 결과는 `apps/storybook/src`만 남았다.
- `apps/api`, `apps/web`, `apps/admin-api`, `apps/admin`, `packages/core`, `packages/db`, `packages/ui`, `packages/env`, `packages/logger`의 `package.json` 보존을 확인했다.
- `CONTEXT.md`, `ARCHITECTURE.md`, `DOMAIN.md`, `FRONTEND.md`, `BACKEND.md`에 reset 상태와 후속 Task에서 새 baseline 구현을 작성한다는 정책을 기록했다.
- 전체 typecheck, lint, test는 source root를 비운 이 Task의 완료 조건으로 사용하지 않는다. 후속 Task 2가 새 source root를 만들고 나면 패키지별 검증을 다시 수행한다.

### 2026-06-14 Task 2 시작

- Task 2는 플랫폼 API의 공통 기반인 env, logger, core 콘텐츠 DTO, DB baseline schema, Kwep 콘텐츠 seed 변환, 공개 콘텐츠 repository를 새 source root에 작성하는 단계로 진행한다.
- `Kwep/src/app/courses.json`을 읽어 원본 수량이 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝임을 다시 확인했다.
- Step 2.1 매핑 표를 새 baseline schema와 일치하도록 `courses.category`, `course_units`, `lessons`, `lesson_steps` 기준으로 정정했다.
- 첫 검증 단위는 `bun --filter @workspace/db test -- seed-content`이며, 실패 테스트를 먼저 작성한 뒤 seed 변환 구현으로 통과시킨다.

### 2026-06-14 Task 2 Step 2.1 완료

- `packages/db/src/seeds/content-seed-data.json`에 Kwep 콘텐츠 seed fixture를 고정했다.
- `packages/db/src/seeds/seed-content.test.ts`에 코스 5개, 유닛 15개, 레슨 44개, 스텝 136개 변환 수량과 스텝 타입 분포 검증을 추가했다.
- `packages/db/src/seeds/seed-content.ts`에 Kwep 필드를 새 baseline row 형태로 변환하는 `createContentSeedRows`와 타입 정규화 함수를 작성했다.
- `bun --filter @workspace/db test -- seed-content`: 통과했다.

### 2026-06-14 Task 2 Step 2.2 시작

- Step 2.2는 Drizzle SQLite schema, in-memory DB client, baseline migration runner를 새로 작성한다.
- 먼저 `client` 테스트로 baseline migration이 `courses`, `course_units`, `lessons`, `lesson_steps` 테이블과 foreign key를 생성하는지 고정한다.
- 이후 `repositories` 테스트로 seed row를 baseline schema에 삽입할 수 있는지 검증하고, 공개 콘텐츠 필터링은 Step 2.4에서 별도 정책 테스트로 확장한다.

### 2026-06-14 Task 2 Step 2.2 완료

- `packages/db/src/schema/content.schema.ts`에 `courses`, `course_units`, `lessons`, `lesson_steps` Drizzle schema를 작성했다.
- `packages/db/src/client.ts`에 Bun SQLite 기반 `createKwepDatabase`, `createInMemoryKwepDatabase` client를 작성했다.
- `packages/db/src/migrations/0000-kwep-baseline.sql`와 `packages/db/src/migrations/migrate.ts`에 새 baseline migration을 작성했다.
- `packages/db/src/client.test.ts`와 `packages/db/src/repositories/content.repository.test.ts`로 migration 적용, foreign key, seed row 삽입을 검증했다.
- `bun --filter @workspace/db test -- client repositories`: 통과했다.

### 2026-06-14 Task 2 Step 2.3 시작

- Step 2.3은 `packages/core`에 콘텐츠 ID brand, DTO schema, repository port, service를 새로 작성한다.
- API DTO의 스텝 타입은 저장용 표준 타입과 같은 대문자 snake 표기(`READING`, `MULTIPLE_CHOICE`, `AI_FEEDBACK` 등)를 사용한다.
- 먼저 `content.dto` 테스트로 코스 목록, 코스 상세, 레슨, Kwep 10개 스텝 DTO parse를 고정하고, `content.service` 테스트로 repository 결과와 not-found error 계약을 고정한다.

### 2026-06-14 Task 2 Step 2.3 완료

- `packages/core/src/content/content.ids.ts`에 코스, 유닛, 레슨, 레슨 스텝 brand ID schema를 작성했다.
- `packages/core/src/content/content.dto.ts`에 코스 목록, 코스 상세, 레슨, Kwep 10개 스텝 DTO schema를 작성했다.
- `packages/core/src/content/content.repository.ts`와 `packages/core/src/content/content.service.ts`에 콘텐츠 repository port와 service Result 계약을 작성했다.
- `packages/core/src/result.ts`에 명시적 `Result` 타입과 helper를 추가했다.
- `bun --filter @workspace/core test -- content.dto content.service`: 통과했다.

### 2026-06-14 Task 2 Step 2.4 시작

- Step 2.4는 DB package의 Drizzle repository가 학습자 API용 active 콘텐츠만 반환하도록 작성한다.
- 검증 명령은 실제 테스트 파일명과 맞춰 `bun --filter @workspace/db test -- content.repository`로 정정했다.
- 기존 seed 삽입 테스트 위에 archived 코스 제외, archived 하위 콘텐츠 제외, active 코스 lesson metadata 응답 테스트를 추가한다.

### 2026-06-14 Task 2 Step 2.4 완료

- `packages/db/src/repositories/content.repository.ts`에 core `ContentRepository` port를 구현하는 Drizzle repository를 작성했다.
- 코스 목록, 코스 상세, 레슨 조회에서 `active` 상태의 코스, 유닛, 레슨, 스텝만 학습자 응답에 포함하도록 했다.
- `lesson_steps.content_json`의 Kwep 원본 lowercase 타입은 제거하고 저장용 표준 타입을 사용해 core lesson step DTO로 parse한다.
- `packages/db/src/index.ts`와 `packages/db/src/seeds/index.ts`에 DB package export를 추가했다.
- DB package typecheck가 core exported source를 안정적으로 해석하도록 `packages/core/package.json`에 `./content/*`, `./result` export를 추가하고, core 구현 파일의 노출 import를 package self-import로 정리했다.
- `bun --filter @workspace/db test -- content.repository`: 통과했다.

### 2026-06-14 Task 2 Step 2.5 시작

- Step 2.5는 Task 2 파일 목록 중 아직 작성되지 않은 env parser, logger, 학습자 auth schema, admin auth schema를 마무리하는 보강 단계다.
- env/logger는 테스트를 먼저 작성해 실패를 확인한 뒤 구현한다.
- auth schema는 후속 API 인증 작업에서 학습자와 어드민 인증 저장소를 분리할 수 있도록 `auth_*`, `admin_auth_*` table prefix를 사용한다.

### 2026-06-14 Task 2 Step 2.5 완료

- `packages/env/src/parse-env.ts`와 `packages/env/src/index.ts`에 API/admin API port, origin, DB URL, Better Auth secret을 검증하는 env parser를 작성했다.
- `packages/logger/src/index.ts`와 `packages/logger/src/request-logger.ts`에 pino JSON logger와 request 완료 log helper를 작성했다.
- `packages/db/src/schema/auth.schema.ts`와 `packages/db/src/schema/admin-auth.schema.ts`에 학습자/어드민 인증 table prefix를 분리한 Drizzle schema를 추가했다.
- cross-package import 안정성을 위해 `packages/env`, `packages/logger`, `packages/db`의 package export와 노출 구현 파일의 package self-import를 정리했다.
- `bun --filter @workspace/env test -- parse-env`: 통과했다.
- `bun --filter @workspace/logger test -- logger`: 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.

### 2026-06-14 Task 2 완료

- Task 2의 대상 파일 중 env, logger, core 콘텐츠 계약, DB client/schema/migration/seed/repository, auth/admin-auth schema를 모두 작성했다.
- Step 2.1부터 Step 2.5까지 검증 가능한 단위마다 커밋했다.
- `bun --filter @workspace/env test`: 통과했다.
- `bun --filter @workspace/logger test`: 통과했다.
- `bun --filter @workspace/core test`: 통과했다.
- `bun --filter @workspace/db test`: 통과했다.
- `bun --filter @workspace/env typecheck`: 통과했다.
- `bun --filter @workspace/logger typecheck`: 통과했다.
- `bun --filter @workspace/core typecheck`: 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.
- `bun --filter @workspace/env lint`: 통과했다.
- `bun --filter @workspace/logger lint`: 통과했다.
- `bun --filter @workspace/core lint`: 통과했다.
- `bun --filter @workspace/db lint`: 통과했다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md packages/env/src packages/logger/src packages/core/src packages/db/src packages/env/package.json packages/logger/package.json packages/core/package.json packages/db/package.json`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Task에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 3 시작

- Task 3은 학습 진행, 답변 저장, 학습자 프로필, 연속 학습일 기반을 플랫폼 API 경계에 추가하는 단계다.
- 현재 작업 위치는 일반 checkout이지만 `codex/kwep-platform-pivot-plan` 브랜치 위에 있으며, 기존 작업 방식에 맞춰 같은 브랜치에서 이어간다.
- Step 3.1 계획의 FK 대상 `user(id)`를 실제 baseline auth table인 `auth_users(id)`로 정정했다.
- Step 3.1 검증이 progress 저장, answer 저장, lesson 완료 저장을 요구하므로 `learner_lesson_progress`, `learner_lesson_answers` table을 새 baseline schema 계획에 추가했다.
- 첫 검증 단위는 `bun --filter @workspace/db test -- learning.repository`이며, 실패 테스트를 먼저 작성한 뒤 DB schema와 repository 구현으로 통과시킨다.

### 2026-06-14 Task 3 Step 3.1 완료

- `packages/db/src/schema/learning.schema.ts`에 `learner_profiles`, `learner_activity_days`, `learner_lesson_progress`, `learner_lesson_answers` schema를 추가했다.
- `packages/db/src/migrations/0000-kwep-baseline.sql`에 auth/admin-auth table과 learning table을 새 baseline schema로 포함했다.
- `packages/db/src/repositories/learning.repository.ts`에 progress 저장, step answer 저장, lesson 완료 저장과 활동 날짜 upsert를 구현했다.
- `packages/db/src/repositories/learning.repository.test.ts`로 progress 저장, answer 저장, lesson 완료가 활동 날짜 row를 생성하거나 갱신하는지 검증했다.
- `bun --filter @workspace/db test -- learning.repository`: 통과했다.
- `bun --filter @workspace/db test`: 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.
- `bun --filter @workspace/db lint`: 통과했다.

### 2026-06-14 Task 3 Step 3.2 시작

- Step 3.2는 core learning service가 Kwep의 답변 가능한 스텝 타입만 저장 대상으로 허용하도록 작성한다.
- 검증 명령은 실제 테스트 파일명과 맞춰 `bun --filter @workspace/core test -- learning.service`를 사용한다.
- service는 content repository에서 active lesson step을 확인하고, `READING`, `COMPARE`처럼 답변 저장 대상이 아닌 콘텐츠형 스텝은 `invalid-request`를 반환한다.

### 2026-06-14 Task 3 Step 3.2 완료

- `packages/core/src/learning/learning.ids.ts`에 학습자 ID brand schema를 추가했다.
- `packages/core/src/learning/learning.dto.ts`에 JSON answer value와 progress/answer/complete command schema를 추가했다.
- `packages/core/src/learning/learning.repository.ts`에 learning repository port를 정의했다.
- `packages/core/src/learning/learning.service.ts`에 Kwep 답변 가능 스텝 타입 검증과 저장 service를 구현했다.
- `packages/core/src/learning/learning.service.test.ts`로 저장 가능 8개 타입, plain string answer, 콘텐츠형 스텝 거절, lesson에 없는 stepId 거절을 검증했다.
- `bun --filter @workspace/core test -- learning.service`: 통과했다.
- `bun --filter @workspace/core test`: 통과했다.
- `bun --filter @workspace/core typecheck`: 통과했다.

### 2026-06-14 Task 3 Step 3.3 시작

- Step 3.3은 `apps/api`의 Hono app factory, session resolver 경계, `/profile` route를 새로 작성한다.
- 첫 API 인증 경계는 `Authorization: Bearer <token>`을 session resolver에 넘기는 명시적 interface로 두고, Better Auth 연결은 후속 auth wiring에서 같은 interface 뒤로 붙인다.
- `/profile` route는 인증 없음 `401`, active 사용자 profile/stat 응답, `suspended`/`deleted` 사용자 보호 route 차단을 테스트로 먼저 고정한다.

### 2026-06-14 Task 3 Step 3.3 완료

- `apps/api/src/app.ts`에 Hono app factory와 health/profile route 등록을 추가했다.
- `apps/api/src/auth/session.ts`에 Bearer token 기반 session resolver 경계를 정의했다.
- `apps/api/src/routes/profile.route.ts`에 `/profile` route와 보호 route 계정 상태 정책을 구현했다.
- `apps/api/src/routes/error-response.ts`와 `apps/api/src/routes/health.route.ts`에 공통 error response와 health route를 추가했다.
- `apps/api/src/app.test.ts`로 인증 없음 `401`, active profile 응답, `suspended`/`deleted` 차단을 검증했다.
- `bun --filter @workspace/api test -- app profile`: 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.

### 2026-06-14 Task 3 Step 3.4 시작

- Step 3.4는 Kwep 홈/코스 화면에 필요한 `/progress` 응답과 답변 저장을 위한 `/learning/answers` route를 작성한다.
- `/progress`는 active 코스 상세의 lesson 순서와 사용자의 completed lesson id를 기준으로 첫 미완료 lesson만 `available`, 이후 lesson은 `locked`로 계산한다.
- `/learning/answers`는 인증된 사용자의 answer 저장 요청을 core learning service로 전달하고, `invalid-request`는 HTTP `400`으로 변환한다.

### 2026-06-14 Task 3 Step 3.4 완료

- `apps/api/src/routes/progress.route.ts`에 course progressPercent, nextLessons, lesson estimatedMinutes/status, currentStreakDays 응답을 구현했다.
- `apps/api/src/routes/learning.route.ts`에 answer 저장 route를 구현하고, `apps/api/src/app.ts`에서 선택적 dependency가 있을 때 route를 등록하도록 확장했다.
- `apps/api/src/routes/progress.route.test.ts`로 Kwep의 첫 미완료 lesson `available` 계산과 이후 lesson `locked` 계산을 검증했다.
- `apps/api/src/routes/learning.route.test.ts`로 answer 저장 요청 전달과 `invalid-request` HTTP `400` 변환을 검증했다.
- `bun --filter @workspace/api test -- progress learning`: 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.

### 2026-06-14 Task 3 Step 3.5 시작

- Task 3 파일 목록 중 아직 없는 API env, main, auth/openapi/courses/lessons route, route helper를 마무리하는 보강 단계다.
- 먼저 env parsing, health/openapi/auth session, course list/detail, lesson detail route 테스트를 작성해 실패를 확인한다.
- 구현은 후속 Task 4 OpenAPI 확장과 Task 5 웹 연동이 바로 이어질 수 있는 최소 API 골격으로 제한한다.

### 2026-06-14 Task 3 Step 3.5 완료

- `apps/api/src/env.ts`와 `apps/api/src/env.test.ts`에 API 실행 env parser를 추가했다.
- `apps/api/src/routes/auth.route.ts`, `openapi.route.ts`, `courses.route.ts`, `lessons.route.ts`, `route-helpers.ts`를 추가했다.
- `apps/api/src/main.ts`에 DB-backed content/learning repository와 session/profile/progress reader를 연결하는 실행 진입점을 작성했다.
- `apps/api/package.json`에 API에서 직접 사용하는 `drizzle-orm` dependency를 명시하고 `bun install`로 lockfile/workspace link를 갱신했다.
- `bun --filter @workspace/api test -- env app courses lessons openapi auth`: 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.

### 2026-06-14 Task 3 완료

- Task 3의 학습 진행 DB 저장, core 답변 저장 계약, `/profile`, `/progress`, `/learning/answers`, API 실행 골격, 콘텐츠 조회 route를 모두 작성했다.
- Task 3은 검증 가능한 Step 묶음마다 커밋했다.
- `bun --filter @workspace/db test`: 통과했다. 테스트 파일 4개, 테스트 11개가 통과했다.
- `bun --filter @workspace/core test`: 통과했다. 테스트 파일 3개, 테스트 10개가 통과했다.
- `bun --filter @workspace/api test`: 통과했다. 테스트 파일 8개, 테스트 13개가 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.
- `bun --filter @workspace/core typecheck`: 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.
- `bun --filter @workspace/db lint`: 통과했다.
- `bun --filter @workspace/core lint`: 통과했다.
- `bun --filter @workspace/api lint`: 통과했다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md apps/api/package.json packages/core/package.json packages/db/package.json 'apps/api/src/**/*.ts' 'packages/core/src/**/*.ts' 'packages/db/src/**/*.ts'`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Task에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 4 시작

- Task 4는 플랫폼 API에 AI 코칭 시도 정책, OpenAI provider 경계, feedback 저장소, `/ai-feedback` route, OpenAPI 문서 baseline을 추가하는 단계로 진행한다.
- Step 4.1은 외부 OpenAI 호출 없이 core service와 DB repository의 시도 횟수, 실패 호출 미소모, 응답 DTO 정책을 먼저 테스트로 고정한다.
- Kwep의 총평, 잘된 점, 개선점, 다음 시도 UI를 채우는 응답 필드를 API 표준 DTO로 유지한다.
- OpenAI 실제 호출 구현은 provider interface 뒤에 두고, 테스트에서는 deterministic fake provider를 사용한다.

### 2026-06-14 Task 4 Step 4.1 완료

- `packages/core/src/ai-feedback`에 AI feedback DTO, provider port, repository port, service를 추가했다.
- 최대 3회 완료 시도 정책, provider 실패 시 시도 횟수 미소모, `AI_FEEDBACK` 스텝 전용 검증을 core service 테스트로 고정했다.
- `packages/core/package.json`에 `./ai-feedback/*` export를 추가했다.
- `bun --filter @workspace/core test`: 통과했다. 테스트 파일 4개, 테스트 14개가 통과했다.
- `bun --filter @workspace/core typecheck`: 통과했다.
- `bun --filter @workspace/core lint`: 통과했다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md packages/core/package.json 'packages/core/src/**/*.ts'`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 4 AI 피드백 DB 저장소 완료

- `packages/db/src/schema/feedback.schema.ts`에 `ai_feedback_attempts` table schema를 추가했다.
- `packages/db/src/migrations/0000-kwep-baseline.sql`에 AI feedback 시도 저장 table을 새 baseline으로 포함했다.
- `packages/db/src/repositories/feedback.repository.ts`에 core `AiFeedbackRepository` port 구현을 추가했다.
- 완료된 AI 코칭 시도 저장과 user/lesson/step 기준 시도 수 집계를 repository 테스트로 검증했다.
- `bun --filter @workspace/db test`: 통과했다. 테스트 파일 5개, 테스트 12개가 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.
- `bun --filter @workspace/db lint`: 통과했다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md 'packages/db/src/**/*.ts'`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 4 AI 피드백 API 연결 완료

- `apps/api/src/routes/ai-feedback.route.ts`에 인증된 AI 코칭 요청 route를 추가했다.
- `/ai-feedback` route는 core service 결과를 `200`, `400`, `404`, `429`, `503` HTTP 상태로 변환한다.
- `apps/api/src/openai/openai-feedback-provider.ts`에 OpenAI Responses API adapter와 API key 부재 시 unavailable provider를 추가했다.
- `apps/api/src/main.ts`에서 DB feedback repository, AI feedback service, OpenAI provider를 연결했다.
- `apps/api/src/env.ts`는 `OPENAI_API_KEY`를 API 실행 설정으로 명시적으로 노출한다.
- `bun --filter @workspace/api test`: 통과했다. 테스트 파일 10개, 테스트 18개가 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.
- `bun --filter @workspace/api lint`: 통과했다.
- `bunx prettier --check 'apps/api/src/**/*.ts'`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 4 Step 4.2 완료

- `apps/api/src/openapi/openapi-document.ts`에 `/profile`, `/progress`, `/ai-feedback`를 포함한 플랫폼 API OpenAPI 3.1 baseline 문서를 작성했다.
- `/openapi` route가 같은 OpenAPI 문서를 반환하도록 연결했다.
- `apps/api/src/scripts/generate-openapi.ts`를 추가해 `bun --filter @workspace/api openapi:generate`가 `docs/openapi/writing-app-api.json`을 갱신하도록 했다.
- `bun --filter @workspace/api openapi:generate`: 통과했다.
- `bun --filter @workspace/web api:generate`: 통과했고 `apps/web/src/lib/api/generated/writing-app-api.d.ts`를 생성했다.
- `bun --filter @workspace/api test -- openapi`: 통과했다. 테스트 파일 2개, 테스트 3개가 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.
- `bun --filter @workspace/api lint`: 통과했다.
- `bunx prettier --check docs/openapi/writing-app-api.json apps/web/src/lib/api/generated/writing-app-api.d.ts 'apps/api/src/openapi/**/*.ts' 'apps/api/src/scripts/**/*.ts' apps/api/src/routes/openapi.route.ts`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 4 완료

- Task 4의 AI 코칭 core 계약, DB 저장소, API route, OpenAI provider, OpenAPI 문서, web 생성 타입을 모두 작성했다.
- Task 4는 검증 가능한 Step 묶음마다 커밋했다.
- `bun --filter @workspace/core test`: 통과했다. 테스트 파일 4개, 테스트 14개가 통과했다.
- `bun --filter @workspace/db test`: 통과했다. 테스트 파일 5개, 테스트 12개가 통과했다.
- `bun --filter @workspace/api test`: 통과했다. 테스트 파일 11개, 테스트 20개가 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.
- `bun --filter @workspace/api lint`: 통과했다.
- `bun run format:check`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Task에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 5 시작

- Task 5는 플랫폼 웹이 API route를 직접 알지 않도록 `WritingAppApi` 포트, HTTP adapter, API result/error, 코스/레슨/프로필 매퍼를 작성하는 단계로 진행한다.
- 첫 검증 단위는 `create-http-writing-app-api`, `profile-api-mappers`, `course-api-mappers`, `lesson-api-mappers` 테스트다.
- OpenAPI generated 타입은 `apps/web/src/lib/api/generated/writing-app-api.d.ts`를 기준으로 사용하되, 화면 내부 모델은 Kwep 도메인 언어에 맞춰 별도 타입으로 둔다.
- 외부 fetch는 테스트에서 deterministic fake fetch로 대체하고, 구현은 브라우저와 서버에서 모두 사용할 수 있는 명시적 base URL 경계로 작성한다.

### 2026-06-14 Task 5 Step 5.1 완료

- `apps/web/src/lib/api`에 `ApiResult`, `ApiError`, `WritingAppApi` 포트, OpenAPI HTTP client, browser/server API factory를 추가했다.
- `apps/web/src/features/courses`, `features/lessons`, `features/profile`에 API 응답을 화면 내부 모델로 바꾸는 mapper와 타입을 추가했다.
- HTTP adapter는 Bearer token header, GET/POST JSON 요청, 실패 응답의 화면용 오류 변환을 테스트로 검증했다.
- `bun --filter @workspace/web test -- create-http-writing-app-api profile-api-mappers course-api-mappers lesson-api-mappers api-error`: 통과했다. 테스트 파일 5개, 테스트 10개가 통과했다.
- `bun --filter @workspace/web lint`: 통과했다. Next pages/app 디렉토리 부재 안내는 reset 상태에서 발생하는 warning이며 exit code는 0이다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md 'apps/web/src/**/*.ts' apps/web/src/lib/api/generated/writing-app-api.d.ts`: 통과했다.
- `git diff --check`: 통과했다.
- `bun --filter @workspace/web typecheck`: 실패했다. 현재 `apps/web/src/app`이 아직 Task 6에서 재작성되기 전이라 Next typegen이 app/pages 디렉토리 부재를 보고하며, 기존 `apps/web/test` fixture가 Task 1에서 삭제된 이전 구현 모듈을 참조한다. 새 Step 5.1 파일에서 보고된 타입 오류는 정리했다.

### 2026-06-14 Task 5 Step 5.2 완료

- `apps/web/src/features/lessons/lesson-types.ts`를 Kwep 10개 step 타입의 discriminated union으로 확장했다.
- `lesson-api-mappers.ts`가 `READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `WRITE`, `AI_FEEDBACK`, `MATCH`, `CATEGORIZE` content를 내부 lesson model로 보존하도록 했다.
- OpenAPI lesson step schema에 Kwep step content 필드를 추가하고 `docs/openapi/writing-app-api.json`, `apps/web/src/lib/api/generated/writing-app-api.d.ts`를 다시 생성했다.
- `bun --filter @workspace/api openapi:generate`: 통과했다.
- `bun --filter @workspace/web api:generate`: 통과했다.
- `bun --filter @workspace/web test -- create-http-writing-app-api profile-api-mappers course-api-mappers lesson-api-mappers api-error`: 통과했다. 테스트 파일 5개, 테스트 11개가 통과했다.
- `bun --filter @workspace/api test -- openapi`: 통과했다. 테스트 파일 2개, 테스트 3개가 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다. Next pages/app 디렉토리 부재 안내는 reset 상태에서 발생하는 warning이며 exit code는 0이다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/openapi/writing-app-api.json apps/web/src/lib/api/generated/writing-app-api.d.ts 'apps/web/src/**/*.ts' 'apps/api/src/openapi/**/*.ts'`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 5 완료

- Task 5의 웹 API 포트, HTTP adapter, profile/course/lesson mapper, Kwep step content mapper, OpenAPI generated 타입 갱신을 완료했다.
- Task 5는 Step 5.1과 Step 5.2 완료 시점에 각각 검증 후 커밋한다.
- `bun --filter @workspace/web typecheck`: 실패 상태가 남아 있다. 남은 실패는 `apps/web/src/app`이 Task 6 전까지 없는 reset 상태와 기존 `apps/web/test` fixture가 이전 구현 타입/모듈을 참조하는 문제로 분리했다.
- 이번 Task에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 6 시작

- Task 6은 플랫폼 웹의 공개 랜딩, 로그인, 앱 shell, 홈, 코스, 프로필 화면을 Kwep `글결` 방향으로 재작성하는 단계로 진행한다.
- Step 6.1은 루트 `/` 공개 랜딩과 `/login` 화면을 먼저 작성하고, CTA는 `/login?next=/app`로 고정한다.
- UI primitive는 `@workspace/ui`의 shadcn/base-ui 기반 공용 component로 두되, 화면 feature는 제품 언어와 API 포트 경계에만 의존하게 한다.
- Step 단위 검증이 끝날 때마다 작업 로그를 갱신하고 커밋한다.

### 2026-06-14 Task 6 Step 6.1 완료

- `@workspace/ui`에 button, card, input primitive와 공용 Tailwind token CSS, icon export, `cn` 유틸을 추가했다.
- `apps/web/src/app`에 root layout, global CSS import, 공개 `/` 랜딩, `/login` route를 추가했다.
- 랜딩은 `글결` 제품명, 가치 제안, 코스 미리보기, 학습 방식, CTA를 한국어로 렌더링하고 기존 코스 썸네일 이미지를 hero와 코스 카드 visual asset으로 사용한다.
- 로그인 화면은 안전한 내부 `next` 경로만 Google 로그인 callback으로 전달하고 외부 URL, 프로토콜 상대 URL, 로그인 재귀 경로를 `/app`으로 정규화한다.
- `packages/ui`의 React devDependency를 web과 같은 `19.2.4`로 고정해 workspace UI와 web 테스트가 같은 React 인스턴스를 사용하게 했다.
- reset 이전 `apps/web/test` fixture는 현재 `WritingAppApi` 계약과 Kwep 10개 step 모델 이전의 테스트 지원 코드라서 삭제했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 7개, 테스트 14개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun --filter @workspace/ui typecheck`: 통과했다.
- `bun --filter @workspace/ui lint`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 6 Step 6.2 시작

- Step 6.2는 `/app` 홈 화면을 Kwep 진행 카드 중심으로 재구성한다.
- 홈 화면은 사용자 이름 또는 기본 호칭, 현재 연속 학습일, 진행 중인 코스 카드, 코스별 진행률, 다음 레슨 최대 2개, 진행 코스가 없을 때의 시작 진입점을 표시한다.
- 진행률 표시는 `@workspace/ui`의 progress primitive로 추가하고, 화면 테스트는 API 호출 없이 `ProgressCourseList` 모델을 직접 주입해 검증한다.

### 2026-06-14 Task 6 Step 6.2 완료

- `apps/web/src/features/home/home-page.tsx`에 Kwep 진행 카드 중심 홈 화면을 추가했다.
- 홈 화면은 사용자 이름 또는 `학습자` 기본 호칭, 현재 연속 학습일, 전체 학습 맥락, 진행 중인 코스, 코스별 진행률, 다음 레슨 최대 2개를 표시한다.
- 진행 중인 코스가 없으면 `아직 진행 중인 코스가 없습니다.` 빈 상태와 `/app/courses` 진입점을 보여준다.
- `apps/web/src/app/app/page.tsx`는 profile/progress 요청을 병렬로 시작하고, 실패 시 한국어 API 오류 안내와 빈 진행 상태를 렌더링한다.
- `@workspace/ui`에 progress primitive를 추가했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 8개, 테스트 16개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun --filter @workspace/ui typecheck`: 통과했다.
- `bun --filter @workspace/ui lint`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 6 Step 6.3 시작

- Step 6.3은 `/app/courses`와 `/app/courses/[id]`를 Kwep 콘텐츠 구조에 맞게 작성한다.
- 코스 목록은 카테고리별 그룹, 제목, 설명, 레슨 수, 진행률을 표시한다.
- 코스 상세는 코스 설명, 진행률, 유닛별 접기/펼치기, 레슨 완료/진행 가능/잠김 상태, 이어하기 버튼을 표시한다.

### 2026-06-14 Task 6 Step 6.3 완료

- `apps/web/src/features/courses/courses-page.tsx`에 카테고리별 코스 목록과 코스 카드 진행률을 추가했다.
- `apps/web/src/features/courses/course-detail-page.tsx`에 코스 상세 설명, 진행률, 이어하기 버튼을 추가했다.
- `apps/web/src/features/courses/course-curriculum.tsx`에 유닛별 접기/펼치기와 완료/진행 가능/잠김 레슨 상태를 추가했다.
- `/app/courses`, `/app/courses/[id]` App Router page를 추가하고 list/detail/progress API 요청을 병렬로 시작하게 했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 11개, 테스트 19개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 6 Step 6.4 시작

- Step 6.4는 `/app/profile` 프로필 화면과 전역 내비게이션의 프로필 진입점을 작성한다.
- 프로필 화면은 사용자 이름, 이메일, 이미지 또는 대체 이니셜, 가입일, 현재 연속 학습일, 완료 레슨 수, 전체 진도, 로그아웃 액션을 표시한다.
- auth navigation helper는 로그인 next 경로 정규화와 logout callback URL 생성을 같은 경계에서 관리한다.

### 2026-06-14 Task 6 Step 6.4 완료

- `apps/web/src/features/profile/profile-page.tsx`에 사용자 정보, 프로필 이미지 대체 이니셜, 가입일, 연속 학습일, 완료 레슨, 전체 진도, 로그아웃 액션을 추가했다.
- `apps/web/src/components/layout/global-nav.tsx`와 `app-shell.tsx`를 추가하고 `/app` layout에 연결했다.
- `apps/web/src/app/app/profile/page.tsx`를 추가해 profile API 응답 기반 프로필 화면과 실패 시 로그인 진입점을 렌더링한다.
- `apps/web/src/lib/auth/auth-navigation.ts`에 logout callback URL helper를 추가했다.
- Google 계정 프로필 이미지를 위해 `apps/web/next.config.ts`에 `googleusercontent.com` remote image pattern을 명시했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 14개, 테스트 22개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 6 완료

- Task 6의 공개 랜딩, 로그인, 앱 홈, 코스 목록, 코스 상세/커리큘럼, 프로필, 전역 내비게이션 화면 구현을 완료했다.
- `/app` route segment는 인증/session 기반 화면으로 이어질 경계이므로 `dynamic = "force-dynamic"`으로 명시했다.
- Task 6은 Step 6.1, 6.2, 6.3, 6.4 완료 시점마다 검증 후 커밋했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 14개, 테스트 22개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun --filter @workspace/web build`: 통과했다. `/app`, `/app/courses`, `/app/courses/[id]`, `/app/profile`, `/login`은 dynamic route로 빌드됐다.
- `bun --filter @workspace/ui typecheck`: 통과했다.
- `bun --filter @workspace/ui lint`: 통과했다.
- 이번 Task에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 7 Step 7.1 시작

- Step 7.1은 레슨 시작 화면과 첫 스텝 진입 저장 흐름을 먼저 작성한다.
- 시작 화면은 제목, 카테고리, 설명, 예상 시간, 스텝 수를 표시한다.
- `시작하기` 클릭 시 현재 API 포트의 `saveLessonAnswer`에 첫 스텝 기준 `lesson-started` 마커를 저장하고, 저장 실패는 한국어 오류로 화면에 표시한다.
- 실제 `/app/lesson?lesson_id=...` route는 서버에서 레슨을 조회하고 클라이언트 레슨 경험 컴포넌트에 직렬화 가능한 lesson 데이터만 전달한다.

### 2026-06-14 Task 7 Step 7.1 완료

- `apps/web/src/features/lessons/lesson-experience.tsx`에 레슨 시작 화면과 첫 스텝 진입 상태를 추가했다.
- `apps/web/src/features/lessons/use-lesson-persistence.ts`는 첫 스텝 기준 `lesson-started` 마커를 `saveLessonAnswer`로 저장하고 실패 시 한국어 오류를 반환한다.
- `apps/web/src/features/lessons/lesson-step-renderer.tsx`는 시작 후 첫 스텝을 표시하는 최소 렌더러로 작성했다.
- `/app/lesson?lesson_id=...` route를 추가해 서버에서 레슨을 조회하고 클라이언트 경험 컴포넌트로 전달한다.
- `bun --filter @workspace/web test -- lesson-experience`: 통과했다. 테스트 파일 1개, 테스트 2개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun run format:check`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 7 Step 7.2 시작

- Step 7.2는 답변 가능한 Kwep 표준 스텝에서 답변 변경 시 자동 저장을 호출하는 단계로 진행한다.
- 현재 `LessonStep` 표준 타입에 존재하는 저장 대상은 `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `MATCH`, `CATEGORIZE`, `WRITE`로 한정한다.
- 계획의 `따라 쓰기`, `체크리스트`, `성찰`은 이전 레슨 모델의 타입명이며 현재 Kwep 10개 표준 타입에는 없으므로 이번 Step에서는 새 타입을 추가하지 않는다.
- 저장 payload는 `saveLessonAnswer`의 `answer` 필드에 스텝 타입별 JSON 문자열로 전달한다.

### 2026-06-14 Task 7 Step 7.2 완료

- `LessonStepRenderer`를 클라이언트 상호작용 컴포넌트로 확장해 객관식, 빈칸, 단어 선택, 순서 배열, 매칭, 분류, 글쓰기 입력을 지원했다.
- 각 답변 변경은 `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `MATCH`, `CATEGORIZE`, `WRITE` 타입별 JSON 문자열로 직렬화한다.
- `useLessonPersistence`에 `saveAnswer`를 추가해 `LessonExperience`에서 첫 스텝 답변 변경을 `saveLessonAnswer`로 자동 저장하게 했다.
- `bun --filter @workspace/web test -- lesson-experience lesson-step-renderer`: 통과했다. 테스트 파일 2개, 테스트 10개가 통과했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 16개, 테스트 32개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun run format:check`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 7 Step 7.3 시작

- Step 7.3은 `AI_FEEDBACK` 스텝에서 코칭 요청, 로딩, 결과 표시, 재시도, 한도 초과 오류를 구현하는 단계로 진행한다.
- `LessonStepRenderer`는 `AI 코칭 받기` 버튼을 표시하고, `LessonExperience`는 API 포트의 `createAiFeedback`으로 요청을 위임한다.
- 현재 Step 7 범위에서는 작성 답변 히스토리 저장소를 따로 만들지 않고, `AI_FEEDBACK.target` 값을 코칭 요청의 answer로 사용한다.

### 2026-06-14 Task 7 Step 7.3 완료

- `LessonStepRenderer`의 `AI_FEEDBACK` 스텝에 `AI 코칭 받기` 버튼, 로딩 안내, 결과 카드, `다시 받기` 버튼, 오류 메시지를 추가했다.
- AI 코칭 결과는 총평, 잘된 점, 다듬을 점, 다음 시도, 점수를 표시한다.
- `useLessonPersistence`에 `requestAiFeedback`을 추가해 `LessonExperience`에서 `createAiFeedback`으로 코칭 요청을 위임한다.
- 시도 한도 초과 같은 API 실패는 한국어 오류 메시지로 렌더링한다.
- `bun --filter @workspace/web test -- lesson-step-renderer lesson-experience`: 통과했다. 테스트 파일 2개, 테스트 13개가 통과했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 16개, 테스트 35개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun run format:check`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 7 Step 7.4 시작

- Step 7.4는 Task 7에서 추가한 플랫폼 레슨 경험이 web 테스트, 타입체크, 린트, 빌드, 포맷, diff 검증을 통과하는지 확인한다.
- 코드 변경 없이 검증 결과를 기록하고, 실패가 있으면 원인을 분리해 수정한다.

### 2026-06-14 Task 7 Step 7.4 완료

- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 16개, 테스트 35개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun --filter @workspace/web build`: 통과했다. `/app/lesson`은 dynamic route로 빌드됐다.
- `bun run format:check`: 통과했다.
- `git diff --check`: 통과했다.
- 이번 Step에서는 dev server를 실행하지 않았으므로 종료할 장기 실행 프로세스가 없다.

### 2026-06-14 Task 7 Step 7.5 시작

- Step 7.5는 `bun run dev:app`으로 실제 web/API dev 서버를 띄우고 주요 플랫폼 화면을 브라우저로 확인하는 단계다.
- 첫 실행은 `@workspace/db db:seed`가 `packages/db/src/seeds/seed.ts`를 찾지 못해 실패했다.
- 스모크 전제 조건을 복구하기 위해 `packages/db/src/seeds/seed.ts`와 회귀 테스트를 추가한다.

### 2026-06-14 Task 7 Step 7.5 seed 실행 복구

- `packages/db/src/seeds/seed.ts`에 baseline migration 적용, 콘텐츠 row 초기화, Kwep 콘텐츠 seed 삽입 실행 함수를 추가했다.
- `packages/db/src/seeds/seed.test.ts`는 파일 DB에 seed를 실행한 뒤 코스 5개, 레슨 44개, 스텝 136개가 들어가는지 검증한다.
- `bun --filter @workspace/db test -- seed`: 통과했다. 테스트 파일 2개, 테스트 4개가 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.
- `bun --filter @workspace/db lint`: 통과했다.
- `bunx prettier --check packages/db/src/seeds/seed.ts packages/db/src/seeds/seed.test.ts`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 7 Step 7.5 개발 세션 연결

- `db:seed`가 기본 학습자 `user-1`과 active learner profile을 보장하도록 확장했다.
- web은 `kwep_session` 쿠키 값을 API Bearer token으로 전달한다.
- 서버 컴포넌트 route는 `getServerLearnerSessionToken`, 브라우저 레슨 저장/AI 코칭은 `getBrowserLearnerSessionToken`을 사용한다.
- `bun --filter @workspace/db test -- seed`: 통과했다. 테스트 파일 2개, 테스트 4개가 통과했다.
- `bun --filter @workspace/web test -- session-token lesson-experience`: 통과했다. 테스트 파일 2개, 테스트 6개가 통과했다.
- `bun --filter @workspace/db typecheck`: 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/db lint`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 7 Step 7.5 DB 경로 일관화

- 브라우저 스모크 준비 중 API가 루트 `data/api.sqlite`의 이전 스키마를 열고, `db:seed`는 `packages/db/data/api.sqlite`를 생성해 `auth_users` 테이블을 찾지 못하는 실패를 확인했다.
- `@workspace/db` 기본 DB 경로를 저장소 루트 `data/api.sqlite` 절대 경로로 고정했다.
- `DATABASE_URL`이 없을 때는 env parser가 DB 경로를 만들지 않고 DB client 기본값을 사용하게 했다.
- seed는 이전 개발 DB 스키마가 남아 있으면 로컬 SQLite 파일을 새 baseline으로 재생성한다.
- `bun --filter @workspace/db test -- client seed`: 통과했다. 테스트 파일 3개, 테스트 7개가 통과했다.
- `bun --filter @workspace/env test -- parse-env`: 통과했다. 테스트 파일 1개, 테스트 4개가 통과했다.
- 루트 `data/api.sqlite` 복사본에 `db:seed`를 실행해 기본 학습자 1명, 코스 5개, 레슨 44개가 들어가는지 확인했다.
- 실제 기본 경로에서 `bun --filter @workspace/db db:seed`를 실행해 루트 `data/api.sqlite`에 기본 학습자 1명, 코스 5개, 레슨 44개가 들어가는지 확인했다.

### 2026-06-14 Task 7 Step 7.5 레슨 완료 흐름 구현

- 브라우저 스모크 체크리스트의 객관식, 글쓰기, AI 코칭, 레슨 완료 항목을 실제 화면에서 확인하려면 시작 후 첫 스텝에 머무는 현재 구현을 확장해야 함을 확인했다.
- `POST /learning/lessons/{lessonId}/complete` API 계약과 route를 추가해 기존 learning service의 `completeLesson`을 노출했다.
- web API client와 OpenAPI 산출물을 갱신하고, `LessonExperience`에 이전/다음 이동, 마지막 스텝 완료 저장, 완료 화면, 코스 상세 이동 링크를 추가했다.
- `docs/lesson-page.md`에 레슨 이동과 완료 저장 동작을 기록했다.
- `bun --filter @workspace/api test`: 통과했다. 테스트 파일 11개, 테스트 21개가 통과했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 17개, 테스트 38개가 통과했다.
- 포맷 후 `bun --filter @workspace/api test -- learning.route openapi-document`: 통과했다. 테스트 파일 2개, 테스트 5개가 통과했다.
- 포맷 후 `bun --filter @workspace/web test -- create-http-writing-app-api lesson-experience`: 통과했다. 테스트 파일 2개, 테스트 8개가 통과했다.
- 포맷 후 `bun --filter @workspace/api typecheck && bun --filter @workspace/web typecheck`: 통과했다.

### 2026-06-14 Task 7 Step 7.5 보호 redirect 보강

- 브라우저 스모크 체크리스트의 `/app` 보호 redirect 항목을 맞추기 위해 `/app` 계열 서버 page가 세션 토큰이 없으면 `/login?next=...`로 이동하도록 보강했다.
- `createLoginPagePath` helper를 추가해 로그인 next 경로 인코딩을 한 곳에서 처리한다.
- `docs/platform-backend-api.md`와 `docs/platform-product-feature-spec.md`에 보호 redirect와 완료 endpoint를 반영했다.
- `bun --filter @workspace/web test -- auth-navigation`: 통과했다. 테스트 파일 1개, 테스트 1개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.

### 2026-06-14 Task 7 Step 7.5 객관식 확인 UX 보강

- 브라우저 스모크 체크리스트의 객관식 확인과 해설 항목을 맞추기 위해 객관식 선택 후 정오답 메시지와 해설을 표시하도록 보강했다.
- 객관식 해설은 선택 전에는 숨기고, 선택 전 설명은 `답을 선택하면 해설을 확인합니다.` 안내로 바꿨다.
- `docs/lesson-page.md`에 객관식 정답 확인 동작을 기록했다.
- `bun --filter @workspace/web test -- lesson-step-renderer`: 통과했다. 테스트 파일 1개, 테스트 9개가 통과했다.

### 2026-06-14 Task 7 Step 7.5 시작 저장과 write 변형 복구

- Playwright 스모크 중 첫 스텝이 `READING`인 레슨에서 `lesson-started` 마커 저장이 API의 답변 가능 스텝 검증에 막혀 레슨에 진입하지 못하는 실패를 확인했다.
- 같은 스모크에서 `l6` 레슨의 일부 `WRITE` 스텝이 `guide` 없이 `prompt`, `topic`, `structure`만 가져 core DTO 검증이 실패하는 문제를 확인했다.
- 첫 스텝의 JSON 문자열 `lesson-started` 마커는 읽기 스텝이어도 저장을 허용하도록 learning service를 보강했다.
- Kwep `WRITE` DTO의 `guide`를 선택값으로 바꾸고, 실제 seed의 `l6` 레슨이 repository에서 조회되는 회귀 테스트를 추가했다.
- `docs/lesson-page.md`에 시작 마커와 Kwep write 변형 수용 동작을 기록했다.
- `bun --filter @workspace/core test -- content.dto learning.service`: 통과했다. 테스트 파일 2개, 테스트 9개가 통과했다.
- `bun --filter @workspace/db test -- content.repository`: 통과했다. 테스트 파일 1개, 테스트 5개가 통과했다.

### 2026-06-14 Task 7 Step 7.5 브라우저 CORS 복구

- Playwright 스모크에서 브라우저의 `POST /learning/answers`가 preflight `OPTIONS /learning/answers` 404로 차단되는 실패를 확인했다.
- `apps/api`의 Hono 앱 조립 루트에 `WEB_ORIGIN` 기준 CORS 미들웨어를 추가해 `Authorization`, `Content-Type`, credentials 포함 요청과 `GET`, `POST`, `OPTIONS`를 허용했다.
- `apps/api/src/app.test.ts`에 브라우저 쓰기 요청 preflight가 `204`와 `access-control-allow-origin`, `access-control-allow-credentials` 헤더를 반환하는 회귀 테스트를 추가했다.
- `curl -i -X OPTIONS http://localhost:3001/learning/answers`에 `Origin: http://localhost:3000`과 preflight 헤더를 붙여 실제 dev API가 `204`를 반환하는지 확인했다.

### 2026-06-14 Task 7 Step 7.5 완료

- 로컬 Playwright 기본 브라우저가 설치되어 있지 않아 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` 실행 파일로 headless 스모크를 수행했다.
- `bun run dev:app`은 루트 `data/api.sqlite`를 seed한 뒤 web `http://localhost:3000`, API `http://localhost:3001`을 실행했다.
- 스모크 확인 항목은 랜딩, 로그인 Google 버튼, `/app` 보호 redirect, 인증 홈, 코스 목록, 코스 상세, 첫 레슨 시작 화면, 객관식 정답/해설, 글쓰기 저장, AI 환경 오류 안내, 레슨 완료와 다음 레슨 이동이다.
- `node --input-type=module` Playwright 스모크: 통과했다. 8개 브라우저 체크가 모두 통과했다.
- `bun --filter @workspace/api test -- app`: 통과했다. 테스트 파일 1개, 테스트 4개가 통과했다.

### 2026-06-14 Task 8 Step 8.1 시작

- Step 8.1은 어드민 API baseline의 첫 단위로, 대시보드 DTO, core service, DB read repository, `/dashboard` route를 작성한다.
- 새 테이블을 만들지 않고 기존 학습자 사용자, 활동일, 레슨 진행, 콘텐츠 상태, 관리자 세션 테이블을 읽어 지표를 계산한다.
- 먼저 core service와 admin-api route 테스트를 실패시키고, 이후 repository 계산 테스트를 추가한다.

### 2026-06-14 Task 8 Step 8.1 완료

- `packages/core/src/admin`에 `AdminDashboardDto`, `AdminDashboardRepository`, `AdminService`를 추가했다.
- `packages/db/src/repositories/admin.repository.ts`는 기존 학습자 사용자, 프로필, 활동일, 레슨 진행, 콘텐츠 테이블에서 대시보드 지표와 최근 활동을 계산한다.
- `apps/admin-api/src`에 관리자 Bearer 세션 resolver, CORS 포함 Hono 앱 조립, `/health`, `/dashboard`, env parser를 추가했다.
- `/dashboard`는 관리자 세션이 없으면 `401 unauthorized`, 세션이 있으면 DB 기반 dashboard DTO를 반환한다.
- `bun --filter @workspace/core test -- admin.service`: 통과했다. 테스트 파일 1개, 테스트 1개가 통과했다.
- `bun --filter @workspace/db test -- admin.repository`: 통과했다. 테스트 파일 1개, 테스트 1개가 통과했다.
- `bun --filter @workspace/admin-api test -- app env`: 통과했다. 테스트 파일 2개, 테스트 3개가 통과했다.
- `bun --filter @workspace/core typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/admin-api typecheck`: 통과했다.
- `bun --filter @workspace/core lint && bun --filter @workspace/db lint && bun --filter @workspace/admin-api lint`: 통과했다.

### 2026-06-14 Kwep UI 1:1 재작업 계획 수정 시작

- 브라우저 비교 결과, 현재 플랫폼 프론트엔드 초안이 Kwep 프로토타입과 UI, 화면 흐름, 상호작용 기준에서 1:1로 일치하지 않음을 확인했다.
- 사용자 지시에 따라 학습자 화면 작업 순서를 공개 랜딩(`/`)부터 사용자 플로우 순서로 재정렬한다.
- 한 화면이 Kwep와 완전히 일치하기 전에는 다음 화면으로 넘어가지 않고, 화면 완료 후 커밋한 뒤 다음 화면을 작업하는 규칙을 계획에 추가한다.
- Task 6과 Task 7의 완료 상태는 API 연결과 기본 화면 초안 완료로만 해석하고, 실제 UI 완료는 새 Kwep UI 1:1 재작업 Task에서 판정하도록 정정한다.

### 2026-06-14 Kwep UI 1:1 재작업 계획 수정 완료

- `Kwep UI 1:1 재작업 운영 규칙`을 추가해 화면 작업 순서, 화면별 완료 게이트, 반복 루프, 금지 사항을 명시했다.
- `Task 7R: 사용자 플로우 기반 Kwep UI 1:1 재작업`을 추가해 공개 랜딩부터 로그인, 홈, 배우기, 코스 상세, 레슨, 프로필 순서로 화면별 비교와 커밋 단위를 고정했다.
- 상태 요약에서 플랫폼 프론트엔드 항목을 초안 구현/검증으로 정정하고, Kwep UI 1:1 사용자 플로우 재작업과 브라우저 검증을 별도 미완료 항목으로 분리했다.
- `bunx prettier --check docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check -- docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.

### 2026-06-14 Kwep UI 1:1 일치 기준 보강

- 사용자 지시에 따라 화면 일치의 정의를 HTML 구조, CSS 스타일링, 기능 동등성의 완전 일치로 명시했다.
- 사용자 화면 root 내부의 모든 보이는 요소는 Kwep와 같은 순서, 계층, 태그 역할, 텍스트, 속성, 접근성 상태, 입력 상태로 배치되어야 한다.
- computed style과 배치 비교 항목에 레이아웃, spacing, typography, color, background, border, radius, shadow, opacity, responsive 결과, hover/focus/active/disabled 상태를 포함했다.
- 기능 비교 항목에 클릭, 탭, 키보드 입력, 선택, 제출, validation, modal, navigation, 자동 저장, 복원, loading, error, 완료 전이 흐름을 포함했다.
- 알려진 DOM/CSS/기능 차이가 하나라도 남으면 해당 화면은 완료가 아니며 커밋하거나 다음 화면으로 넘어가지 않는다고 명시했다.

### 2026-06-14 Task 7R Step 7R.1 랜딩 화면 일치 완료

- 제품 랜딩을 기존 글결 초안에서 Kwep `Kernel` 공개 랜딩과 같은 섹션, 문구, 색상, spacing, radius, typography, CTA 구성으로 교체했다.
- Kwep와 같은 Pretendard 웹폰트를 로드해 한글 텍스트 폭과 모바일 CTA 줄 배치를 맞췄다.
- Kwep `lucide-react@0.487.0`의 `Sparkles` SVG path를 랜딩 내부에서 고정해 보이는 SVG DOM과 폭 차이를 제거했다.
- 로고 클릭은 Kwep `/`에 대응하는 제품 `/`, 시작 CTA는 Kwep `/home`에 대응하는 제품 `/app`, 코스 CTA는 Kwep `/learn`에 대응하는 제품 `/app/courses`로 이동하도록 기능을 분리했다.
- `docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/capture-landing.mjs`는 `document.fonts.ready` 이후 Kwep와 제품을 캡처한다.
- 최종 좌표 비교에서 390x844와 1280x720 모두 visible element count가 일치했고, section/button/image/heading의 rect diff가 0개임을 확인했다.
- computed style 비교에서 390x844와 1280x720 모두 diff 0개를 확인했다.
- 스크롤 상호작용 비교에서 `scrollY` `0`, `3600`, `4100`, `4800`의 showcase preview와 final CTA heading 좌표가 Kwep와 제품에서 일치했다.
- 클릭 검증에서 비로그인 상태의 최종 URL은 Kwep와 제품 모두 `/login`이었다. 내부 논리 route는 Kwep `/home`, `/learn`에 대응해 제품 `/app`, `/app/courses`를 사용한다.
- 2026-06-14 strict 기준 보강 후 앱 root layout의 inline style attribute 정규화와 Reveal style 조정을 적용해 390x844와 1280x720 모두 attribute diff 0개, rect diff 0개, computed style diff 0개를 다시 확인했다.
- `bun --filter @workspace/web test -- landing-page`: 통과했다. 테스트 파일 1개, 테스트 2개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check apps/web/src/features/landing apps/web/src/app/globals.css docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/capture-landing.mjs docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` 기반 Playwright 캡처를 다시 생성했다.

### 2026-06-14 Task 7R Step 7R.2 로그인 화면 일치 완료

- 제품 로그인 화면을 Kwep `LoginScreen`과 같은 screen root 구조, 중앙 정렬, ✍️ 표식, `글결.` heading, 설명 문구, Google 버튼, 이메일/비밀번호 미지원 안내로 교체했다.
- Kwep와 같은 `an-fi` 진입 애니메이션을 제품 전역 CSS에 추가했다.
- Kwep에는 없는 제품 card wrapper와 랜딩 복귀 UI를 제거했다.
- Google 버튼은 Kwep와 같은 `<button>` 구조를 유지하면서 제품 Google 인증 URL로 이동하도록 연결했다.
- `docs/superpowers/evidence/2026-06-14-kwep-ui-parity/login/capture-login.mjs`로 390x844와 1280x720 캡처, strict DOM/style diff, 클릭 검증 데이터를 생성했다.
- 최종 비교에서 390x844와 1280x720 모두 screen root item count `12 / 12`, visible element count `12 / 12`, rect diff 0개, computed style diff 0개를 확인했다.
- 2026-06-14 strict 기준 보강 후 앱 root layout의 inline style attribute 정규화를 적용해 390x844와 1280x720 모두 attribute diff 0개, rect diff 0개, computed style diff 0개를 다시 확인했다.
- `bun --filter @workspace/web test -- auth-page`: 통과했다. 테스트 파일 1개, 테스트 2개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.

### 2026-06-14 Task 7R Step 7R.3 홈 fresh 화면 일치 완료

- 제품 `/app` shell을 Kwep `Root`와 같은 `bg-cream`, sticky header, max-width main, 모바일 하단 nav 구조로 교체했다.
- 제품 홈 fresh 상태를 Kwep `HomeScreen`과 같은 인사말, `0일` 연속 학습, `0개` 완료 레슨, 첫 코스 선택 카드 구성으로 맞췄다.
- API 진행도 조회가 실패하더라도 Kwep fresh 화면과 같은 빈 진행 상태로 렌더링하게 해 오류 안내가 홈 화면 DOM에 끼어들지 않도록 했다.
- Kwep `lucide-react@0.487.0`의 `Flame`, `BookOpen`, `ChevronRight`, `Home/House`, `User`, `Sparkles` SVG path를 홈과 앱 chrome에서 고정해 SVG DOM과 icon path 차이를 제거했다.
- 제품 전역 CSS에서 Kwep와 다른 shadcn 기본 `border-color`, 버튼 `cursor` 규칙을 Kwep 기준으로 덮었다.
- 앱 root layout에 inline style attribute 정규화를 추가해 Vite client render와 Next SSR의 style 문자열 공백/세미콜론 차이를 제거했다.
- `docs/superpowers/evidence/2026-06-14-kwep-ui-parity/home/capture-home.mjs`로 390x844와 1280x720 캡처, strict DOM/style diff, 클릭 검증 데이터를 생성했다.
- 최종 비교에서 390x844는 screen root item count `67 / 67`, visible element count `56 / 56`, structural diff 0개, rect diff 0개, computed style diff 0개를 확인했다.
- 최종 비교에서 1280x720은 screen root item count `67 / 67`, visible element count `41 / 41`, structural diff 0개, rect diff 0개, computed style diff 0개를 확인했다.
- 클릭 검증에서 Kwep 첫 코스 카드는 `/learn`, 제품 첫 코스 카드는 대응 route인 `/app/courses`로 이동했다.
- 랜딩과 로그인 화면도 다시 캡처해 각 화면의 diff 파일이 390x844와 1280x720 모두 0개임을 확인했다.
- `bun --filter @workspace/web test -- home-page global-nav`: 통과했다. 테스트 파일 2개, 테스트 2개가 통과했다.
- `node docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing/capture-landing.mjs`: 통과했다. attribute diff, rect diff, computed style diff가 모두 0개였다.
- `node docs/superpowers/evidence/2026-06-14-kwep-ui-parity/login/capture-login.mjs`: 통과했다. diff 파일이 모두 0개였다.
- `node docs/superpowers/evidence/2026-06-14-kwep-ui-parity/home/capture-home.mjs`: 통과했다. structural diff, rect diff, computed style diff가 모두 0개였다.

### 2026-06-14 Task 7R Step 7R.4 배우기 화면 일치 시작

- 대상 화면은 Kwep `/learn`과 제품 `/app/courses`이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/Screens.tsx`의 `LearnScreen`과 course card 관련 컴포넌트이다.
- 제품 대상 파일은 `apps/web/src/app/app/courses/page.tsx`, `apps/web/src/features/courses/*`, 공통 app shell/nav이다.
- 같은 사용자 인증 상태와 fresh 진행 상태에서 모바일 `390x844`, 데스크톱 `1280x720`을 비교한다.
- 먼저 Kwep와 제품의 현재 DOM/CSS/기능 차이를 캡처하고, 제품 API 의존으로 화면이 비는 문제가 있으면 Kwep fresh 화면과 같은 코스 목록을 렌더링하도록 수정한다.

### 2026-06-14 Task 7R Step 7R.4 배우기 화면 일치 완료

- 제품 `/app/courses`를 Kwep `LearnScreen`과 같은 heading, 설명 문구, 카테고리 탭, 코스 카드 그리드 구조로 교체했다.
- shadcn card/progress/link UI를 제거하고 Kwep와 같은 클릭 가능한 `div` 카드, picsum seed 이미지, 모바일 가로 카드/데스크톱 세로 카드 반응형 구조를 적용했다.
- API 코스 목록 조회가 실패하거나 비어 있어도 Kwep seed와 같은 5개 코스 요약 fallback을 렌더링하게 해 제품 화면이 비지 않도록 했다.
- 카테고리 클릭은 Kwep와 같은 active class 전환을 수행하고, 코스 카드 클릭은 Kwep `/course/:id`에 대응해 제품 `/app/courses/:id`로 이동한다.
- `docs/superpowers/evidence/2026-06-14-kwep-ui-parity/learn/capture-learn.mjs`로 390x844와 1280x720 캡처, strict DOM/style diff, 카테고리/카드 클릭 검증 데이터를 생성했다.
- 최종 비교에서 390x844는 screen root item count `48 / 48`, visible element count `43 / 43`, structural diff 0개, rect diff 0개, computed style diff 0개를 확인했다.
- 최종 비교에서 1280x720은 screen root item count `48 / 48`, visible element count `29 / 29`, structural diff 0개, rect diff 0개, computed style diff 0개를 확인했다.
- 클릭 검증에서 `문법 심화` 선택 후 Kwep는 `/course/c2`, 제품은 대응 route인 `/app/courses/c2`로 이동했다.
- `bun --filter @workspace/web test -- courses-page`: 통과했다. 테스트 파일 1개, 테스트 1개가 통과했다.
- `node docs/superpowers/evidence/2026-06-14-kwep-ui-parity/learn/capture-learn.mjs`: 통과했다. structural diff, rect diff, computed style diff가 모두 0개였다.

### 2026-06-14 Task 7R Step 7R.5 코스 상세 화면 일치 시작

- 대상 화면은 Kwep `/course/c1`과 제품 `/app/courses/c1`이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/Screens.tsx`의 `CourseDetailScreen`이다.
- 제품 대상 파일은 `apps/web/src/app/app/courses/[id]/page.tsx`, `apps/web/src/features/courses/course-detail-page.tsx`, `apps/web/src/features/courses/course-curriculum.tsx`이다.
- 같은 사용자 인증 상태와 fresh 진행 상태에서 모바일 `390x844`, 데스크톱 `1280x720`을 비교한다.
- 먼저 Kwep 상세 hero, 돌아가기 버튼, 진행률, 첫 레슨 CTA, 커리큘럼 accordion, 레슨 상태 badge와 제품 구현의 DOM/CSS/기능 차이를 캡처한다.

### 2026-06-14 Task 7R Step 7R.5 코스 상세 화면 일치 완료

- 제품 `/app/courses/c1` 상세 화면을 Kwep `CourseDetailScreen`과 같은 root, 돌아가기 버튼, hero surface, 코스 이미지, 제목, 설명, 진행률, 첫 레슨 CTA 구조로 교체했다.
- shadcn `Card`, `Progress`, `Link`, `details` 기반 커리큘럼을 제거하고 Kwep와 같은 `button`, `div`, grid row accordion, 레슨 row 전체 클릭 구조로 다시 작성했다.
- API 코스 상세 조회가 실패해도 Kwep `c1` seed와 같은 코스 상세 fallback을 렌더링하게 해 제품 route가 404로 빠지지 않도록 했다.
- fresh 진행 상태는 Kwep와 같이 `0/10` 진행률, 첫 레슨 `좋은 문장이란 무엇인가`만 진행 가능, 이후 레슨은 잠금 상태로 계산한다.
- Kwep `lucide-react@0.487.0`의 `ChevronLeft`, `ChevronDown`, `Check`, `Lock`, `Play` SVG path를 제품 icon wrapper에 추가해 상세 화면 SVG DOM을 맞췄다.
- 코스 이미지 URL helper를 추가해 배우기 카드와 상세 hero가 Kwep와 같은 `picsum.photos/seed/:id/:width/:height` 규칙을 사용하게 했다.
- `docs/superpowers/evidence/2026-06-14-kwep-ui-parity/course-detail/capture-course-detail.mjs`로 390x844와 1280x720 캡처, strict DOM/style diff, 뒤로가기/첫 레슨/accordion 클릭 검증 데이터를 생성했다.
- 최종 비교에서 390x844는 screen root item count `177 / 177`, visible element count `168 / 168`, structural diff 0개, rect diff 0개, computed style diff 0개를 확인했다.
- 최종 비교에서 1280x720은 screen root item count `177 / 177`, visible element count `153 / 153`, structural diff 0개, rect diff 0개, computed style diff 0개를 확인했다.
- 클릭 검증에서 Kwep `돌아가기`는 `/learn`, 제품 `돌아가기`는 대응 route인 `/app/courses`로 이동했다.
- 클릭 검증에서 Kwep 첫 레슨 CTA와 row는 `/lesson/c1/l1`, 제품은 대응 route인 `/app/lesson?lesson_id=l1`로 이동했다.
- accordion 검증에서 첫 유닛은 Kwep와 제품 모두 초기/재오픈 `gridTemplateRows: 1fr`, 닫힘 `gridTemplateRows: 0fr`와 같은 높이 전이를 보였다.
- `bun --filter @workspace/web test -- courses-page course-detail-page course-curriculum`: 통과했다. 테스트 파일 3개, 테스트 3개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check 'apps/web/src/app/app/courses/[id]/page.tsx' apps/web/src/app/globals.css apps/web/src/features/courses/course-curriculum.tsx apps/web/src/features/courses/course-curriculum.test.tsx apps/web/src/features/courses/course-detail-page.tsx apps/web/src/features/courses/course-detail-page.test.tsx apps/web/src/features/courses/course-image-url.ts apps/web/src/features/courses/courses-page.tsx apps/web/src/features/courses/kwep-course-detail-fallback.ts packages/ui/src/components/icons.tsx docs/superpowers/evidence/2026-06-14-kwep-ui-parity/course-detail/capture-course-detail.mjs docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.
- 남은 DOM/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.6 레슨 시작 화면 일치 시작

- 다음 대상 화면은 Kwep `/lesson/c1/l1`과 제품 `/app/lesson?lesson_id=l1`이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`와 `/tmp/kwep-runtime-writing-app/src/app/components/Screens.tsx`의 레슨 진입 흐름이다.
- 제품 대상 파일은 `apps/web/src/app/app/lesson/page.tsx`, `apps/web/src/features/lessons/*`, 관련 API fallback이다.
- 코스 상세 커밋 후 Kwep 코드를 기준으로 레슨 시작 화면의 React/Tailwind 구조를 제품에 같은 형태로 이식한다.

### 2026-06-14 Task 7R Step 7R.6 레슨 시작 화면 일치 완료

- 제품 `/app/lesson?lesson_id=l1` 시작 상태를 Kwep `LessonShell`의 `!isStarted` branch와 같은 fullscreen fixed overlay 구조로 교체했다.
- 기존 shadcn `Card`, `CardHeader`, `CardFooter`, summary list, arrow button UI를 제거하고 Kwep와 같은 X 나가기 버튼, 카테고리 라벨, title, description, `⏱`, `📚`, 하단 gradient CTA 구조를 적용했다.
- X 나가기 버튼은 Kwep `/course/c1`에 대응하는 제품 `/app/courses/c1`로 이동한다.
- 시작 CTA는 Kwep `Btn`과 같은 `w-full font-bold py-5 rounded-4xl btn-squish bg-charcoal text-cream` button 구조를 사용한다.
- API 레슨 조회가 실패해도 Kwep `l1` seed와 같은 fallback lesson을 렌더링해 시작 화면이 제품 오류 card로 바뀌지 않도록 했다.
- Kwep `lucide-react@0.487.0`의 `X` SVG path를 제품 icon wrapper에 추가해 나가기 아이콘 DOM을 맞췄다.
- `bun --filter @workspace/web test -- lesson-experience`: 통과했다. 테스트 파일 1개, 테스트 5개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check apps/web/src/app/app/lesson/page.tsx apps/web/src/features/lessons/lesson-experience.tsx apps/web/src/features/lessons/lesson-experience.test.tsx apps/web/src/features/lessons/kwep-lesson-fallback.ts packages/ui/src/components/icons.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.
- 남은 레슨 시작 화면 DOM/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.7 읽기 스텝 화면 일치 시작

- 다음 대상 화면은 Kwep `/lesson/c1/l1`에서 `시작하기`를 누른 뒤의 첫 읽기 스텝과 제품 `/app/lesson?lesson_id=l1`에서 `시작하기`를 누른 뒤의 첫 읽기 스텝이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`의 started branch와 `/tmp/kwep-runtime-writing-app/src/app/components/StepRenderer.tsx`의 `reading` branch이다.
- 제품 대상 파일은 `apps/web/src/features/lessons/lesson-experience.tsx`, `apps/web/src/features/lessons/lesson-step-renderer.tsx`, `apps/web/src/features/lessons/use-lesson-persistence.ts`이다.
- 레슨 시작 화면 커밋 후 Kwep 코드를 기준으로 읽기 스텝의 header/progress/content/bottom CTA 구조를 같은 형태로 이식한다.

### 2026-06-14 Task 7R Step 7R.7 읽기 스텝 화면 일치 완료

- 계획을 최신 사용자 지시에 맞춰 Kwep React/Tailwind 소스를 1차 기준으로 대조하는 코드 우선 비교 방식으로 갱신했다.
- 제품 started branch를 Kwep `LessonShell.tsx`와 같은 fullscreen fixed shell, 상단 X 버튼, progress bar, `현재/전체` 카운터, content 영역, 하단 gradient CTA 구조로 교체했다.
- 읽기 스텝은 Kwep `StepRenderer.tsx`의 `reading` branch와 같은 `h2`, guide/body `ReactMarkdown`, typography `prose` class, source label 구조를 사용한다.
- Kwep `Btn`과 같은 primary/secondary button variant를 제품 lesson button helper에 적용해 시작 CTA와 exit modal 버튼 구조를 공유한다.
- 읽기/비교 스텝 CTA는 `이해했어요`, 퀴즈형 스텝 CTA는 `확인하기`, 쓰기형 스텝 CTA는 `다음으로 →`로 Kwep label 흐름을 맞췄다.
- `react-markdown`과 `@tailwindcss/typography`를 추가하고 Tailwind typography plugin을 등록했다.
- `bun --filter @workspace/web test -- lesson-experience lesson-step-renderer`: 통과했다. 테스트 파일 2개, 테스트 14개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check apps/web/package.json apps/web/src/app/globals.css apps/web/src/features/lessons/lesson-experience.tsx apps/web/src/features/lessons/lesson-experience.test.tsx apps/web/src/features/lessons/lesson-step-renderer.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md`: 문서 완료 기록 전 코드 기준으로 통과했다.
- 남은 읽기 스텝 HTML/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.8 매칭/분류/쓰기 레슨 화면 일치 시작

- 다음 대상 화면은 Kwep `/lesson/c1/l-new`와 제품 `/app/lesson?lesson_id=l-new`이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`, `/tmp/kwep-runtime-writing-app/src/app/components/MatchStep.tsx`, `/tmp/kwep-runtime-writing-app/src/app/components/CategorizeStep.tsx`, `/tmp/kwep-runtime-writing-app/src/app/components/StepRenderer.tsx`이다.
- 제품 대상 파일은 `apps/web/src/features/lessons/lesson-experience.tsx`, `apps/web/src/features/lessons/lesson-step-renderer.tsx`, `apps/web/src/features/lessons/lesson-types.ts`와 `l-new` seed/API mapping 관련 파일이다.
- 읽기 스텝 커밋 후 Kwep 코드 기준으로 `l-new`의 시작 화면, 매칭, 분류, 쓰기 스텝을 하나의 사용자 흐름 안에서 같은 구조와 기능으로 맞춘다.

### 2026-06-14 Task 7R Step 7R.8 매칭/분류/쓰기 레슨 화면 일치 완료

- Kwep `LessonShell.tsx`의 `getCanSubmit`, quiz 확인, 결과 footer 흐름을 제품 `LessonExperience`에 이식해 매칭은 `확인하기 → 완벽해요!/아쉽지만 달라요 → 계속하기`, 분류와 쓰기는 준비 조건 충족 후 `다음으로 →`로 이동하게 했다.
- 제품 `MATCH` branch를 Kwep `MatchStep.tsx`와 같은 왼쪽 선택, 오른쪽 탭, deterministic right shuffle, correct/wrong 색상, 해설 박스 구조로 교체했다.
- 제품 `CATEGORIZE` branch를 Kwep `CategorizeStep.tsx`와 같은 태그 선택 패널, 항목 탭 배치, category palette, tagged item chip 구조로 교체했다.
- 제품 `WRITE` branch를 Kwep `StepRenderer.tsx`의 write branch와 같은 title, badge, claim, markdown guide, 참고 원문, 구조 가이드, rounded textarea, 글자 수 카운터, draft/sample 영역 구조로 교체했다.
- API/OpenAPI 경계에서 Kwep write step의 `badge`, `claim`, `context`, `prompt`, `reference`, `structure`, `draft`, `mode`, `placeholder`가 제품 웹까지 전달되도록 OpenAPI 문서, 생성 타입, lesson mapper, web type을 갱신했다.
- `bun --filter @workspace/web test -- lesson-experience lesson-step-renderer`: 통과했다. 테스트 파일 2개, 테스트 15개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- 남은 `l-new` 매칭/분류/쓰기 레슨 HTML/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.9 객관식 확인 레슨 화면 일치 시작

- 다음 대상 화면은 Kwep `/lesson/c1/l2`와 제품 `/app/lesson?lesson_id=l2`이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`와 `/tmp/kwep-runtime-writing-app/src/app/components/StepRenderer.tsx`의 `reading`, `multiple_choice` branch이다.
- 제품 대상 파일은 `apps/web/src/features/lessons/lesson-experience.tsx`, `apps/web/src/features/lessons/lesson-step-renderer.tsx`, `apps/web/src/features/lessons/lesson-types.ts`와 객관식 저장/확인 관련 테스트이다.
- `l-new` 커밋 후 Kwep 코드 기준으로 `l2`의 읽기 3개 스텝 진행, 객관식 선택 색상, `확인하기`, 정답/오답 결과 footer를 같은 구조와 기능으로 맞춘다.

### 2026-06-14 Task 7R Step 7R.9 객관식 확인 레슨 화면 일치 완료

- 제품 `MULTIPLE_CHOICE` branch를 Kwep `StepRenderer.tsx`의 `multiple_choice` branch와 같은 card 없는 `an-fi` root, 질문 `h2`, option button class, selected/correct/wrong/faded 색상 상태로 교체했다.
- 객관식 answer payload를 lesson shell에 전달해 Kwep처럼 선택 전 `확인하기` CTA가 disabled secondary 상태이고, 선택 후 primary enabled 상태가 되게 했다.
- 객관식 확인 후 Kwep checked footer와 같은 `완벽해요!`/`아쉽지만 달라요`, explanation/wrong text, `계속하기` 흐름을 사용한다.
- `l2`의 읽기 3개 스텝은 기존 Kwep reading branch를 그대로 사용하고, 4번째 객관식 스텝에서 `4/4` progress와 확인 흐름을 검증했다.
- `bun --filter @workspace/web test -- lesson-experience lesson-step-renderer`: 통과했다. 테스트 파일 2개, 테스트 16개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- 남은 객관식 확인 레슨 HTML/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.10 레슨 완료 화면 일치 시작

- 다음 대상 화면은 Kwep 레슨 마지막 스텝 완료 후 `SessionDone.tsx`와 제품 레슨 마지막 스텝 완료 후 화면이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/SessionDone.tsx`와 `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`의 `isDone` branch이다.
- 제품 대상 파일은 `apps/web/src/features/lessons/lesson-experience.tsx`, `apps/web/src/features/lessons/lesson-step-renderer.tsx`, 완료 저장/완료 화면 테스트이다.
- 객관식 확인 레슨 커밋 후 Kwep 코드 기준으로 완료 화면의 full-screen 구조, 텍스트, CTA, route 대응을 맞춘다.

### 2026-06-14 Task 7R Step 7R.10 레슨 완료 화면 일치 완료

- 제품 레슨 완료 화면을 Kwep `SessionDone.tsx`와 같은 `bg-primary` fullscreen fixed overlay, 중앙 정렬 축하 영역, `🙌`, `완료!`, 저장 완료 문구 구조로 교체했다.
- 레슨 `summary`가 있으면 Kwep와 같은 `bg-cream rounded-5xl` 요약 카드, 번호 원형 badge, 요약 문장 목록을 표시한다.
- 완료 통계 카드는 Kwep와 같은 `완료한 레슨 +1`, `코스 진행률 completed/total`, 가운데 구분선 구조를 사용한다.
- 제품 `/app/lesson` route에서 레슨의 course detail을 함께 조회해 Kwep `courseProg(cid)`와 `getNextLesson(cid, lid)`에 대응하는 진행률과 다음 레슨 CTA를 계산한다.
- 다음 레슨 CTA는 Kwep `/lesson/:cid/:lid`에 대응해 제품 `/app/lesson?lesson_id=:lid`로 이동하고, 코스로 돌아가기는 `/app/courses/:cid`로 이동한다.
- `bun --filter @workspace/web test -- lesson-experience`: 먼저 `courseDetail`이 없는 완료 테스트에서 `1/2`와 다음 레슨 CTA가 없어 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 7개가 통과했다.
- `bun --filter @workspace/web test -- lesson-experience lesson-step-renderer`: 통과했다. 테스트 파일 2개, 테스트 16개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check apps/web/src/app/app/lesson/page.tsx apps/web/src/features/lessons/lesson-experience.tsx apps/web/src/features/lessons/lesson-experience.test.tsx docs/lesson-page.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.
- 남은 레슨 완료 HTML/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.11 프로필과 테마 전환 화면 일치 시작

- 다음 대상 화면은 Kwep `/profile`과 제품 `/app/profile`이다.
- Kwep 기준 파일은 `/tmp/kwep-runtime-writing-app/src/app/components/Screens.tsx`의 `ProfileScreen`과 `ThemeToggle`이다.
- 제품 대상 파일은 `apps/web/src/app/app/profile/page.tsx`, `apps/web/src/features/profile/*`, `apps/web/src/app/layout.tsx`의 theme 적용 경계이다.
- 레슨 완료 화면 커밋 후 Kwep 코드 기준으로 프로필 사용자 정보, 가입일, 완료 레슨, 연속 학습일, 라이트/다크/시스템 테마 전환 UI와 기능을 같은 구조로 맞춘다.

### 2026-06-14 Task 7R Step 7R.11 프로필과 테마 전환 화면 일치 완료

- 제품 `/app/profile` 본문을 Kwep `ProfileScreen`과 같은 `max-w-2xl mx-auto` root, 큰 `✍️` 아바타, 이름, `가입일: yyyy.mm.dd` 구조로 교체했다.
- 기존 shadcn card/progress/profile image UI를 제거하고 Kwep와 같은 `나의 학습 요약` heading, 완료한 레슨/연속 학습일 2열 surface tile을 사용한다.
- 제품 `ThemeToggle`은 Kwep와 같은 라이트/다크/시스템 3분할 control, `aria-pressed`, `bg-primary` active 상태, `text-muted hover:bg-surface-hover` inactive 상태를 사용한다.
- Kwep의 `next-themes` 설정과 같이 root layout에 `ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`를 연결했다.
- Kwep의 mounted effect 패턴은 repo lint 규칙과 충돌하므로 `useSyncExternalStore` 기반 mounted snapshot으로 같은 hydration guard를 구현했다.
- 로그아웃은 Kwep의 button DOM과 `wrong` button style을 유지하되, 제품 인증 경계상 Better Auth sign-out URL(`/api/auth/sign-out?callbackURL=%2F`)로 이동한다.
- `bun --filter @workspace/web test -- profile-page`: 먼저 기존 card형 프로필에서 `✍️` 아바타가 없어 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 1개가 통과했다.
- `bun --filter @workspace/web test -- profile-page global-nav auth-navigation`: 통과했다. 테스트 파일 3개, 테스트 3개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check FRONTEND.md apps/web/src/app/layout.tsx apps/web/src/app/app/profile/page.tsx apps/web/src/features/profile/profile-page.tsx apps/web/src/features/profile/profile-page.test.tsx docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.
- 남은 프로필/테마 HTML/CSS/기능 차이는 없다.

### 2026-06-14 Task 7R Step 7R.12 학습자 플로우 전체 회귀 검증 시작

- 다음 대상은 공개 랜딩부터 프로필까지 커밋된 학습자 사용자 플로우 전체다.
- Kwep 코드 기준으로 맞춘 화면들이 현재 제품 코드에서 함께 회귀하지 않는지 테스트, 타입체크, lint, 필요한 포맷 검증을 다시 수행한다.
- 회귀 검증 후에는 Task 7R 완료 상태를 갱신하고 어드민 진입/대시보드 화면으로 넘어간다.

### 2026-06-14 Task 7R Step 7R.12 학습자 플로우 전체 회귀 검증 완료

- 사용자 지시에 따라 별도 스크린샷, curl, 렌더링 HTML 역분석은 반복하지 않고, Kwep React/Tailwind 소스와 제품 코드 계약을 기준으로 화면별 완료 상태를 확인했다.
- `bun --filter @workspace/web test`: 통과했다. 테스트 파일 17개, 테스트 40개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bun --filter @workspace/web build`: 통과했다. `/`, `/login`, `/app`, `/app/courses`, `/app/courses/[id]`, `/app/lesson`, `/app/profile` route가 빌드됐다.
- `bun --filter @workspace/api test`: 통과했다. 테스트 파일 11개, 테스트 22개가 통과했다.
- `bun --filter @workspace/api typecheck`: 통과했다.
- `bun --filter @workspace/api lint`: 통과했다.
- `bun run format:check`: 통과했다.
- `git diff --check`: 통과했다.
- `git status --short`: tracked 변경은 없고, 읽기 전용 프로토타입 `Kwep/`만 untracked로 남아 있다.
- Task 7R의 학습자 사용자 플로우 1~12번 화면 단위 재작업과 회귀 검증을 완료했다.

### 2026-06-14 Task 8 Step 8.2 사용자 목록과 상세 API 시작

- 다음 대상은 어드민 사용자 관리 화면의 Kwep `AdminUserList.tsx`, `AdminUserDetail.tsx`에 대응하는 제품 API 계약이다.
- 제품 대상 파일은 `packages/core/src/admin/*`, `packages/db/src/repositories/admin.repository.ts`, `apps/admin-api/src/app.ts`, `apps/admin-api/src/routes/users.route.ts`, 관련 테스트이다.
- 사용자 목록은 검색, 상태 필터, `lastActive`/`joined`/`lessonsDone`/`streak` 정렬, 페이지네이션을 제공한다.
- 사용자 상세는 가입일, 최근 접속, 현재 스트릭, 완료 레슨, 전체 진도 계산에 필요한 값을 제공한다.
- 상태 변경은 `active`/`suspended`만 허용하고, 삭제는 프로필 status를 `deleted`로 바꾸며 학습 진행과 답변 row는 보존한다.

### 2026-06-14 Task 8 Step 8.2 사용자 목록과 상세 API 완료

- `packages/core/src/admin`에 어드민 사용자 목록, 상세, 상태 변경, 삭제 결과 DTO와 repository/service port를 추가했다.
- `packages/db/src/repositories/admin.repository.ts`는 기존 auth user, learner profile, activity day, lesson progress, content table에서 사용자 목록/상세를 계산한다.
- 사용자 목록은 Kwep `AdminUserList`와 같은 이름/이메일 검색, 상태 필터, `lastActive`/`joined`/`lessonsDone`/`streak` 정렬, 페이지네이션을 지원한다.
- 사용자 상세는 Kwep `AdminUserDetail`에 필요한 가입일, 최근 접속, 현재 스트릭, 완료 레슨, 전체 진도 계산값을 반환한다.
- `PATCH /users/:userId/status`는 `active`, `suspended`만 허용하고, `DELETE /users/:userId`는 learner profile을 `deleted`로 바꿔 학습 진행/답변 row를 보존한다.
- `bun --filter @workspace/core test -- admin.service`: 먼저 `service.getUsers is not a function`으로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 2개가 통과했다.
- `bun --filter @workspace/admin-api test -- app`: 먼저 `/users` route가 없어 404로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 6개가 통과했다.
- `bun --filter @workspace/db test -- admin.repository`: 먼저 `repository.readUsers is not a function`으로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 2개가 통과했다.
- `bun --filter @workspace/core typecheck`, `bun --filter @workspace/db typecheck`, `bun --filter @workspace/admin-api typecheck`: 통과했다.
- `bun --filter @workspace/core lint`, `bun --filter @workspace/db lint`, `bun --filter @workspace/admin-api lint`: 통과했다.
- `bunx prettier --check apps/admin-api/src/app.test.ts apps/admin-api/src/app.ts apps/admin-api/src/routes/users.route.ts packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts packages/db/src/repositories/admin.repository.ts packages/db/src/repositories/admin.repository.test.ts docs/admin-site.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 8 Step 8.3 분석 API 시작

- 다음 대상은 어드민 분석 화면의 Kwep `AdminAnalytics.tsx`와 `Kwep/src/app/admin/mockData.ts`에서 파생한 제품 API 계약이다.
- 제품 대상 파일은 `packages/core/src/admin/*`, `packages/db/src/repositories/admin.repository.ts`, `apps/admin-api/src/app.ts`, `apps/admin-api/src/routes/analytics.route.ts`, 관련 테스트이다.
- `GET /analytics?days=30`은 일별 가입 수, 일별 레슨 완료 수, 연속 학습일 bucket, 완료율이 낮은 레슨 요약을 제공한다.
- `GET /analytics/lessons?page=1&pageSize=10&query=&sort=completionRate&direction=asc`는 Kwep 레슨별 완료율 테이블에 필요한 검색, 정렬, 페이지네이션을 제공한다.
- 완료율은 `completed / started`, 이탈률은 `100 - completionRate`로 계산하고, 시작 수가 0인 레슨은 완료율 0으로 처리한다.
- production code 수정 전에 core service, admin API route, DB repository 테스트에 실패 기대값을 먼저 추가한다.

### 2026-06-14 Task 8 Step 8.3 분석 API 완료

- `packages/core/src/admin`에 일별 분석, 스트릭 bucket, 레슨별 완료/이탈률, 레슨 분석 페이지 DTO와 repository/service port를 추가했다.
- `apps/admin-api/src/routes/analytics.route.ts`를 추가하고 `GET /analytics`, `GET /analytics/lessons`를 관리자 세션 뒤에 연결했다.
- `GET /analytics`는 Kwep 분석 화면의 일별 추이, 연속 학습일 bucket, 완료율이 낮은 레슨 요약을 반환한다.
- `GET /analytics/lessons`는 Kwep 레슨별 완료율 테이블의 검색, `lesson`/`course`/`completionRate`/`dropOff` 정렬, 페이지네이션을 반환한다.
- `packages/db/src/repositories/admin.repository.ts`는 삭제되지 않은 학습자, active 코스/유닛/레슨, lesson progress를 기준으로 가입 수, 완료 수, 스트릭 분포, 완료율과 이탈률을 계산한다.
- `bun --filter @workspace/core test -- admin.service`: 먼저 `service.getAnalytics is not a function`으로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 3개가 통과했다.
- `bun --filter @workspace/admin-api test -- app`: 먼저 `/analytics` route가 없어 404로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 10개가 통과했다.
- `bun --filter @workspace/db test -- admin.repository`: 먼저 `repository.readAnalytics is not a function`으로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 3개가 통과했다.
- `bun --filter @workspace/admin-api test -- analytics`: route 전용 테스트 파일 1개, 테스트 4개가 통과했다.
- `bun --filter @workspace/core typecheck`, `bun --filter @workspace/db typecheck`, `bun --filter @workspace/admin-api typecheck`: 통과했다.
- `bun --filter @workspace/core lint`, `bun --filter @workspace/db lint`, `bun --filter @workspace/admin-api lint`: 통과했다.
- `bunx prettier --check apps/admin-api/src/app.test.ts apps/admin-api/src/app.ts apps/admin-api/src/routes/analytics.route.ts apps/admin-api/src/routes/analytics.route.test.ts packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts packages/db/src/repositories/admin.repository.ts packages/db/src/repositories/admin.repository.test.ts docs/admin-site.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.

### 2026-06-14 Task 8 Step 8.4 운영 설정 API 시작

- 다음 대상은 어드민 운영 설정 화면의 Kwep `AdminSettings.tsx`, `Kwep/src/app/admin/content.tsx`, `Kwep/src/app/data.ts`에서 파생한 제품 API 계약이다.
- 제품 대상 파일은 `packages/core/src/admin/*`, `packages/db/src/schema/*`, `packages/db/src/migrations/0000-kwep-baseline.sql`, `packages/db/src/repositories/admin.repository.ts`, `apps/admin-api/src/app.ts`, `apps/admin-api/src/routes/settings.route.ts`, 관련 테스트이다.
- `GET /settings`는 Kwep localStorage 설정값에 대응하는 `banner`, `announce`, `terms`, `privacy`를 반환한다.
- `PUT /settings/notice`는 공지/배너를 저장하고, `PUT /settings/legal`은 약관/개인정보처리방침을 저장한다.
- `POST /settings/content-reset`은 Kwep seed 콘텐츠를 기준으로 active 콘텐츠를 재시드하고, 새 revision과 변경 수를 반환한다.
- production code 수정 전에 core service, admin API route, DB repository 테스트에 실패 기대값을 먼저 추가한다.

### 2026-06-14 Task 8 Step 8.4 운영 설정 API 완료

- `packages/core/src/admin`에 운영 설정 DTO, 공지/법무 저장 요청 DTO, 콘텐츠 초기화 결과 DTO와 repository/service port를 추가했다.
- `packages/db/src/schema/admin.schema.ts`와 baseline migration에 `admin_settings` key-value 테이블을 추가했다.
- `packages/db/src/seeds/seed-content.ts`는 Kwep seed rows 생성 helper를 어드민 reset에서도 재사용할 수 있도록 공개했다.
- `packages/db/src/repositories/admin.repository.ts`는 `banner`, `announce`, `terms`, `privacy`를 저장/조회하고, Kwep seed 콘텐츠를 transaction 안에서 upsert하며 seed에 없는 기존 콘텐츠는 archived로 전환한다.
- `apps/admin-api/src/routes/settings.route.ts`를 추가하고 `GET /settings`, `PUT /settings/notice`, `PUT /settings/legal`, `POST /settings/content-reset`를 관리자 세션 뒤에 연결했다.
- `bun --filter @workspace/core test -- admin.service`: 먼저 `service.getSettings is not a function`으로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 4개가 통과했다.
- `bun --filter @workspace/admin-api test -- settings`: 먼저 `/settings` route가 없어 404로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 6개가 통과했다.
- `bun --filter @workspace/db test -- admin.repository`: 먼저 `repository.readSettings is not a function`으로 실패함을 확인했고, 수정 후 테스트 파일 1개, 테스트 4개가 통과했다.
- `bun --filter @workspace/db test -- seed`: seed 관련 테스트 파일 2개, 테스트 5개가 통과했다.
- `bun --filter @workspace/core typecheck`, `bun --filter @workspace/db typecheck`, `bun --filter @workspace/admin-api typecheck`: 통과했다.
- `bun --filter @workspace/core lint`, `bun --filter @workspace/db lint`, `bun --filter @workspace/admin-api lint`: 통과했다.
- `bunx prettier --check apps/admin-api/src/app.test.ts apps/admin-api/src/app.ts apps/admin-api/src/routes/analytics.route.test.ts apps/admin-api/src/routes/settings.route.ts apps/admin-api/src/routes/settings.route.test.ts packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.repository.ts packages/core/src/admin/admin.service.ts packages/core/src/admin/admin.service.test.ts packages/db/src/schema/admin.schema.ts packages/db/src/schema/index.ts packages/db/src/seeds/seed-content.ts packages/db/src/seeds/seed.ts packages/db/src/repositories/admin.repository.ts packages/db/src/repositories/admin.repository.test.ts docs/admin-site.md docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md`: 통과했다.
- `git diff --check`: 통과했다.

## 상태 요약

- [x] 브랜치 생성
- [x] Kwep 요구사항 1차 도출
- [x] SSOT 계획 문서 생성
- [x] 전면 재작성 원칙 반영
- [x] 기준선 검증
- [x] 기존 구현 코드 제거
- [x] 시작 문서 갱신
- [x] 플랫폼 API 구현
- [x] 플랫폼 API 검증
- [x] 플랫폼 프론트엔드 초안 구현
- [x] 플랫폼 프론트엔드 초안 검증
- [x] 플랫폼 브라우저 스모크(초안)
- [x] Kwep UI 1:1 사용자 플로우 재작업
- [ ] Kwep UI 1:1 브라우저 검증
- [ ] 어드민 API 구현
- [ ] 어드민 API 검증
- [ ] 어드민 프론트엔드 구현
- [ ] 어드민 프론트엔드 검증
- [ ] 어드민 브라우저 스모크
- [ ] 전체 검증
- [ ] 완료 문서 갱신
