# 코드베이스 개선 작업 계획

## 문서 상태

- 작성일: 2026-07-13
- 리뷰 반영일: 2026-07-13
- 대상 저장소: `writing-app`
- 대상 런타임: Bun `1.3.10`, Node.js `24.x`
- 확인된 설치 버전: Bun `1.3.14`, Node.js `24.15.0`, Turborepo `2.10.4`, Vitest `4.1.10`, Playwright `1.61.1`
- 상태: 변경 단위 1 완료, 변경 단위 2 단계 4~5 완료
- 구현 단위: 독립적으로 병합·롤백 가능한 5개 변경 단위

## 목적

이 계획은 현재 코드와 설정에서 재현된 검증 누락, 중복 실행, 캐시 무효화, 개발 프로세스 수명, 브라우저 테스트 관측성, UI 스타일 빌드 책임 문제를 해결한다.

개선은 다음 원칙을 따른다.

- correctness를 성능보다 먼저 복구한다.
- 기존 `lint`, `typecheck`, `test`, `test:coverage`, `build` 명령을 유지한다.
- 새로운 사용자 정의 명령을 업계 표준처럼 취급하지 않는다.
- workspace와 검증 범위는 하드코딩하지 않고 저장소의 실제 상태에서 결정한다.
- Node/Vitest와 Bun runtime의 차이를 숨기지 않는다.
- root tooling test는 파일별 실행 runtime을 명시하고 Bun과 Node 실행 범위를 섞지 않는다.
- 측정 없이 병렬성, coverage 기준, 원격 캐시를 확대하지 않는다.
- 각 변경 단위는 다음 변경 단위와 독립적으로 전체 회귀 검증과 문서 동기화를 완료한다.
- 각 변경은 기존 Module의 Interface를 줄이고 Implementation의 Locality와 Leverage를 높여야 한다.

## 범위

### 포함

- workspace inventory와 repository tooling
- CI와 로컬 검증 명령의 일치
- 전체 테스트와 coverage 책임 분리
- Turborepo task hash와 환경 변수 설정
- Bun·Node toolchain 재현성
- 로컬 개발 서버 setup과 장기 프로세스 분리
- Playwright flaky 테스트 관측성
- Tailwind 실행 책임과 공유 UI 스타일 Seam
- UI style Seam 변경의 컴파일 CSS와 시각 회귀 검증
- 위 변경에 직접 영향받는 엔지니어링 문서

### 제외

- 제품 기능 추가
- 도메인 모델 또는 HTTP 계약 변경
- 인증·권한·데이터 migration 정책 변경
- 측정 결과가 없는 coverage 목표 수치 상향
- 측정 결과가 없는 원격 캐시 도입
- 범용 process supervisor 신규 구현
- ADR-0002가 금지한 feature Module의 `packages/ui` 이동

## 확인된 현재 문제

### 1. CI workspace inventory가 현재 저장소와 불일치한다

- 실제 workspace는 16개다.
- `scripts/ci-workspace-inventory.test.ts`는 15개 행을 기대한다.
- `scripts/ci-workspace-inventory.ts`는 제목을 `15개 workspace`로 하드코딩한다.
- 현재 재현 결과는 `Expected 15 / Received 16`으로 실패한다.
- 스크립트는 manifest에 명령이 존재하는지만 확인하고 실제 실행 여부와 무관하게 `실행`이라고 표시한다.

### 2. workspace 발견 Implementation이 여러 스크립트에 중복되어 있다

다음 파일이 workspace glob과 `package.json`을 각자 읽는다.

- `scripts/check-workspace-inventory.ts`
- `scripts/check-import-cycles.ts`
- `scripts/check-document-drift.ts`
- `scripts/ci-workspace-inventory.ts`

이 중복은 workspace가 추가될 때 검증 도구마다 서로 다른 결과를 만들 수 있다. `packages/repository-tooling`은 이미 repository inventory와 import graph를 소유하므로 workspace 발견도 같은 Module 안에 두는 것이 기존 package 목적에 부합한다.

### 3. CI가 전체 테스트를 실행하지 않는다

- `.github/workflows/quality-gates.yml`의 test job은 루트 `test`를 실행하지 않고 `test:coverage`만 실행한다.
- `scripts/run-workspace-coverage.ts`는 13개 프로젝트만 열거하고 `packages/repository-tooling`을 제외한다.
- 8개 workspace는 일부 `coverageTests`만 Vitest positional filter로 실행한다.
- root `scripts` 테스트 중 `check-document-drift.test.ts`, `csp-policy.test.ts`는 CI 명시 목록에 없다.
- `bun test scripts`는 경로 부분 문자열 filter이므로 `apps/admin-api/src/scripts`까지 선택하며 root tooling test 범위를 보장하지 않는다.
- `scripts/oxlint/workspace-rules.test.mjs`는 Node.js에서 실행해야 하므로 root tooling test를 하나의 Bun 실행으로 합칠 수 없다.
- `vitest.workspace.ts`에는 14개 프로젝트가 있지만 `docs/engineering/testing.md`는 13개라고 설명한다.

### 4. coverage가 correctness와 orchestration 책임을 함께 가진다

