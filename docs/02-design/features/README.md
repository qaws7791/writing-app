---
title: 기능 설계
description: 글필의 핵심 기능을 사용자 가치 단위로 정의한 설계 문서를 관리한다.
status: active
---

## 문서 역할

이 폴더는 user-flow를 실제 상호작용 단위로 분해한 중간 설계 문서를 관리한다.

각 feature 문서는 목적, 사용자 문제, 진입 조건, 상호작용 규칙, 예외 상태, 연결된 flow와 screen을 함께 정의한다.

## 문서 목록

- [[02-design/features/writing-prompt]] — 글감 시스템 (탐색, 필터, 북마크)
- [[02-design/features/journey-system]] — 여정 시스템 (진행률, 세션 잠금/해제)
- [[02-design/features/session-steps]] — 세션/스텝 타입 및 상태 관리
- [[02-design/features/ai-feedback]] — AI 소크라테스식 코칭 피드백
- [[02-design/features/editor-library]] — 에디터 & 서재 (자동 저장, 검색)
- [[02-design/features/gamification]] — 게이미피케이션 (진행률, 스트릭, 뱃지)

## 연결 기준

- 상위 흐름: [[02-design/user-flows/README]]
- 하위 화면: [[02-design/screens/README]]
- 기준 문서: [[02-design/design-principles]], [[02-design/information-architecture]], [[02-design/content-style-guide]]
