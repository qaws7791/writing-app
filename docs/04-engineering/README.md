---
title: 엔지니어링
description: 모노레포 개발 규칙, 로컬 개발 방법, 프론트엔드와 백엔드 구현 가이드를 관리합니다.
---

이 섹션은 코드 작성 규칙과 실행 방식, 현재 구현 상태를 기준으로 한 엔지니어링 합의 문서를 모아둡니다.

## 상태

- 기준 시점: 2026-03-19
- 현재 `apps/web`는 목 데이터와 mock AI를 사용하는 프로토타입 단계입니다.
- 현재 `apps/api`는 Hono 애플리케이션 골격과 `GET /` 응답만 구현된 상태입니다.
- 아직 구현되지 않은 항목은 "도입 예정" 기준으로 기록합니다.

## 포함 문서

- [[local-development]]: 개발 환경 준비, 실행 명령, 기본 작업 흐름
- [[coding-standards]]: 코드 작성 규칙과 리뷰 기준
- [[frontend-architecture-guide]]: Next.js 프론트엔드 구조와 구성 원칙
- [[state-management-guide]]: 프론트엔드 상태 관리 기준
- [[backend-architecture-guide]]: Hono 기반 백엔드 구조 원칙
- [[api-conventions]]: API 경로, 요청, 응답, 버전 규약
- [[dependency-injection]]: 백엔드 의존성 주입과 조립 원칙
- [[environment-variables]]: 환경 변수 관리 정책
- [[error-message-guidelines]]: 사용자 메시지와 API 오류 응답 기준
- [[logging-guide]]: 구조화 로그와 요청 추적 기준

## 읽는 순서

1. [[local-development]]
2. [[coding-standards]]
3. [[frontend-architecture-guide]]
4. [[backend-architecture-guide]]
5. [[api-conventions]]

## 관련 문서

- [[03-architecture/README]]
- [[03-architecture/tech-stack]]
- [[03-architecture/api-overview]]
- [[03-architecture/error-handling]]

## 출처

- [Bun Workspaces](https://bun.sh/docs/pm/workspaces)
- [Package and Task Graphs | Turborepo](https://turborepo.dev/docs/core-concepts/package-and-task-graph)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
