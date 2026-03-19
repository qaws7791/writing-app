---
title: 아키텍처 다이어그램
description: 03-architecture 문서를 보강하는 목표 아키텍처 다이어그램 모음입니다.
---

이 디렉토리는 `03-architecture` 문서의 핵심 구조를 빠르게 훑기 위한 시각화 허브다. 각 다이어그램은 현재 구현 스냅샷이 아니라 문서에 정의된 목표 아키텍처를 기준으로 유지한다.

## 다이어그램 목록

- [[03-architecture/diagrams/system-context]]: 사용자, 플랫폼, 외부 의존성, 운영 계층의 시스템 경계
- [[03-architecture/diagrams/container-view]]: 모노레포 기준 컨테이너와 주요 런타임 의존성
- [[03-architecture/diagrams/writing-runtime-flow]]: 홈 진입부터 저장, AI, 공개, 내보내기까지의 런타임 흐름
- [[03-architecture/diagrams/domain-relationship]]: 핵심 도메인 엔티티와 관계
- [[03-architecture/diagrams/deployment-topology]]: 로컬, 스테이징, 운영 환경의 배치와 배포 경계
- [[03-architecture/diagrams/observability-flow]]: 로그, 메트릭, 트레이스, 감사 이벤트 수집 흐름

## 사용 규칙

- 모든 다이어그램은 Mermaid Markdown으로만 작성한다.
- 다이어그램이 바뀌면 대응하는 원문 문서도 함께 검토한다.
- 구현 세부를 확정하는 문서는 아니며, 시스템 경계와 흐름을 빠르게 파악하는 용도로 사용한다.
- 원문과 다이어그램이 충돌하면 먼저 `03-architecture` 원문을 기준으로 정리한다.

## 원문 문서 연결

- [[03-architecture/tech-stack]] -> [[03-architecture/diagrams/system-context]], [[03-architecture/diagrams/container-view]]
- [[03-architecture/api-overview]] -> [[03-architecture/diagrams/system-context]], [[03-architecture/diagrams/container-view]]
- [[03-architecture/auth-and-session]] -> [[03-architecture/diagrams/system-context]], [[03-architecture/diagrams/domain-relationship]]
- [[03-architecture/data-flow]] -> [[03-architecture/diagrams/writing-runtime-flow]]
- [[03-architecture/domain-model]] -> [[03-architecture/diagrams/domain-relationship]]
- [[03-architecture/deployment-strategy]] -> [[03-architecture/diagrams/deployment-topology]]
- [[03-architecture/file-storage-strategy]] -> [[03-architecture/diagrams/system-context]], [[03-architecture/diagrams/deployment-topology]]
- [[03-architecture/error-handling]] -> [[03-architecture/diagrams/writing-runtime-flow]], [[03-architecture/diagrams/observability-flow]]
- [[03-architecture/observability-architecture]] -> [[03-architecture/diagrams/observability-flow]]

## 관련 문서

- [[03-architecture/README]]
- [[04-engineering/README]]
