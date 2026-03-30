# packages/\* 의존성 주입 현황 분석 및 개선 방안

> 작성일: 2026-03-28  
> 배경: 이전 세션에서 `apps/api`에 Awilix 기반 DI 컨테이너를 도입했다. 이 문서는 내부 패키지들(`packages/*`)의 DI 구현 방식을 분석하고 일관성 있는 개선 방향을 제안한다.

---

## 1. 현황 분석

### 1.1 패키지 목록

| 패키지                | 역할                                 | DI 노출 방식                                 |
| --------------------- | ------------------------------------ | -------------------------------------------- |
| `packages/core`       | 도메인 모델 · 유즈케이스 · 포트 정의 | `make*UseCase(deps)` 팩토리 함수             |
| `packages/database`   | SQLite/Drizzle 리포지터리 구현       | `create*Repository(db, clock?)` 팩토리 함수  |
| `packages/ai`         | Vercel AI SDK 기반 AI 서비스         | `createAIService(model)` + `createAIModel()` |
| `packages/email`      | 이메일 전송 어댑터                   | 단일 팩토리 함수 추정                        |
| `packages/ui`         | React 컴포넌트 라이브러리            | DI 무관 (순수 UI)                            |
| `packages/config`     | 공통 설정                            | DI 무관                                      |
| `packages/api-client` | API 클라이언트                       | DI 무관                                      |

---

### 1.2 packages/core — 유즈케이스 DI

`core`는 **포트(인터페이스) 중심 아키텍처**를 채택하고 있으며, 모든 유즈케이스는 수동 DI 팩토리 함수 패턴을 일관되게 사용한다.

#### 패턴 예시

```ts
// packages/core/src/modules/writings/use-cases/create-writing.ts
export type CreateWritingDeps = {
  readonly writingRepository: WritingRepository
  readonly promptExists: (id: PromptId) => Promise<boolean>
}

export function makeCreateWritingUseCase(deps: CreateWritingDeps) {
  return (userId: UserId, input: CreateWritingInput): ResultAsync<...> => { ... }
}
```

```ts
// packages/core/src/modules/home/use-cases/get-home.ts
export type GetHomeDeps = {
  readonly dailyRecommendationRepository: DailyRecommendationRepository
  readonly writingRepository: WritingRepository
  readonly promptRepository: PromptRepository
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  return (userId: UserId): ResultAsync<HomeSnapshot, never> => { ... }
}
```

#### 특징

- `make*UseCase(deps)` → 호출 가능한 함수 반환 (클로저 기반 커링)
- `*Deps` 타입을 명시적으로 분리하여 export
- 포트 인터페이스만 의존 (구현체에 의존 없음)
- `neverthrow`의 `ResultAsync`로 실패를 값으로 처리
- `promptExists`처럼 리포지터리 전체가 아닌 **함수 단위**로도 주입 가능

---

### 1.3 packages/database — 리포지터리 DI

구현체는 `db` 클라이언트와 선택적 `clock`을 인수로 받는 팩토리 함수 패턴을 사용한다.

```ts
// packages/database/src/repository/writing.repository.ts
export function createWritingRepository(
  database: DbClient,
  clock: Clock = () => new Date().toISOString()
): WritingRepository {
  return { create, delete, getById, list, replace, resume }
}

// packages/database/src/repository/daily-recommendation.repository.ts
export function createDailyRecommendationRepository(
  database: DbClient,
  clock: Clock = () => new Date().toISOString()
): DailyRecommendationRepository { ... }
```

#### 특징

- `DbClient` 하나를 주입받아 모든 쿼리를 실행
- `Clock` 함수를 옵셔널로 주입 → 테스트에서 시간 고정 가능
- 반환 타입이 `core`에서 정의한 포트 인터페이스를 구현하므로 타입 안전
- `AIRequestRepository`는 `core`가 아닌 `database` 패키지에서만 타입을 정의함 (인터페이스/구현 혼재)

---

### 1.4 packages/ai — AI 서비스 DI

```ts
// packages/ai/src/service.ts
export function createAIService(model: LanguageModel): AIService { ... }

// packages/ai/src/provider.ts
export function createAIModel(): LanguageModel {
  return google("gemini-3.1-flash-lite-preview")
}
```