- coverage runner가 workspace별 일반 테스트 실행, coverage 수집, LCOV 저장, 핵심 파일 threshold 검사를 모두 담당한다.
- Bun 경계 4개 프로젝트는 전체 Vitest 실행 후 선택 테스트를 Bun coverage로 다시 실행한다.
- 핵심 파일 threshold가 모두 1%라서 위험 기반 회귀 방지보다 실행 여부 확인에 가깝다.
- 13개 프로젝트를 순차 실행하므로 비용이 크지만, CPU·SQLite 경합을 측정하지 않은 상태에서 무조건 병렬화할 수도 없다.

Vitest V8 coverage가 Bun runtime에서 동작하지 않는다는 공식 제약 때문에 Node/Vitest와 Bun native coverage를 함께 사용하는 결정 자체는 유지한다.

### 5. 로컬·hook·CI의 정적 검증 범위가 다르다

- `check:package-interfaces`는 pre-commit에만 있다.
- `check:localhost-literals`는 CI에만 있다.
- `check:document-drift`와 `check:components-config`는 필수 품질 workflow와 별도 document workflow에서 중복 실행된다.
- root `lint`와 CI static job이 서로 다른 검사를 직접 나열한다.

### 6. Turborepo global hash 범위가 지나치게 넓다

- `turbo.json`은 35개 값을 `globalEnv`에 둔다.
- `GITHUB_STEP_SUMMARY`처럼 task 산출물에 영향을 주지 않는 step별 경로도 전체 task hash에 포함된다.
- 앱 하나에만 영향을 주는 환경 변수 변경이 모든 workspace task의 cache miss를 만들 수 있다.
- CI는 Bun download cache만 보존하며 Turbo cache 효율과 miss 원인을 기록하지 않는다.

### 7. toolchain 대상과 실제 실행 버전이 다르다

- `package.json`은 Bun `1.3.10`, Node `24.x`를 선언한다.
- 현재 로컬은 Bun `1.3.14`, Node `24.15.0`이다.
- CI는 Bun `1.3.10`을 명시하지만 직접 사용하는 Node.js 버전은 명시하지 않는다.
- Bun type package와 TypeScript `types` 설정이 `bun-types`와 `bun`으로 혼재한다.

### 8. admin 개발 명령이 setup과 장기 실행을 결합한다

- `dev:admin`은 migration, seed, admin seed 이후 장기 dev process를 실행한다.
- `dev:app`과 `dev:app:setup`은 이미 분리되어 있어 두 개발 Interface가 일관되지 않다.
- Next와 Bun의 기존 watcher는 유지할 수 있지만, 종료 후 port와 `.next` lock이 해제되는지 검증하는 회귀 기준이 부족하다.

### 9. Playwright가 flaky 결과를 분류하지 않는다

- `retries`가 0이라서 최초 실패 후 성공하는 flaky 상태를 구분할 수 없다.
- trace는 `retain-on-failure`로 설정되어 있다.
- 고정 port와 공유 SQLite 때문에 `workers`를 바로 늘리면 격리가 깨질 수 있다.

### 10. 공유 UI가 Tailwind 실행 Implementation을 소유한다

- `packages/ui/src/styles/globals.css`가 Tailwind import, typography plugin, source scan, token과 utility CSS를 모두 소유한다.
- `apps/web`, `apps/admin`, `apps/storybook`은 이 파일을 가져오면서 Tailwind plugin 해석과 설치 책임까지 간접적으로 가진다.
- Storybook의 `@tailwindcss/typography` 누락이 실제 isolated build 실패로 이어진 이력이 있다.

ADR-0002는 `packages/ui`가 도메인 비의존 token, 접근성, 상태 표현을 제공하는 Deep Module이어야 한다고 결정한다. Tailwind/PostCSS 실행은 앱 Adapter가 소유하고 공유 UI는 token과 공통 style Implementation을 제공하는 방향이 이 결정과 일치한다.

## 목표 구조

| 관심사              | 현재                               | 목표                                           |
| ------------------- | ---------------------------------- | ---------------------------------------------- |
| workspace inventory | 여러 스크립트가 독립 발견          | `packages/repository-tooling`의 한 Deep Module |
| CI 실행 보고        | manifest 명령 존재를 실행으로 표시 | 실제 task 결과와 선택 범위 보고                |
| correctness         | coverage runner가 부분 대행        | 전체 `test`와 root tooling test가 별도 보장    |
| coverage            | 테스트 실행과 coverage 수집 결합   | runtime별 Adapter와 명시적 aggregation         |
| 정적 검증           | root, hook, CI 목록이 다름         | 기존 root 명령을 canonical Interface로 사용    |
| Turbo env           | 대부분 `globalEnv`                 | 실제 소비 task에 Locality 확보                 |
| toolchain           | 선언과 실행 버전 불일치            | CI와 로컬에서 같은 대상 검증                   |
| admin dev           | setup과 장기 process 결합          | 명시적 setup과 장기 process 분리               |
| E2E flaky           | 최초 실패만 기록                   | flaky 분류, 실패, trace 확보                   |
| UI style            | 공유 package가 build engine 소유   | 앱 Adapter가 Tailwind 실행 소유                |

### Canonical inventory 파생 집합

