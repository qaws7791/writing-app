---
title: 도메인 모델
description: 글필(Geulpil) 플랫폼의 핵심 엔티티와 관계, 책임 경계를 immutable 데이터 모델 기준으로 정의합니다.
---

## 모델링 원칙

- 플랫폼의 중심 도메인은 여정(Journey) 기반 글쓰기 학습이다.
- 기능 위계: **Core(여정) > Secondary(글쓰기) > Tertiary(글감)**. 이 위계가 화면 설계, 탭 구조, API 우선순위에 반영된다.
- AI는 독립 저자가 아니라 소크라테스식 코칭을 수행하는 보조 기능으로 모델링한다.
- 여정-세션-스텝의 계층 구조가 학습 흐름의 골격이다.
- 사용자의 글은 버전 가능한 형태로 다루며, AI 피드백은 버전에 연결한다.
- 구현 기준에서 모델은 클래스 인스턴스보다 immutable plain object로 표현한다.
- 상태 전이는 모델 내부 메서드보다 순수 함수와 operation 계층에서 처리한다.
- 인프라 저장 모델과 제품 도메인 모델은 같은 이름을 써도 같은 타입으로 취급하지 않는다.

## 핵심 엔티티

### User

- 플랫폼을 사용하는 기본 주체
- 프로필, 온보딩 데이터(관심사, 글쓰기 수준), 구독 티어를 가진다.
- 하나 이상의 인증 수단을 연결할 수 있다.
- 구현상 better-auth의 `user` 테이블과 대응한다.
- `email`, `emailVerified`, `image` 같은 필드는 인증 기본 정보이면서 동시에 최소 프로필 정보다.

### AuthAccount

- Google 로그인, Kakao 로그인 같은 인증 수단
- 한 `User`에 여러 `AuthAccount`가 연결될 수 있다.
- 인증 수단 자체와 사용자 프로필을 분리해 관리한다.
- 구현상 better-auth의 `account` 테이블과 대응한다.
- `providerId`, `accountId`는 외부 인증 공급자 식별자다.

### Session

- 현재 로그인 상태를 나타내는 보안 컨텍스트
- 만료 시각, 최근 활동 시각, 기기 메타데이터를 가진다.
- `User`에 종속되지만 생명주기는 독립적이다.
- 구현상 better-auth의 `session` 테이블과 대응한다.
- 세션 토큰은 글쓰기 도메인 식별자가 아니라 인증 인프라 식별자다.

### WritingPrompt

- 사용자의 사고를 촉발하는 질문·주제·상황 카드
- 유형(감각/회고/의견), 제목, 본문, 응답 수를 가진다.
- Tertiary 기능으로 글쓰기 진입 화면과 에디터 내 Bottom Sheet에서만 노출된다.
- 글감 기반 자유 글쓰기의 출발점이자, 세션 글쓰기 스텝의 프롬프트로 활용된다.

### Journey

- 특정 글쓰기 역량 향상을 목표로 한 구조화된 커리큘럼
- 제목, 설명, 카테고리(글쓰기 기술/마음챙김/기술), 썸네일, 세션 수를 가진다.
- 여러 세션으로 구성되며, 세션은 선형 진행 구조를 따른다.

### JourneySession

- 여정 내 하나의 학습 노드. 10~20분 완결형
- 여정 내 순서(order), 제목, 설명, 예상 소요 시간을 가진다.
- 여러 스텝으로 구성된다.

### Step

- 세션 내 하나의 마이크로 활동 단위
- 세션 내 순서(order)와 유형을 가진다.
- 유형: `LEARN` | `READ` | `GUIDED_QUESTION` | `WRITE` | `FEEDBACK` | `REVISE`
- 유형별 구조화된 콘텐츠를 JSON으로 저장한다.

### Writing

- 사용자가 작성한 에세이의 현재 상태
- 제목, 본문, 단어 수를 가진다.
- 글감(WritingPrompt) 또는 세션(JourneySession)에 연결될 수 있다.
- 플랫폼의 핵심 애그리게이트다.

