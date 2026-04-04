---
title: 백엔드 패키지 경계
description: apps/api, core, database, ai 패키지의 책임과 금지 의존성을 정의합니다.
---

## 상태

- 기준 시점: 2026-04-06
- 현재 이 문서의 패키지 구조는 목표 구조입니다.
- `packages/core`, `packages/database`, `packages/ai`가 생성되어 있습니다.
- 글필(Geulpil) 피벗에 따라 여정, 세션, AI 피드백 도메인이 추가되었습니다.

## 최상위 원칙

- 각 앱과 패키지는 자기 역할만 가집니다.
- 앱은 패키지를 조립하지만, 패키지 내부 구현을 흡수하지 않습니다.
- 비즈니스 규칙은 인프라 구현 세부사항에 의존하지 않습니다.
- 연결은 dependency injection으로 수행합니다.
- 구현이 아니라 인터페이스와 포트에 의존합니다.

## 책임 표

| 위치                | 책임                                                        | 직접 알면 안 되는 것             |
| ------------------- | ----------------------------------------------------------- | -------------------------------- |
| `apps/api`          | HTTP 라우팅, 미들웨어, Context, OpenAPI, HTTP 매핑, 조립    | SQL 상세, AI provider 세부 응답  |
| `packages/core`     | 비즈니스 규칙, 계약 스키마, 상태 전이, use case, 포트       | Hono, DB 드라이버, AI SDK        |
| `packages/database` | DB 스키마, repository 구현, transaction, persistence mapper | Hono Context, HTTP 응답 형식     |
| `packages/ai`       | AI provider adapter, 프롬프트 실행, 응답 정규화             | Hono Context, 비즈니스 상태 전이 |
| `packages/ui`       | 프론트 디자인 시스템                                        | 백엔드 계약 구현, 서버 인프라    |

## 허용 의존 방향

```text
apps/api -> packages/core
apps/api -> packages/database
apps/api -> packages/ai

packages/database -> packages/core
packages/ai -> packages/core
```

## 금지 의존 방향

- `packages/core -> apps/api`
- `packages/core -> packages/database`
- `packages/core -> packages/ai`
- `packages/database -> packages/ai`
- `packages/ui -> backend packages`

인프라 패키지끼리는 공통 계약이 필요할 때도 직접 내부 구현을 공유하지 않고 `core` 포트 또는 별도 공통 타입으로 정리합니다.

## 패키지별 공개 인터페이스 기준

### `packages/core`

- 공개 대상
  - `contracts`
  - `use-cases`
  - `ports`
  - `model`의 핵심 타입
- 비공개 대상
  - 내부 helper
  - 모듈 내부 조합 세부사항

### `packages/database`

- 공개 대상
  - repository factory
  - transaction runner
  - DB client bootstrap
- 비공개 대상
  - 테이블 내부 세부 구현
  - SQL mapper 세부사항

### `packages/ai`

- 공개 대상
  - AI adapter factory
  - provider별 capability 설정
- 비공개 대상
  - provider 응답 정규화 세부 로직

## 새 기능 배치 규칙

- HTTP 요청 파싱, 응답 직렬화, OpenAPI route 정의는 `apps/api`
- 비즈니스 규칙, 검증, 상태 전이, 유스케이스는 `core`
- 영속성 구현은 `database`
- AI 코칭 피드백 구현은 `ai`
- LLM 호출과 응답 정규화는 `ai`

한 기능이 여러 패키지를 건드리더라도 책임을 한 패키지에 몰아넣지 않습니다.

## 안티패턴

- `apps/api`가 직접 SQL을 실행하는 구조
- `core`가 Hono `Context`를 파라미터로 받는 구조
- `core`가 SDK 클라이언트를 직접 import하는 구조
- `db` 패키지가 AI provider를 직접 호출하는 구조
- `storage` 패키지가 비즈니스 규칙을 스스로 결정하는 구조

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-core-guide]]
- [[dependency-injection]]
- [[03-architecture/README]]
