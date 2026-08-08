# Storybook에서 Astro로 디자인 시스템 문서를 이전하고 앱을 제거하는 계획

## 문서 상태

- 상태: 구현과 검증 완료
- 기준 시각: 2026-08-09 KST
- 연계 작업: [`Luma UI 전체 전환`](../2026-08-08-luma-ui-migration/plan.md)
- 기준 소스: 현재 작업 트리의 [`apps/storybook`](../../../apps/storybook/)

현재 작업 트리에는 수정 중인 Storybook 파일과 새 story가 있다.

구현자는 `HEAD`가 아니라 현재 작업 트리를 기준으로 이전 목록을 다시 고정해야 한다.

이미 삭제된 legacy story 5개는 폐기된 디자인을 설명하므로 복원하지 않는다.

## 목표

1. [`apps/ui`](../../../apps/ui/)를 디자인 시스템 설명과 실행 예제의 단일 Astro 앱으로 만든다.
2. 현재 Storybook의 설명, 예제, 상태, control, fixture와 검증 계약을 빠짐없이 이전한다.
3. 대체 검증이 통과한 뒤 [`apps/storybook`](../../../apps/storybook/)을 삭제한다.
4. Storybook 전용 script, dependency, CI, lint, 문서와 에이전트 계약을 제거한다.
5. Luma registry와 `@workspace/ui`의 소유 경계를 유지한다.

제품 route, 인증, API, 채점 규칙과 registry 공개 URL은 변경하지 않는다.

## 현재 기준선

| 항목                               | 현재 수치 | 이전 완료 기준                                            |
| ---------------------------------- | --------: | --------------------------------------------------------- |
| Storybook source와 설정 파일       |      63개 | 각 파일에 `이전`, `대체`, `삭제` 목적지를 기록한다.       |
| story module                       |      39개 | 모든 module에 Astro 목적지와 검증 목적지를 기록한다.      |
| story export                       |     154개 | 모든 export를 공개 Astro URL과 anchor에 연결한다.         |
| MDX 문서                           |       2개 | 제목, 본문, 표와 코드 예제를 모두 Astro 문서로 옮긴다.    |
| `args` 또는 `argTypes` 보유 module |      18개 | 의미 있는 control과 설명을 Astro playground로 옮긴다.     |
| `docs.description` 보유 module     |      15개 | component와 story 설명을 대상 문서에 옮긴다.              |
| `ci-test` 보유 module              |      35개 | 대응하는 browser render와 접근성 검증을 만든다.           |
| `play` 보유 module                 |       9개 | 기존 사용자 행동과 assertion을 대응 test로 옮긴다.        |
| 최근 Storybook browser test        | 58개 통과 | 각 test의 관찰 가능한 계약을 migration ledger에 연결한다. |
| Astro component 문서               |     115개 | 기존 문서를 유지하고 Storybook 예제를 합친다.             |
| Astro component 예제               |     522개 | 기존 예제를 유지하고 중복 없이 Storybook 상태를 합친다.   |

story 범위는 다음과 같다.

| 범주                        | module | story | 대상 영역                                |
| --------------------------- | -----: | ----: | ---------------------------------------- |
| `Components/UI`             |   22개 | 104개 | 기존 component 문서와 프로젝트 확장 문서 |
| `Components/Lesson`         |   10개 |  38개 | 프로젝트 확장 `Lesson` 문서              |
| `Foundations`               |    4개 |   7개 | Color, Typography, Spacing, Motion       |
| `Patterns/Admin`            |    1개 |   2개 | 관리자 pattern                           |
| `Recipes/Course Management` |    1개 |   2개 | 코스 관리 recipe                         |
| `Quality/Checklist`         |    1개 |   1개 | 품질 기준                                |

`Getting Started/Welcome`과 `Quality/Accessibility Checklist`는 별도 MDX 문서다.

## 수용 기준 비교

