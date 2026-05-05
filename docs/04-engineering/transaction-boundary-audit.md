---
title: 트랜잭션 경계 감사
description: 트랜잭션 없는 다단계 DB 작업 현황을 조사하고, 시스템적으로 이 안티패턴을 차단하기 위한 개선 방안을 정의합니다.
---

## 상태

- 기준 시점: 2026-05-05
- 범위:
  - 운영 요청 경로(`apps/api` → `packages/core` → `packages/database`)
  - 초기화 스크립트(`packages/database/src/connection`)
- 목표:
  - 트랜잭션 없는 다단계 DB 쓰기 작업을 새 코드에서 원천적으로 막는다.
  - 기존 위험 구간을 모두 원자적(atomic) 경계 안으로 옮긴다.

## 조사 결과 요약

- 운영 요청 경로에서 확인된 위험 구간: 4곳
- 보조 스크립트에서 확인된 위험 구간: 3곳
- 구조적 원인:
  - `packages/core` 포트에 트랜잭션 경계 개념이 없다.
  - `apps/api`는 트랜잭션 스코프가 아닌 전역 repository를 조립한다.
  - repository API가 너무 세분화되어 있어 use case가 여러 쓰기 작업을 임의 조합할 수 있다.
  - 문서상으로는 `packages/database`가 transaction runner를 공개해야 하지만 실제 export는 없다.

## 현재 위험 코드

### 1. 글 생성 후 글감 응답 수 증가가 분리되어 있음

- 파일: `packages/database/src/repository/writing.repository.ts:73-107`
- 흐름:
  1. `writings`에 글을 insert
  2. `writing_prompts.response_count`를 update
- 위험:
  - 두 번째 update가 실패하면 글은 생성되지만 글감 응답 수는 증가하지 않는다.
  - `response_count`가 파생 상태인데 애플리케이션 코드가 수동으로 맞추고 있어 쉽게 드리프트가 생긴다.

### 2. 여정 등록과 세션 진행 상태 초기화가 서로 다른 호출로 분리되어 있음

- 파일:
  - `packages/core/src/modules/progress/use-cases/enroll-journey.ts:17-25`
  - `packages/database/src/repository/progress.repository.ts:138-225`
- 흐름:
  1. `user_journey_progress`에 여정 등록
  2. 모든 세션에 대한 `user_session_progress`를 별도 호출로 초기화
- 위험:
  - 1단계 성공 후 2단계 실패 시, 사용자는 여정에는 등록되었지만 세션 진행 레코드가 일부 또는 전부 없는 상태가 된다.
  - `initSessionProgressForJourney()` 내부는 트랜잭션을 쓰지만, 더 바깥의 `enrollJourney()`와 묶여 있지 않아 전체 유스케이스 원자성이 보장되지 않는다.

### 3. 세션 완료와 여정 진행률 갱신이 병렬 호출이지만 하나의 트랜잭션이 아님

- 파일: `packages/core/src/modules/progress/use-cases/complete-session.ts:27-40`
- 흐름:
  1. 현재 세션을 `completed`로 update
  2. 여정 진행률과 현재 세션 order를 update
- 위험:
  - 둘 중 하나만 반영되면 세션/여정 상태가 서로 다른 진실을 말하게 된다.
  - 예: 세션은 완료인데 여정은 여전히 이전 세션 order를 가리키는 상태.

### 4. 스텝 제출 시 세션 진행 상태와 AI 상태 저장이 분리되어 있음

- 파일: `packages/core/src/modules/progress/use-cases/submit-step.ts:151-204`
- 흐름 A:
  1. `user_session_progress` update
  2. `user_session_step_ai_state` upsert
- 흐름 B:
  1. `user_session_progress` update
  2. `user_journey_progress` update
- 위험:
  - AI 피드백 스텝에서는 진행 상태만 앞으로 갔는데 AI job이 생성되지 않을 수 있다.
  - 마지막 스텝 완료에서는 세션만 완료되고 여정 진행률은 남아 있거나, 반대로 여정만 넘어갈 수 있다.
  - 이 유스케이스가 현재 가장 복합적인 상태 전이를 가지고 있어 우선 교정 대상이다.

### 5. 시드 스크립트가 중간 실패 시 부분 반영 상태를 남길 수 있음

- 파일: `packages/database/src/connection/seed.ts:19-145`
- 흐름:
  - prompts → journeys → sessions → steps → users/accounts를 반복적으로 insert
- 위험:
  - 중간 실패 시 일부 여정만 들어가거나, user만 있고 account가 없는 상태가 남을 수 있다.
  - 운영 경로는 아니지만 개발/스테이징 데이터 신뢰성을 해친다.

