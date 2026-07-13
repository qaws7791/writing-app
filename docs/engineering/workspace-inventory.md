# 워크스페이스 인벤토리

이 문서는 루트 `package.json`의 Bun workspace manifest와 함께 현재 모노레포 인벤토리를 설명하는 기준 문서다. 실제 검증 기준은 `apps/*/package.json`과 `packages/*/package.json`이며, `bun run check:workspace-inventory`가 이 문서, `vitest.workspace.ts`, `turbo.json`, 분석 입력이 같은 구조를 가리키는지 확인한다.

## 개선 작업 상태

- 2026-07-13: workspace 발견과 manifest 해석을 `@workspace/repository-tooling`의 단일 Interface로 통합했다.
- fixture는 지원하지 않는 glob, 누락된 manifest, 중복 package 이름, workspace 추가·삭제와 test task capability 변경을 검증한다.
- 아래 워크스페이스 표가 현재 기준이며, 고정된 workspace 개수는 검증 계약으로 사용하지 않는다.

## Canonical inventory 집합

`createRepositoryWorkspaceInventory`는 루트 `workspaces` glob을 한 번 해석하고 다음 집합을 같은 결과에서 파생한다.

| 집합                    | 현재 포함 기준                                                               |
| ----------------------- | ---------------------------------------------------------------------------- |
| `allWorkspaces`         | 유효한 package manifest가 있는 전체 workspace                                |
| `testCapableWorkspaces` | 지원 runtime을 판별할 수 있는 `test` script와 `vitest.config.ts`가 있는 대상 |
| `coverageTargets`       | runtime 코드 coverage를 수집하는 test 가능 workspace                         |
| `coverageExclusions`    | test script 없음, Storybook 별도 실행, repository tooling이라는 제외 사유    |
| `storybookTargets`      | `test:stories` script로 별도 interaction·접근성 검증을 수행하는 workspace    |

test runtime은 manifest 명령에서 Bun 또는 Node/Vitest로 명시적으로 판별한다. 판별할 수 없는 `test` 명령은 자동 추론하지 않고 inventory 오류로 반환한다.

## 워크스페이스

| 경로                          | 패키지 이름                     | 분류    | 책임                                                        |
| ----------------------------- | ------------------------------- | ------- | ----------------------------------------------------------- |
| `apps/admin`                  | `@workspace/admin`              | app     | 관리자 Next.js 운영 대시보드                                |
| `apps/admin-api`              | `@workspace/admin-api`          | app     | 관리자 Hono API                                             |
| `apps/api`                    | `@workspace/api`                | app     | 학습자 Hono API                                             |
| `apps/storybook`              | `@workspace/storybook`          | app     | 공유 UI 컴포넌트 개발 환경                                  |
| `apps/web`                    | `@workspace/web`                | app     | 학습자 Next.js 앱                                           |
| `packages/config`             | `@workspace/config`             | package | 공유 TypeScript 설정                                        |
| `packages/contracts`          | `@workspace/contracts`          | package | 학습자·관리자 request/response DTO와 Zod 계약               |
| `packages/core`               | `@workspace/core`               | package | 도메인 유스케이스, repository 구현, 학습자 API 런타임 조립  |
| `packages/db`                 | `@workspace/db`                 | package | Drizzle schema, migration, seed, SQLite client              |
| `packages/env`                | `@workspace/env`                | package | 환경 변수 파싱과 로컬 기본값                                |
| `packages/hono`               | `@workspace/hono`               | package | Hono route, validation, error handling 표준                 |
| `packages/http-client`        | `@workspace/http-client`        | package | HTTP transport result와 네트워크 오류 모델                  |
| `packages/logger`             | `@workspace/logger`             | package | pino logger와 요청 로그 middleware                          |
| `packages/repository-tooling` | `@workspace/repository-tooling` | package | source inventory, TypeScript module graph와 정책 matcher    |
| `packages/resource-document`  | `@workspace/resource-document`  | package | 브라우저·서버 공용 Lexical GFM 문서 계약과 Yjs 투영         |
| `packages/ui`                 | `@workspace/ui`                 | package | 공유 UI primitive, 도메인 순수 프레젠테이션, 아이콘, 스타일 |

## 비워크스페이스 도구 루트

| 경로      | 책임                                       |
| --------- | ------------------------------------------ |
| `scripts` | 저장소 검증, lint rule, 분석 보조 스크립트 |

## 검증 기준

- 루트 `package.json`의 `workspaces`가 선언한 단일 깊이 glob만 지원하며, 매칭 디렉터리에 `package.json`이 없으면 오류다.
- `test` script를 가진 workspace는 지원 runtime과 `vitest.config.ts`가 있어야 하며 루트 `vitest.workspace.ts`의 `projects`에 포함되어야 한다.
- coverage runner의 대상은 `coverageTargets`와 일치해야 하고 나머지 workspace는 구조화된 제외 사유를 가져야 한다.
- `apps/storybook`, `packages/config`, `scripts`는 분석 입력에 포함되어야 한다.
- `scripts`는 workspace package가 아니지만 루트 `lint`와 분석 입력의 관리 대상이다.
- `package.json`이 없는 ignored/generated 디렉터리는 workspace 인벤토리에 포함하지 않는다.
- `exports`를 선언한 package는 public export target이 package 내부의 실제 파일을 가리켜야 한다. wildcard target은 기준 디렉터리와 매칭 파일이 있어야 하며, public export key는 `./src` 내부 경로를 직접 노출하지 않는다.