Canonical inventory는 하나의 평면 목록이나 고정 숫자가 아니라 같은 workspace manifest 집합에서 파생한 명시적 집합이다.

| 집합                    | 의미                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `allWorkspaces`         | root `workspaces` glob에서 발견하고 manifest를 검증한 전체 |
| `testCapableWorkspaces` | `test` script와 실행 runtime이 명시된 workspace            |
| `coverageTargets`       | coverage runner, 대상 파일, runtime Adapter가 명시된 항목  |
| `coverageExclusions`    | coverage에서 제외되며 구조화된 사유가 있는 workspace       |
| `storybookTargets`      | 일반 `test`와 분리된 Storybook interaction·접근성 테스트   |
| `rootToolingTests`      | workspace 밖의 repository script test와 Bun·Node 실행 정보 |

`vitest.workspace.ts`, coverage 목록, CI summary는 이 파생 집합과 대조한다. 실행 보고는 `지원`, `실행`, `cache hit`, `실패`, `건너뜀`, `제외`를 구분하며 고정 workspace 수를 성공 조건으로 사용하지 않는다.

## 변경 단위와 작업 순서

P0 복구가 P1·P2 작업에 종속되지 않도록 다음 변경 단위를 각각 독립적으로 병합한다. 각 변경 단위는 포함 단계가 끝난 즉시 단계 10의 전체 회귀 검증과 관련 문서 동기화를 수행한다.

| 변경 단위 | 포함 단계 | 병합 조건                                       |
| --------- | --------- | ----------------------------------------------- |
| 1         | 1~3, 10   | correctness와 coverage 게이트가 독립적으로 통과 |
| 2         | 4~6, 10   | 정적 검증·cache hash·toolchain 계약이 통과      |
| 3         | 7, 10     | admin lifecycle 자동 smoke가 통과               |
| 4         | 8, 10     | flaky 분류와 trace artifact 검증이 통과         |
| 5         | 9, 10     | isolated build·컴파일 CSS·시각 회귀가 통과      |

단계 번호는 구현 의존성을 나타내며 하나의 대규모 PR을 의미하지 않는다.

| 완료 상태 | 단계 | 작업                                 | 우선순위 | 선행 조건                |
| --------- | ---- | ------------------------------------ | -------- | ------------------------ |
| ✅        | 1    | workspace inventory Module 통합      | P0       | 없음                     |
| ✅        | 2    | CI 전체 테스트 실행과 실행 보고 교정 | P0       | 단계 1                   |
| ✅        | 3    | correctness와 coverage 책임 분리     | P0       | 단계 1, 2                |
| ✅        | 4    | 정적 검증 Interface 정렬             | P1       | 단계 1                   |
| ✅        | 5    | Turbo env와 cache hash 정밀화        | P1       | 단계 2, 4                |
| ❌        | 6    | toolchain 재현성 고정                | P1       | 단계 2                   |
| ❌        | 7    | admin 개발 lifecycle 정리            | P2       | 단계 2, 6                |
| ❌        | 8    | Playwright flaky 관측성 추가         | P2       | 단계 2                   |
| ❌        | 9    | UI style build Seam 이동             | P2       | 단계 2, 4                |
| ❌        | 10   | 전체 회귀 검증과 문서 동기화         | P0       | 각 변경 단위의 포함 단계 |

## 단계 1. Workspace inventory Module 통합

### 목표

workspace 발견과 manifest 해석을 `packages/repository-tooling`의 하나의 Interface 뒤에 둔다. 네 개 스크립트는 같은 결과를 소비하는 Adapter가 된다.

### 변경 대상

- `packages/repository-tooling/src/*`
- `packages/repository-tooling/src/index.ts`
- `scripts/check-workspace-inventory.ts`
- `scripts/check-import-cycles.ts`
- `scripts/check-document-drift.ts`
- `scripts/ci-workspace-inventory.ts`
- 관련 테스트 fixture

### 구현 작업

1. root `package.json`의 `workspaces` glob을 읽고 실제 package manifest를 반환하는 Implementation을 repository-tooling 내부로 이동한다.
2. package path, package name, scripts, exports, Vitest config 존재 여부, test runtime처럼 현재 소비자가 실제로 사용하는 정보만 Interface에 포함한다.
3. 지원하지 않는 glob, 누락된 manifest, 중복 package name을 명시적 오류로 반환한다.
4. 기존 네 스크립트의 개별 filesystem 탐색 코드를 삭제하고 절대 import로 공통 Module을 사용한다.
5. 같은 inventory에서 `testCapableWorkspaces`, `coverageTargets`, `coverageExclusions`, `storybookTargets`를 파생하고 포함·제외 사유를 구조화한다.
6. fixture repository를 이용해 workspace 추가·삭제·중복·잘못된 glob과 task capability 변경을 검증한다.

### 완료 조건

- workspace 수를 하드코딩한 코드가 없다.
- 네 소비자가 동일한 workspace 집합을 사용한다.
- 전체 workspace와 test·coverage·Storybook 파생 집합의 관계가 한 Interface에서 확인된다.
- 새 workspace fixture를 추가하면 모든 inventory 소비자 결과에 자동 반영된다.
- duplicate utility가 남지 않는다.

### 검증