| 기준      | 권위 소스                                               | 현재 코드                                            | 차이                                         | 처리                                                                          |
| --------- | ------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| 문서 소유 | [`docs/design/storybook.md`](../../design/storybook.md) | Storybook이 실행 명세를 소유한다.                    | Astro는 component와 block만 설명한다.        | Astro를 실행 가능한 카탈로그로 정하고 새 ADR로 소유권 변경을 기록한다.        |
| 정보 구조 | Storybook preview 설정                                  | 시작하기, 기반, 컴포넌트, 패턴, 레시피, 품질 순서다. | Astro sidebar는 component 목록만 제공한다.   | 같은 순서를 Astro sidebar, mobile menu와 검색에 적용한다.                     |
| 예제      | story source와 Astro guide                              | Storybook 154개와 Astro 522개가 별도로 존재한다.     | 중복과 누락을 자동으로 판정하지 않는다.      | story 단위 ledger와 Astro 문서 validator를 연결한다.                          |
| API 설명  | Storybook autodocs와 component source                   | Storybook은 docgen과 `argTypes`를 사용한다.          | Astro는 일부 공통 Props를 수동으로 제공한다. | 실제 source에서 공개 API metadata를 생성하고 명시적 guide 설명으로 보완한다.  |
| theme     | Storybook toolbar와 Astro theme picker                  | 두 앱 모두 light, dark와 system을 제공한다.          | 상태 저장 방식과 preview 적용 경계가 다르다. | Astro theme 상태를 문서와 격리 preview에 함께 적용한다.                       |
| motion    | Storybook `full`과 `reduced` global                     | Astro는 OS preference CSS만 제공한다.                | 수동 비교 control이 없다.                    | Astro에 `full`과 `reduced` preview control을 추가한다.                        |
| viewport  | Storybook custom viewport                               | 5개 고정 viewport를 제공한다.                        | Astro preview는 page viewport를 공유한다.    | 격리 preview route와 iframe으로 동일한 크기를 제공한다.                       |
| 상호작용  | Storybook `play`와 `ci-test`                            | Chromium에서 focus, keyboard와 상태를 검증한다.      | Astro 전용 browser test가 없다.              | Playwright 기반 Astro browser contract로 옮긴다.                              |
| 접근성    | Storybook addon-a11y                                    | `ci-test` story에서 axe 실패를 차단한다.             | Astro는 문서 validator만 제공한다.           | Astro preview에 직접 axe 검사를 적용한다.                                     |
| 공유 UI   | [`packages/shared/ui`](../../../packages/shared/ui/)    | Storybook은 `@workspace/ui`를 직접 렌더링한다.       | Astro는 registry source를 렌더링한다.        | registry 예제와 workspace 확장 예제를 구분하고 source 동기화 검사를 추가한다. |

## 목표 정보 구조

Astro 문서 sidebar는 다음 순서를 사용한다.

1. 시작하기
2. 파운데이션
3. 컴포넌트
4. 프로젝트 확장
5. 패턴
6. 레시피
7. 품질
8. 블록

| 경로                              | 내용                                        |
| --------------------------------- | ------------------------------------------- |
| `/docs/getting-started`           | Welcome, 사용 방법과 기여 기준              |
| `/docs/foundations/color`         | Overview, Semantic Tokens, Contrast Pairs   |
| `/docs/foundations/typography`    | Scale과 긴 콘텐츠                           |
| `/docs/foundations/spacing`       | spacing scale                               |
| `/docs/foundations/motion`        | full과 reduced motion 비교                  |
| `/docs/components/{slug}`         | registry component와 기존 Storybook UI 상태 |
| `/docs/extensions/theme-selector` | `@workspace/ui` 전용 ThemeSelector          |
| `/docs/extensions/lesson/{slug}`  | 10개 lesson presentation adapter            |
| `/docs/patterns/admin`            | 관리자 overview와 empty result              |
| `/docs/recipes/course-management` | course card와 responsive form               |
| `/docs/quality/content`           | content contract의 Do와 Do not              |
| `/docs/quality/accessibility`     | 기존 접근성 MDX의 전체 설명과 코드          |
| `/docs/blocks`                    | 현재 20개 registry block catalog            |

`Components/UI/Status`는 Spinner 문서의 `loading-states` 예제로 옮긴다.

`Components/UI/ThemeSelector`는 registry item이 아니므로 프로젝트 확장 문서로 옮긴다.

10개 `Components/Lesson` story는 registry JSON을 제공하지 않는 프로젝트 확장 문서로 옮긴다.

## 이전 원칙

### 콘텐츠

1. 각 story export마다 공개 URL, anchor와 새 예제 ID를 기록한다.
2. `docs.description`, JSDoc, control 설명과 렌더링 문구를 함께 옮긴다.
3. MDX의 문단, 표, 코드와 안티패턴 설명을 모두 옮긴다.
4. 동일한 상태가 Astro에 이미 있으면 한 예제로 합친다.
5. 합친 예제는 모든 원본 story ID를 ledger에 역참조한다.
6. 삭제한 제품 기능이나 legacy 디자인을 다시 문서화하지 않는다.

