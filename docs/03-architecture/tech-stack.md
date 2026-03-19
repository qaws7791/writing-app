---
title: 기술 스택
description: 플랫폼과 백엔드 패키지 분리 구조를 위한 기술 스택과 선택 이유를 기록합니다.
---

## 상태

- 기준 시점: 2026-03-20
- 문서에는 현재 사용 중인 기술과 도입 예정 기술이 함께 포함됩니다.
- 아직 설치되지 않은 기술은 버전을 추정하지 않고 `도입 예정`으로 기록합니다.

## 공통

### Runtime & Package Manager

| 기술                                             | 버전   | 상태    | 선택 이유                             |
| ------------------------------------------------ | ------ | ------- | ------------------------------------- |
| **[Bun](https://bun.sh)**                        | 1.3.10 | 사용 중 | 빠른 설치와 실행, 워크스페이스 관리   |
| **[Turborepo](https://turbo.build/repo)**        | 2.8.8  | 사용 중 | 모노레포 태스크 오케스트레이션과 캐싱 |
| **[TypeScript](https://www.typescriptlang.org)** | 5.9.3  | 사용 중 | 패키지 경계 전체에서 타입 안전성 확보 |

## `apps/api` — HTTP / OpenAPI 조립 계층

| 기술                                                           | 버전                     | 상태    | 선택 이유                                                 |
| -------------------------------------------------------------- | ------------------------ | ------- | --------------------------------------------------------- |
| **[Hono](https://hono.dev)**                                   | ^4.12.5                  | 사용 중 | 가벼운 HTTP 프레임워크와 명확한 경계 구성                 |
| **[@hono/zod-openapi](https://hono.dev/examples/zod-openapi)** | 도입 예정                | 계획    | `backend-core`의 zod 계약을 route와 OpenAPI 문서에 재사용 |
| **OpenAPIHono**                                                | `@hono/zod-openapi` 포함 | 계획    | 모듈별 app 구성과 `app.openapi()` 연결 표준               |
| **[@scalar/hono-api-reference](https://scalar.com)**           | 도입 예정                | 계획    | Hono OpenAPI 스펙을 문서 UI로 노출                        |
| **[better-auth](https://better-auth.com)**                     | 도입 예정                | 계획    | 인증과 세션 정책을 앱 경계에 통합                         |

## API 계약 연동

| 기술                                                       | 버전      | 상태 | 선택 이유                                           |
| ---------------------------------------------------------- | --------- | ---- | --------------------------------------------------- |
| **[openapi-typescript](https://openapi-ts.dev)**           | 도입 예정 | 계획 | OpenAPI 스펙에서 타입을 생성해 계약 드리프트를 줄임 |
| **[openapi-fetch](https://openapi-ts.dev/openapi-fetch/)** | 도입 예정 | 계획 | 생성된 API 타입 기반 클라이언트 구성                |

## `packages/backend-core` — 비즈니스 코어

| 기술                                                       | 버전      | 상태 | 선택 이유                               |
| ---------------------------------------------------------- | --------- | ---- | --------------------------------------- |
| **[Zod](https://zod.dev)**                                 | 도입 예정 | 계획 | 계약 스키마와 타입 추론의 단일 기준     |
| **[neverthrow](https://github.com/supermacro/neverthrow)** | 도입 예정 | 계획 | 예외 대신 `Result` 값으로 실패를 표현   |
| **[remeda](https://remedajs.com)**                         | 도입 예정 | 계획 | 선언적 데이터 변환과 함수형 유틸리티    |
| **[Vitest](https://vitest.dev)**                           | 도입 예정 | 계획 | 순수 함수와 use case의 빠른 단위 테스트 |

## `packages/db` — 데이터베이스 구현

| 기술                                             | 버전      | 상태 | 선택 이유                                    |
| ------------------------------------------------ | --------- | ---- | -------------------------------------------- |
| **[Drizzle ORM](https://orm.drizzle.team)**      | 도입 예정 | 계획 | SQL 중심의 명시적 영속성 모델과 타입 안전성  |
| **[bun:sqlite](https://bun.sh/docs/api/sqlite)** | 도입 예정 | 계획 | Bun 런타임과 자연스럽게 맞물리는 SQLite 접근 |
| **[Litestream](https://litestream.io)**          | 도입 예정 | 계획 | SQLite 기반 운영의 백업과 복제 전략          |

## `packages/storage` — 파일 저장 구현

| 기술                   | 버전      | 상태 | 선택 이유                                           |
| ---------------------- | --------- | ---- | --------------------------------------------------- |
| Object storage adapter | 도입 예정 | 계획 | 파일 저장 책임을 API 앱에서 분리                    |
| Signed URL 전략        | 도입 예정 | 계획 | 업로드/다운로드 권한 제어를 storage 패키지로 캡슐화 |

## `packages/ai` — AI 구현

| 기술                                         | 버전      | 상태 | 선택 이유                                    |
| -------------------------------------------- | --------- | ---- | -------------------------------------------- |
| **[AI SDK (Vercel)](https://sdk.vercel.ai)** | 도입 예정 | 계획 | LLM provider 차이를 감추는 adapter 계층 구성 |

## `apps/web` — 웹 프론트엔드

| 기술                                        | 버전    | 상태    | 선택 이유                     |
| ------------------------------------------- | ------- | ------- | ----------------------------- |
| **[Next.js](https://nextjs.org)**           | 16.1.6  | 사용 중 | React 기반 앱 프레임워크      |
| **[React](https://react.dev)**              | ^19.2.4 | 사용 중 | UI 컴포넌트 기반 개발         |
| **[Tailwind CSS](https://tailwindcss.com)** | 사용 중 | 사용 중 | 디자인 시스템 토큰과 스타일링 |

## `packages/ui` — 디자인 시스템

| 기술                                        | 버전    | 상태    | 선택 이유                        |
| ------------------------------------------- | ------- | ------- | -------------------------------- |
| **[Base UI](https://base-ui.com)**          | 사용 중 | 사용 중 | 비스타일 접근성 프리미티브       |
| **[shadcn/ui](https://ui.shadcn.com)**      | 사용 중 | 사용 중 | 소유 가능한 UI 레시피            |
| **[Tailwind CSS](https://tailwindcss.com)** | 사용 중 | 사용 중 | 앱과 패키지 사이의 스타일 일관성 |

## 메모

- 현재 설치 상태는 실제 `package.json` 기준이다.
- `backend-core`, `db`, `storage`, `ai` 관련 기술은 문서 기준의 목표 구조다.
- 실제 도입 시 버전과 선택 세부사항을 다시 갱신해야 한다.

## 관련 다이어그램

- [[03-architecture/diagrams/system-context]]
- [[03-architecture/diagrams/container-view]]
- [[04-engineering/backend-package-boundaries]]
