# `buttonVariants` 스타일 재사용 마이그레이션 계획

작성일: 2026-07-14
상태: 구현 완료

## 목표

버튼과 버튼처럼 동작하는 링크·트리거의 공통 시각 계약은 `@workspace/ui/components/ui/button`의 `buttonVariants`로만 재사용한다. 호출부에서 `.btn-squish`를 직접 붙여 누름 효과만 재사용하지 않는다.

이 원칙은 hover·focus-visible·disabled·`aria-invalid`·아이콘·크기·누름 모션을 한 계약으로 유지하게 한다. 이관을 통해 기존 utility 의존성을 제거하고 `buttonVariants`가 해당 동작을 직접 소유한다.

## 이관 결과

- 이관 전 직접 `.btn-squish` 호출: 코드 19곳
  - `packages/ui`: 6곳
  - `apps/web`: 7곳
  - `apps/admin`: 6곳
- 이관 후 프로덕션 소스 직접 호출: 0곳
- `buttonVariants` 공개 resolver가 `cn` 기반 충돌 해소와 press selector를 소유한다.
- 기존 utility 정의는 삭제하고 compiled CSS sentinel은 `buttonVariants`가 생성한 press selector를 검증한다.
- 디자인 시스템 guardrail은 `apps/**`, `packages/**`의 legacy motion class 재도입을 0건 기준선으로 차단한다.

## 완료 조건

1. [x] `buttonVariants`가 공통 버튼 기본 스타일과 눌림 상태를 직접 소유한다.
2. [x] `apps/**`, `packages/**`의 프로덕션 소스에 `.btn-squish` 직접 호출이 없다.
3. [x] `utilities.css`와 compiled CSS sentinel에서 `.btn-squish` 계약을 제거한다.
4. [x] 기존 시각·상호작용 계약(상태별 색상, size, focus, disabled, dropdown 확장 상태의 scale 제외)을 자동 검증한다.
5. [x] `buttonVariants`를 `Link`·Base UI trigger·native button에 적용해 element 의미와 키보드 동작을 유지한다.

## 구현 순서

### 1. 공통 API를 먼저 보강한다

대상: `packages/ui/src/components/ui/button.tsx`

1. 현재 CVA 정의를 내부 구성과 공개 `buttonVariants` resolver로 분리한다.
2. 공개 resolver가 `className` 재정의까지 `cn`으로 정규화하도록 하여, `buttonVariants({ className })`를 직접 쓴 경우에도 호출부 재정의가 기본·variant·size보다 우선하도록 한다.
3. `.btn-squish`가 제공하던 transition과 `:active:not(:disabled):not([aria-haspopup="true"]):not([aria-expanded="true"])` scale 규칙을 버튼 기본 class로 옮긴다.
4. Tailwind CSS `4.1.18`의 arbitrary variant가 위 selector를 기존 CSS와 동등하게 컴파일하는지 production Storybook build로 확인한다.
5. 실제 compiled CSS에서 `transform: scale(var(--motion-press-scale))` selector를 확인하고 이를 sentinel로 고정한다.

### 2. 공유 UI와 레슨 UI를 이관한다

다음 항목은 native button이면서 버튼 시각 계약을 독자적으로 복제하고 있으므로 `buttonVariants`를 기본으로 사용한다. 도메인별 색상·선택 상태·폭은 `className` 재정의로 유지한다.