### 문서 모델

1. 문서 데이터를 `registry-component`, `workspace-extension`, `composition`, `foundation`, `quality`로 구분한다.
2. registry component만 설치 명령과 registry JSON 링크를 표시한다.
3. workspace extension은 `@workspace/ui` import와 package source를 표시한다.
4. composition은 조합에 사용한 component와 상태 계약을 표시한다.
5. canonical URL은 실제 문서 경로를 입력으로 받는다.
6. 검색은 component, foundation, extension, pattern, recipe, quality와 block을 모두 색인한다.

### 실행 예제

1. 기존 Astro guide의 코드 생성 방식을 Storybook 이전 예제에도 사용한다.
2. 예제 코드와 실제 preview module은 같은 입력에서 생성한다.
3. 18개 story module의 유효한 `args`와 `argTypes`는 명시적 control schema로 옮긴다.
4. action callback은 현재 값이나 event log가 보이는 React island로 대체한다.
5. `fn()`과 Storybook runtime API는 이전 결과에 남기지 않는다.
6. overlay와 responsive 예제는 site chrome과 분리된 preview route에서 렌더링한다.

### theme, motion과 viewport

1. theme control은 `system`, `light`, `dark`를 제공한다.
2. motion control은 `full`, `reduced`를 제공한다.
3. preview frame은 `360×800`, `430×932`, `834×1112`, `1280×900`, `1440×1000` CSS px를 제공한다.
4. preview route는 media query, portal과 focus 이동을 실제 browser viewport에서 실행한다.
5. 문서 page와 preview frame은 theme과 motion 상태를 동기화한다.
6. preview iframe에는 고유한 접근 가능한 제목을 제공한다.

## 테스트 대체 계약

Storybook 삭제는 test runner 삭제가 아니다.

| 기존 계약                   | 새 소유 위치                                         | 완료 기준                                                          |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| 정적 render와 ARIA          | Astro preview browser test                           | 35개 `ci-test` module의 대응 예제가 error 없이 렌더링된다.         |
| keyboard, focus와 상태 전이 | Astro Playwright test 또는 shared UI Testing Library | 9개 `play` 함수의 사용자 행동과 assertion이 모두 대응된다.         |
| axe 검사                    | Astro preview browser test                           | 대응 예제에서 WCAG 위반이 0건이다.                                 |
| 순수 prop과 state 규칙      | `packages/shared/ui` Vitest                          | browser가 필요 없는 규칙을 가장 작은 package 경계에서 검증한다.    |
| 문서 완전성                 | `apps/ui` 문서 validator                             | 154개 story ID와 2개 MDX ID에 목적지가 있다.                       |
| registry와 package 동기화   | 새 source sync validator                             | UI, block와 hook inventory가 일치하고 허용된 import 변환만 다르다. |
| route, search와 canonical   | Astro build contract                                 | 모든 문서 URL, anchor, 검색 항목과 canonical link가 유효하다.      |

기존 focus guard 제외 규칙은 재현 근거가 있는 경우에만 유지한다.

접근성 runner는 앱의 직접 개발 dependency로 선언한다.

Storybook의 transitive `axe-core`에 의존하지 않는다.

## 실행 단계

### 0. 현재 작업 트리 고정

1. Storybook 63개 파일의 경로와 checksum을 기록한다.
2. 154개 story export와 2개 MDX 문서의 ID를 생성한다.
3. `args`, `argTypes`, 설명, fixture, tag, `play`와 assertion을 추출한다.
4. 각 항목에 Astro 목적지와 test 목적지를 기록하는 `migration-ledger.md`를 만든다.
5. 수정 파일과 새 `dialog`, `lesson`, `popover` story가 ledger에 포함됐는지 확인한다.

완료 기준은 누락된 현재 Storybook 파일과 story ID가 0개인 상태다.

### 1. Astro 문서 기반 확장

1. 범주를 표현하는 판별 가능한 문서 타입을 추가한다.
2. 범용 문서 layout의 canonical, sidebar, 목차와 보조 카드를 수정한다.
3. global navigation, mobile menu와 검색 색인을 새 정보 구조로 확장한다.
4. registry item이 아닌 문서에서 registry JSON 링크를 숨긴다.
5. 격리 preview route와 theme, motion, viewport control을 추가한다.

완료 기준은 목표 정보 구조의 빈 route가 모두 build되는 상태다.

### 2. 시작하기, 파운데이션과 품질 이전

