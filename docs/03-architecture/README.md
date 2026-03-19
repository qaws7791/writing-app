---
title: README
description: 플랫폼의 시스템 구조, 백엔드 패키지 경계, 인증, 데이터 흐름, 배포, 파일 저장, 운영 제약을 다루는 문서들을 관리합니다.
---

이 섹션은 플랫폼의 기술 구조와 시스템 경계, 운영 방식을 정의합니다. 백엔드는 `apps/api` 조립 계층과 `backend-core`, `db`, `storage`, `ai` 패키지 경계를 기준으로 설명합니다.

## 포함 문서

- [[tech-stack]]: 채택 기술과 선택 이유
- [[diagrams/README]]: 목표 아키텍처 다이어그램 허브
- [[api-overview]]: API 책임, 패키지 경계, 주요 리소스
- [[auth-and-session]]: 인증과 세션 정책
- [[data-flow]]: 사용자 입력부터 저장·공개까지의 흐름
- [[deployment-strategy]]: 환경별 배포와 롤백 전략
- [[file-storage-strategy]]: 파일 저장과 접근 통제 정책
- [[error-handling]]: Result 기반 오류 처리와 HTTP 변환 원칙
- [[observability-architecture]]: 로그, 메트릭, 트레이스 기준

## 관련 문서

- [[01-product/README]]
- [[01-product/principles]]
- [[02-design/design-principles]]
- [[04-engineering/README]]