#### 특징

- `AIService` 포트는 `packages/ai/src/port.ts`에 정의
- 모델 팩토리(`createAIModel`)와 서비스 팩토리(`createAIService`) 분리
- `apps/api`에서 `createAIApiService` 내부적으로 `createAIService(createAIModel())`를 직접 호출 — 컨테이너에 등록되지 않음

---

### 1.5 apps/api — DI 컨테이너 연결

```
Awilix Container (ApiCradle)
├── environment, isProduction
├── logger
├── database (singleton + disposer)
├── auth, emailSender, devEmailInbox
├── aiRequestRepository
├── dailyRecommendationRepository
├── promptRepository
├── writingRepository, writingSyncRepository, writingSyncWriter
├── writingTransactionRepository, writingVersionRepository
├── aiUseCases      ← createAIApiService(deps)
├── homeUseCases    ← createHomeApiService(deps)
├── promptUseCases  ← createPromptApiService(promptRepository)
├── writingUseCases ← createWritingApiService(deps)
└── writingSyncUseCases ← createWritingSyncApiService(deps)
```

`apps/api/src/services/*.ts`의 `create*ApiService` 함수들이 Awilix cradle에서 의존성을 받아 `core`의 유즈케이스를 조합한다. 패키지 경계가 명확하고 단방향 의존을 유지하고 있다.

---

## 2. 발견된 문제점

### 2.1 AIService가 컨테이너 바깥에서 생성됨

`apps/api/src/services/ai-services.ts`의 `createAIApiService` 내부에서 `createAIService(createAIModel())`를 직접 호출한다. `AIService` 인스턴스는 컨테이너에 등록되지 않아 수명 주기 관리, 교체, 테스트 모킹이 어렵다.

```ts
// 현재: createAIApiService 내부에 숨어 있음
export function createAIApiService(deps: AIApiServiceDeps): AIApiService {
  const ai = createAIService(createAIModel())  // ← 컨테이너 밖에서 생성
  ...
}
```

### 2.2 AIRequestRepository 타입이 database 패키지에만 존재

`core`에 `AIRequestRepository` 인터페이스가 없고 `@workspace/database`에서만 타입을 정의한다. `apps/api`가 `database` 패키지의 구체 타입에 직접 의존하게 되어 포트/어댑터 경계가 깨진다.

```ts
// apps/api/src/runtime/container.ts
import type { AIRequestRepository } from "@workspace/database" // ← 구현 패키지 직접 참조
```

### 2.3 중간 API 서비스 계층의 필요성 의문

`create*ApiService` 함수들이 유즈케이스를 래핑하기만 하고 `unwrapOrThrow`를 공통으로 적용하는 얇은 계층으로, 컨테이너 수가 늘어날수록 보일러플레이트가 비례해서 증가한다.

### 2.4 `@deprecated` 파일 잔존

`packages/core/src/modules/prompts/contracts/index.ts`, `ports/index.ts`, `model/index.ts`가 `@deprecated` 주석을 달고 여전히 남아 있어 탐색 시 혼란을 유발한다.

### 2.5 `promptExists` 주입 방식의 비일관성

`createWritingApiService`가 `promptRepository: Pick<PromptRepository, "exists">`를 받지만, 내부에서는 `deps.promptRepository.exists(promptId)`로 단순 위임만 한다. 일부 유즈케이스는 리포지터리 전체를, 일부는 단일 함수를 주입받아 인터페이스가 불통일하다.

---

## 3. 개선 방안

### 3.1 AIService를 컨테이너에 등록 (즉시 적용 권장)

`packages/ai`의 `createAIService`와 `createAIModel`을 컨테이너 레지스트리에 직접 등록하여 수명 주기와 교체를 일원화한다.

```ts
// apps/api/src/runtime/container.ts 변경

// 추가할 cradle 필드
aiModel: ReturnType<typeof createAIModel>
aiService: AIService

// 등록
aiModel: asFunction(() => createAIModel()).singleton(),
aiService: asFunction(({ aiModel }: ApiCradle) =>
  createAIService(aiModel)
).singleton(),

// 변경
aiUseCases: asFunction(
  ({ aiService, aiRequestRepository, logger }: ApiCradle) =>
    createAIApiService({ aiService, aiRequestRepository, logger })
).singleton(),
```