### 6. DB reset이 테이블별 순차 delete만 수행함

- 파일: `packages/database/src/connection/reset.ts:4-9`
- 위험:
  - 중간 실패 시 일부 테이블만 비워진 반쯤 초기화된 상태가 남는다.

### 7. 테스트/관리 계정 시드도 user/account 생성이 분리되어 있음

- 파일: `packages/database/src/connection/seed.ts:112-145`
- 위험:
  - user insert 이후 account insert가 실패하면 인증 불가능한 반쪽 계정이 남는다.

## 구조적 진단

### 1. 트랜잭션이 use case의 1급 개념이 아님

- `packages/core/src/modules/progress/progress-port.ts`와 `packages/core/src/modules/writings/writing-port.ts`에는 transaction scope나 unit of work가 없다.
- 그래서 여러 repository 쓰기 호출을 하나의 비즈니스 상태 전이로 묶는 표준 방식이 없다.

### 2. repository가 트랜잭션 스코프가 아닌 전역 DB 클라이언트에 묶여 있음

- `apps/api/src/runtime/modules/repositories.ts:11-28`는 `database.db` 기반 singleton repository를 등록한다.
- 이 구조에서는 use case가 "같은 트랜잭션 안의 repository"를 받기가 어렵다.

### 3. 문서와 실제 구현이 어긋나 있음

- `docs/04-engineering/backend-package-boundaries.md:27, 69-72`는 `packages/database`가 transaction runner를 공개해야 한다고 적고 있다.
- 하지만 `packages/database/src/index.ts:1-44`에는 transaction runner export가 없다.
- 즉, 아키텍처 문서의 약속이 코드 레벨에서 아직 강제되지 않는다.

## 개선 방안

### 개선 방안 1. 트랜잭션 경계를 1급 구성요소로 도입한다

가장 먼저 해야 할 일은 "다단계 쓰기 유스케이스는 반드시 transaction runner를 통해 실행된다"는 공통 구조를 만드는 것이다.

- `packages/core`에 `TransactionManager` 포트를 추가한다.
- 예시:

```ts
export interface TransactionManager {
  run<T>(work: (scope: TransactionScope) => Promise<T>): Promise<T>
}

export interface TransactionScope {
  progressRepository: ProgressRepository
  writingRepository: WritingRepository
  promptRepository: PromptRepository
  journeyRepository: JourneyRepository
}
```

- `packages/database`는 `db.transaction(...)` 위에 `createTransactionManager(db)`를 구현한다.
- `TransactionScope` 안의 repository는 반드시 같은 `tx` 객체를 공유하도록 factory 기반으로 생성한다.
- `apps/api`는 더 이상 "전역 singleton mutating repository"만 주입하지 말고, `transactionManager`도 함께 조립한다.
- 다단계 쓰기 유스케이스(`enrollJourney`, `completeSession`, `submitStep`, `createWriting`)는 이 runner 안에서만 상태 전이를 수행한다.

이 방안의 핵심은 "트랜잭션을 쓸 수 있다"가 아니라 "다단계 쓰기는 transaction runner 없이는 구현할 수 없다"로 구조를 바꾸는 것이다.

#### 이 방안을 적용했을 때의 완료 조건

- 다단계 쓰기 use case가 모두 `transactionManager.run()` 안으로 이동한다.
- repository 구현은 `DbClient`와 `TransactionClient`를 같은 인터페이스로 다룰 수 있어야 한다.
- 신규 유스케이스는 transaction boundary를 명시하지 않으면 리뷰와 lint를 통과하지 못한다.

### 개선 방안 2. 세분화된 쓰기 API를 줄이고 원자적 command API로 재설계한다

트랜잭션 runner만 도입해도 도움이 되지만, 더 강하게 막으려면 repository 포트 자체가 "부분 상태만 저장하는 메서드 묶음"이 아니라 "의미 있는 상태 전이"를 표현해야 한다.

- 현재 문제:
  - `updateSessionProgress()`
  - `updateJourneyProgress()`
  - `saveSessionStepAiState()`
  - `enrollJourney()`
  - `initSessionProgressForJourney()`
- 이런 메서드는 개별적으로는 유용하지만, use case에서 잘못 조합되기 쉽다.

대신 아래처럼 workflow 단위 command를 만든다.

- `enrollJourneyWithInitialSessions(userId, journeyId)`
- `completeSessionAndAdvanceJourney(userId, sessionId, journeyId, nextSessionOrder, totalSessions)`
- `submitStepAndQueueAi(userId, sessionId, input)`
- `submitFinalStepAndAdvanceJourney(userId, sessionId, journeyId, input)`
- `createWritingFromPrompt(userId, input)`

