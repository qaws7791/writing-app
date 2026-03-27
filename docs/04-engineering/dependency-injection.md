---
title: 의존성 주입 가이드
description: 백엔드 패키지들을 인터페이스와 포트로 연결하고 apps/api에서 최종 조립하는 기준을 정의합니다.
---

## 상태

- 기준 시점: 2026-03-28
- `apps/api/src/runtime/container.ts`에 Awilix 기반 DI 컨테이너가 도입되었습니다.
- `apps/api/src/runtime/bootstrap.ts`는 컨테이너를 생성하고 마이그레이션/시딩 등 오케스트레이션만 담당합니다.

## 기본 원칙

- 비즈니스 코드는 구현체가 아니라 포트 타입에 의존합니다.
- 포트는 `packages/core`에 둡니다.
- 구현체는 `packages/db`, `packages/storage`, `packages/ai`에 둡니다.
- 최종 조립은 `apps/api`의 composition root에서 끝냅니다.
- Hono `Context`는 요청 메타데이터 전달용이며, 범용 서비스 로케이터로 쓰지 않습니다.

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
- handler에 use case 주입
- 요청 스코프 값과 장수명 객체 연결

## 요청 스코프와 장수명 dependency

### 요청 스코프

- `requestId`
- 인증 주체
- 권한 스냅샷
- locale 같은 요청 메타데이터

이 값들은 Hono `Context`에 둘 수 있습니다.

### 장수명 dependency

- DB client
- repository factory
- storage adapter
- AI adapter
- logger
- clock, id generator의 기본 구현체

이 값들은 앱 시작 시 생성해 조립합니다.

## 권장 패턴

### Use case factory (packages/core)

```ts
type CreateWritingDeps = {
  saveWriting: WritingRepository["save"]
  getNow: Clock["now"]
  createId: IdGenerator["create"]
}

export const createCreateWritingUseCase =
  (deps: CreateWritingDeps) => (input: CreateWritingInput) =>
    pipe(
      buildWriting(input, deps.createId, deps.getNow),
      ResultAsync.fromResult,
      ResultAsync.andThen((writing) => deps.saveWriting(writing))
    )
```

핵심은 use case가 구현체를 직접 만들지 않고, 필요한 동작만 타입으로 받아 조합한다는 점입니다.

### 컨테이너 등록 (apps/api)

`apps/api/src/runtime/container.ts`에서 Awilix 컨테이너에 모든 장수명 dependency를 선언적으로 등록합니다.

```ts
import { createContainer, asFunction, asValue, InjectionMode } from "awilix"

const container = createContainer<ApiCradle>({
  injectionMode: InjectionMode.PROXY,
  strict: true,
})

container.register({
  // 각 팩토리는 cradle에서 의존성을 구조 분해로 받습니다.
  // Awilix가 의존성 해석 순서를 자동으로 결정합니다.
  writingRepository: asFunction(({ database }: ApiCradle) =>
    createWritingRepository(database.db)
  ).singleton(),

  writingUseCases: asFunction(
    ({ writingRepository, promptRepository }: ApiCradle) =>
      createWritingApiService({ writingRepository, promptRepository })
  ).singleton(),
})
```

- `InjectionMode.PROXY`: 팩토리 함수에 cradle proxy를 전달하고, 구조 분해 시 lazy 해석합니다.
- `strict: true`: 등록되지 않은 이름으로 해석을 시도하면 즉시 에러를 던집니다.
- 모든 등록은 `singleton()`: 앱 수명과 동일한 장수명 객체입니다.
- `disposer()`: `container.dispose()` 호출 시 DB 연결 등 자원을 정리합니다.

### 오케스트레이션 (bootstrap.ts)

`bootstrap.ts`는 컨테이너를 생성한 뒤 마이그레이션, 시딩, Hono 앱 조립 등 순서가 중요한 작업만 담당합니다.

```ts
const container = createApiContainer(environment)
const { database, logger } = container.cradle

await migrateDatabase(database.db)
// 컨테이너에서 서비스를 꺼내 Hono 앱에 주입
```

## 하지 않는 것

- route handler 안에서 `new` 체인으로 구현체 생성
- `core`가 `db`, `storage`, `ai` 패키지를 직접 import
- 전역 mutable singleton으로 상태 공유
- 테스트만 위해 존재하는 과도한 추상화

## 검토 기준

- 포트는 `core`
- 구현은 인프라 패키지
- 조립은 `apps/api`
- 요청 값과 장수명 객체의 수명이 구분되어야 합니다.

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[backend-core-guide]]
- [[api-conventions]]
