# packages/core 리팩토링 계획서

## 1. 개선 후 예상 전체 디렉토리 구조

```
packages/core/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
└── src/
    ├── index.ts                           # 패키지 공개 barrel export
    │
    ├── shared/                            # 모든 모듈이 공유하는 커널
    │   ├── index.ts
    │   ├── brand/
    │   │   ├── index.ts
    │   │   └── brand.ts                   # Brand<T,N>, UserId, DraftId, PromptId
    │   ├── error/
    │   │   ├── index.ts
    │   │   └── domain-error.ts            # DomainError discriminated union + 팩토리 + toHttpStatus
    │   └── schema/
    │       ├── index.ts
    │       ├── draft-content-schema.ts    # DraftContent zod 스키마
    │       └── prompt-schema.ts           # PromptTopic, PromptLevel 등
    │
    ├── modules/
    │   ├── drafts/
    │   │   ├── index.ts                   # 모듈 공개 API (contracts 역할 통합)
    │   │   ├── draft-types.ts             # Draft, DraftSummary, DraftDetail, DraftPersistInput
    │   │   ├── draft-error.ts             # DraftModuleError discriminated union + 팩토리
    │   │   ├── draft-operations.ts        # 순수 함수: buildDraft, updateDraftContent 등
    │   │   ├── draft-port.ts              # DraftRepository 인터페이스
    │   │   ├── use-cases/
    │   │   │   ├── index.ts
    │   │   │   ├── create-draft.ts
    │   │   │   ├── autosave-draft.ts
    │   │   │   ├── delete-draft.ts
    │   │   │   ├── get-draft.ts
    │   │   │   └── list-drafts.ts
    │   │   └── testing/
    │   │       ├── index.ts
    │   │       ├── draft-fixture.ts       # DraftFixture 빌더 (함수형)
    │   │       └── fake-draft-repository.ts
    │   │
    │   ├── prompts/
    │   │   ├── index.ts
    │   │   ├── prompt-types.ts            # PromptSummary, PromptDetail
    │   │   ├── prompt-error.ts            # PromptModuleError + 팩토리
    │   │   ├── prompt-port.ts             # PromptRepository 인터페이스
    │   │   ├── use-cases/
    │   │   │   ├── index.ts
    │   │   │   ├── get-prompt.ts
    │   │   │   ├── list-prompts.ts
    │   │   │   ├── save-prompt.ts
    │   │   │   └── unsave-prompt.ts
    │   │   └── testing/
    │   │       └── index.ts
    │   │
    │   └── home/
    │       ├── index.ts
    │       ├── home-types.ts              # HomeSnapshot
    │       ├── use-cases/
    │       │   ├── index.ts
    │       │   └── get-home.ts
    │       └── testing/
    │           └── index.ts
    │
    └── testing/                           # 패키지 수준 공유 테스트 유틸리티
        └── index.ts
```

### 현재 구조 대비 주요 변경점

| 현재                                                                | 개선 후                               | 근거                                                         |
| ------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `shared/types/result.ts` (자체 Result 구현)                         | **삭제** → `neverthrow` 대체          | 검증된 라이브러리로 체이닝·ResultAsync 등 확보               |
| `shared/types/errors.ts` + `shared/utilities/application-errors.ts` | `shared/error/domain-error.ts` 통합   | 에러 정의와 변환이 분리되어 있던 것을 한 곳에 colocation     |
| `shared/ports/` (전역 레포지토리 인터페이스)                        | 각 모듈의 `*-port.ts`로 이동          | 포트는 모듈의 계약, 모듈이 소유해야 함 (DDD Bounded Context) |
| `shared/testing/fake-draft-repository.ts`                           | `modules/drafts/testing/`으로 이동    | fake는 해당 모듈의 관심사 (colocation)                       |
| 모듈 내 `contracts/` 디렉토리                                       | `index.ts`가 contracts 역할 통합      | 별도 디렉토리 없이 barrel export가 계약                      |
| 모듈 내 `model/`, `operations/`, `errors/`, `ports/` 각각 디렉토리  | 파일 1개씩으로 평탄화                 | 파일이 1개인 디렉토리는 인지부하만 증가 (YAGNI)              |
| `adapters/application-compatibility.ts`                             | **삭제**                              | neverthrow `.match()`로 consumer가 직접 처리                 |
| use-case 이중 API (make\* + standalone)                             | `make*` 팩토리만 유지                 | 단일 진입점 원칙 (Code That Fits in Your Head)               |
| 자체 `mapResult`, `flatMapResult`                                   | `neverthrow`의 `.map()`, `.andThen()` | Railway-Oriented Programming 표준 패턴                       |
| `switch` 문 에러 분기                                               | `ts-pattern`의 `match().with()`       | 컴파일 타임 exhaustive check 보장                            |
| 수동 데이터 변환                                                    | `remeda` 파이프라인                   | 선언적·합성 가능한 데이터 처리                               |