1. Welcome MDX를 `/docs/getting-started`로 옮긴다.
2. Color helper 6개를 Astro foundation module로 옮긴다.
3. token 복사, 해석된 색상값과 contrast 계산 기능을 보존한다.
4. Typography, Spacing과 Motion의 7개 story를 옮긴다.
5. Quality story와 Accessibility MDX를 두 품질 문서로 옮긴다.

완료 기준은 MDX와 foundation·quality ledger 행이 모두 닫힌 상태다.

### 3. component와 lesson 설명 이전

1. `Components/UI`의 104개 story를 기존 component guide에 합친다.
2. Status와 ThemeSelector의 별도 목적지를 적용한다.
3. `Components/Lesson`의 38개 story를 10개 프로젝트 확장 문서로 옮긴다.
4. 18개 module의 control 설명과 조작 기능을 옮긴다.
5. Storybook fixture의 사용자 상태를 Astro 예제 source로 옮긴다.
6. 제품 API, routing과 채점 로직은 fixture에 넣지 않는다.

완료 기준은 component와 lesson의 142개 story 행이 모두 닫힌 상태다.

### 4. pattern과 recipe 이전

1. Admin의 overview와 empty result를 `/docs/patterns/admin`으로 옮긴다.
2. Course Management의 card와 responsive form을 `/docs/recipes/course-management`로 옮긴다.
3. 사용 component, responsive 기준과 복구 행동을 설명한다.

완료 기준은 4개 composition story가 공개 URL에서 실행되는 상태다.

### 5. 대체 검증 병행

1. 35개 `ci-test` module의 새 browser 대상 목록을 실행한다.
2. 9개 `play` 함수의 대응 test를 실행한다.
3. 대응 preview에 직접 axe 검사를 실행한다.
4. Astro 문서 완전성, source sync, route와 검색 검사를 실행한다.
5. 기존 Storybook test와 새 Astro test를 같은 revision에서 모두 실행한다.
6. 차이가 있으면 Storybook을 유지하고 ledger를 다시 연다.

완료 기준은 양쪽 gate가 통과하고 미대응 test 계약이 0개인 상태다.

### 6. Storybook 앱과 도구 제거

Storybook을 먼저 삭제하면 현재 작업 트리의 수정 내용과 검증 계약이 복구하기 어려운 형태로 손실된다.

구현자는 5단계 완료 증거를 확인한 뒤 정확한 [`apps/storybook`](../../../apps/storybook/) 경로만 삭제해야 한다.

1. `apps/storybook`의 63개 현재 파일을 삭제한다.
2. root의 `storybook`, `build-storybook`, `test:storybook` script를 제거한다.
3. root repomix의 Storybook include와 ignore를 정리한다.
4. `knip.json`의 Storybook workspace를 제거한다.
5. `.oxlintrc.json`의 Storybook source pattern을 제거한다.
6. dependency-cruiser의 Storybook 전용 output 예외를 제거한다.
7. quality workflow의 Storybook 명령을 Astro browser 명령으로 교체한다.
8. Storybook package와 addon dependency를 제거한다.
9. 사용처가 없는 `@vitest/browser-playwright`와 Storybook 전용 build dependency를 제거한다.
10. `bun install`로 root lockfile을 한 번 갱신한다.
11. lockfile을 수동으로 편집하지 않는다.

완료 기준은 active source와 lockfile의 Storybook package 참조가 0개인 상태다.

### 7. 권위 문서와 작업 계약 확정

1. `docs/design/storybook.md`를 `docs/design/ui-documentation.md`로 대체한다.
2. `docs/design/_index.md`, `foundations.md`와 `design-brief.md`의 소유 경계를 갱신한다.
3. `docs/authority-map.md`에서 실행 가능한 UI 카탈로그를 Astro에 연결한다.
4. `docs/engineering/testing.md`, `frontend-development.md`, `deployment.md`, `code-style.md`와 `lesson-runtime.md`를 갱신한다.
5. `ADR-0029`에 Astro 카탈로그와 대체 browser gate 결정을 기록한다.
6. `ADR-0002`와 `ADR-0003`의 Storybook 결정은 새 ADR이 대체했다고 기록한다.
7. root `AGENTS.md`, PR template, root README와 shared UI README를 갱신한다.
8. `implement-ui` skill과 agent metadata를 Astro 문서·검증 계약으로 갱신한다.
9. 완료 후 이 작업 디렉터리를 같은 이름으로 `docs/archive`에 이동한다.