```bash
bun run --filter=@workspace/repository-tooling test
bun run --filter=@workspace/repository-tooling typecheck
bun run check:workspace-inventory
bun run check:document-drift
bun run check:import-cycles
```

## 단계 2. CI 전체 테스트 실행과 실행 보고 교정

### 목표

CI가 전체 테스트를 실제로 실행하고, 실행된 범위와 결과만 보고하게 한다.

### 변경 대상

- `.github/workflows/quality-gates.yml`
- `scripts/ci-workspace-inventory.ts`
- `scripts/ci-workspace-inventory.test.ts`
- `scripts/oxlint/workspace-rules.test.mjs`
- root `scripts/*.test.ts`
- `docs/engineering/testing.md`

### 구현 작업

1. test job에서 기존 root `test`를 실행해 `test` script가 있는 workspace의 Turbo task graph를 검증한다.
2. root Bun tooling test는 exact directory path인 `bun test ./scripts`로 실행하고 Node 전용 test가 Bun discovery에 포함되지 않게 한다.
3. `scripts/oxlint/workspace-rules.test.mjs`는 Bun discovery pattern과 겹치지 않는 `workspace-rules.node-test.mjs`로 이름을 바꾸고 기존처럼 Node.js로 별도 실행한다.
4. root Bun tooling test의 test API는 `bun:test`로 통일하고 Vitest runtime을 암묵적으로 가져오지 않는다.
5. `packages/repository-tooling` 테스트가 CI task 결과에서 실행 또는 cache hit로 확인되는지 고정한다.
6. `ci-workspace-inventory.ts`의 `15개` 하드코딩을 제거한다.
7. manifest에 script가 존재한다는 의미는 `지원`으로 표현하고 `실행`과 구분한다.
8. 실제 실행 보고는 Turborepo `2.10.4`의 `--summarize` fixture로 schema를 고정한 뒤 `실행`, `cache hit`, `실패`, `건너뜀`을 판정한다. command가 없는 task record를 실행으로 계산하지 않고 manifest 추론으로 성공을 만들지 않는다.
9. `testCapableWorkspaces`와 `vitest.workspace.ts`의 관계를 검사하고 현재 파생 결과인 14개가 문서 목록과 일치하게 한다. 숫자 자체는 하드코딩하지 않는다.

### 완료 조건

- 현재 실패하는 `ci-workspace-inventory.test.ts`가 통과한다.
- 현재 `testCapableWorkspaces`에서 파생되는 14개 Vitest 프로젝트와 root tooling test가 실행된다.
- root tooling test가 Bun과 Node runtime 경계를 지키며 앱 내부 `src/scripts` 테스트를 중복 선택하지 않는다.
- `packages/repository-tooling`을 실행하지 않고 실행했다고 표시할 수 없다.
- 새 workspace 추가 시 고정 숫자 수정이 필요하지 않다.
- 실패 task가 있어도 summary가 이를 성공으로 표현하지 않는다.

### 검증

```bash
bun test ./scripts/ci-workspace-inventory.test.ts
bun test ./scripts
node scripts/oxlint/workspace-rules.node-test.mjs
bun run test
bunx turbo run test --dry=json
bunx turbo run test --summarize
```

## 단계 3. Correctness와 coverage 책임 분리

### 목표

전체 테스트 통과와 coverage 수집을 서로 독립적으로 판정한다. coverage 결과가 전체 테스트 실행을 대신하지 않게 한다.

### 변경 대상

- `scripts/run-workspace-coverage.ts`
- `vitest.workspace.ts`
- workspace별 `vitest.config.ts`
- `.github/workflows/quality-gates.yml`
- `docs/engineering/testing.md`

### 구현 작업

1. 전체 correctness는 단계 2의 root `test`가 소유한다.
2. coverage runner의 프로젝트 목록을 단계 1의 inventory 결과와 대조한다.
3. coverage에서 제외되는 workspace마다 runtime이 없거나 coverage 대상이 아닌 명시적 사유를 둔다.
4. Node/Vitest V8 Adapter와 Bun native Adapter를 코드 구조에서 분리한다.
5. LCOV aggregation과 threshold 판정을 runner 실행 orchestration에서 분리한다.
6. 선택 테스트만 실행하는 coverage 경로를 전체 테스트라고 표현하지 않는다.
7. 1% threshold를 임의의 공통 숫자로 교체하지 않는다. 현재 baseline을 기록한 뒤 인증, repository, migration, 동기화처럼 위험이 높은 파일부터 기존 coverage 이하로 하락하지 않는 기준을 설정한다.
8. Vitest duration breakdown과 coverage debug 결과로 순차 실행 비용을 측정한다.
9. correctness와 coverage가 독립 판정을 위해 같은 test를 다시 실행하는 비용은 의도된 비용으로 따로 기록한다.
10. 측정 뒤 CPU와 SQLite 경합이 없는 workspace만 제한된 동시성으로 실행한다. 무조건 `Promise.all`을 사용하지 않는다.

### 완료 조건