---

## 2. 현재 코드 분석 및 문제점

### 2.1 구조적 문제

1. **자체 Result 타입 재발명**: `shared/types/result.ts`에 `ok()`, `err()`, `mapResult()`, `flatMapResult()` 등을 직접 구현. neverthrow가 제공하는 `ResultAsync`, `.andThen()`, `.orElse()`, `.match()` 등 풍부한 API를 활용하지 못함.

2. **포트의 잘못된 배치**: `DraftRepository`, `PromptRepository` 인터페이스가 `shared/ports/`에 위치. DDD에서 포트는 해당 모듈의 계약이므로 모듈이 소유해야 함. 현재 구조는 모듈 간 결합을 유발.

3. **과도한 디렉토리 중첩**: 파일이 1개뿐인 디렉토리가 다수 (`contracts/index.ts`, `model/draft.ts`, `errors/draft-errors.ts`). 탐색 시 인지부하 증가.

4. **adapter 계층의 불필요한 복잡성**: `application-compatibility.ts`가 Result → throw 변환만 수행. neverthrow의 `.match()`를 consumer가 직접 사용하면 이 계층이 불필요.

5. **이중 use-case API**: 모든 use-case에 `make*` 팩토리 + standalone 함수가 공존. 진입점이 2개라 혼란.

### 2.2 함수형 프로그래밍 관점

1. **명령형 에러 처리**: `if (result.kind === "not-found") return ...` 패턴이 반복. Railway-Oriented 파이프라인으로 선언적 처리 가능.

2. **Error 클래스 혼재**: `application-errors.ts`에 class 기반 Error와 plain object DomainError가 공존. Data-Oriented Programming 원칙에 따라 plain data만 사용해야 함.

3. **switch 문의 비안전성**: `toHttpStatus()`의 switch 문은 새 에러 코드 추가 시 컴파일 타임 경고 없음. ts-pattern의 `.exhaustive()`로 보장 가능.

4. **수동 데이터 변환**: `extractDraftTextMetrics()` 등에서 수동 배열 조작. remeda의 `pipe`, `map`, `filter` 등으로 선언적 처리 가능.

### 2.3 타입 시스템 관점

1. **DraftDetail이 DraftSummary를 확장**: 상속 대신 합성이 적절. 각각 독립 타입으로 정의하고 공통 필드는 별도 base 타입으로.

2. **use-case 출력 타입이 모호**: `{ kind: "success"; draft: DraftDetail } | DraftModuleError`에서 DraftModuleError에 `kind`가 없어 태그 판별이 불완전. neverthrow의 `Result<T, E>`가 이 문제를 근본적으로 해결.

---

## 3. 리팩토링 원칙

### 설계 철학

