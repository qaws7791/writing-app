# Repository architecture tooling

## 상태

완료했다.

## Module Interface

`@workspace/repository-tooling`은 architecture 정책이 공유하는 다음 Interface를 제공한다.

- `createRepositoryInventory`: `.ts`·`.tsx` source와 module reference inventory를 결정적으로 정렬한다.
- `readModuleReferences`: import, re-export, dynamic import, import type과 named import를 구분한다.
- `collectImportViolations`: 정책 matcher가 반환한 source→target 위반을 같은 형식으로 표시한다.
- `createModuleGraph`: 상대 경로, private alias, package export를 실제 source 파일로 해석한다.
- `findCycles`: runtime graph의 순환을 source→target chain으로 반환한다.

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