이렇게 바꾸면 use case는 여러 write 메서드를 조합하지 않고, "한 번의 의미 있는 상태 전이"만 호출한다.

추가로 파생 상태는 최대한 직접 쓰지 않도록 줄인다.

- `writing_prompts.response_count`는
  - 가능하면 조회 시 `count(*)`로 계산하거나,
  - 성능상 필요하면 projection/trigger로 관리하거나,
  - 최소한 같은 트랜잭션 안에서만 갱신해야 한다.

즉, 개선 방안 2의 목적은 "트랜잭션을 잘 쓰자"가 아니라 "트랜잭션이 필요한 조합을 use case 바깥으로 숨겨, 잘못된 조합 자체를 만들기 어렵게 하자"다.

#### 이 방안을 적용했을 때의 완료 조건

- `packages/core` use case에서 mutating repository 메서드를 2개 이상 연달아 호출하는 코드가 사라진다.
- 상태 전이의 진입점이 coarse-grained command로 재편된다.
- 파생 카운터/보조 상태는 한 유스케이스에서 따로따로 갱신하지 않는다.

### 개선 방안 3. 정적 검사와 실패 주입 테스트로 재발을 시스템적으로 차단한다

구조를 개선해도, 시간이 지나면 다시 잘못된 패턴이 들어올 수 있다. 그래서 마지막으로 "실수해도 merge되지 않게" 만드는 안전장치가 필요하다.

#### 3-1. 정적 검사

- `packages/core/src/modules/**/use-cases/*.ts`에 대해 custom ESLint rule을 추가한다.
- 규칙 예시:
  - mutating repository 메서드(`create|update|delete|save|start|complete|enroll|submit|bookmark`)를 2회 이상 호출하면 실패
  - 예외: `transactionManager.run(...)` 콜백 내부에서 transaction-scoped command 하나만 호출하는 경우
- `packages/database/src/repository/**`에서도 `database.transaction(...)` 없이 2개 이상의 write statement를 수행하면 실패하도록 검사할 수 있다.

#### 3-2. 실패 주입 테스트

- 다단계 상태 전이마다 "두 번째 write에서 강제 실패" 테스트를 만든다.
- 기대값:
  - 실패 전후 DB 상태가 완전히 롤백된다.
  - `user_session_progress`와 `user_journey_progress`가 서로 어긋나지 않는다.
  - `writings`와 `writing_prompts.response_count`가 드리프트하지 않는다.

#### 3-3. 문서/리뷰 규칙

- PR 체크리스트에 아래 항목을 추가한다.
  - "이번 변경에 다단계 DB 쓰기가 있는가?"
  - "있다면 transaction boundary가 어디인가?"
  - "rollback 테스트가 추가되었는가?"
- `docs/04-engineering/backend-package-boundaries.md`와 본 문서를 기준 문서로 삼아 리뷰한다.

이 방안의 핵심은 사람이 기억해서 지키는 규칙이 아니라, lint와 테스트가 위반을 자동으로 막는 체계를 만드는 것이다.

#### 이 방안을 적용했을 때의 완료 조건

- 트랜잭션 없는 다단계 쓰기 코드는 CI에서 실패한다.
- 새 use case가 부분 반영 상태를 남기는지 failure-injection 테스트로 검증된다.
- 리뷰어가 코드 맥락을 추측하지 않고도 boundary를 바로 확인할 수 있다.

## 권장 적용 순서

1. `packages/database`에 transaction runner를 추가하고 `apps/api` 조립 계층에 연결한다.
2. 아래 운영 경로를 우선 마이그레이션한다.
   - `enrollJourney`
   - `submitStep`
   - `completeSession`
   - `createWriting`
3. coarse-grained command API로 포트를 재정의한다.
4. lint rule과 rollback 테스트를 추가한다.
5. 마지막으로 시드/리셋 스크립트도 transaction 경계 안으로 옮긴다.

## 작업 완료 후 기대 상태

이 보완 작업이 끝난 뒤에는 다음 조건을 만족해야 한다.

- 운영 경로에서 다단계 DB 쓰기는 모두 명시적 transaction boundary 안에서만 수행된다.
- `packages/core` use case는 여러 mutating repository를 임의 조합하지 않는다.
- repository 포트는 "부분 상태 갱신 함수 모음"이 아니라 "원자적 상태 전이 command"를 제공한다.
- 트랜잭션 없는 다단계 쓰기 코드는 lint 또는 테스트에서 자동으로 차단된다.

## 관련 문서

- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[dependency-injection]]
- [[03-architecture/data-flow]]
- [[03-architecture/error-handling]]