| 원칙                                    | 출처                                         | 적용                                                          |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| **데이터와 행위를 분리**                | Data-Oriented Programming (Sharvit)          | 타입은 plain data, 함수는 별도 모듈                           |
| **Railway-Oriented Error Handling**     | Scott Wlaschin, NDC 2014                     | neverthrow의 `Result`/`ResultAsync`로 에러를 값으로 흐름 제어 |
| **Make Illegal States Unrepresentable** | Domain Modeling Made Functional              | Brand 타입 + discriminated union으로 런타임 오류 방지         |
| **단일 책임, 최소 표면적**              | Clean Architecture (Martin)                  | 모듈은 index.ts를 통해서만 공개, 내부는 은닉                  |
| **Colocation**                          | A Philosophy of Software Design (Ousterhout) | 관련 코드는 물리적으로 가까이 배치                            |
| **YAGNI**                               | Extreme Programming (Beck)                   | 불필요한 추상화 디렉토리 제거, 필요할 때 분리                 |
| **Exhaustive Matching**                 | ts-pattern + Grokking Simplicity             | 모든 분기를 컴파일 타임에 보장                                |
| **Pipe-based Composition**              | Functional Design and Architecture, remeda   | 데이터 변환을 선언적 파이프라인으로                           |

### 의존성 규칙

```
shared (커널)          ← 어떤 모듈에도 의존하지 않음
modules/drafts         ← shared만 의존
modules/prompts        ← shared만 의존
modules/home           ← shared + drafts/prompts의 공개 타입만 의존
```

모듈 간 직접 import 금지. home이 다른 모듈의 타입을 필요로 할 경우 shared 또는 포트를 통해 간접 참조.

---

## 4. 라이브러리 도입 계획

### 4.1 neverthrow

**역할**: Result<T, E> 모나드 기반 에러 처리

```typescript
// Before: 자체 Result + 수동 분기
const result = await getDraftUseCase(userId, draftId, repo)
if (result.ok === false) return result.error

// After: neverthrow의 ResultAsync + 체이닝
const getDraft = (userId: UserId, draftId: DraftId) =>
  ResultAsync.fromPromise(repo.getById(userId, draftId), () =>
    draftNotFound("초안을 찾을 수 없습니다.", draftId)
  ).andThen((accessResult) =>
    match(accessResult)
      .with({ kind: "draft" }, ({ draft }) => ok(draft))
      .with({ kind: "not-found" }, () => err(draftNotFound("...", draftId)))
      .with({ kind: "forbidden" }, ({ ownerId }) =>
        err(draftForbidden("...", ownerId))
      )
      .exhaustive()
  )
```

### 4.2 ts-pattern

**역할**: Exhaustive 패턴 매칭

```typescript
// Before: switch + 누락 위험
export function toHttpStatus(error: DomainError): number {
  switch (error.code) { ... }
}

// After: 컴파일 타임 exhaustive 보장
import { match } from "ts-pattern"

export const toHttpStatus = (error: DomainError) =>
  match(error)
    .with({ code: "VALIDATION_ERROR" }, () => 400 as const)
    .with({ code: "NOT_FOUND" }, () => 404 as const)
    .with({ code: "FORBIDDEN" }, () => 403 as const)
    .with({ code: "CONFLICT" }, () => 409 as const)
    .exhaustive()
```

### 4.3 remeda

**역할**: 타입 안전한 FP 유틸리티 (pipe, map, filter 등)

```typescript
// Before: 수동 배열 조작
const words = plainText
  .trim()
  .split(/\s+/)
  .filter((w) => w.length > 0)

// After: remeda 파이프라인
import { pipe, split, filter, length } from "remeda"

const wordCount = pipe(
  plainText.trim(),
  split(/\s+/),
  filter((w) => w.length > 0),
  length
)
```

### 4.4 zod (유지)

기존 zod 스키마는 그대로 유지. 입력 검증과 파싱에 계속 활용.

---

## 5. 상세 리팩토링 작업 목록

### Phase 1: 기반 인프라 교체

#### 1-1. 의존성 추가

- `package.json`에 `neverthrow`, `ts-pattern`, `remeda` 추가

#### 1-2. shared/error 통합

- `shared/types/errors.ts` + `shared/utilities/application-errors.ts` → `shared/error/domain-error.ts`로 병합
- DomainError discriminated union 및 팩토리 함수 유지
- `toHttpStatus`를 ts-pattern으로 재작성
- Error 클래스(`NotFoundError`, `ForbiddenError` 등) 제거 → plain object만 사용
- `toApplicationError` 제거 (neverthrow `.match()` 사용으로 대체)

