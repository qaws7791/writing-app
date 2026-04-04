---
title: 백엔드 아키텍처 가이드
description: DOP와 패키지 경계 중심으로 글필(Geulpil) 백엔드 구조를 정의합니다. apps/api는 조립 계층이고, 비즈니스와 인프라는 별도 패키지로 분리합니다.
---

## 상태

- 기준 시점: 2026-04-06
- `apps/api`는 Hono + Awilix 기반으로 인증, 글쓰기, 글감, 동기화 라우트를 포함합니다.
- `packages/core`는 writings, prompts, home 모듈의 비즈니스 코어를 포함합니다.
- `packages/database`는 PostgreSQL + Drizzle ORM 기반 영속성 계층입니다.
- `packages/ai`는 AI SDK + Google Gemini 기반 AI 어댑터입니다.
- 여정(journeys), 세션(sessions), 스텝(steps), AI 피드백(ai-feedback) 모듈은 도입 예정입니다.

## 기준 원칙

- 백엔드는 Data-Oriented Programming을 기본으로 설계합니다.
- 데이터는 클래스 인스턴스보다 `readonly` plain object와 배열로 표현합니다.
- 비즈니스 로직은 작은 순수 함수와 선언적 파이프라인으로 조합합니다.
- 부수 효과는 패키지 경계의 adapter에서만 수행합니다.
- 앱은 조립하고, 패키지는 자기 책임을 수행합니다.
- 구현체가 아니라 포트와 인터페이스에 의존합니다.

## 핵심 패턴

### Functional Core, Imperative Shell

- `packages/core`는 순수 함수, 상태 전이, 검증, use case 조합을 담당합니다.
- `packages/database`, `packages/ai`는 외부 시스템과 통신하는 imperative shell입니다.
- `apps/api`는 HTTP 요청을 순수 코어에 연결하고 결과를 HTTP 응답으로 변환합니다.

### Ports and Adapters

- 포트 타입은 `packages/core`에 둡니다.
- 저장소, AI 구현체는 각 인프라 패키지에서 포트를 구현합니다.
- `apps/api`는 구현체를 생성하고 use case에 주입합니다.

### Composition Root

- 최상위 조립은 `apps/api`에서 끝냅니다.
- 요청 스코프 값은 Hono `Context`에 두고, 장수명 dependency는 앱 시작 시 생성합니다.
- 비즈니스 모듈은 Hono `Context`, SDK 클라이언트, SQL 빌더를 직접 참조하지 않습니다.

### Schema-first Contract

- 요청/응답에 사용하는 zod 스키마는 `packages/core`의 `contracts`에 둡니다.
- `apps/api`는 `@hono/zod-openapi`의 `createRoute()`에서 이 스키마를 가져다 씁니다.
- HTTP 계약과 비즈니스 입력/출력 데이터의 기준을 한 곳에서 유지합니다.

## 역할 분리

### `apps/api`

- Hono 라우팅
- 미들웨어
- request context
- OpenAPI 문서화
- HTTP 요청/응답 매핑
- dependency 조립

`apps/api`는 비즈니스 규칙, SQL, 스토리지 SDK, AI provider 호출 로직을 직접 가지지 않습니다.

### `packages/core`

- 모듈러 모놀리스 비즈니스 로직
- 도메인 상태 데이터와 브랜드 타입
- zod 계약 스키마
- 순수 연산과 상태 전이
- use case
- 포트 타입
- 에러 타입

`packages/core`는 Hono, DB 드라이버, 스토리지 SDK, AI SDK에 직접 의존하지 않습니다.

### `packages/database`

- PostgreSQL + Drizzle ORM 클라이언트
- 영속성 스키마 (여정, 세션, 스텝, 글감, 글, 버전, 진행 상태)
- repository 구현체
- DB 전용 mapper와 transaction 처리

### `packages/storage`

- 파일 저장
- object key 전략
- signed URL 발급
- 업로드/다운로드 adapter

### `packages/ai`

