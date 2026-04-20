---
title: 문서 인덱스
description: 글필(Geulpil) wiki의 모든 페이지를 카테고리별로 나열한 탐색 기점. 쿼리 응답 전 이 파일을 먼저 읽고 관련 페이지를 드릴다운한다.
---

## 사용 방법

이 파일은 LLM 쿼리의 진입점이다. 쿼리와 관련된 카테고리를 확인하고 해당 페이지를 읽어 답변을 합성한다. 원본 코드가 진실의 원천이며, 이 wiki는 결정 이유·맥락·운영 지식을 제공한다.

---

## 00 · PRD (제품 요구 사항)

| 파일          | 요약                                                  |
| ------------- | ----------------------------------------------------- |
| [[00-prd/v2]] | 현행 PRD. 핵심 기능, 설계 원칙, 여정 시스템 상세 명세 |
| [[00-prd/v1]] | 피벗 이전 PRD. 참고용 아카이브                        |

---

## 01 · 제품

| 파일                   | 요약                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| [[01-product/problem]] | 숏폼 문화·AI 남용에 의한 사고력 저하, 기존 도구 한계, 시장 기회 분석 |
| [[01-product/persona]] | 타겟 3개 페르소나와 세그먼트 우선순위 정의                           |

---

## 02 · 설계

### 기준 문서

| 파일                              | 요약                                       |
| --------------------------------- | ------------------------------------------ |
| [[02-design/design-principles]]   | 모든 UX/UI 설계 판단의 기준 원칙           |
| [[02-design/content-style-guide]] | 화면 문구·안내 문체·마이크로카피 작성 기준 |

### 기능 (features)

| 파일                                  | 요약                                      |
| ------------------------------------- | ----------------------------------------- |
| [[02-design/features/README]]         | 기능 문서 허브 및 연결 구조               |
| [[02-design/features/journey-system]] | 여정 시스템 — 진행률, 세션 잠금/해제 규칙 |
| [[02-design/features/session-steps]]  | 세션/스텝 타입 정의 및 상태 전이 규칙     |
| [[02-design/features/ai-feedback]]    | AI 소크라테스식 코칭 피드백 설계          |
| [[02-design/features/editor-library]] | 에디터 & 서재 — 자동 저장, 검색           |
| [[02-design/features/gamification]]   | 게이미피케이션 — 진행률, 스트릭, 뱃지     |

### 사용자 흐름 (user-flows)

| 파일                                     | 요약                                    |
| ---------------------------------------- | --------------------------------------- |
| [[02-design/user-flows/README]]          | 사용자 흐름 허브                        |
| [[02-design/user-flows/onboarding]]      | 온보딩 흐름 — 가입부터 첫 여정 시작까지 |
| [[02-design/user-flows/journey-session]] | 여정 세션 진행 흐름                     |

### 화면 명세 (screens)

| 파일                                 | 요약                |
| ------------------------------------ | ------------------- |
| [[02-design/screens/README]]         | 화면 명세 허브      |
| [[02-design/screens/my-journeys]]    | 내 여정 화면 명세   |
| [[02-design/screens/journey-detail]] | 여정 상세 화면 명세 |
| [[02-design/screens/session-flow]]   | 세션 진행 화면 명세 |
| [[02-design/screens/profile]]        | 프로필 화면 명세    |

---

## 03 · 아키텍처

| 파일                                           | 요약                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [[03-architecture/README]]                     | 아키텍처 섹션 허브 및 포함 문서 목록                              |
| [[03-architecture/tech-stack]]                 | 채택 기술과 선택 이유                                             |
| [[03-architecture/auth-and-session]]           | Google/Kakao 소셜 로그인, 세션 유지, 권한 검사 정책               |
| [[03-architecture/data-flow]]                  | 홈 진입→글감 선택→여정 진행→AI 피드백까지 데이터 흐름             |
| [[03-architecture/deployment-strategy]]        | 환경별 배포·롤백 전략                                             |
| [[03-architecture/file-storage-strategy]]      | 파일 저장·접근 통제 정책                                          |
| [[03-architecture/error-handling]]             | Result 기반 오류 처리와 HTTP 변환 원칙                            |
| [[03-architecture/observability-architecture]] | 저장 실패·인증·AI 지연·여정 오류 감지를 위한 로그·메트릭·트레이스 |

### 다이어그램

| 파일                                              | 요약                          |
| ------------------------------------------------- | ----------------------------- |
| [[03-architecture/diagrams/README]]               | 다이어그램 허브               |
| [[03-architecture/diagrams/system-context]]       | 시스템 컨텍스트 다이어그램    |
| [[03-architecture/diagrams/container-view]]       | 컨테이너 뷰 다이어그램        |
| [[03-architecture/diagrams/domain-relationship]]  | 도메인 관계 다이어그램        |
| [[03-architecture/diagrams/writing-runtime-flow]] | 글쓰기 런타임 흐름 다이어그램 |
| [[03-architecture/diagrams/deployment-topology]]  | 배포 토폴로지 다이어그램      |
| [[03-architecture/diagrams/observability-flow]]   | 관측 흐름 다이어그램          |

