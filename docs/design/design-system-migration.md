# 디자인 시스템 Kwep 이관

이 문서는 gitignore된 [`Kwep/`](../../Kwep/) UI 프로토타입을 시각·UX 단일 진실 원천(SSOT)으로 삼아 `packages/ui`, `apps/web`, `apps/admin`을 맞추는 실행 기준이다. 기능 범위는 제품 docs(`docs/design/screens/`, `docs/product/requirements/`)를 따르고, 시각·레이아웃·모션은 Kwep를 따른다.

관련 결정: [ADR-0002](../engineering/adr/ADR-0002-ui-design-system-contract.md)

## 범위

- **포함:** 색상·타이포·radius·motion·primitive·화면 레이아웃·인터랙션 피드백
- **제외:** Kwep mock state·라우터·Provider 이식, Radix로의 되돌리기, `/tour` 라우트
- **기능 범위 유지:** 어드민 인증은 이메일/비밀번호(`apps/admin/login`)를 유지하고 Kwep `AdminGate` 패스코드 UI는 이식하지 않는다.

## Phase 개요

| Phase | 목표            | 완료 기준                                                        |
| ----- | --------------- | ---------------------------------------------------------------- |
| 0     | SSOT 인벤토리   | 본 문서 + 매핑표 + 체크리스트                                    |
| 1     | 파운데이션 토큰 | `packages/ui/src/styles/tokens/`, utilities 연결, `data-density` |
| 2     | Primitive P0/P1 | Button, field, Progress, Surface, Badge, lesson/admin pattern    |
| 3     | apps/web        | 랜딩·nav·학습자 화면·레슨                                        |
| 4     | apps/admin      | shell·목록·편집·설정                                             |
| 5     | 품질 게이트     | guardrail, Storybook, legacy alias 정리                          |
| 6     | 문서 동결       | foundations, components, patterns, screens                       |

## 화면 매핑

| Kwep 라우트          | Monorepo            | Kwep 소스                             | Monorepo 소스                      |
| -------------------- | ------------------- | ------------------------------------- | ---------------------------------- |
| `/`                  | `/`                 | `Kwep/src/app/components/landing/`    | `apps/web/src/features/landing/`   |
| `/login`             | `/login`            | `Screens.tsx` LoginScreen             | `apps/web/src/features/auth/`      |
| `/home`              | `/app`              | HomeScreen                            | `apps/web/src/features/home/`      |
| `/learn`             | `/app/courses`      | LearnScreen                           | `apps/web/src/features/courses/`   |
| `/course/:id`        | `/app/courses/[id]` | CourseDetailScreen                    | `course-detail-page.tsx`           |
| `/profile`           | `/app/profile`      | ProfileScreen                         | `profile-page.tsx`                 |
| `/lesson/:cid/:lid`  | `/app/lesson`       | `LessonShell.tsx`, `StepRenderer.tsx` | `lesson-*`, `packages/ui/lesson/*` |
| `/admin`             | `/`                 | `AdminDashboard.tsx`                  | `admin-dashboard-page.tsx`         |
| `/admin/courses`     | `/courses`          | `AdminCourseList.tsx`                 | `admin-courses-page.tsx`           |
| `/admin/courses/:id` | `/courses/[id]`     | `AdminCourseEditor.tsx`               | `course-editor/*`                  |
| `/admin/users`       | `/users`            | `AdminUserList.tsx`                   | `admin-users-page.tsx`             |
| `/admin/users/:uid`  | `/users/[id]`       | `AdminUserDetail.tsx`                 | `admin-user-detail-page.tsx`       |
| `/admin/analytics`   | `/analytics`        | `AdminAnalytics.tsx`                  | `admin-analytics-page.tsx`         |
| `/admin/settings`    | `/settings`         | `AdminSettings.tsx`                   | `admin-settings-page.tsx`          |
| `/admin/resources`   | `/resources`        | `AdminResourceList.tsx`               | `admin-resources-page.tsx`         |
| `/admin/chat`        | `/chat`             | `AdminChat.tsx`                       | `admin-ai-chat-page.tsx`           |

## 컴포넌트 매핑

| Kwep               | packages/ui                    | 비고                       |
| ------------------ | ------------------------------ | -------------------------- |
| `ui.tsx` Btn       | `button.tsx`                   | `rounded-4xl`, variant 7종 |
| `ui.tsx` Card      | `surface.tsx` / `card.tsx`     | hover scale                |
| `ui.tsx` Modal     | `alert-dialog.tsx`             | `rounded-4xl`, `an-fi`     |
| `ui/input.tsx`     | `input`, `textarea`, `select`  | field-control contract     |
| `ui/progress.tsx`  | `progress.tsx`                 | 노란 indicator             |
| `ui/accordion.tsx` | `accordion.tsx`                | 커리큘럼                   |
| admin `Metric`     | `stat-card.tsx`                | icon+label 한 줄           |
| admin `fields.tsx` | `field.tsx` + Input            |                            |
| `Chrome.tsx`       | `global-nav`, `mobile-nav`     |                            |
| `AdminLayout.tsx`  | `admin-shell`, `admin-sidebar` |                            |

