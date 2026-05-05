---
title: README
description: 글숨 Labs 플랫폼의 시스템 구조, 도메인 모델, 인증, 데이터 흐름, 배포, 파일 저장, 운영 제약을 다루는 문서들을 관리합니다.
---

이 섹션은 글숨 Labs의 기술 구조와 시스템 경계, 운영 방식을 정의합니다. 백엔드는 `apps/api` 조립 계층과 `packages/core`, `packages/database`, `packages/ai`, `packages/storage` 패키지 경계를 기준으로 설명합니다.

## 현재 기준

- 현행 PRD: [[00-prd/v3]]
- 핵심 도메인: Scene, MaterialNode, MaterialSelection, SentenceSeed, SentenceDraft, GardenCard, Provenance
- 유지 경계: Better Auth, Hono API 골격, DB 연결/트랜잭션 유틸, OpenAPI/API client 생성 흐름
- 제거 대상: 여정, 세션, 스텝, 글감, 긴 글 피드백 중심 제품 도메인

## 포함 문서

- [[tech-stack]]: 채택 기술과 선택 이유
- [[domain-model]]: 사진, 표현 재료, 문장 씨앗, 문체 정원 중심 도메인 모델
- [[diagrams/README]]: 목표 아키텍처 다이어그램 허브
- [[api-overview]]: 사진, 표현 재료, 문장 씨앗, 문체 정원 리소스의 API 책임과 경계
- [[auth-and-session]]: 인증과 세션 정책
- [[data-flow]]: 데이터 흐름 문서. 글숨 Labs 피벗 반영 필요
- [[deployment-strategy]]: 환경별 배포와 롤백 전략
- [[file-storage-strategy]]: 파일 저장과 접근 통제 정책
- [[error-handling]]: Result 기반 오류 처리와 HTTP 변환 원칙
- [[observability-architecture]]: 로그, 메트릭, 트레이스 기준

## 관련 문서

- [[00-prd/v3]]
- [[01-product/README]]
- [[01-product/principles]]
- [[02-design/design-principles]]
- [[04-engineering/README]]