#### 1-3. shared/types/result.ts 제거

- 자체 Result 타입 전체 삭제
- 모든 참조를 `neverthrow`의 `Result`, `ResultAsync`, `ok`, `err`로 교체

#### 1-4. shared/types 디렉토리 제거

- errors.ts → shared/error/로 이동
- result.ts → 삭제
- 디렉토리 자체 제거

#### 1-5. shared/utilities 정리

- `application-errors.ts`, `application-errors.test.ts` 삭제
- `draft-content-utilities.ts` → remeda 파이프라인으로 리팩토링
- 디렉토리명 `utilities` 유지 (범용 순수 함수)

### Phase 2: 모듈 구조 개편

#### 2-1. 포트 이동

- `shared/ports/draft-repository.ts` → `modules/drafts/draft-port.ts`
- `shared/ports/prompt-repository.ts` → `modules/prompts/prompt-port.ts`
- `shared/ports/user-seed-repository.ts` → `shared/` 유지 (범용)
- `shared/ports/` 디렉토리 삭제

#### 2-2. 모듈 내 디렉토리 평탄화

각 모듈에서 파일이 1개뿐인 디렉토리를 파일로 승격:

- `model/draft.ts` → `draft-types.ts`
- `errors/draft-errors.ts` → `draft-error.ts`
- `operations/draft-operations.ts` → `draft-operations.ts`
- `ports/index.ts` → 삭제 (draft-port.ts로 대체)
- `contracts/index.ts` → 삭제 (index.ts가 역할 대체)
- `adapters/application-compatibility.ts` → 삭제
- `fixtures/` → `testing/` 디렉토리로 이동

#### 2-3. 테스팅 유틸리티 이동

- `shared/testing/fake-draft-repository.ts` → `modules/drafts/testing/fake-draft-repository.ts`
- `shared/testing/` → 패키지 수준 공유가 필요하면 `src/testing/`으로 이동

### Phase 3: Use-case neverthrow 전환

#### 3-1. 반환 타입 변경

모든 use-case의 반환 타입을 `ResultAsync<T, E>`로 변경:

```typescript
// Before
export type CreateDraftUseCaseOutput =
  | { kind: "success"; draft: DraftDetail }
  | DraftModuleError

// After
// 함수 반환: ResultAsync<DraftDetail, DraftModuleError>
```

#### 3-2. 이중 API 제거

- `makeCreateDraftUseCase` 팩토리만 유지
- standalone `createDraftUseCase` 제거
- 모든 모듈에 동일 적용

#### 3-3. ts-pattern 적용

use-case 내 `if (result.kind === "not-found")` 패턴을 `match(result).with(...)` 으로 교체.

#### 3-4. remeda 적용

데이터 변환 로직에 remeda 파이프라인 적용.

### Phase 4: barrel export 정리

#### 4-1. 모듈 index.ts 재작성

각 모듈의 `index.ts`가 해당 모듈의 유일한 공개 경계:

- 타입: 도메인 모델, 에러, 포트 인터페이스
- 값: use-case 팩토리 함수
- 테스팅: `testing/` 하위 export (별도 export path)