```ts
// apps/api/src/services/ai-services.ts 변경
import type { AIService } from "@workspace/ai"

type AIApiServiceDeps = {
  aiService: AIService          // ← 외부에서 주입
  aiRequestRepository: AIRequestRepository
  logger: ApiLogger
}

export function createAIApiService(deps: AIApiServiceDeps): AIApiService {
  const { aiService, aiRequestRepository, logger } = deps
  // createAIService(createAIModel()) 호출 제거
  ...
}
```

### 3.2 AIRequestRepository 포트를 core로 이동 (중기)

`packages/core` 내 적절한 모듈 아래(예: `modules/ai-assistant/`) `AIRequestRepository` 인터페이스를 정의하고, `packages/database`의 구현체가 이를 구현하도록 변경한다.

```ts
// packages/core/src/modules/ai-assistant/ai-assistant-port.ts (신규)
export interface AIRequestRepository {
  saveRequest(input: AIRequestInput): Promise<void>
}
```

```ts
// packages/database/src/repository/ai-request.repository.ts
import type { AIRequestRepository } from "@workspace/core/modules/ai-assistant"

export function createAIRequestRepository(db: DbClient): AIRequestRepository {
  ...
}
```

`apps/api`의 cradle 타입은 `@workspace/core`의 포트 타입을 참조하게 되어 단방향 의존 규칙을 복원한다.

### 3.3 @deprecated 파일 제거 (리팩토링 스프린트)

`packages/core/src/modules/prompts/` 아래의 `contracts/`, `model/`, `ports/` 인덱스 파일들을 삭제하고 내부/외부 참조를 직접 경로로 정정한다. 이 시점에 관련 import를 `grep`으로 확인하여 한 번에 처리한다.

### 3.4 promptExists 인터페이스 통일 (소규모 정리)

`create*ApiService`에서 리포지터리의 단일 메서드를 함수로 추출하여 전달하면 유즈케이스가 리포지터리 타입 전체에 묶이지 않는다. 이미 `promptExists`는 함수로 주입되지만 서비스 계층에서 `promptRepository` 전체를 받아 래핑하는 것은 불필요하다.

```ts
// 변경 전: createWritingApiService가 promptRepository 전체를 받음
createWritingApiService({
  writingRepository,
  promptRepository: Pick<PromptRepository, "exists">,
})

// 변경 후: 필요한 함수만 전달
createWritingApiService({
  writingRepository,
  promptExists: (id) => promptRepository.exists(id),
})
```

이렇게 하면 `writing-services.ts`가 `PromptRepository` 타입 import를 제거할 수 있어 모듈 결합도가 줄어든다.

---

## 4. 적용 우선순위

| 우선순위              | 항목                              | 이유                                     |
| --------------------- | --------------------------------- | ---------------------------------------- |
| **즉시**              | 3.1 AIService 컨테이너 등록       | 수명 주기 버그 방지 · 테스트 용이성 향상 |
| **단기**              | 3.4 promptExists 인터페이스 통일  | diff 최소 · 결합도 감소                  |
| **중기**              | 3.2 AIRequestRepository 포트 이동 | 패키지 경계 복원                         |
| **리팩토링 스프린트** | 3.3 @deprecated 파일 제거         | 코드베이스 정리                          |

---

## 5. 변경하지 않는 것

다음 패턴은 현재 구현이 적절하여 변경 대상이 아니다.

- **`make*UseCase(deps)` 커링 팩토리**: 테스트에서 가짜 의존성을 주입하기 쉽고 타입 안전하다.
- **`create*Repository(db, clock?)` 팩토리**: 시간 주입이 가능하여 결정론적 테스트를 지원한다.
- **`ResultAsync` 기반 유즈케이스 반환**: 에러를 타입 수준에서 다루는 올바른 방식이다.
- **Awilix 컨테이너 중앙화**: 리포지터리 → 서비스 수명 주기를 일관되게 관리한다.
- **단방향 의존 (apps → packages/core → 인터페이스 / packages/database → 구현)**