## 검증 파이프라인

1. Storybook variant matrix (`apps/storybook`)
2. 화면별 visual checklist (light/dark, mobile/desktop)
3. `node scripts/kwep-web-ui-compare.mjs` — Kwep(5173) vs web(3000) fingerprint 비교 (`output/playwright/kwep-web-compare/`)
4. `node scripts/kwep-admin-theme-compare.mjs` — Kwep(5173) vs admin(3001) light/dark 비교 (`output/playwright/kwep-admin-compare/`)
5. `node scripts/kwep-step-tour-compare.mjs` — Kwep `/tour` vs admin `/debug/steps` 스텝 미리보기 비교 (`output/playwright/kwep-step-tour-compare/`)
6. `bun run check:design-system-guardrails`
7. `bun --filter @workspace/ui test`, `bun run lint`

## 파운데이션 메모

- `@tailwindcss/typography`는 `packages/ui/src/styles/globals.css`에서 한 번만 로드한다. `MarkdownContent`·레슨 마크다운의 `prose-*` 클래스는 이 플러그인에 의존한다.
- `--radius-3xl`은 Kwep 폰 프레임 기준 `1.5rem`(24px)이다.

## 화면별 visual checklist

### 학습자 web

- [x] `/` — LandingNav, Hero, Marquee, Features, HowItWorks, Stats, Showcase, FinalCTA, Footer; 브랜드 `글결.`
- [x] `/login` — emoji hero, Google CTA `rounded-4xl`, `ink` variant (`bg-ink text-white`, 라이트·다크 고정)
- [x] AppShell — sticky header `border-b-2 border-surface/50`, pill nav, avatar ring
- [x] `/app` — continue carousel, StatGrid, course cards `hover:scale-[1.02]`
- [x] `/app/courses` — category chips, bottom search pill + X clear
- [x] `/app/courses/[id]` — hero image, yellow progress, accordion curriculum
- [x] `/app/profile` — centered surface StatCard(`layout="profile"`), streak, theme `bg-accent` 활성, 로그아웃 `destructive extra`
- [x] `/app/lesson` — intro progress header, StickyActionBar gradient, correct/wrong CTA

### 어드민

- [x] shell — `글결 어드민` 브랜드, Kwep 메뉴 순서, `bg-surface` sidebar, active `bg-primary`, 모바일 헤더·탭 nav, `앱으로 이동`·`어드민 로그아웃` 푸터
- [x] dashboard — 4 Metric cards + recharts 3종 + 최근 활동 패널
- [x] lists — 인라인 검색/필터, mint/coral `StatusBadge`, bordered table·card list
- [x] course editor — Kwep 탭 UI(강의 정보·커리큘럼), 읽기 전용 편집 경계 유지
- [x] analytics — recharts + 레슨별 완료율 테이블
- [x] settings — 탭 UI(공지·약관·접근·콘텐츠)
- [x] chat — split pane, 퀵 프롬프트, `AI 에이전트` 타이틀
- [x] auth — Kwep 카드 스타일, 이메일/비밀번호 폼 유지
- [x] step debug (`/debug/steps`) — Kwep `/tour` 폰 프레임(`data-density="comfortable"`), compare 콜아웃 `bg-accent-soft`, CTA `bg-charcoal text-cream`·`text-body-lg`

## Kwep 핵심 className 스펙 (팀 공유용)

`Kwep/src/styles/theme.css` reference:

- `--color-cream: #FDFBF7`, `--color-surface: #F4EFE6`, `--color-charcoal: #2A2621`
- `--color-primary: #FFC800` (노란 악센트·진행률)
- `--color-mint: #34C759`, `--color-mint-light: #52D86A`, `--color-coral-light: #FFADA7` (정답/오답 CTA·놓친 정답 `bg-mint/30`)
- `.btn-squish:active { transform: scale(0.96) }`, `.an-fi` fade-up 0.4s

Btn variant (`Kwep/src/app/components/ui.tsx`):

- `primary`: `bg-charcoal text-cream`
- `secondary`: `bg-surface text-charcoal`
- `correct`: `bg-mint-light text-charcoal`
- `wrong`: `bg-coral-light text-charcoal`
- `white`: `bg-cream text-charcoal`
- `outline`: `border-4 border-charcoal`

## 동결 기준

- Storybook P0/P1 스토리가 Kwep variant와 일치
- 위 checklist 100% pass
- guardrail baseline 달성 (inline typography 0, legacy admin class 0)

## Phase 완료 상태

| Phase | 상태 | 완료일     |
| ----- | ---- | ---------- |
| 0     | 완료 | 2026-07-05 |
| 1     | 완료 | 2026-07-05 |
| 2     | 완료 | 2026-07-05 |
| 3     | 완료 | 2026-07-05 |
| 4     | 완료 | 2026-07-05 |
| 5     | 완료 | 2026-07-05 |
| 6     | 완료 | 2026-07-05 |