- correctness 실패와 coverage 실패가 별도 원인으로 보고된다.
- Vitest V8 coverage를 Bun runtime에 적용하지 않는다.
- coverage 대상·제외 사유·runner가 한 곳에서 확인된다.
- 위험 파일 threshold에 baseline과 근거가 기록된다.
- correctness와 coverage 사이의 의도된 재실행 비용이 CI duration에 기록된다.
- coverage runner 내부의 불필요한 동일 테스트 재실행은 측정 전보다 증가하지 않는다.

### 검증

```bash
bun run test
bun run test:coverage
bun run --filter=@workspace/repository-tooling test
bun run check:workspace-inventory
```

## 단계 4. 정적 검증 Interface 정렬

### 목표

로컬과 CI가 기존 root 명령을 같은 의미로 사용하게 한다. CI 전용·hook 전용 검사를 최소화한다.

### 변경 대상

- `package.json`
- `lefthook.yml`
- `.github/workflows/quality-gates.yml`
- `.github/workflows/document-drift.yml`
- 관련 검사 스크립트와 테스트

### 구현 작업

1. `check:package-interfaces`와 `check:localhost-literals`의 필수 실행 위치를 root 검증 흐름에 통합한다.
2. CI static job은 검사 목록을 다시 작성하지 않고 가능한 한 기존 `lint`, `format:check`, `typecheck`를 호출한다.
3. pre-commit은 staged file 기반의 빠른 검증을 유지하고, 전체 검증을 흉내 내지 않는다.
4. document drift와 components config 검사를 두 workflow에서 중복 실행하지 않는다.
5. 별도 document workflow가 branch protection의 required check라면 check 이름을 보존하거나 설정을 변경한 뒤 통합한다. 이 상태는 저장소만으로 확정할 수 없어 적용 전 확인이 필요하다.
6. 일반 검증은 기존 fail-fast 동작을 유지한다. 여러 독립 실패를 수집해야 할 때만 Turborepo 공식 `--continue=dependencies-successful`을 일회성 진단에 사용한다.

### 완료 조건

- 로컬 `lint` 통과와 CI static 검증 통과가 같은 필수 검사 집합을 의미한다.
- 필수 검사가 hook에만 있거나 CI에만 있는 상태가 없다.
- 동일 commit에서 document drift 검사가 중복 실행되지 않는다.
- 새로운 root 명령은 기존 명령으로 목적을 명확히 표현할 수 없는 경우에만 추가하고 repository 전용 검사임을 문서화한다.

### 검증

```bash
bun run lint
bun run format:check
bun run typecheck
bun lefthook run pre-commit
```

## 단계 5. Turbo 환경 변수와 cache hash 정밀화

### 목표

task 결과에 실제 영향을 주는 값만 hash에 포함해 cache Locality를 높인다.

### 변경 대상

- `turbo.json`
- workspace `package.json`
- `.github/workflows/quality-gates.yml`
- 환경 변수 관련 검증 테스트

### 구현 작업

1. `GITHUB_STEP_SUMMARY`를 `globalEnv`에서 제거한다.
2. task가 값은 필요하지만 산출물 hash에는 영향을 받지 않는 경우 `passThroughEnv` 사용 가능성을 검증한다.
3. 앱 전용 환경 변수는 실제 소비 앱과 task의 `env`로 이동한다.
4. lint, typecheck처럼 runtime URL과 무관한 task가 불필요하게 cache miss되지 않는지 확인한다.
5. `tsc --noEmit`인 admin-api build는 package task override에서 output이 없는 task로 명시해 잘못된 output 경고를 제거한다.
6. 변경 전후 `--dry=json`과 `--summarize`로 task hash와 cache hit 원인을 비교한다.
7. PR 변경 범위 최적화가 필요하면 충분한 Git history를 준비한 뒤 공식 `--affected`를 선행 피드백에만 적용한다. 전역 검사와 main 통합 전체 검증은 유지한다.
8. 원격 캐시는 서로 다른 머신 간 중복 실행이 실제 병목으로 측정될 때 별도 결정한다.

### 완료 조건

- `GITHUB_STEP_SUMMARY` 값 변경만으로 전체 task hash가 달라지지 않는다.
- 앱 하나의 runtime URL 변경이 무관한 workspace lint hash를 바꾸지 않는다.
- admin-api build output 경고가 사라진다.
- cache 변경 전후 근거가 Turbo summary로 남는다.

### 검증

```bash
bunx turbo run lint typecheck build --dry=json
bunx turbo run lint typecheck build --summarize
bun run lint
bun run typecheck
bun run build
```

## 단계 6. Toolchain 재현성 고정

### 목표

Bun은 exact version을 사용하고 Node.js는 지원 major를 사용한다. 로컬과 CI의 불일치를 작업 초기에 자동으로 발견한다.

- Bun 계약: `packageManager`가 선언한 exact `1.3.10`
- Node.js 계약: `engines.node`가 선언한 `24.x`
- CI: Bun `1.3.10`, Node.js `24.x`를 명시적으로 setup
- 로컬: Bun exact version과 Node major를 자동 검사

### 변경 대상

- `package.json`
- `.github/workflows/quality-gates.yml`
- `scripts/check-toolchain.ts`
- `scripts/check-toolchain.test.ts`
- Bun type package와 관련 `tsconfig.json`
- `README.md`
- `AGENTS.md`

### 구현 작업

