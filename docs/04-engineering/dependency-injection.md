---
title: 의존성 주입 가이드
description: 백엔드 패키지들을 인터페이스와 포트로 연결하고 apps/api에서 최종 조립하는 기준을 정의합니다.
---

## 상태

- 기준 시점: 2026-03-20
- 현재 저장소에는 실제 DI 조립 코드가 아직 없습니다.
- 이 문서는 `apps/api`, `core`, `db`, `storage`, `ai` 패키지 분리 이후의 표준 조립 방식을 설명합니다.

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
