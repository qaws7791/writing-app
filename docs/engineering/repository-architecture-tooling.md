# Repository architecture tooling

## 범위

repository tooling은 workspace inventory, module graph, import ratchet, CI 실행 보고, coverage 집계와 package public-surface 검사를 제공한다. `apps/api`의 단일 runtime은 학습자 HTTP 표면과 `/api/admin` 경로 sub-app에서 여섯 관리자 capability를 조립하며, 정적 검사는 제거된 별도 관리자 runtime과 forwarding 경계의 재도입을 거부한다.

이 도구가 검증하는 것은 repository source graph와 정적 deployment contract다. Compose/Caddy source가 unified API를 가리킨다는 사실만으로 실제 production traffic 적용·관찰까지 증명하지 않는다.

## Module Interface

`@workspace/repository-tooling`은 architecture 정책이 공유하는 다음 Interface를 제공한다.

- `createRepositoryInventory`: `.ts`·`.tsx` source와 module reference inventory를 결정적으로 정렬한다.
- `readModuleReferences`: import, re-export, dynamic import, import type과 named import를 구분한다.
- `collectImportViolations`: 정책 matcher가 반환한 source→target 위반을 같은 형식으로 표시한다.
- `createModuleGraph`: 상대 경로, private alias, package export를 실제 source 파일로 해석한다.
- `findCycles`: runtime graph의 순환을 source→target chain으로 반환한다.
- `evaluateImportRatchet`: 파일·specifier 단위 allowance와 실제 import edge를 대조해 신규 위반과 제거 뒤 남은 allowance를 모두 실패시킨다.
- `createRepositoryWorkspaceInventory`: root workspace glob과 manifest를 읽고 test·coverage·Storybook capability를 파생하거나 구조화된 오류를 반환한다.
- `readTurboRunSummary`, `resolveTaskExecutionStatus`: Turborepo `2.10.4` summary v1에서 실행, cache hit, 실패, 건너뜀, 제외를 구분한다.
- `aggregateLcovReports`, `assertLineCoverageThresholds`: workspace별 LCOV 집계와 위험 파일 baseline 판정을 coverage 실행 orchestration에서 분리한다.

앱과 core의 architecture test는 이 Interface 위에서 허용·금지 matcher만 정의한다. graph parser와 source traversal을 test마다 다시 만들지 않는다.

## Architecture 기준선

`check:architecture-boundaries`는 core runtime adapter edge와 capability 간 private edge를 허용하지 않는다. UI의 app/core/DB/HTTP client 의존, 두 frontend의 core·DB·Drizzle 의존과 API transport의 DB·Drizzle 의존도 허용하지 않는다. allowance가 제거되면 같은 변경에서 기준선을 줄이지 않는 한 검사가 실패한다.

`core-capability-contract-entrypoint` 규칙은 test를 포함한 `packages/core/src` 전체를 수집한다. `@workspace/contracts/learning/{step-data,read-data}`와 `@workspace/contracts/admin/{content-data,identity-data,dashboard-analytics-data,settings-data,ai-chat-data,resource-library-data}`만 정확히 허용하고 다른 learning/admin source는 allowance 없이 실패시킨다.

## Core capability public surface

`check:package-interfaces`는 기존 `packages/core/package.json` subpath snapshot과 삭제 파일 guard를 유지하면서 `packages/core/tsconfig.json`으로 TypeScript program을 만든다. checker의 `getExportsOfModule`로 `admin`, `ai-feedback`, `auth`, `content`, `learning`, `resource-library`의 `api/index.ts`를 해석하므로 직접 export뿐 아니라 `export *`가 전이적으로 노출하는 symbol도 포함한다.

실제 symbol 이름은 정렬·중복 제거된 `scripts/fixtures/core-capability-public-surface.json`과 exact 비교한다. 새 symbol은 `added`, 제거된 symbol은 `removed`로 capability와 facade 경로를 함께 출력한다. fixture의 capability key, 정렬 또는 중복이 잘못돼도 실패하므로 공개 API 확장은 source와 snapshot을 같은 review에서 명시적으로 승인해야 한다.

## Runtime cycle 범위

root `check:import-cycles`는 workspace package dependency와 다음 전체 runtime source를 검사한다.

- `apps/web/src`
- `apps/admin/src`
- `apps/api/src`
- `packages/core/src`

test와 declaration 파일, type-only reference는 runtime cycle graph에서 제외한다. re-export와 dynamic import는 runtime edge로 포함한다.

## 검증

- tooling fixture는 type-only, re-export, dynamic import, private alias, package export와 의도적 cycle을 포함한다.
- architecture 정책 오류와 cycle 오류는 `source -> target` chain을 출력한다.
- core architecture 정책은 domain과 production application의 DB·ORM·인증·provider·Hono import, application→infrastructure import와 직접 Worker·WebSocket·fetch·`process.env` 사용을 거부한다.
- core architecture 정책은 모든 capability facade의 infrastructure export와 facade가 아닌 core 구현의 canonical `#core/modules/<capability>/api/index` 역참조를 거부한다.
- core public-surface fixture는 6개 facade의 실제 export symbol을 고정하고 추가·제거를 구분해 보고한다.
- core contract 정책은 test까지 포함해 broad·legacy·transport source를 거부한다. Oxlint fixture는 architecture inventory가 표현하지 않는 import-equals와 computed dynamic import까지 차단하고 static·re-export·dynamic·import-type 우회를 중복 검증한다.
- `packages/repository-tooling/vitest.config.ts`는 root workspace test와 quality gate에 포함된다.
- web, admin, api, core architecture test와 root cycle script는 이 Module의 공통 source traversal·AST parser를 사용한다. 별도 removal verifier는 삭제된 runtime 식별자의 재도입을 차단한다.
- workspace fixture는 추가·삭제·중복·누락·지원하지 않는 glob과 test runtime 변경을 검증한다.
- workspace glob 아래에 `.next`, `.turbo`, `coverage`, `dist`, `node_modules`만 남은 제거된 workspace 디렉터리는 source가 없는 생성 산출물로 제외한다. 빈 디렉터리나 다른 source entry가 있는 manifest 누락은 계속 오류다.
- CI summary fixture는 Turborepo `2.10.4`의 v1 schema를 고정하며 실패 task를 성공으로 표시하지 않는다.