1. 모든 CI job에서 Node.js `24.x`를 `actions/setup-node`로 명시한다.
2. 기존 `oven-sh/setup-bun`의 Bun `1.3.10` 고정을 유지한다.
3. 현재 Bun `1.3.14`가 `packageManager: bun@1.3.10`을 거부하지 않는 것이 재현되었으므로 manifest 선언만으로 exact version이 강제된다고 가정하지 않는다.
4. `check:toolchain`은 `packageManager`와 `engines`를 canonical source로 읽어 현재 Bun exact version과 Node major를 검사한다. 검사 코드에 version 상수를 복제하지 않는다.
5. `check:toolchain`을 로컬 필수 검증과 모든 CI job의 install 이전 preflight에 연결한다. CI workflow 선언과 manifest가 어긋나는 fixture도 검증한다.
6. `bun-types`와 `types: ["bun-types"]` 사용처를 공식 `@types/bun`과 `types: ["bun"]` 관용으로 통일할 수 있는지 Bun `1.3.10` 호환 버전을 먼저 확인한다.
7. 문서의 `bun 1310` 표기를 `bun 1.3.10`으로 교정한다.

### 완료 조건

- CI log에서 Bun `1.3.10`과 Node.js `24.x`가 명확히 확인된다.
- Bun `1.3.10`이 아닌 로컬 runtime과 Node.js 24가 아닌 runtime은 자동 검사에서 실패한다.
- 로컬 target 문서와 workflow 설정이 root manifest와 일치한다.
- Bun type package가 하나의 관용으로 통일되거나, 유지해야 하는 구체적 이유가 문서화된다.
- version 값이 여러 스크립트에 중복 하드코딩되지 않는다.

### 검증

```bash
bun run check:toolchain
bun --version
node --version
bun run typecheck
bun run lint
bun run build
```

## 단계 7. Admin 개발 lifecycle 정리

### 목표

일회성 DB setup과 장기 실행 dev process를 분리하고, 기존 watcher를 유지한 상태에서 시작·종료를 결정적으로 만든다.

### 변경 대상

- `package.json`
- `apps/admin/package.json`
- `apps/admin-api/package.json`
- `apps/admin-api/src/dev-environment.ts`
- `.github/workflows/quality-gates.yml`
- 개발 실행 관련 테스트
- `scripts/admin-dev-lifecycle.test.ts`
- `README.md`
- `docs/engineering/runtime-configuration.md`
- `docs/engineering/testing.md`

### 구현 작업

1. 기존 `dev:admin:setup`은 migration과 seed를 수행하는 명시적 일회성 명령으로 유지한다.
2. `dev:admin`에서는 setup chain을 제거하고 admin과 admin-api 장기 process만 실행한다.
3. `dev:app`과 같은 Interface 규칙을 문서화한다.
4. Bun API watcher와 Next 자체 watcher는 교체하지 않는다.
5. 자동 smoke harness는 disposable local DB로 `dev:admin`을 시작하고 health·page readiness를 기다린 뒤 정상 종료 신호를 보낸다.
6. harness는 자신이 시작한 root PID와 child PID만 추적해 종료하고 제한시간 뒤 3001·4001 port와 `.next` lock이 해제되었는지 판정한다.
7. harness는 watcher 시작 전에 `packages/env` 아래 전용 test fixture를 준비하고 readiness 이후 한 번만 변경한다. process 종료 뒤 fixture를 정리하고 admin-api restart log가 정확히 한 번인지 검증한다. 기존 source 파일은 변경하지 않는다.
8. lifecycle smoke를 CI의 Windows·Linux matrix에서 실행하고 platform별 종료 방식은 Adapter로 격리한다.
9. process owner를 확인하지 않는 자동 kill이나 범용 supervisor는 추가하지 않는다.
10. watcher가 workspace dependency 변경을 놓치는 재현이 다시 생길 때만 Turbo `interruptible` 또는 `turbo watch`를 별도 검토한다.

### 완료 조건

- `dev:admin` 실행이 DB 상태를 암묵적으로 변경하지 않는다.
- setup 필요 여부가 명령과 문서에서 명확하다.
- 정상 종료 뒤 3001·4001 port와 Next lock이 남지 않는다.
- `packages/env` 변경 시 admin-api가 한 번 재시작한다.
- 대상 Bun watch 경고가 다시 발생하지 않는다.

### 검증

```bash
bun run dev:admin:setup
bun test ./scripts/admin-dev-lifecycle.test.ts
bun run --filter=@workspace/admin-api test
bun run typecheck
bun run lint
```

개발 서버 검증은 `ENABLE_TEST_AUTH=true`와 disposable local DB를 사용하고 종료 후 관련 process를 정리한다.

## 단계 8. Playwright flaky 관측성 추가

### 목표

CI에서 최초 실패 후 성공하는 테스트를 flaky로 분류하고 성공으로 숨기지 않으며, 재현에 필요한 trace를 남긴다.

### 변경 대상

- `playwright.config.ts`
- `.github/workflows/quality-gates.yml`
- `docs/engineering/testing.md`

### 구현 작업

