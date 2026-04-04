---
title: 엔지니어링
description: 글필(Geulpil) 모노레포 개발 규칙과 프론트엔드, 백엔드, 패키지 경계 기반 구현 가이드를 관리합니다.
---

이 섹션은 글필 플랫폼의 코드 작성 규칙과 실행 방식, 현재 구현 상태를 기준으로 한 엔지니어링 합의 문서를 모아둡니다.

## 상태

- 기준 시점: 2026-04-06
- 제품은 글필(Geulpil) — 한국어 에세이 글쓰기 학습 플랫폼으로 피벗했습니다.
- 핵심 도메인은 여정(Journey)-세션(Session)-스텝(Step) 기반 학습, 글감(WritingPrompt), 글쓰기(Writing), AI 소크라테스식 코칭입니다.
- `apps/web`은 홈, 글감, 여정, 에디터, 서재, 인증 화면의 프로토타입을 포함합니다.
- `apps/api`는 Hono + Awilix 기반 DI 컨테이너와 인증, 글쓰기, 글감, 동기화 라우트를 포함합니다.
- `packages/core`는 writings, prompts, home 모듈의 비즈니스 코어를 포함합니다.
- `packages/database`는 PostgreSQL + Drizzle ORM 기반 영속성 계층입니다.
- `packages/ai`는 AI SDK + Google Gemini 기반 AI 어댑터입니다.
- 여정, 세션, 스텝, AI 피드백 모듈은 도입 예정입니다.

## 포함 문서

- [[local-development]]: 개발 환경 준비, 실행 명령, 기본 작업 흐름
- [[coding-standards]]: 코드 작성 규칙과 리뷰 기준
- [[frontend-architecture-guide]]: Next.js 프론트엔드 구조와 구성 원칙
- [[state-management-guide]]: 프론트엔드 상태 관리 기준
- [[backend-architecture-guide]]: DOP와 패키지 경계 중심 백엔드 표준 아키텍처
- [[backend-package-boundaries]]: apps/api, core, db, storage, ai의 책임과 금지 의존성
- [[backend-core-guide]]: core 모듈 구조, 포트, use case, 테스트 기준
- [[api-conventions]]: OpenAPIHono와 core 계약 스키마를 연결하는 규약
- [[dependency-injection]]: 포트, 구현체, 조립 계층을 연결하는 기준
- [[environment-variables]]: 환경 변수 관리 정책
- [[error-message-guidelines]]: 사용자 메시지와 API 오류 응답 기준
- [[logging-guide]]: 구조화 로그와 요청 추적 기준

## 읽는 순서

1. [[local-development]]
2. [[coding-standards]]
3. [[backend-architecture-guide]]
4. [[backend-package-boundaries]]
5. [[backend-core-guide]]
6. [[dependency-injection]]
7. [[api-conventions]]

## 관련 문서

- [[03-architecture/README]]
- [[03-architecture/tech-stack]]
- [[03-architecture/api-overview]]
- [[03-architecture/error-handling]]

## 출처

- [Bun Workspaces](https://bun.sh/docs/pm/workspaces)
- [Package and Task Graphs | Turborepo](https://turborepo.dev/docs/core-concepts/package-and-task-graph)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