---

## 04 · 엔지니어링

### 공통 기준

| 파일                                     | 요약                                |
| ---------------------------------------- | ----------------------------------- |
| [[04-engineering/coding-standards]]      | 코드 작성 기준 — 일관성·경계 명확성 |
| [[04-engineering/local-development]]     | 모노레포 설치·실행·점검 기본 절차   |
| [[04-engineering/environment-variables]] | 환경 변수 저장·노출·검증 기준       |

### 백엔드

| 파일                                          | 요약                                                       |
| --------------------------------------------- | ---------------------------------------------------------- |
| [[04-engineering/backend-architecture-guide]] | DOP·패키지 경계 중심 백엔드 구조 정의                      |
| [[04-engineering/backend-core-guide]]         | packages/core 모듈 구조, DOP 패턴, 포트 설계, vitest 기준  |
| [[04-engineering/backend-package-boundaries]] | apps/api·core·database·ai 패키지 책임과 금지 의존성        |
| [[04-engineering/api-conventions]]            | core 계약 스키마와 use case를 HTTP/OpenAPI에 연결하는 규약 |
| [[04-engineering/dependency-injection]]       | 인터페이스·포트 연결 및 apps/api 최종 조립 기준            |
| [[04-engineering/transaction-boundary-audit]] | 트랜잭션 없는 다단계 DB 작업 감사와 시스템 차단 전략       |
| [[04-engineering/logging-guide]]              | 요청 추적·운영 디버깅·보안 대응을 위한 로그 기준           |
| [[04-engineering/error-message-guidelines]]   | 사용자·API 오류 응답 일관 설계 기준                        |
| [[04-engineering/core-refactoring-plan]]      | packages/core 모듈 확장 계획 (피벗 대응)                   |

### 프론트엔드

| 파일                                                     | 요약                                          |
| -------------------------------------------------------- | --------------------------------------------- |
| [[04-engineering/state-management-guide]]                | FSD 4-Layer 기반 상태 관리 원칙               |
| [[04-engineering/frontend/domain-layer]]                 | 프론트엔드 도메인 레이어 — 비즈니스 로직 분리 |
| [[04-engineering/frontend/application-layer]]            | 유즈케이스와 애플리케이션 레이어 관심사 분리  |
| [[04-engineering/frontend/api-boundary-dto]]             | API DTO 경계 설계 — 외부 변경 격리 전략       |
| [[04-engineering/frontend/api-call-function-separation]] | API 호출 함수 분리 기준                       |
| [[04-engineering/frontend/http-client-centralization]]   | HTTP 클라이언트 중앙화 기준                   |
| [[04-engineering/frontend/tanstack-query]]               | TanStack Query 서버 상태 관리 패턴            |

### 에디터 동기화

| 파일                                                    | 요약                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| [[04-engineering/editor-sync/editor-sync-architecture]] | Local-First 에디터 동기화 아키텍처 (XState, IndexedDB, delta 전송) |
| [[04-engineering/editor-sync/workplan]]                 | 에디터 동기화 구현 작업 계획                                       |

#### 에디터 동기화 참고 자료 (references)

| 파일                                                                                                     | 요약                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [[04-engineering/editor-sync/references/prosemirror-guide]]                                              | ProseMirror 공식 가이드 요약             |
| [[04-engineering/editor-sync/references/operational-transformation-wiki]]                                | OT(Operational Transformation) 개념 정리 |
| [[04-engineering/editor-sync/references/how-figmas-multiplayer-technology-works]]                        | Figma 멀티플레이어 기술 분석             |
| [[04-engineering/editor-sync/references/scaling-the-linear-sync-engine]]                                 | Linear 동기화 엔진 스케일링 분석         |
| [[04-engineering/editor-sync/references/reverse-engineering-study-of-linears-sync-engine]]               | Linear 동기화 엔진 역공학 연구           |
| [[04-engineering/editor-sync/references/exploring-notions-data-model-a-block-based-architecture-notion]] | Notion 블록 기반 데이터 모델 분석        |
| [[04-engineering/editor-sync/references/event-sourcing-pattern-azure-architecture-center]]               | 이벤트 소싱 패턴 (Azure Architecture)    |
| [[04-engineering/editor-sync/references/collaborative-editing-in-prosemirror]]                           | ProseMirror 협업 편집 구현               |
| [[04-engineering/editor-sync/references/designing-the-delta-format-quill-rich-text-editor]]              | Quill Delta 포맷 설계                    |
| [[04-engineering/editor-sync/references/behind-the-feature-the-hidden-challenges-of-autosave]]           | 자동 저장의 숨겨진 도전 과제             |
| [[04-engineering/editor-sync/references/the-hard-things-about-sync]]                                     | 동기화의 근본적인 어려움                 |
| [[04-engineering/editor-sync/references/making-multiplayer-more-reliable]]                               | 멀티플레이어 신뢰성 개선 전략            |
| [[04-engineering/editor-sync/references/the-story-of-crafts-in-house-sync-protocol]]                     | Craft 자체 동기화 프로토콜 개발기        |
| [[04-engineering/editor-sync/references/emergence-engineering-blog]]                                     | Emergence 동기화 엔지니어링 블로그       |