1. Playwright `1.61.1` 기준으로 CI에서만 retry를 1회 허용한다.
2. `failOnFlakyTests`를 CI에서 활성화해 재시도 성공도 job 실패로 처리한다.
3. trace를 `on-first-retry`로 변경해 모든 테스트의 trace 비용을 피하고 첫 번째 retry 실행의 재현 정보를 보존한다. 최초 실패 실행 자체의 trace라고 표현하지 않는다.
4. local retry는 0을 유지해 빠른 실패 피드백을 보존한다.
5. 고정 port와 공유 SQLite 격리를 제거하기 전에는 `workers: 1`을 유지한다.
6. flaky 발생 시 test 이름, 최초 실패, retry 결과, trace artifact를 함께 확인할 수 있게 한다.

### 완료 조건

- 정상 테스트는 한 번만 실행된다.
- 최초 실패 후 성공한 테스트가 CI 성공으로 숨겨지지 않는다.
- flaky 결과에 최초 실패 보고와 첫 retry trace가 함께 존재한다.
- `ENABLE_TEST_AUTH=true` 경로만 사용하고 Google OAuth에 의존하지 않는다.

### 검증

```bash
bun run test:e2e
bun run test:storybook
```

## 단계 9. UI style build Seam 이동

### 목표

`packages/ui`를 token과 도메인 비의존 공통 style을 제공하는 Deep Module로 유지하고 Tailwind 실행은 각 앱 Adapter가 소유하게 한다.

### 변경 대상

- `packages/ui/src/styles/globals.css`
- `packages/ui/src/styles/tokens/*`
- `packages/ui/src/styles/utilities.css`
- `packages/ui/package.json`
- `apps/web/src/app/globals.css`
- `apps/admin/src/app/globals.css`
- `apps/storybook/styles.css`
- 세 앱의 `package.json`
- UI style compile sentinel test
- `e2e/ui-style-seam.visual.spec.ts`
- `docs/design/storybook.md`
- ADR-0002 관련 설계 문서

### 구현 작업

1. `packages/ui`에는 token, 공통 utility, 도메인 비의존 style Implementation만 남긴다.
2. 각 앱 CSS entry가 `@import "tailwindcss"`, 필요한 `@plugin`, 앱과 공유 UI의 `@source`를 직접 소유한다.
3. 각 앱이 build 중 직접 해석하는 Tailwind plugin을 자신의 manifest에 선언한다. `@tailwindcss/typography`와 `tw-animate-css`는 실제 CSS import 소유 위치에 따라 직접 의존성을 결정한다.
4. Storybook 하나를 pilot Adapter로 먼저 전환하고 isolated build를 검증한다.
5. pilot 성공 후 admin과 web을 각각 전환한다.
6. Tailwind 자동 탐색에 의존하지 않고 `source(none)`과 명시적 `@source`를 사용해 앱과 `packages/ui/src`만 scan한다.
7. 각 앱의 compiled CSS에 typography, animation, token, custom utility의 대표 sentinel이 존재하는지 검사한다.
8. Typography, Markdown, Dialog처럼 plugin·token·animation 경계를 대표하는 test-auth 화면에 Playwright `toHaveScreenshot` 기반 visual snapshot을 추가한다.
9. CI clean checkout 또는 disposable repository copy에서 `bun install --linker isolated --frozen-lockfile` 후 Storybook, admin, web을 각각 build한다. 사용자의 기존 `node_modules`는 삭제하거나 교체하지 않는다.
10. token 이름, density, 접근성 primitive, feature Module 제외 규칙은 ADR-0002를 유지한다.
11. 기존 호환 alias 제거는 이 작업에 포함하지 않는다.

### 완료 조건

- 공유 UI CSS를 소비해도 앱에 선언되지 않은 plugin을 우연히 해석하지 않는다.
- Storybook, admin, web이 isolated install에서 각각 build된다.
- `packages/ui`의 Interface가 Tailwind build engine 설정을 노출하지 않는다.
- ADR-0002의 token·density·접근성 계약이 유지된다.
- typography, animation, token, utility 누락이 compile sentinel에서 발견된다.
- 대표 UI의 시각 변화가 Playwright visual snapshot에서 발견된다.
- interaction·접근성 테스트는 동작과 접근성 회귀를 별도로 검출한다.

### 검증

```bash
# CI clean checkout 또는 disposable repository copy에서만 실행
bun install --linker isolated --frozen-lockfile
bun run build-storybook
bun run test:storybook
bun run test:e2e -- --grep "UI style seam"
bun run --filter=@workspace/ui test
bun run --filter=@workspace/ui typecheck
bun run build
bun run lint
```

## 단계 10. 변경 단위별 전체 회귀 검증과 문서 동기화

### 목표

각 변경 단위가 독립적으로 통과한 즉시 전체 저장소 Interface가 일관된지 확인한다. 단계 10을 단계 1~9가 모두 끝날 때까지 미루지 않는다.

### 필수 검증

모든 변경 단위는 현재 존재하는 canonical 검증을 실행한다. `check:toolchain`은 변경 단위 2에서 추가된 뒤 이후 변경 단위의 필수 검증에 포함한다.

```bash
bun run check:workspace-inventory
bun run check:document-drift
bun run lint
bun run format:check
bun run typecheck
bun run test
bun run test:coverage
bun run test:storybook
bun run test:e2e
bun run build
bun lefthook run pre-commit
```

