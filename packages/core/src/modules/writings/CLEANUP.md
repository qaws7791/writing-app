# writings 모듈 crud- 접두사 제거 정리 계획

## 조사 결과 요약

`packages/core/src/modules/writings/` 내에 두 가지 계층이 혼재:

1. **sync 계층**: Writing(동기화 모델) 관련 use-cases, port, types
2. **CRUD 계층**: WritingFull/WritingDetail 관련 use-cases, port, types (→ `crud-` 접두사)

## 파일별 분석

### `crud-` 접두사 ROOT 파일 (중복 여부)

| 파일                         | 상태                                                                    | 처리                                 |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| `writing-crud-types.ts`      | `writing-types.ts`로 re-export만 함, 고유 내용 없음                     | **DELETE**                           |
| `writing-crud-port.ts`       | `WritingRepository` 정의 (고유); `writing-port.ts`가 re-export          | **INLINE → `writing-port.ts`**       |
| `writing-crud-operations.ts` | buildWriting 등 정의 (고유); `writing-operations.ts`가 re-export        | **INLINE → `writing-operations.ts`** |
| `writing-crud-error.ts`      | PromptReferenceNotFoundError 정의 (고유) + WritingNotFoundError 등 중복 | **INLINE → `writing-error.ts`**      |
| `writing-crud-schemas.ts`    | CRUD 스키마 정의 (고유); `writing-schemas.ts`가 re-export               | **INLINE → `writing-schemas.ts`**    |
| `crud-index.ts`              | `crud-use-cases/` 등 CRUD re-export만 함                                | **DELETE**                           |

### `crud-` 접두사 디렉터리

| 디렉터리          | 상태                                                                                  | 처리                     |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------ |
| `crud-use-cases/` | CRUD use-cases (create, autosave, delete, get, list); `use-cases/`에는 sync use-cases | **MERGE → `use-cases/`** |
| `crud-testing/`   | WritingRepository fake + WritingFull fixture                                          | **MERGE → `testing/`**   |
| `crud-fixtures/`  | @deprecated; `crud-testing/` re-export만 함                                           | **DELETE**               |
| `crud-model/`     | @deprecated; writing-types + writing-operations re-export                             | **DELETE**               |
| `crud-errors/`    | 빈 디렉터리                                                                           | **DELETE**               |

### 내용 겹침 분석

- `writing-crud-error.ts` vs `writing-error.ts`: WritingNotFoundError, WritingForbiddenError, WritingValidationError 타입이 양쪽에 **중복 정의**. `writing-crud-error.ts`에만 고유: `PromptReferenceNotFoundError`, `promptNotFound`. `writing-error.ts`에만 고유: `WritingConflictError`, `writingConflict`
- `writing-crud-schemas.ts` vs `writing-schemas.ts`: 완전히 다른 스키마 (CRUD vs sync). `writingIdParamSchema`는 `writing-schemas.ts`에도 독립적으로 정의됨.
- `crud-testing/writing-fixture.ts` vs `testing/test-fixtures.ts`: 둘 다 `createTestWriting()` 함수 이름이 같지만 반환 타입 다름 (WritingFull vs Writing). **이름 충돌** → CRUD 픽스쳐는 `createTestWritingFull`로 rename

### 외부 참조 (home 모듈)

- `home/adapters/application-compatibility.ts` → `../../writings/writing-crud-port`
- `home/home-schemas.ts` → `../writings/writing-crud-schemas`
- `home/ports/index.ts` → `../../writings/writing-crud-port`
- `home/use-cases/get-home.test.ts` → `../../writings/writing-crud-port`
- `home/use-cases/get-home-use-case.ts` → `../../writings/writing-crud-port`
- `home/use-cases/get-home.ts` → `../../writings/writing-crud-port`
- `home/use-cases/get-home-use-case.test.ts` → `../../writings/writing-crud-port`
- `writings/writing-crud-operations.test.ts` → `./crud-testing/writing-fixture`

## 변경 계획

### Phase 1: 루트 파일 인라인

1. `writing-port.ts`: re-export 제거 → WritingRepository 인터페이스 직접 정의
2. `writing-operations.ts`: re-export 제거 → CRUD 함수 직접 인라인
3. `writing-error.ts`: re-export 제거 → PromptReferenceNotFoundError + promptNotFound 직접 추가
4. `writing-schemas.ts`: re-export 제거 → CRUD 스키마 직접 인라인

### Phase 2: use-cases 통합

5. `crud-use-cases/` 하위 파일 모두 → `use-cases/`로 이동

6. `use-cases/index.ts` 업데이트

### Phase 3: testing 통합

7. `crud-testing/fake-writing-repository.ts` → `testing/fake-writing-repository.ts`
8. `crud-testing/writing-fixture.ts` → `testing/writing-full-fixtures.ts` (createTestWriting → createTestWritingFull)

### Phase 4: deprecated 삭제

9. 삭제 대상: `crud-fixtures/`, `crud-model/`, `crud-errors/`, `crud-index.ts`, `writing-crud-types.ts`, `writing-crud-port.ts`, `writing-crud-operations.ts`, `writing-crud-error.ts`, `writing-crud-schemas.ts`, `crud-use-cases/`, `crud-testing/`

### Phase 5: 외부 참조 업데이트

10. `home/` 모듈: `writing-crud-port` → `writing-port`, `writing-crud-schemas` → `writing-schemas`
11. `writing-crud-operations.test.ts`: crud-testing import 업데이트

### Phase 6: index.ts 업데이트

12. 모든 `crud-*` import 제거, 정규 경로로 교체