---

## 05 · 리서치

| 파일                   | 요약                                |
| ---------------------- | ----------------------------------- |
| [[05-research/README]] | 리서치 섹션 허브 — 목적과 구성 안내 |

### 사용자 리서치

| 파일                                                           | 요약                                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [[05-research/user-research/ai-writing-difficulties]]          | AI 활용 글쓰기 사용자 고충 — Harvard·Oxford·NIH 등 2023~2025 연구 종합 |
| [[05-research/user-research/generative-ai-writing-challenges]] | 생성형 AI 글쓰기 단계별 어려움 — 정확성·문체 획일화·저자성·의존성      |
| [[05-research/user-research/essay-writing-difficulties]]       | 에세이 글쓰기 공통 고충 — 아이디어 생성, 구조화, 심리적 블록           |
| [[05-research/user-research/interactive-platform-research]]    | 자기주도형 학습 플랫폼 설계 리서치 — 시장 조사 및 포지셔닝             |
| [[05-research/user-research/reference-services-analysis]]      | 레퍼런스 서비스 분석 — NoRedInk, Quill, Cambridge Write & Improve      |

### 커리큘럼 참고 자료

| 파일                                                                       | 요약                                                           |
| -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [[05-research/references/essay-curriculum-gpt]]                            | 에세이 교육 48주 커리큘럼 — 8개 역량군 기반                    |
| [[05-research/references/essay-education-platform-design-gpt]]             | 에세이 교육 플랫폼 설계 — 활동 기반 학습 시스템                |
| [[05-research/references/korean-essay-learning-activities-platform]]       | 한국어 에세이 학습 활동 플랫폼 — 과정 중심 쓰기 이론           |
| [[05-research/references/korean-writing-curriculum-gpt]]                   | 한국인 대상 글쓰기 커리큘럼 — 코어 + 심화 트랙 설계            |
| [[05-research/references/essay-competency-integrated-curriculum-research]] | 수필 창작 교육 역량 연구 — 4대 핵심 역량 및 12주 통합 커리큘럼 |

---

## 06 · 운영

| 파일                                | 요약                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| [[06-operations/incident-playbook]] | 서비스 장애 대응 절차 및 유형별 가이드                   |
| [[06-operations/operational-risks]] | 커뮤니티·콘텐츠·데이터 신뢰성 등 운영 리스크와 대응 기준 |
| [[06-operations/security]]          | 계정·데이터·비밀 정보 보호를 위한 보안 원칙              |

---

## 기타

| 파일               | 요약                                                                |
| ------------------ | ------------------------------------------------------------------- |
| [[AGENTS]]         | wiki 관리 규칙 — 에이전트 동작 스키마 (이 파일을 항상 먼저 읽을 것) |
| [[여정_스탭_설계]] | 여정 스텝 상세 설계 문서                                            |

---

## 99 · 아카이브 (pre-pivot)

> 피벗 이전 자료. 현재 기준 문서가 아니므로 참고 목적으로만 사용.

| 파일                                                    | 요약                        |
| ------------------------------------------------------- | --------------------------- |
| [[99-archive/pre-pivot-ux/information-architecture]]    | 이전 정보 구조              |
| [[99-archive/pre-pivot-ux/ai-assistant]]                | 이전 AI 어시스턴트 설계     |
| [[99-archive/pre-pivot-ux/editor]]                      | 이전 에디터 설계            |
| [[99-archive/pre-pivot-learning/curriculum-principles]] | 이전 커리큘럼 원칙          |
| [[99-archive/pre-pivot-learning/learning-loop]]         | 이전 학습 루프 설계         |
| [[99-archive/pre-pivot-prompts/master-planning-prompt]] | 이전 마스터 플래닝 프롬프트 |
| [[99-archive/daily-recommendation-feature]]             | 일일 추천 기능 실험 기록    |
| [[99-archive/phase-one-backend]]                        | 1단계 백엔드 초기 계획      |
