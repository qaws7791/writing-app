---
title: 엔지니어링
description: 글숨 Labs 모노레포 개발 규칙과 프론트엔드, 백엔드, 패키지 경계 기반 구현 가이드를 관리합니다.
---

이 섹션은 글숨 Labs의 코드 작성 규칙과 실행 방식, 현재 구현 상태를 기준으로 한 엔지니어링 합의 문서를 모아둡니다.

## 상태

- 기준 시점: 2026-05-05
- 제품은 글숨 Labs, AI-native 한국어 표현 플랫폼으로 피벗 중입니다.
- 현행 PRD는 [[00-prd/v3]]입니다.
- 핵심 루프는 사진 업로드 → 표현 재료 선택 → 문장 씨앗 조립 → 한 문장 작성 → 표현 카드 저장입니다.
- 기존 글필의 여정(Journey), 세션(Session), 스텝(Step), 글감(WritingPrompt), 긴 글 작성 도메인은 제거 또는 replaced 대상입니다.
- 코드 절단선은 [[geulsoom-labs-pivot-plan]]의 `2. 코드 절단선 확정`에 확정되어 있습니다.
- 유지 대상은 Bun/Turbo 모노레포, Hono API 골격, Better Auth, DB 연결/트랜잭션 유틸, OpenAPI/API client 생성 흐름, `packages/ui` 기반 UI 컴포넌트입니다.
- `packages/core`는 scenes, materials, sentence-seeds, garden 중심으로 재구성할 예정입니다.
- `packages/database`는 Better Auth 스키마를 유지하고 제품 테이블은 새 도메인 모델로 초기화할 예정입니다.

## 포함 문서

- [[geulsoom-labs-pivot-plan]]: 글숨 Labs PRD v1.1 기반 전체 프로젝트 피벗 작업 체크리스트
- [[local-development]]: 개발 환경 준비, 실행 명령, 기본 작업 흐름
- [[coding-standards]]: 코드 작성 규칙과 리뷰 기준
- [[frontend-architecture-guide]]: Next.js 프론트엔드 구조와 구성 원칙
- [[state-management-guide]]: 프론트엔드 상태 관리 기준
- [[storybook]]: apps/storybook 운영 원칙과 시각적 검증 가이드
- [[backend-architecture-guide]]: DOP와 패키지 경계 중심 백엔드 표준 아키텍처
- [[backend-package-boundaries]]: apps/api, core, db, storage, ai의 책임과 금지 의존성
- [[backend-core-guide]]: core 모듈 구조, 포트, use case, 테스트 기준
- [[api-conventions]]: OpenAPIHono와 core 계약 스키마를 연결하는 규약
- [[dependency-injection]]: 포트, 구현체, 조립 계층을 연결하는 기준
- [[transaction-boundary-audit]]: 트랜잭션 없는 다단계 DB 작업 감사와 차단 전략
- [[environment-variables]]: 환경 변수 관리 정책
- [[error-message-guidelines]]: 사용자 메시지와 API 오류 응답 기준
- [[logging-guide]]: 구조화 로그와 요청 추적 기준
- [[code-review-remediation-2026-04-20]]: 2026-04-20 코드 리뷰 후속 조치와 항목별 처리 현황
- [[codebase-simplification-review]]: 2026-04-21 기준 코드베이스 단순화 우선 개선 포인트

## 읽는 순서

1. [[geulsoom-labs-pivot-plan]]
2. [[local-development]]
3. [[coding-standards]]
4. [[backend-architecture-guide]]
5. [[backend-package-boundaries]]
6. [[backend-core-guide]]
7. [[dependency-injection]]
8. [[api-conventions]]

## 관련 문서

- [[00-prd/v3]]
- [[03-architecture/README]]
- [[03-architecture/tech-stack]]
- [[03-architecture/api-overview]]
- [[03-architecture/domain-model]]
- [[03-architecture/error-handling]]

## 출처

- [Bun Workspaces](https://bun.sh/docs/pm/workspaces)
- [Package and Task Graphs | Turborepo](https://turborepo.dev/docs/core-concepts/package-and-task-graph)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