#### 4-2. 패키지 exports 업데이트

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./modules/drafts": "./src/modules/drafts/index.ts",
    "./modules/drafts/testing": "./src/modules/drafts/testing/index.ts",
    "./modules/prompts": "./src/modules/prompts/index.ts",
    "./modules/prompts/testing": "./src/modules/prompts/testing/index.ts",
    "./modules/home": "./src/modules/home/index.ts",
    "./modules/home/testing": "./src/modules/home/testing/index.ts",
    "./testing": "./src/testing/index.ts"
  }
}
```

### Phase 5: Consumer 마이그레이션

#### 5-1. apps/api 수정

- `toApplicationError` import 제거
- use-case 결과를 `.match()` 또는 ts-pattern으로 직접 처리
- adapter 계층 제거 후 use-case 직접 호출

#### 5-2. packages/database 수정

- 포트 인터페이스 import 경로 변경 (`@workspace/core` → `@workspace/core/modules/drafts`)
- 타입 import 경로 변경

#### 5-3. apps/web 수정

- 타입 import 경로 확인 및 필요 시 변경

---

## 6. 테스트 전략

### 원칙

- **각 use-case마다 단위 테스트** (Given-When-Then)
- **순수 함수(operations)는 빠른 속성 기반 테스트** 가능
- **fake repository는 함수형으로 재작성** (팩토리 함수로 생성)
- **테스트 파일은 `__tests__/` 대신 같은 디렉토리에 `.test.ts`로 colocation**

### 테스트 파일 목록

```
modules/drafts/
  draft-operations.test.ts
  use-cases/create-draft.test.ts
  use-cases/autosave-draft.test.ts
  use-cases/delete-draft.test.ts
  use-cases/get-draft.test.ts
  use-cases/list-drafts.test.ts

modules/prompts/
  use-cases/get-prompt.test.ts
  use-cases/list-prompts.test.ts
  use-cases/save-prompt.test.ts
  use-cases/unsave-prompt.test.ts

modules/home/
  use-cases/get-home.test.ts

shared/
  error/domain-error.test.ts
  utilities/draft-content-utilities.test.ts
```

### neverthrow 테스트 패턴

```typescript
describe("makeCreateDraftUseCase", () => {
  it("글감이 존재하면 초안을 생성한다", async () => {
    const result = await createDraft(userId, input)

    expect(result.isOk()).toBe(true)
    result.map((draft) => {
      expect(draft.title).toBe("새 글")
    })
  })

  it("글감이 없으면 NOT_FOUND 에러를 반환한다", async () => {
    const result = await createDraft(userId, { sourcePromptId })

    expect(result.isErr()).toBe(true)
    result.mapErr((error) => {
      expect(error.code).toBe("NOT_FOUND")
    })
  })
})
```

---

## 7. 마이그레이션 안전성

### 하위 호환성

- 기존 `@workspace/core` export 경로는 모두 유지
- 새 export 경로를 추가하되 기존 경로를 즉시 제거하지 않음
- adapter 제거는 consumer 마이그레이션 완료 후 진행

### 검증 체크리스트

- [ ] `bun run typecheck` 통과
- [ ] `bun run test` 전체 통과
- [ ] `bun run lint` 통과
- [ ] `bun run build` 통과
- [ ] apps/api 기존 테스트 통과
- [ ] packages/database 기존 테스트 통과

---

## 8. 참고 문헌 매핑

| 적용 항목                    | 근거 문헌                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Result 모나드 기반 에러 처리 | Railway-Oriented Programming (Wlaschin), Domain Modeling Made Functional            |
| Plain data + 순수 함수       | Data-Oriented Programming (Sharvit), Grokking Simplicity                            |
| Brand 타입으로 도메인 식별자 | Domain Modeling Made Functional, DDD (Evans)                                        |
| Discriminated union 에러     | Domain Modeling Made Functional, ts-pattern                                         |
| 모듈 내 포트 소유            | Clean Architecture (Martin), Hexagonal Architecture (Cockburn)                      |
| Colocation 원칙              | A Philosophy of Software Design (Ousterhout), Code That Fits in Your Head (Seemann) |
| 파이프 기반 합성             | Functional Design and Architecture, SICP                                            |
| 최소 표면적                  | Clean Code (Martin), Code Simplicity (Kanat-Alexander)                              |
| Exhaustive matching          | Grokking Simplicity, ts-pattern 공식 문서                                           |
| YAGNI (불필요 추상화 제거)   | Extreme Programming Explained (Beck), Refactoring (Fowler)                          |
| 테스트 colocation            | The Art of Unit Testing (Osherove), xUnit Test Patterns (Meszaros)                  |
| 팩토리 함수로 DI             | Dependency Injection Principles (Seemann), Functional Architecture                  |
