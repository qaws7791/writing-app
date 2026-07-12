# 워크스페이스 인벤토리

이 문서는 루트 `package.json`의 Bun workspace manifest와 함께 현재 모노레포 인벤토리를 설명하는 기준 문서다. 실제 검증 기준은 `apps/*/package.json`과 `packages/*/package.json`이며, `bun run check:workspace-inventory`가 이 문서, `vitest.workspace.ts`, `turbo.json`, 분석 입력이 같은 구조를 가리키는지 확인한다.

## 워크스페이스

| 경로                         | 패키지 이름                    | 분류    | 책임                                                        |
| ---------------------------- | ------------------------------ | ------- | ----------------------------------------------------------- |
| `apps/admin`                 | `@workspace/admin`             | app     | 관리자 Next.js 운영 대시보드                                |
| `apps/admin-api`             | `@workspace/admin-api`         | app     | 관리자 Hono API                                             |
| `apps/api`                   | `@workspace/api`               | app     | 학습자 Hono API                                             |
| `apps/storybook`             | `storybook`                    | app     | 공유 UI 컴포넌트 개발 환경                                  |
| `apps/web`                   | `@workspace/web`               | app     | 학습자 Next.js 앱                                           |
| `packages/config`            | `@workspace/config`            | package | 공유 TypeScript 설정                                        |
| `packages/contracts`         | `@workspace/contracts`         | package | 학습자·관리자 request/response DTO와 Zod 계약               |
| `packages/core`              | `@workspace/core`              | package | 도메인 유스케이스, repository 구현, 학습자 API 런타임 조립  |
| `packages/db`                | `@workspace/db`                | package | Drizzle schema, migration, seed, SQLite client              |
| `packages/env`               | `@workspace/env`               | package | 환경 변수 파싱과 로컬 기본값                                |
| `packages/hono`              | `@workspace/hono`              | package | Hono route, validation, error handling 표준                 |
| `packages/http-client`       | `@workspace/http-client`       | package | HTTP transport result와 네트워크 오류 모델                  |
| `packages/logger`            | `@workspace/logger`            | package | pino logger와 요청 로그 middleware                          |
| `packages/resource-document` | `@workspace/resource-document` | package | 브라우저·서버 공용 Lexical GFM 문서 계약과 Yjs 투영         |
| `packages/ui`                | `@workspace/ui`                | package | 공유 UI primitive, 도메인 순수 프레젠테이션, 아이콘, 스타일 |

## 비워크스페이스 도구 루트

| 경로      | 책임                                       |
| --------- | ------------------------------------------ |
| `scripts` | 저장소 검증, lint rule, 분석 보조 스크립트 |

## 검증 기준

- `apps/*`와 `packages/*` 아래에서 `package.json`을 가진 디렉터리만 Bun workspace package로 간주한다.
- `vitest.config.ts`를 가진 workspace는 루트 `vitest.workspace.ts`의 `projects`에 포함되어야 한다.
- `apps/storybook`, `packages/config`, `scripts`는 분석 입력에 포함되어야 한다.
- `scripts`는 workspace package가 아니지만 루트 `lint`와 분석 입력의 관리 대상이다.
- `package.json`이 없는 ignored/generated 디렉터리는 workspace 인벤토리에 포함하지 않는다.
- `exports`를 선언한 package는 public export target이 package 내부의 실제 파일을 가리켜야 한다. wildcard target은 기준 디렉터리와 매칭 파일이 있어야 하며, public export key는 `./src` 내부 경로를 직접 노출하지 않는다.