- AI SDK + Google Gemini provider 연결
- 소크라테스식 코칭 프롬프트 실행
- 피드백 응답 정규화 (강점/개선점/사고 촉발 질문)
- AI 관련 adapter

## 표준 구조 예시

```text
apps/
  api/
    src/
      app.ts
      index.ts
      shared/
        http/
        middleware/
        context/
        openapi/
        presenters/
      composition/
        create-app-deps.ts
        create-modules.ts
      modules/
        writings/
          writings-app.ts
          routes/
            create-writing-route.ts
            get-writing-route.ts
          handlers/
            create-writing-handler.ts
          presenters/
            writing-presenter.ts
        writing-prompts/
          writing-prompts-app.ts
          routes/
          handlers/
          presenters/
        journeys/
          journeys-app.ts
          routes/
          handlers/
          presenters/
        sessions/
          sessions-app.ts
          routes/
          handlers/
          presenters/
        ai-feedback/
          ai-feedback-app.ts
          routes/
          handlers/
          presenters/

packages/
  core/
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
          model/
          operations/
          ports/
          use-cases/
          errors/
          fixtures/
        writing-prompts/
          contracts/
          model/
          ports/
          use-cases/
          fixtures/
        journeys/
          contracts/
          model/
          operations/
          ports/
          use-cases/
          errors/
          fixtures/
        sessions/
          contracts/
          model/
          operations/
          ports/
          use-cases/
          errors/
          fixtures/
        ai-feedback/
          contracts/
          model/
          ports/
          use-cases/
          fixtures/
    tests/
  database/
    src/
      client/
      schema/
      repositories/
      mappers/
      transactions/
      testing/
  ai/
    src/
      client/
      feedback/
      compare/
      mappers/
      testing/
```

## 구현 흐름

1. `packages/core/modules/*/contracts`에서 zod 계약 스키마를 정의합니다.
2. `apps/api/modules/*/routes`에서 `createRoute()`로 OpenAPI route를 선언합니다.
3. `apps/api/modules/*/*-app.ts`에서 `new OpenAPIHono()`로 모듈 app을 만듭니다.
4. `app.openapi()`에서 handler를 route와 연결합니다.
5. handler는 `Context`를 use case 입력으로 변환합니다.
6. use case는 포트를 주입받아 순수 연산과 adapter 호출 순서를 조합합니다.
7. presenter가 `Result`를 HTTP 성공 응답 또는 Problem Details로 변환합니다.

## 데이터와 함수 기준

- 모든 상태 데이터는 가능한 한 `readonly`로 표현합니다.
- 상태 변경은 객체를 직접 수정하지 않고 새 값을 반환하는 함수로 처리합니다.
- 복잡한 흐름은 작은 함수와 `pipe()` 조합으로 표현합니다.
- 범용 데이터 가공은 `remeda`를 우선 고려합니다.
- 예외는 기본 제어 흐름으로 사용하지 않고 `neverthrow`의 `Result`, `ResultAsync`를 우선 사용합니다.

## 도입하지 않는 것

- Hono route 안에서 직접 `new`로 외부 의존성을 생성하는 구조
- `apps/api` 안에 SQL, 스토리지, AI provider 호출을 직접 두는 구조
- 클래스 인스턴스를 중심으로 한 도메인 모델
- 전역 mutable singleton
- 테스트 우회를 위한 숨겨진 분기

## 테스트 기준

- `packages/core`: vitest 단위 테스트가 기본입니다.
- 순수 함수와 use case는 포트 스텁으로 검증합니다.
- `packages/database`, `packages/ai`: adapter 계약과 mapper를 검증합니다.
- `apps/api`: route 계약, validator, presenter, 모듈 조립을 검증합니다.

## 관련 문서

- [[README]]
- [[backend-package-boundaries]]
- [[backend-core-guide]]
- [[dependency-injection]]
- [[api-conventions]]
- [[coding-standards]]
- [[03-architecture/api-overview]]
- [[03-architecture/error-handling]]

## 출처

- [OpenAPI RPC - Hono](https://hono.dev/examples/zod-openapi)
- [Context - Hono](https://hono.dev/docs/api/context)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
