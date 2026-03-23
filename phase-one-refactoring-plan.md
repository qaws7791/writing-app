# phase-one 리팩토링 계획

## 배경

`apps/web/src/lib/`에 `phase-one-*` 접두사로 명명된 파일들이 다수 존재하며, 루트 디렉토리에도 임시 작업 문서들이 흩어져 있습니다. 이 파일들은 현재 정식 기능이 된 코드에 프로젝트 단계명이 붙어 있거나, 올바른 디렉토리에 위치하지 않은 상태입니다.

---

## 범위

### 1. `apps/web/src/lib/` — phase-one 접두사 제거

| 현재 파일명 | 변경 후 파일명 |
|---|---|
| `phase-one-types.ts` | `web-types.ts` |
| `phase-one-format.ts` | `format.ts` |
| `phase-one-format.test.ts` | `format.test.ts` |
| `phase-one-rich-text.ts` | `rich-text.ts` |
| `phase-one-rich-text.test.ts` | `rich-text.test.ts` |
| `phase-one-storage.ts` | `storage.ts` |
| `phase-one-storage.test.ts` | `storage.test.ts` |
| `phase-one-repository.ts` | `repository.ts` |
| `phase-one-repository.test.ts` | `repository.test.ts` |
| `phase-one-draft-sync.ts` | `draft-sync.ts` |
| `phase-one-fixtures.ts` | `fixtures.ts` |

### 2. `apps/web/src/test-support/` — phase-one 접두사 제거

| 현재 파일명 | 변경 후 파일명 |
|---|---|
| `phase-one-test-fixtures.ts` | `test-fixtures.ts` |
| `mock-phase-one-repository.ts` | `mock-repository.ts` |

### 3. `apps/web/e2e/` — E2E 테스트 파일명 정규화

| 현재 파일명 | 변경 후 파일명 |
|---|---|
| `phase-one.spec.ts` | `write-flow.spec.ts` |

### 4. 심볼(타입·함수) 이름 변경

`repository.ts` (구 `phase-one-repository.ts`):

| 현재 심볼 | 변경 후 심볼 |
|---|---|
| `PhaseOneRepository` | `AppRepository` |
| `PhaseOneRepositoryMode` | `AppRepositoryMode` |
| `createPhaseOneRepository` | `createAppRepository` |

`storage.ts` (구 `phase-one-storage.ts`):

| 현재 심볼 | 변경 후 심볼 |
|---|---|
| `phaseOneStorageKeys` | `storageKeys` |

`mock-repository.ts` (구 `mock-phase-one-repository.ts`):

| 현재 심볼 | 변경 후 심볼 |
|---|---|
| `MockedPhaseOneRepository` | `MockedRepository` |
| `createMockPhaseOneRepository` | `createMockRepository` |

> **참고**: `storageKeys` 객체의 값(`"phase-one.drafts"` 등) 문자열은 localStorage 키네임스페이스이므로 기존 사용자 데이터 호환을 위해 변경하지 않습니다.

### 5. 루트 디렉토리 마크다운 파일 → `docs/` 이동

| 현재 위치 | 이동 위치 |
|---|---|
| `Phase-one-backend.md` | `docs/99-archive/phase-one-backend.md` |
| `core-refactoring-plan.md` | `docs/04-engineering/core-refactoring-plan.md` |
| `daily-recommendation-feature.md` | `docs/99-archive/daily-recommendation-feature.md` |
| `editor-sync-workplan.md` | `docs/04-engineering/editor-sync/workplan.md` |

### 6. 루트 스크립트 파일 이동

| 현재 위치 | 이동 위치 |
|---|---|
| `fix-js-imports.ts` | `scripts/fix-js-imports.ts` |

---

## Import 업데이트 대상 파일 목록

파일명 변경 및 심볼 이름 변경에 따라 아래 파일들의 import 구문을 모두 수정합니다.

### `apps/web/src/lib/` 내부