### WritingVersion

- 특정 시점의 글 상태 스냅샷
- 본문, 단어 수, 버전 번호를 가진다.
- AI 피드백(JSON)을 포함할 수 있다.
- `Writing`의 이력을 보존한다.

### UserJourneyProgress

- 사용자의 여정 참여 상태를 추적한다.
- 현재 세션 순서, 완료율, 진행 상태(IN_PROGRESS | COMPLETED)를 가진다.

### UserSessionProgress

- 사용자의 세션 진행 상태를 추적한다.
- 현재 스텝 순서, 진행 상태(LOCKED | IN_PROGRESS | COMPLETED)를 가진다.
- 각 스텝에 대한 사용자 응답을 JSON으로 저장한다.

## 관계 요약

- `User` 1:N `AuthAccount`
- `User` 1:N `Session`
- `User` 1:N `Writing`
- `User` 1:N `UserJourneyProgress`
- `User` 1:N `UserSessionProgress`
- `Journey` 1:N `JourneySession`
- `JourneySession` 1:N `Step`
- `WritingPrompt` 0..N → `Writing`
- `JourneySession` 0..N → `Writing`
- `Writing` 1:N `WritingVersion`
- `UserJourneyProgress` N:1 `Journey`
- `UserSessionProgress` N:1 `JourneySession`

## 상태 모델

### Writing 상태

- `draft`: 작성 중인 글
- `completed`: 작성이 완료된 글
- `archived`: 사용자에게서 숨겨졌지만 기록은 유지되는 상태

### UserJourneyProgress 상태

- `IN_PROGRESS`: 여정 진행 중
- `COMPLETED`: 모든 세션을 완료한 상태

### UserSessionProgress 상태

- `LOCKED`: 이전 세션이 완료되지 않아 접근 불가
- `IN_PROGRESS`: 세션을 진행 중
- `COMPLETED`: 세션의 모든 스텝을 완료

### WritingPrompt 유형

- `SENSORY`: 감각적 경험에서 출발하는 자유 글쓰기
- `REFLECTION`: 과거 경험을 되돌아보는 성찰적 글쓰기
- `OPINION`: 특정 주제에 대한 입장을 논증하는 글쓰기

### Journey 카테고리

- `WRITING_SKILL`: 에세이 구조, 문단 구성, 퇴고 전략 등 기술적 역량
- `MINDFULNESS`: 감정 탐색, 자기 성찰, 일상 관찰 중심
- `PRACTICAL`: 특정 직무·상황 맞춤형 글쓰기

### Step 유형

- `LEARN`: 핵심 개념 설명과 예시
- `READ`: 모범 에세이 또는 문단 읽기와 분석
- `GUIDED_QUESTION`: 메타인지 촉발 질문에 답하기
- `WRITE`: 글감/프롬프트에 따른 글쓰기
- `FEEDBACK`: AI 피드백 확인 (강점/개선점/질문)
- `REVISE`: 피드백 기반 수정

## 경계에 대한 메모

- better-auth의 `user`, `account`, `session`은 인증 서브도메인의 영속성 모델이다.
- 글쓰기 제품 문서에서는 이를 `User`, `AuthAccount`, `Session`으로 표현하되, 구현 스키마와의 대응 관계를 유지한다.
- `packages/core`는 제품 도메인 모델을 정의하고, `packages/database`는 영속성 모델과 매핑을 담당한다.
- Hono request/response 타입은 도메인 모델에 직접 섞지 않는다.
- 커뮤니티 피드백과 소셜 기능은 현재 범위 밖이며, 추후 별도 서브도메인으로 확장한다.
- 통계용 집계 값은 원천 엔티티를 대체하지 않고 파생 데이터로 취급한다.
- 구독 티어(FREE/PRO)는 `User`에 포함하되, 결제 인프라는 별도 서브도메인으로 분리한다.

## 관련 다이어그램

- [[03-architecture/diagrams/domain-relationship]]
- [[03-architecture/diagrams/writing-runtime-flow]]
- [[04-engineering/backend-core-guide]]
