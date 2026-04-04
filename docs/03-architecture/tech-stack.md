---
title: 기술 스택
description: 글필(Geulpil) 플랫폼의 기술 스택과 패키지 분리 구조, 선택 이유를 기록합니다.
---

## 상태

- 기준 시점: 2026-04-06
- 문서에는 현재 사용 중인 기술과 도입 예정 기술이 함께 포함된다.
- 아직 설치되지 않은 기술은 버전을 추정하지 않고 `도입 예정`으로 기록한다.

## 공통

### Runtime & Package Manager

| 기술                                             | 버전   | 상태    | 선택 이유                             |
| ------------------------------------------------ | ------ | ------- | ------------------------------------- |
| **[Bun](https://bun.sh)**                        | 1.3.10 | 사용 중 | 빠른 설치와 실행, 워크스페이스 관리   |
| **[Turborepo](https://turbo.build/repo)**        | 2.8.8  | 사용 중 | 모노레포 태스크 오케스트레이션과 캐싱 |
| **[TypeScript](https://www.typescriptlang.org)** | 5.9.3  | 사용 중 | 패키지 경계 전체에서 타입 안전성 확보 |

## `apps/api` — HTTP / OpenAPI 조립 계층

| 기술                                                           | 버전                     | 상태    | 선택 이유                                         |
| -------------------------------------------------------------- | ------------------------ | ------- | ------------------------------------------------- |
| **[Hono](https://hono.dev)**                                   | ^4.12.5                  | 사용 중 | 가벼운 HTTP 프레임워크와 명확한 경계 구성         |
| **[better-auth](https://better-auth.com)**                     | 사용 중                  | 사용 중 | 소셜 로그인(Google/Kakao)과 세션 관리 통합        |
| **[awilix](https://github.com/jeffijoe/awilix)**               | 사용 중                  | 사용 중 | 의존성 주입 컨테이너                              |
| **[pino](https://getpino.io)**                                 | 사용 중                  | 사용 중 | 구조화 로깅                                       |
| **[@hono/zod-openapi](https://hono.dev/examples/zod-openapi)** | 도입 예정                | 계획    | `core`의 zod 계약을 route와 OpenAPI 문서에 재사용 |
| **OpenAPIHono**                                                | `@hono/zod-openapi` 포함 | 계획    | 모듈별 app 구성과 `app.openapi()` 연결 표준       |
| **[@scalar/hono-api-reference](https://scalar.com)**           | 도입 예정                | 계획    | Hono OpenAPI 스펙을 문서 UI로 노출                |

## API 계약 연동

| 기술                                                       | 버전    | 상태    | 선택 이유                                           |
| ---------------------------------------------------------- | ------- | ------- | --------------------------------------------------- |
| **[openapi-typescript](https://openapi-ts.dev)**           | 사용 중 | 사용 중 | OpenAPI 스펙에서 타입을 생성해 계약 드리프트를 줄임 |
| **[openapi-fetch](https://openapi-ts.dev/openapi-fetch/)** | 사용 중 | 사용 중 | 생성된 API 타입 기반 클라이언트 구성                |

## `packages/core` — 비즈니스 코어

| 기술                                                       | 버전    | 상태    | 선택 이유                                 |
| ---------------------------------------------------------- | ------- | ------- | ----------------------------------------- |
| **[Zod](https://zod.dev)**                                 | 사용 중 | 사용 중 | 계약 스키마와 타입 추론의 단일 기준       |
| **[neverthrow](https://github.com/supermacro/neverthrow)** | 사용 중 | 사용 중 | 예외 대신 `Result` 값으로 실패를 표현     |
| **[remeda](https://remedajs.com)**                         | 사용 중 | 사용 중 | 선언적 데이터 변환과 함수형 유틸리티      |
| **[ts-pattern](https://github.com/gvergnaud/ts-pattern)**  | 사용 중 | 사용 중 | 패턴 매칭으로 분기 로직을 선언적으로 표현 |
| **[Vitest](https://vitest.dev)**                           | 사용 중 | 사용 중 | 순수 함수와 use case의 빠른 단위 테스트   |

## `packages/database` — 데이터베이스 구현

| 기술                                         | 버전    | 상태    | 선택 이유                                               |
| -------------------------------------------- | ------- | ------- | ------------------------------------------------------- |
| **[Drizzle ORM](https://orm.drizzle.team)**  | 사용 중 | 사용 중 | SQL 중심의 명시적 영속성 모델과 타입 안전성             |
| **[PostgreSQL](https://www.postgresql.org)** | 사용 중 | 사용 중 | 관계형 데이터(여정-세션-스텝-글) 저장에 최적화된 안정성 |

## `packages/ai` — AI 구현

| 기술                                                         | 버전    | 상태    | 선택 이유                                    |
| ------------------------------------------------------------ | ------- | ------- | -------------------------------------------- |
| **[AI SDK (Vercel)](https://sdk.vercel.ai)**                 | 사용 중 | 사용 중 | LLM provider 차이를 감추는 adapter 계층 구성 |
| **[@ai-sdk/google](https://sdk.vercel.ai/providers/google)** | 사용 중 | 사용 중 | Google Gemini API 연동, 빠르고 비용 효율적   |

## `apps/web` — 웹 프론트엔드

| 기술                                               | 버전    | 상태    | 선택 이유                          |
| -------------------------------------------------- | ------- | ------- | ---------------------------------- |
| **[Next.js](https://nextjs.org)**                  | 16.1.6  | 사용 중 | React 기반 앱 프레임워크           |
| **[React](https://react.dev)**                     | ^19.2.4 | 사용 중 | UI 컴포넌트 기반 개발              |
| **[Tailwind CSS](https://tailwindcss.com)**        | 사용 중 | 사용 중 | 디자인 시스템 토큰과 스타일링      |
| **[TanStack Query](https://tanstack.com/query)**   | 사용 중 | 사용 중 | 서버 상태 관리와 캐싱              |
| **[Zustand](https://zustand-demo.pmnd.rs)**        | 사용 중 | 사용 중 | 클라이언트 상태 관리               |
| **[Tiptap](https://tiptap.dev)**                   | 사용 중 | 사용 중 | 확장 가능한 리치 텍스트 에디터     |
| **[React Hook Form](https://react-hook-form.com)** | 사용 중 | 사용 중 | 폼 상태 관리                       |
| **[Dexie](https://dexie.org)**                     | 사용 중 | 사용 중 | IndexedDB 래퍼, 오프라인 임시 저장 |

## `packages/ui` — 디자인 시스템

| 기술                                        | 버전    | 상태    | 선택 이유                        |
| ------------------------------------------- | ------- | ------- | -------------------------------- |
| **[Base UI](https://base-ui.com)**          | 사용 중 | 사용 중 | 비스타일 접근성 프리미티브       |
| **[shadcn/ui](https://ui.shadcn.com)**      | 사용 중 | 사용 중 | 소유 가능한 UI 레시피            |
| **[Tailwind CSS](https://tailwindcss.com)** | 사용 중 | 사용 중 | 앱과 패키지 사이의 스타일 일관성 |

## 인프라 & 배포

| 기술                                                       | 상태      | 선택 이유                          |
| ---------------------------------------------------------- | --------- | ---------------------------------- |
| **[Vercel](https://vercel.com)**                           | 사용 중   | Next.js 최적화 배포, 서버리스 운영 |
| **[Cloudflare R2](https://developers.cloudflare.com/r2/)** | 도입 예정 | 여정 썸네일 등 정적 자산 저장      |

## 메모

- 현재 설치 상태는 실제 `package.json` 기준이다.
- 실제 도입 시 버전과 선택 세부사항을 다시 갱신해야 한다.

## 관련 다이어그램

- [[03-architecture/diagrams/system-context]]
- [[03-architecture/diagrams/container-view]]
- [[04-engineering/backend-package-boundaries]]