- `rich-text.ts`: `./phase-one-types` → `./web-types`
- `draft-sync.ts`: `./phase-one-rich-text`, `./phase-one-storage`, `./phase-one-types`
- `fixtures.ts`: `./phase-one-types`, `./phase-one-rich-text`
- `repository.ts`: `./phase-one-fixtures`, `./phase-one-rich-text`, `./phase-one-storage`, `./phase-one-types`
- `format.test.ts`: `./phase-one-format` → `./format`
- `rich-text.test.ts`: `./phase-one-rich-text` → `./rich-text`
- `storage.test.ts`: `./phase-one-storage` → `./storage`
- `repository.test.ts`: `./phase-one-repository` → `./repository`, `./phase-one-storage` → `./storage`

### `apps/web/src/test-support/`

- `test-fixtures.ts`: `@/lib/phase-one-types` → `@/lib/web-types`
- `mock-repository.ts`: `@/lib/phase-one-types` → `@/lib/web-types`, `@/lib/phase-one-repository` → `@/lib/repository`

### `apps/web/src/components/`

- `writing-body-editor.tsx`: `@/lib/phase-one-types` → `@/lib/web-types`, `@/lib/phase-one-rich-text` → `@/lib/rich-text`

### `apps/web/src/app/(protected)/home/`

- `page.tsx`: `@/lib/phase-one-format` → `@/lib/format`, `@/lib/phase-one-repository` → `@/lib/repository` (+ `createAppRepository`), `@/lib/phase-one-types` → `@/lib/web-types`
- `page.test.tsx`: `@/test-support/mock-phase-one-repository` → `@/test-support/mock-repository` (+ `createMockRepository`), `@/test-support/phase-one-test-fixtures` → `@/test-support/test-fixtures`

### `apps/web/src/app/(protected)/write/`

- `page.tsx`: phase-one → 정규화
- `page.test.tsx`: mock-phase-one → 정규화

### `apps/web/src/app/(protected)/write/[id]/`

- `use-writing-page.ts`: phase-one-repository, phase-one-draft-sync, phase-one-rich-text, phase-one-types → 정규화
- `use-writing-page.test.tsx`: mock, fixtures → 정규화
- `writing-page-header.tsx`: phase-one-format, phase-one-types, phase-one-draft-sync → 정규화
- `writing-page-body.tsx`: phase-one-draft-sync, phase-one-types → 정규화

### `apps/web/src/app/(protected)/prompts/`

- `page.tsx`: phase-one → 정규화
- `page.test.tsx`: mock → 정규화

### `apps/web/src/app/(protected)/prompts/[id]/`

- `prompt-detail-page-client.tsx`: phase-one → 정규화
- `prompt-detail-page-client.test.tsx`: mock → 정규화

---

## 실행 순서

1. PowerShell `mv` 명령으로 파일 이동/복사 (lib, test-support, e2e)
2. 새 파일 내 internal import 경로 수정
3. 심볼 이름 변경 (`PhaseOneRepository` → `AppRepository` 등)
4. 외부에서 이 파일들을 참조하는 모든 파일의 import 수정
5. 루트 MD 파일을 `docs/`에 이동
6. `fix-js-imports.ts`를 `scripts/`로 이동
7. 빌드·타입체크·테스트로 검증
8. 구 파일(`phase-one-*`) 삭제

---

## 검증 체크리스트

- [x] `bun run typecheck` 통과 (web 패키지)
- [x] `bun run test` 통과 (lib, app 테스트 32개)
- [x] `phase-one-` 접두사를 사용하는 import가 0개 (새 파일 기준)
- [ ] 구 `phase-one-*` 파일 삭제 (git에서 제거 필요)

## 실행 완료 내용

- `apps/web/src/lib/phase-one-*` → 새 파일명으로 복사 및 내부 import/심볼 전부 업데이트
- `apps/web/src/test-support/phase-one-*` → 새 파일명으로 복사 및 업데이트
- `apps/web/e2e/phase-one.spec.ts` → `write-flow.spec.ts`
- `PhaseOneRepository` → `AppRepository`, `createPhaseOneRepository` → `createAppRepository` 등 심볼 일괄 변경
- `phaseOneStorageKeys` → `storageKeys` (localStorage 키 값 문자열은 기존 사용자 데이터 호환을 위해 유지)
- `createMockPhaseOneRepository` → `createMockRepository`
- 루트 MD 파일 → `docs/` 적절한 하위 경로로 이동
- `fix-js-imports.ts` → `scripts/` 로 이동 (사용 완료된 마이그레이션 스크립트)