| 파일                                                           | 대상                     | 권장 기준                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/ui/choice-card.tsx`                | `choiceCardVariants`     | `buttonVariants` 기본 class와 choice state만 조합한다. `ChoiceCard`의 상태 API는 유지한다.                                                      |
| `packages/ui/src/components/lesson/categorize-answer.tsx`      | 분류 항목, 카테고리 태그 | disabled·`aria-pressed`·palette 상태를 유지한다. 항목은 disabled일 때 press 효과가 없어야 한다.                                                 |
| `packages/ui/src/components/lesson/fill-blank-answer.tsx`      | 단어 선택                | 선택 완료/채점 완료의 disabled 정책과 inline 빈칸 control은 범위를 분리해 확인한다. `.btn-squish`가 없는 inline 빈칸 control은 변경하지 않는다. |
| `packages/ui/src/components/lesson/compare-step-view.tsx`      | 버전 탭                  | 선택 상태와 탭 의미는 유지한다. `role="tab"` 등 접근성 보강은 별도 범위로 확장하지 않는다.                                                      |
| `packages/ui/src/components/lesson/multiple-choice-answer.tsx` | 보기 선택                | `data-state`, 정오답 색, faded disabled 상태를 그대로 유지한다.                                                                                 |

### 3. 학습자 앱을 이관한다

| 파일                                                         | 대상           | variant 출발점                                                                                |
| ------------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------- |
| `apps/web/src/features/profile/profile-page.tsx`             | 테마 선택      | `secondary` 또는 `ghost`; 활성 accent는 화면 class로 유지                                     |
| `apps/web/src/components/layout/global-nav.tsx`              | 주요 nav link  | `ghost` 또는 `secondary`; `aria-current` 상태 유지                                            |
| `apps/web/src/components/layout/global-nav-brand.tsx`        | 브랜드 link    | `link` 기본 class에 브랜드 typography·여백 재정의                                             |
| `apps/web/src/components/layout/global-nav-account-menu.tsx` | 메뉴 trigger   | icon size와 accent surface를 override하고 Base UI trigger 의미 유지                           |
| `apps/web/src/features/landing/landing-motion.tsx`           | 브랜드 link    | `link` 기본 class에 landing layout 재정의                                                     |
| `apps/web/src/features/courses/courses-page.tsx`             | 코스 card link | `secondary` 기본 class에 card layout, `h-auto`, padding, responsive class를 명시적으로 재정의 |
| `apps/web/src/features/courses/course-detail-page.tsx`       | 돌아가기 link  | `link` 기본 class에 compact back-link layout 재정의                                           |

코스 card와 브랜드 link는 현재 누름 효과만 사용하지만 최종 직접 `.btn-squish` 제거 목표에 포함한다. 따라서 버튼 기본 class를 적용한 뒤에도 block/flex 방향, 높이, padding, 배경, underline, hover 결과가 기존 screenshot과 같은지 반드시 확인한다.

### 4. 어드민 앱을 이관한다

| 파일                                                       | 대상                             | variant 출발점                                                                     |
| ---------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/admin/src/components/admin-sidebar.tsx`              | 주요 nav, 앱 이동 link, 로그아웃 | nav/link는 `ghost` 또는 `secondary`; 로그아웃 native button은 `destructive`를 사용 |
| `apps/admin/src/features/settings/admin-settings-page.tsx` | 설정 탭                          | `secondary` 기본 class에 활성 primary tone 유지                                    |
| `apps/admin/src/features/step-debug/step-debug-page.tsx`   | 현재 스텝 초기화, 스텝 선택      | `secondary` 기본 class에 active/inactive tone과 full-width layout 유지             |

### 5. utility와 문서를 제거한다

1. 모든 생산 소스 이관 뒤 `packages/ui/src/styles/utilities.css`에서 `.btn-squish` selector를 삭제한다.
2. `globals.css`의 `.btn-squish` 관련 주석을 button motion 소유권에 맞게 갱신한다. motion token 자체는 `buttonVariants`가 계속 사용하므로 삭제하지 않는다.
3. `scripts/check-ui-style-compiled-css.ts`에서 `.btn-squish` sentinel을 제거하고, button press selector가 실제 산출물에 있는지 확인할 수 있는 안정적인 sentinel을 fixture 결과에 근거해 추가하거나 해당 검증을 component test로 옮긴다.
4. `docs/design/components.md`, `foundations.md`, `accessibility.md`, `design-system-migration.md`의 `.btn-squish` 설명을 `buttonVariants` 계약으로 교체한다.

## 검증 계획

### 자동 검증

