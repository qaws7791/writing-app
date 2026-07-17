# Repository architecture tooling

## 상태

기존 module graph 통합과 2026-07-13 workspace inventory·CI 실행 보고·coverage report 통합을 완료했다. 2026-07-17에는 모노레포 목표 경계의 exact import ratchet과 현재 소스 기준선을 추가했고, 제거한 core forwarding 경로의 재도입 검사와 test 포함 core contract hard-fail을 연결했다. 2026-07-18에는 TypeScript checker가 6개 core capability facade의 실제 export symbol을 해석해 exact public-surface fixture와 비교하도록 package-interface 검사를 확장했다. 같은 날 MTA-59~64 source에서 `apps/api`의 admin Host sub-app이 여섯 관리자 capability를 조립하도록 전환했고 MTA-41에서 이전 관리자 runtime workspace를 제거했다.

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

## 2026-07-17 현재 기준선

고정 도구체인 Bun `1.3.10`, Node.js `24.16.0`에서 `apps`, `packages`, `scripts`의 TypeScript·TSX를 같은 정렬 규칙으로 두 번 수집했다. 두 결과의 SHA-256은 `058e4e34b1ff538ad13667ff17cfcb2389fb6db5e678d8da7a562c68518d3fee`로 같았다.

| 범위       | 소스 파일 | module reference | runtime reference | test 파일 |
| ---------- | --------: | ---------------: | ----------------: | --------: |
| `apps`     |       412 |            1,849 |             1,455 |        94 |
| `packages` |       378 |            1,369 |             1,134 |        66 |
| `scripts`  |        50 |              154 |               154 |        21 |

`check:architecture-boundaries`가 고정한 production 기준선은 core runtime adapter edge와 capability 간 private edge 모두 0개다. MTA-7에서 private forwarding edge 1개를 제거했고 MTA-15·16은 두 composition의 DB edge를 각 1개 제거했다. MTA-17은 learner Better Auth·test auth adapter를 `apps/api`로 옮겨 10개, MTA-24는 자료실 네 Drizzle adapter를 당시 관리자 API 실행 앱으로 옮겨 11개, MTA-21은 관리자 course/content reset adapter를 옮겨 8개, MTA-22는 learner profile과 관리자 user adapter를 옮겨 runtime edge 6개와 private capability edge 1개를 제거했다. 이어 MTA-25가 dashboard·analytics adapter를 옮겨 runtime edge 8개와 private capability edge 2개를 제거했고, MTA-18은 OpenAI provider adapter를 옮겨 runtime edge 1개, MTA-19는 learner transition adapter를 옮겨 runtime edge 3개, MTA-23은 AI feedback adapter를 옮겨 3개, MTA-20은 learner read model·profile adapter를 옮겨 6개, MTA-50은 settings adapter를 옮겨 2개를 제거했다. MTA-30은 AI feedback의 private capability edge 2개를 제거했다. MTA-51은 AI chat adapter edge 3개와 삭제된 admin aggregate의 DB edge 1개를 함께 제거했고, MTA-26은 test-only content Drizzle adapter를 삭제해 마지막 runtime edge 3개를 제거했다. MTA-31은 presenter 경계를 공개 API로 승격해 capability allowance 1개를 더 제거했고 MTA-35는 관리자 학습 활동 정책을 public API로 전환해 allowance 1개를 제거했다. MTA-37은 learner content read service를 learning capability로 옮겨 마지막 allowance를 제거했다. UI의 app/core/DB/HTTP client 의존, 두 frontend의 core·DB·Drizzle 의존과 API transport의 DB·Drizzle 의존도 모두 0개다. allowance가 제거되면 같은 변경에서 기준선도 줄이지 않는 한 검사가 실패한다.

MTA-48의 `core-capability-contract-entrypoint` 규칙은 production 기준선과 별도로 test를 포함한 `packages/core/src` 전체를 수집한다. `@workspace/contracts/learning/{step-data,read-data}`와 `@workspace/contracts/admin/{content-data,identity-data,dashboard-analytics-data,settings-data,ai-chat-data,resource-library-data}`만 정확히 허용하고 다른 learning/admin source는 allowance 없이 실패시킨다. 현재 53개 참조가 모두 canonical이며 금지 참조는 0개다.

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
- web, admin, api, core architecture test와 root cycle script의 중복 source traversal·AST parser를 제거하고 이 Module로 이전했다. MTA-41 post-removal verifier는 삭제된 runtime 식별자의 재도입을 별도로 차단한다.
- workspace fixture는 추가·삭제·중복·누락·지원하지 않는 glob과 test runtime 변경을 검증한다.
- workspace glob 아래에 `.next`, `.turbo`, `coverage`, `dist`, `node_modules`만 남은 제거된 workspace 디렉터리는 source가 없는 생성 산출물로 제외한다. 빈 디렉터리나 다른 source entry가 있는 manifest 누락은 계속 오류다.
- CI summary fixture는 Turborepo `2.10.4`의 v1 schema를 고정하며 실패 task를 성공으로 표시하지 않는다.