변경 단위 2 이후에는 다음 검증을 추가한다.

```bash
bun run check:toolchain
```

### 문서 갱신

- workspace와 테스트 목록: `docs/engineering/workspace-inventory.md`, `docs/engineering/testing.md`
- toolchain과 개발 실행: `README.md`, `AGENTS.md`, `docs/engineering/runtime-configuration.md`
- CI 계약: `docs/engineering/testing.md`
- UI style Seam: `docs/design/storybook.md`, ADR-0002 관련 문서

문서는 실제 Interface, 실행 명령, 검증 기준이 바뀐 경우에만 같은 단계에서 갱신한다. 구현 중간 상태나 작업 일지는 추가하지 않는다.

각 변경 단위를 시작할 때 영향받는 `/docs` 문서와 root guide의 현재 상태를 먼저 확인하고, 병합 전 같은 문서가 최종 Interface·명령·검증 기준을 설명하도록 갱신한다.

## 보류 항목과 도입 조건

### 원격 캐시

현재 계획에는 포함하지 않는다. Turbo summary에서 서로 다른 머신 간 동일 task 재실행이 주요 비용으로 확인되고 task가 결정적이며 `inputs`, `outputs`, `env`가 정확할 때만 도입을 검토한다.

### `--affected` 기반 검증 축소

전체 검증을 대체하지 않는다. Git history와 task graph가 정확하고 대표 변경 fixture에서 선택 누락이 없다는 것이 확인된 뒤 PR 선행 피드백에만 사용한다. root 전역 검사, lockfile, schema, 계약 변경은 전체 검증을 유지한다.

### Coverage 병렬화

Vitest profile과 SQLite 경합 측정 전에는 적용하지 않는다. 순차 실행에서 실제로 오래 걸리는 workspace를 식별한 뒤 제한된 동시성만 사용한다.

### 범용 process supervisor

현재 계획에는 포함하지 않는다. 기존 Next·Bun watcher와 명시적 setup 분리, 정상 종료 검증으로 해결되지 않는 고아 process가 결정적으로 재현될 때만 실험적 제안으로 다시 평가한다.

## 근거 문서

- Turborepo `run`, `--affected`, `--dry`, `--continue`, cache: <https://turborepo.dev/docs/reference/run>
- Turborepo 환경 변수와 task hash: <https://turborepo.dev/docs/crafting-your-repository/using-environment-variables>
- Turborepo CI 구성: <https://turborepo.dev/docs/crafting-your-repository/constructing-ci>
- Vitest CLI test filtering: <https://vitest.dev/guide/cli>
- Vitest coverage provider 제약: <https://vitest.dev/guide/coverage>
- Vitest 성능 profiling: <https://vitest.dev/guide/profiling-test-performance.html>
- Bun test runner: <https://bun.com/docs/test>
- Bun test discovery와 path filter: <https://bun.com/docs/test/discovery>
- Bun isolated install: <https://bun.com/docs/pm/isolated-installs>
- Bun watch mode: <https://bun.com/docs/runtime/watch-mode>
- Bun TypeScript 설정: <https://bun.com/docs/typescript>
- GitHub Actions Node.js 구성: <https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs>
- GitHub Actions dependency cache: <https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching>
- Playwright retry와 flaky 분류: <https://playwright.dev/docs/test-retries>
- Playwright `failOnFlakyTests`: <https://playwright.dev/docs/api/class-testconfig#test-config-fail-on-flaky-tests>
- Playwright trace 모범 사례: <https://playwright.dev/docs/best-practices>
- Playwright trace mode: <https://playwright.dev/docs/api/class-testoptions#test-options-trace>
- Tailwind directive: <https://tailwindcss.com/docs/functions-and-directives>
- Tailwind source detection: <https://tailwindcss.com/docs/detecting-classes-in-source-files>
- Code coverage 모범 사례: <https://testing.googleblog.com/2020/08/code-coverage-best-practices.html>
- Twelve-Factor process disposability: <https://12factor.net/disposability>
- 프로젝트 UI 결정: `docs/engineering/adr/ADR-0002-ui-design-system-contract.md`

## 최종 완료 기준

- CI가 실제 전체 테스트를 실행하고 실행 범위를 사실대로 보고한다.
- 전체 workspace와 test·coverage·Storybook·root tooling 파생 집합이 한 canonical inventory에서 검증된다.
- root tooling test가 Bun과 Node runtime 경계를 지키며 실행된다.
- correctness, coverage, static check, build 실패가 각자의 원인으로 식별된다.
- Turbo cache hash에 무관한 global 값이 포함되지 않는다.
- CI와 문서의 Bun·Node target이 일치한다.
- admin 개발 setup과 장기 process가 명시적으로 분리된다.
- admin 개발 process의 시작·restart·정상 종료가 Windows와 CI Linux smoke에서 검증된다.
- Playwright flaky가 CI 성공으로 숨겨지지 않는다.
- 각 앱이 Tailwind build 책임과 직접 의존성을 소유한다.
- UI style 이동이 isolated build, compiled CSS sentinel, visual snapshot으로 검증된다.
- 전체 lint, format, typecheck, test, coverage, Storybook, E2E, build, pre-commit 검증이 통과한다.