완료 기준은 active 문서와 작업 지침에 Storybook 실행 요구가 0개인 상태다.

## 검증 계획

구현 중 사용할 새 script 이름은 root manifest가 최종 소유한다.

계획에서는 다음 역할을 요구한다.

```sh
bun --filter @workspace/ui-registry docs:validate
bun --filter @workspace/ui-registry registry:validate
bun --filter @workspace/ui-registry build
bun run test:ui-docs
bun --filter @workspace/ui test
bun run ci:static
bun run ci:tests
bun run build
bun run check:route-bundles
bun run audit:production
bun run audit:full
```

dependency 제거 뒤 다음 순서로 재현성을 확인한다.

```sh
bun install
bun install --frozen-lockfile
```

활성 참조 검사는 ADR과 archive를 제외하고 실행한다.

```sh
rg -n "apps/storybook|@workspace/storybook|test:storybook|build-storybook" . \
  --glob "!docs/archive/**" \
  --glob "!docs/engineering/adr/**"
rg -n '"@storybook/|"storybook"|storybook@' package.json bun.lock apps packages
```

두 검색의 결과는 0개여야 한다.

## 수동 확인 matrix

1. 문서 page와 preview를 light와 dark에서 확인한다.
2. preview를 5개 지정 viewport에서 확인한다.
3. 320 CSS px와 200% 확대에서 정보와 행동 손실이 없는지 확인한다.
4. keyboard만으로 search, sidebar, control과 9개 interaction을 완료한다.
5. overlay가 열린 뒤와 닫힌 뒤의 focus 위치를 확인한다.
6. full과 reduced motion의 차이를 확인한다.
7. 긴 한국어 콘텐츠와 empty, loading, error, disabled, invalid 상태를 확인한다.
8. browser console의 error와 warning이 0개인지 확인한다.

## 위험과 대응

| 위험                                            | 결과                                             | 대응                                                             |
| ----------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 현재 Storybook 수정 내용을 기준선에서 빠뜨린다. | 새 Luma story와 설명이 삭제된다.                 | 현재 작업 트리의 checksum과 story ID를 먼저 고정한다.            |
| 화면만 옮기고 `play`와 axe를 제거한다.          | keyboard, focus와 접근성 회귀가 차단되지 않는다. | test 목적지가 없는 story 행에서는 앱 삭제를 금지한다.            |
| Astro container 폭만 바꾼다.                    | viewport media query를 실제로 검증하지 못한다.   | 격리 preview iframe의 browser viewport를 바꾼다.                 |
| registry source와 `@workspace/ui`가 달라진다.   | 문서 예제와 제품 동작이 다르게 보인다.           | inventory와 허용된 import 변환을 검사하는 sync gate를 추가한다.  |
| Storybook dependency가 lockfile에 남는다.       | 공급망과 유지보수 비용이 계속 남는다.            | direct 선언 제거 뒤 lockfile 검색과 audit를 실행한다.            |
| 모든 변경을 한 번에 삭제한다.                   | 회귀 원인과 rollback 지점을 찾기 어렵다.         | Astro 추가, 병행 gate, Storybook 삭제를 별도 변경 단위로 나눈다. |

## 전체 완료 기준

- Storybook 63개 파일의 처리 상태가 모두 닫혀 있다.
- 154개 story export가 공개 Astro URL과 anchor에 연결되어 있다.
- 2개 MDX 문서의 제목, 본문, 표와 코드가 모두 이전되어 있다.
- 18개 control module의 유효한 조작과 설명이 이전되어 있다.
- 35개 `ci-test` module과 9개 `play` module의 계약이 대체 test에 연결되어 있다.
- Astro가 시작하기, 파운데이션, 컴포넌트, 프로젝트 확장, 패턴, 레시피, 품질과 블록을 제공한다.
- theme, motion과 5개 viewport control이 동작한다.
- `apps/storybook` 디렉터리가 없다.
- Storybook script, dependency, lockfile entry와 active 문서 요구가 없다.
- 새 Astro 문서·browser·접근성 gate가 통과한다.
- 필수 root gate 결과와 기존 환경 장애가 분리되어 기록되어 있다.

## 완료 결과

2026-08-09에 모든 이관 행을 닫았다. `apps/ui`는 디자인 시스템 설명, 실행 예제, 격리 preview, shadcn registry와 browser contract를 함께 제공한다. `apps/storybook`의 source, 설정, dependency, script와 CI 참조를 제거했다.

검증 결과와 기존 환경 장애는 `validation-report.md`에 기록했다.
