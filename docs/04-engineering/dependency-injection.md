---
title: 의존성 주입 가이드
description: 백엔드 패키지들을 인터페이스와 포트로 연결하고 apps/api에서 최종 조립하는 기준을 정의합니다.
---

## 상태

- 기준 시점: 2026-04-06
- `apps/api/src/runtime/container.ts`에 Awilix 기반 DI 컨테이너가 도입되었습니다.
- `apps/api/src/runtime/modules/` 아래 네 개의 모듈로 등록 로직이 분리되어 있습니다.
- `apps/api/src/runtime/bootstrap.ts`는 컨테이너를 생성하고 마이그레이션/시딩 등 오케스트레이션만 담당합니다.
- 중간 서비스 레이어(`services/writing-services.ts`, `services/prompt-services.ts`)가 제거되었습니다.
- 각 use case는 컨테이너에 개별 토큰으로 등록되며, Hono context에 직접 주입됩니다.
- 글필(Geulpil) 피벗으로 여정, 세션, AI 피드백 use case가 추가될 예정입니다.

## 기본 원칙

- 비즈니스 코드는 구현체가 아니라 포트 타입에 의존합니다.
- 포트는 `packages/core`에 둡니다.
- 구현체는 `packages/database`, `packages/ai`에 둡니다.
- 최종 조립은 `apps/api`의 composition root에서 끝냅니다.
- Hono `Context`는 요청 메타데이터와 use case 함수를 전달하며, 범용 서비스 로케이터로 쓰지 않습니다.

## 조립 위치

### `packages/core`

- 포트 타입 정의
- use case factory 또는 use case 함수 정의

### 인프라 패키지

- 포트 구현체 생성
- 외부 SDK client bootstrap
- provider, repository, adapter factory

### `apps/api`

- 앱 시작 시 장수명 dependency 생성
- 모듈별 dependency 묶음 조립
- handler에 use case 개별 주입
- 요청 스코프 값과 장수명 객체 연결

## 요청 스코프와 장수명 dependency

### 요청 스코프

| 값              | 위치                  | 설정 시점                |
| --------------- | --------------------- | ------------------------ |
| `requestId`     | `c.var.requestId`     | request-logger 미들웨어  |
| `userId`        | `c.var.userId`        | resolve-session 미들웨어 |
| `requestLogger` | `c.var.requestLogger` | request-logger 미들웨어  |
| `authSession`   | `c.var.authSession`   | resolve-session 미들웨어 |
| `authUser`      | `c.var.authUser`      | resolve-session 미들웨어 |

이 값들은 Hono `Context`에 둡니다.

### 장수명 dependency

| 값                         | 위치             | 설정 시점                     |
| -------------------------- | ---------------- | ----------------------------- |
| DB client, repository      | Awilix cradle    | 컨테이너 (앱 시작)            |
| use case 함수 (`*UseCase`) | `c.var.*UseCase` | DI 미들웨어 (앱 시작 시 고정) |
| AI service, auth handler   | `c.var.*`        | DI 미들웨어 (앱 시작 시 고정) |

Awilix의 `Lifetime.SCOPED`는 사용하지 않습니다.
Hono가 이미 요청별 `Context` 객체를 관리하므로 이중 스코프 관리는 불필요한 복잡성입니다.

## 컨테이너 모듈 구조

컨테이너 등록은 `apps/api/src/runtime/modules/` 아래 네 개의 모듈로 분리합니다.

```
runtime/
  container.ts       ← ApiCradle 타입 정의, 모듈 조합
  modules/
    infrastructure.ts ← 환경, 로거, DB, PostgreSQL 버전
    auth.ts           ← 인증, 이메일
    repositories.ts   ← 모든 repository factory
    use-cases.ts      ← 개별 use case factory, 타입 export
```

`container.ts`는 조합만 담당합니다:

```ts
const container = createContainer<ApiCradle>({
  injectionMode: InjectionMode.PROXY,
  strict: true,
})

registerInfrastructure(container, environment)
registerAuth(container)
registerRepositories(container)
registerUseCases(container)
```

## 권장 패턴

### Use case factory (packages/core)

```ts
type CreateWritingDeps = {
  writingRepository: WritingRepository
  promptExists: (id: PromptId) => Promise<boolean>
}

export function makeCreateWritingUseCase(deps: CreateWritingDeps) {
  return (userId: UserId, input: CreateWritingInput): ResultAsync<WritingDetail, WritingModuleError> =>
    // ...
}
```

핵심은 use case가 구현체를 직접 만들지 않고, 필요한 동작만 타입으로 받아 조합한다는 점입니다.

### 컨테이너 등록 (apps/api)

`apps/api/src/runtime/modules/use-cases.ts`에서 각 use case를 개별 토큰으로 등록합니다.

```ts
container.register({
  createWritingUseCase: asFunction(
    ({ writingRepository, promptRepository }: ApiCradle) =>
      makeCreateWritingUseCase({
        writingRepository,
        promptExists: (id) => promptRepository.exists(id),
      })
  ).singleton(),

  listWritingsUseCase: asFunction(({ writingRepository }: ApiCradle) =>
    makeListWritingsUseCase({ writingRepository })
  ).singleton(),
})
```

- `InjectionMode.PROXY`: 팩토리 함수에 cradle proxy를 전달하고, 구조 분해 시 lazy 해석합니다.
- `strict: true`: 등록되지 않은 이름으로 해석을 시도하면 즉시 에러를 던집니다.
- 모든 등록은 `singleton()`: 앱 수명과 동일한 장수명 객체입니다.
- `disposer()`: `container.dispose()` 호출 시 DB 연결 등 자원을 정리합니다.

### Route handler에서 use case 사용

Route handler는 `c.var`에서 use case를 직접 가져와 사용합니다.
`ResultAsync`를 반환하는 use case는 `unwrapOrThrow`로 결과를 추출합니다.

```ts
const result = await c.var.getWritingUseCase(userId, toWritingId(writingId))
const writing = unwrapOrThrow(result)
return c.json(writing, 200)
```

### 오케스트레이션 (bootstrap.ts)

`bootstrap.ts`는 컨테이너를 생성한 뒤 마이그레이션, 시딩, Hono 앱 조립 등 순서가 중요한 작업만 담당합니다.

```ts
const container = createApiContainer(environment)
const { database, logger } = container.cradle

await migrateDatabase(database.db)
// 컨테이너에서 use case를 꺼내 Hono 앱에 주입
```

## 하지 않는 것

- route handler 안에서 `new` 체인으로 구현체 생성
- `core`가 `db`, `ai` 패키지를 직접 import
- 전역 mutable singleton으로 상태 공유
- 테스트만 위해 존재하는 과도한 추상화
- use case를 그룹으로 묶는 중간 서비스 레이어 (unwrapOrThrow만 하는 wrapper)

## 검토 기준

- 포트는 `core`
- 구현은 인프라 패키지
- 조립은 `apps/api`
- 요청 값과 장수명 객체의 수명이 구분되어야 합니다.
- 새 use case 추가 경로: core 정의 → container 등록 (2단계)

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[backend-core-guide]]
- [[api-conventions]]
