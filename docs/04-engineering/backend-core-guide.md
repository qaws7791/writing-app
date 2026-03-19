---
title: 백엔드 코어 가이드
description: packages/backend-core의 모듈 구조, DOP 패턴, 포트 설계, vitest 테스트 기준을 정의합니다.
---

## 상태

- 기준 시점: 2026-03-20
- `packages/backend-core`는 아직 구현되지 않았습니다.
- 이 문서는 비즈니스 코어를 어떤 구조로 만들지에 대한 설계 기준입니다.

## 역할

`packages/backend-core`는 모듈러 모놀리스 비즈니스 코어입니다.

- 제품 도메인의 상태 데이터를 정의합니다.
- 입력과 출력 계약 스키마를 관리합니다.
- 순수 연산과 상태 전이를 구현합니다.
- 외부 의존성에 대한 포트 타입을 정의합니다.
- 포트를 주입받는 use case를 제공합니다.

이 패키지는 Hono, DB, Storage, AI SDK와 분리됩니다.

## 설계 원칙

- 데이터는 immutable plain object로 표현합니다.
- 함수는 입력과 출력을 명확히 가지는 순수 함수로 나눕니다.
- 상태 전이는 `operations`에 둡니다.
- 외부 호출 순서와 조합은 `use-cases`에 둡니다.
- 에러는 `neverthrow`의 `Result` 값으로 표현합니다.
- 데이터 가공과 컬렉션 조합은 `remeda`와 `pipe()` 중심으로 구성합니다.

## 권장 구조

```text
packages/backend-core/
  src/
    shared/
      result/
      types/
      schema/
      ports/
      testing/
    modules/
      writings/
        contracts/
          writing-contract.ts
        model/
          writing.ts
          writing-id.ts
        operations/
          create-writing.ts
          rename-writing.ts
          change-visibility.ts
        ports/
          writing-repository.ts
          writing-event-log.ts
          writing-clock.ts
        use-cases/
          create-writing-use-case.ts
          get-writing-use-case.ts
        errors/
          writing-error.ts
        fixtures/
          writing-fixture.ts
      prompts/
        contracts/
        model/
        operations/
        ports/
        use-cases/
        fixtures/
  tests/
```

## 디렉토리 책임

### `contracts`

- zod 스키마
- API와 use case가 공유하는 입력/출력 DTO
- OpenAPI route 정의에 재사용될 계약

### `model`

- 브랜드 타입
- readonly 상태 타입
- 상태 enum 또는 discriminated union

### `operations`

- 상태 전이
- 파생값 계산
- 도메인 검증
- 외부 의존성 없는 순수 함수

### `ports`

- repository
- event log
- AI gateway
- storage gateway
- clock
- id generator

포트는 "무엇이 필요하다"를 설명하고 "어떻게 구현한다"는 포함하지 않습니다.

### `use-cases`

- 포트를 입력받아 비즈니스 흐름을 조합합니다.
- 저장 전 검증, 상태 전이, 중복 검사, 이벤트 기록 순서를 정의합니다.
- 결과는 `Result` 또는 `ResultAsync`로 반환합니다.

### `errors`

- 모듈 전용 에러 코드와 의미 있는 실패 타입을 정의합니다.
- `boolean` 성공 플래그는 사용하지 않습니다.

### `fixtures`

- vitest에서 재사용할 테스트 데이터 빌더를 둡니다.
- 테스트는 읽기 쉬운 데이터 조합을 우선합니다.

## 구현 예시 원칙

- `create-writing` 같은 연산은 입력 데이터를 받아 새 `Writing` 값을 반환합니다.
- `create-writing-use-case`는 `WritingRepository`, `Clock`, `IdGenerator` 같은 포트를 받아 조합합니다.
- 유효성 검사 실패, 중복 리소스, 정책 위반은 예외를 던지지 않고 실패 값으로 반환합니다.
- 영속화 전후 매핑은 코어가 아니라 `packages/db`에서 처리합니다.

## 테스트 전략

- test runner는 vitest를 기본으로 합니다.
- `operations`는 완전한 단위 테스트를 가집니다.
- `use-cases`는 포트 스텁, fake, spy로 검증합니다.
- 테스트에서 Hono 앱이나 실제 DB 연결은 사용하지 않습니다.
- fixture와 helper는 테스트 가독성을 높이는 범위에서만 공유합니다.

## 하지 않는 것

- Hono `Context`를 직접 받는 use case
- SDK 응답 타입을 그대로 모델 타입으로 사용하는 구조
- mutable class entity
- 테스트만 통과시키는 숨은 조건 분기

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[dependency-injection]]
- [[03-architecture/domain-model]]
