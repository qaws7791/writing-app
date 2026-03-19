---
title: 로컬 개발 가이드
description: 이 모노레포를 로컬에서 설치, 실행, 점검할 때 필요한 기본 절차와 명령을 정리합니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 로컬 개발의 중심은 `apps/web` 프로토타입 확인과 `apps/api` 골격 실행입니다.
- 환경 변수 없이도 기본 실행은 가능합니다.

## 준비물

- Bun `1.3.10`
- Node.js `20` 이상

## 시작 절차

1. 저장소 루트에서 `bun install`
2. 전체 개발 서버 실행 시 `bun dev`
3. 웹만 실행할 때 `bun --filter web dev`
4. API만 실행할 때 `bun --filter api dev`

## 자주 쓰는 명령

| 목적           | 명령                   |
| -------------- | ---------------------- |
| 전체 개발 서버 | `bun dev`              |
| 웹 앱만 실행   | `bun --filter web dev` |
| API 앱만 실행  | `bun --filter api dev` |
| 전체 린트      | `bun lint`             |
| 전체 타입 검사 | `bun typecheck`        |
| 전체 빌드      | `bun build`            |

## 기본 포트

- 웹: `3000`
- API: `3010`

## 작업 흐름 권장

- 앱과 패키지를 함께 건드릴 때는 항상 저장소 루트에서 명령을 실행합니다.
- 패키지 하나만 고칠 때만 필터 실행을 사용합니다.
- 구현 변경 후 최소한 `bun lint` 또는 `bun typecheck` 중 하나는 돌려서 경계 오류를 먼저 확인합니다.
- 생성 산출물인 `.next`, `.turbo`는 수동 편집하지 않습니다.

## 현재 주의사항

- 웹은 실제 API가 아니라 목 데이터와 mock AI에 의존합니다.
- API는 아직 웹과 연결되지 않았습니다.
- `turbo.json` 기준으로 `dev`는 캐시되지 않고, `build`에는 `.env*`가 입력으로 반영됩니다.

## 관련 문서

- [[README]]
- [[environment-variables]]
- [[frontend-architecture-guide]]
- [[backend-architecture-guide]]

## 출처

- [Bun Workspaces](https://bun.sh/docs/pm/workspaces)
- [Package and Task Graphs | Turborepo](https://turborepo.dev/docs/core-concepts/package-and-task-graph)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