1. `buttonVariants` 단위 테스트를 추가해 default·variant·size·호출부 `className` 재정의와 disabled/expanded press 제외 selector를 확인한다.
2. `ChoiceCard`와 레슨 선택 UI의 기존 상태 테스트를 갱신하거나 추가한다. 특히 `aria-pressed`, disabled, 정답·오답 색상 상태를 확인한다.
3. Storybook Button story에 Link 렌더링, dropdown과 같은 `aria-expanded`, `className` 재정의, disabled press 사례를 추가한다. 기존 a11y/interaction runner로 실행한다.
4. `bun run check:design-system-guardrails`, `bun --filter @workspace/ui test`, 영향 앱의 test·typecheck·lint를 실행한다.
5. production build 뒤 `bun run check:ui-style-compiled-css`를 실행한다.
6. 마지막으로 `rg -n 'btn-squish' apps packages scripts docs`가 계획 문서의 이전 명칭 기록 외에 결과를 내지 않도록 확인한다. 완료 시 이전 명칭 기록도 제거하거나 필요한 최소 기록만 남긴다.

### 시각·브라우저 검증

- Storybook: 모든 Button variant·size와 polymorphic Link를 light/dark에서 확인한다.
- 학습자: `/`, `/app/courses`, `/app/courses/[id]`, `/app/profile`, 레슨의 선택형 step을 desktop/mobile에서 확인한다.
- 어드민: sidebar, `/settings`, `/debug/steps`를 확인한다.
- 실제 pointer press, keyboard focus, disabled, dropdown open 상태에서 scale 적용 여부를 비교한다.
- 로컬 브라우저/E2E가 필요하면 `ENABLE_TEST_AUTH=true` 테스트 전용 로그인만 사용한다.

## 검증 결과

- `bun run lint`: 통과. 디자인 시스템 기준선에서 legacy button motion class는 `0/0`이다.
- `bun run typecheck`: 16개 워크스페이스 대상 전체 통과.
- `bun --filter @workspace/ui test`: 31개 테스트 통과.
- `bun --filter @workspace/web test`: 125개 통과, 1개 skip.
- `bun --filter @workspace/admin test`: 219개 테스트 통과.
- `bun run test:storybook`: 179개 테스트 통과.
- CI용 `.test` origin 환경 변수를 사용한 `bun run build`: web, admin, Storybook, admin API 전체 통과.
- `bun run check:ui-style-compiled-css`: web, admin, Storybook의 production CSS에서 button press selector를 확인했다.
- 개발 Storybook 실브라우저 검증: 재사용 link와 button이 렌더링되고, `className` 크기 재정의, keyboard focus, expanded trigger의 scale 제외가 정상 동작했다.
- production Storybook 정적 산출물은 직접 브라우저로 열 때 mocker 초기화의 `useSyncExternalStore` 오류로 story를 렌더링하지 못했다. build와 Storybook test는 통과했으며 이번 변경과의 연관성은 확인 필요다.
- `apps/**`, `packages/**`에서 `btn-squish` 검색 결과: 0건.
- 전체 script 테스트 중 `admin-dev-lifecycle.test.ts`는 작업 전부터 사용 중인 3001 포트 때문에 사전 조건을 충족하지 못했다. 이번 변경 대상인 디자인 시스템 guardrail과 compiled CSS sentinel 테스트는 통과했다.

## 롤아웃과 롤백

- 순서는 공통 API → `packages/ui` → web → admin → utility·문서 제거로 고정한다. API가 먼저 안정화되므로 호출부별 변경은 독립 commit으로 나눌 수 있다.
- 각 단계에서 visual 또는 접근성 회귀가 발생하면 해당 호출부만 이전 class 조합으로 되돌리고, `.btn-squish` utility 삭제는 전체 기준선이 통과할 때까지 수행하지 않는다.
- `buttonVariants`의 공개 variant·size 이름은 바꾸지 않는다. 소비자 API를 확장해야 하는 필요가 발견되면, 기존 `className` override로 표현할 수 없는 근거와 Storybook matrix를 먼저 제시한다.

## 범위 밖

- 모든 interactive 요소를 `Button` 컴포넌트로 교체하는 작업
- `buttonVariants`의 새 variant/size 추가
- 레슨 탭의 ARIA role 재설계, 화면 layout 리팩터링, 토큰 재정의
- Kwep 프로토타입의 `.btn-squish` 원본 변경

이 항목들은 이번 목표인 스타일 재사용 경로 통일과 직접 관련이 없으므로 포함하지 않는다.
