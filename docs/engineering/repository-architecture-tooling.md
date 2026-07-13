# Repository architecture tooling

## 상태

기존 module graph 통합과 2026-07-13 workspace inventory·CI 실행 보고·coverage report 통합을 완료했다.

## Module Interface

`@workspace/repository-tooling`은 architecture 정책이 공유하는 다음 Interface를 제공한다.

- `createRepositoryInventory`: `.ts`·`.tsx` source와 module reference inventory를 결정적으로 정렬한다.
- `readModuleReferences`: import, re-export, dynamic import, import type과 named import를 구분한다.
- `collectImportViolations`: 정책 matcher가 반환한 source→target 위반을 같은 형식으로 표시한다.
- `createModuleGraph`: 상대 경로, private alias, package export를 실제 source 파일로 해석한다.
- `findCycles`: runtime graph의 순환을 source→target chain으로 반환한다.
- `createRepositoryWorkspaceInventory`: root workspace glob과 manifest를 읽고 test·coverage·Storybook capability를 파생하거나 구조화된 오류를 반환한다.
- `readTurboRunSummary`, `resolveTaskExecutionStatus`: Turborepo `2.10.4` summary v1에서 실행, cache hit, 실패, 건너뜀, 제외를 구분한다.
- `aggregateLcovReports`, `assertLineCoverageThresholds`: workspace별 LCOV 집계와 위험 파일 baseline 판정을 coverage 실행 orchestration에서 분리한다.

앱과 core의 architecture test는 이 Interface 위에서 허용·금지 matcher만 정의한다. graph parser와 source traversal을 test마다 다시 만들지 않는다.

## Runtime cycle 범위

root `check:import-cycles`는 workspace package dependency와 다음 전체 runtime source를 검사한다.

- `apps/web/src`
- `apps/admin/src`
- `apps/api/src`
- `apps/admin-api/src`
- `packages/core/src`

test와 declaration 파일, type-only reference는 runtime cycle graph에서 제외한다. re-export와 dynamic import는 runtime edge로 포함한다.

## 검증

- tooling fixture는 type-only, re-export, dynamic import, private alias, package export와 의도적 cycle을 포함한다.
- architecture 정책 오류와 cycle 오류는 `source -> target` chain을 출력한다.
- `packages/repository-tooling/vitest.config.ts`는 root workspace test와 quality gate에 포함된다.
- web, admin, api, admin-api, core architecture test와 root cycle script의 중복 source traversal·AST parser를 제거하고 이 Module로 이전했다.
- workspace fixture는 추가·삭제·중복·누락·지원하지 않는 glob과 test runtime 변경을 검증한다.
- CI summary fixture는 Turborepo `2.10.4`의 v1 schema를 고정하며 실패 task를 성공으로 표시하지 않는다.
