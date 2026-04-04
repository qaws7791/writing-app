---
title: 디자인
description: 글필(Geulpil) 제품의 UX/UI 상세 설계 허브. 화면 명세, 기능 설계, 사용자 흐름을 관리한다.
status: active
---

## 문서 목적

이 섹션은 글필 제품의 상세 설계를 다루는 허브다.

제품 의도, UX 구조, 화면 명세, 상태 정의, 기능 설계를 포함한다. 구현 방식, API, 데이터 모델, 프론트엔드 아키텍처는 제외한다.

모든 설계 판단의 근거는 `글필_PRD_v1.0.md`를 따른다.

## 제품 개요

**글필(Geulpil)**은 한국어 사용자를 위한 에세이 글쓰기 학습 플랫폼이다. "여정(Journey)"이라는 구조화된 커리큘럼을 통해 사용자가 단계별로 사고력과 글쓰기 역량을 성장시킨다.

핵심 루프: **글감 선택 → 글쓰기 → AI 피드백 → 수정**

핵심 개념:

- **글감 (Writing Prompt):** 사고를 촉발하는 질문·주제 카드
- **여정 (Journey):** 특정 역량을 목표로 한 구조화된 커리큘럼
- **세션 (Session):** 여정 내 하나의 학습 노드 (10~20분 완결형)
- **스텝 (Step):** 세션 내 마이크로 활동 단위 (LEARN / READ / GUIDED_QUESTION / WRITE / FEEDBACK / REVISE)
- **서재 (Library):** 사용자가 작성한 모든 글의 아카이브

## 문서 계층

- [[02-design/screens/README]]: 화면 단위 명세
- [[02-design/features/README]]: 기능 단위 설계
- [[02-design/user-flows/README]]: 사용자 경험 흐름

## 기준 문서

- [[02-design/design-principles]]: 설계 판단 원칙
- [[02-design/information-architecture]]: 전체 구조와 네비게이션
- [[02-design/content-style-guide]]: 화면 문구와 문체 기준

## 작성 규칙

- 파일명은 `lowercase-kebab-case`를 사용한다.
- 모든 문서는 한국어 `title`, `description`, `status` frontmatter를 가진다.
- 모든 문서는 H2 이하 제목만 사용한다.
- 모바일 우선으로 작성한다.
- screen 문서는 기본 상태와 주요 예외 상태를 함께 다룬다.

## 상세 설계 인덱스

**화면 (Screens)**

- [[02-design/screens/home]] — 홈 (홈/글감/여정 탭)
- [[02-design/screens/prompt-detail]] — 글감 상세
- [[02-design/screens/editor]] — 글 에디터
- [[02-design/screens/writing-detail]] — 글 상세 (읽기 뷰)
- [[02-design/screens/my-journeys]] — 나의 여정
- [[02-design/screens/journey-detail]] — 여정 상세
- [[02-design/screens/session-flow]] — 세션 진행 플로우
- [[02-design/screens/library]] — 서재
- [[02-design/screens/profile]] — 프로필/설정

**기능 (Features)**

- [[02-design/features/writing-prompt]] — 글감 시스템
- [[02-design/features/journey-system]] — 여정 시스템
- [[02-design/features/session-steps]] — 세션/스텝 타입
- [[02-design/features/ai-feedback]] — AI 코칭 피드백
- [[02-design/features/editor-library]] — 에디터 & 서재
- [[02-design/features/gamification]] — 게이미피케이션

**사용자 흐름 (User Flows)**

- [[02-design/user-flows/onboarding]] — 온보딩
- [[02-design/user-flows/prompt-to-writing]] — 글감 → 글쓰기
- [[02-design/user-flows/journey-session]] — 여정 세션 진행
- [[02-design/user-flows/library-management]] — 서재 관리
