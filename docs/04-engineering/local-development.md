---
title: 로컬 개발 가이드
description: 이 모노레포를 로컬에서 설치, 실행, 점검할 때 필요한 기본 절차와 명령을 정리합니다.
---

## 상태

- 기준 시점: 2026-04-06
- 현재 로컬 개발의 중심은 `apps/web` 화면 프로토타입 및 `apps/api` 기능 구현입니다.
- `packages/core`, `packages/database`, `packages/ai`가 생성되어 있으며 개발 중입니다.
- 데이터베이스는 PostgreSQL을 사용합니다.

## 준비물

- Bun `1.3.10`
- Node.js `20` 이상

## 시작 절차

1. 저장소 루트에서 `bun install`
2. 전체 개발 서버 실행 시 `bun dev`
3. 웹만 실행할 때 `bun --filter web dev`
4. API만 실행할 때 `bun --filter api dev`

## 현재 자주 쓰는 명령

| 목적           | 명령                   |
| -------------- | ---------------------- |
| 전체 개발 서버 | `bun dev`              |
| 웹 앱만 실행   | `bun --filter web dev` |
| API 앱만 실행  | `bun --filter api dev` |
| 전체 린트      | `bun lint`             |
| oxlint 린트    | `bun lint:oxlint`      |
| 전체 포매팅    | `bun format`           |
| 포매팅 검사    | `bun format:check`     |
| 전체 타입 검사 | `bun typecheck`        |
| 전체 빌드      | `bun build`            |

## 백엔드 패키지 도입 후 권장 명령

아래 명령은 관련 패키지가 생성된 뒤 기준으로 사용합니다.

| 목적                 | 명령 예시                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| 비즈니스 코어 테스트 | `bun --filter @workspace/core test`                                                                    |
| DB 패키지 테스트     | `bun --filter @workspace/database test`                                                                |
| AI 패키지 테스트     | `bun --filter @workspace/ai test`                                                                      |
| API 타입 검사        | `bun --filter api typecheck`                                                                           |
| 백엔드 전체 테스트   | `turbo test --filter api --filter @workspace/core --filter @workspace/database --filter @workspace/ai` |

## 기본 포트

- 웹: `3000`
- API: `3010`

## 작업 흐름 권장

- 앱과 패키지를 함께 건드릴 때는 항상 저장소 루트에서 명령을 실행합니다.
- 패키지 하나만 고칠 때만 필터 실행을 사용합니다.
- 구현 변경 후 최소한 `bun lint` 또는 `bun typecheck` 중 하나는 돌려서 경계 오류를 먼저 확인합니다.
- 생성 산출물인 `.next`, `.turbo`는 수동 편집하지 않습니다.
- 백엔드 변경 시에는 `core` 단위 테스트를 우선하고, 그 다음 `apps/api` 조립 검증을 수행합니다.
- 인프라 패키지는 adapter 계약과 mapper를 검증하고, 비즈니스 규칙 재검증은 `core`에서 끝냅니다.

## 현재 주의사항

- 웹은 목 데이터와 mock AI에 의존하는 화면이 있습니다.
- `turbo.json` 기준으로 `dev`는 캐시되지 않고, `build`에는 `.env*`가 입력으로 반영됩니다.
- 로컬 개발 시 PostgreSQL이 실행 중이어야 합니다.

## 관련 문서

- [[README]]
- [[environment-variables]]
- [[frontend-architecture-guide]]
- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[backend-core-guide]]

## 출처

- [Bun Workspaces](https://bun.sh/docs/pm/workspaces)
- [Package and Task Graphs | Turborepo](https://turborepo.dev/docs/core-concepts/package-and-task-graph)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
