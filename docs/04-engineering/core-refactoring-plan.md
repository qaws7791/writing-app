# packages/core 모듈 확장 계획서

> 글필(Geulpil) 피벗에 따른 core 모듈 확장 계획입니다.
> 기존 코어 리팩토링(neverthrow, ts-pattern, remeda 도입, 모듈 평탄화)은 완료된 상태입니다.

## 상태

- 기준 시점: 2026-04-06
- neverthrow, ts-pattern, remeda가 도입되어 사용 중입니다.
- 기존 writings, prompts, home 모듈이 구현된 상태입니다.
- 글필 피벗에 따라 여정, 세션, 스텝, AI 피드백 모듈 확장이 필요합니다.

## 1. 목표 전체 디렉토리 구조

```
packages/core/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
└── src/
    ├── index.ts
    │
    ├── shared/
    │   ├── index.ts
    │   ├── brand/
    │   │   └── brand.ts                   # Brand<T,N>, UserId, WritingId, PromptId, JourneyId, SessionId, StepId
    │   ├── error/
    │   │   └── domain-error.ts            # DomainError discriminated union + 팩토리 + toHttpStatus
    │   └── schema/
    │       ├── writing-content-schema.ts
    │       └── prompt-schema.ts
    │
    ├── modules/
    │   ├── writings/
    │   │   ├── index.ts
    │   │   ├── writing-types.ts           # Writing, WritingSummary, WritingDetail
    │   │   ├── writing-error.ts           # WritingModuleError discriminated union
    │   │   ├── writing-operations.ts      # 순수 함수: buildWriting, updateWritingContent
    │   │   ├── writing-port.ts            # WritingRepository 인터페이스
    │   │   ├── use-cases/
    │   │   │   ├── create-writing.ts
    │   │   │   ├── autosave-writing.ts
    │   │   │   ├── delete-writing.ts
    │   │   │   ├── get-writing.ts
    │   │   │   └── list-writings.ts
    │   │   └── testing/
    │   │       ├── writing-fixture.ts
    │   │       └── fake-writing-repositories.ts
    │   │
    │   ├── writing-prompts/
    │   │   ├── index.ts
    │   │   ├── prompt-types.ts            # WritingPrompt, PromptSummary, PromptDetail
    │   │   ├── prompt-error.ts
    │   │   ├── prompt-port.ts             # PromptRepository 인터페이스
    │   │   ├── use-cases/
    │   │   │   ├── get-prompt.ts
    │   │   │   ├── list-prompts.ts
    │   │   │   ├── bookmark-prompt.ts
    │   │   │   └── unbookmark-prompt.ts
    │   │   └── testing/
    │   │
    │   ├── journeys/                      # 도입 예정
    │   │   ├── index.ts
    │   │   ├── journey-types.ts           # Journey, JourneySession, Step, StepType
    │   │   ├── journey-error.ts           # JourneyModuleError
    │   │   ├── journey-operations.ts      # unlockNextSession, calculateProgress
    │   │   ├── journey-port.ts            # JourneyRepository 인터페이스
    │   │   ├── session-progress-port.ts   # SessionProgressRepository 인터페이스
    │   │   ├── use-cases/
    │   │   │   ├── get-journey.ts
    │   │   │   ├── list-journeys.ts
    │   │   │   ├── enroll-journey.ts
    │   │   │   ├── start-session.ts
    │   │   │   ├── submit-step.ts
    │   │   │   └── complete-session.ts
    │   │   └── testing/
    │   │       ├── journey-fixture.ts
    │   │       └── fake-journey-repositories.ts
    │   │
    │   ├── ai-feedback/                   # 도입 예정
    │   │   ├── index.ts
    │   │   ├── feedback-types.ts          # AiFeedback, FeedbackStrength, FeedbackImprovement
    │   │   ├── feedback-error.ts
    │   │   ├── feedback-port.ts           # AiCoachingGateway 인터페이스
    │   │   ├── use-cases/
    │   │   │   ├── generate-feedback.ts
    │   │   │   └── compare-revisions.ts
    │   │   └── testing/
    │   │       └── fake-ai-coaching-gateway.ts
    │   │
    │   └── home/
    │       ├── index.ts
    │       ├── home-types.ts              # HomeSnapshot
    │       ├── use-cases/
    │       │   └── get-home.ts
    │       └── testing/
    │
    └── testing/
        └── index.ts
```

## 2. 신규 모듈 설계

### 2.1 journeys 모듈

여정-세션-스텝 계층 구조를 관리하는 핵심 학습 도메인입니다.

**핵심 타입:**

- `Journey`: 구조화된 커리큘럼. 카테고리(WRITING_SKILL/MINDFULNESS/PRACTICAL), 세션 수 포함
- `JourneySession`: 여정 내 학습 노드. 순서(order), 예상 소요 시간
- `Step`: 세션 내 마이크로 활동. 유형별 콘텐츠 JSON
- `StepType`: `LEARN` | `READ` | `GUIDED_QUESTION` | `WRITE` | `FEEDBACK` | `REVISE`
- `UserJourneyProgress`: 사용자의 여정 참여 상태 (IN_PROGRESS | COMPLETED)
- `UserSessionProgress`: 세션 진행 상태 (LOCKED | IN_PROGRESS | COMPLETED)

**핵심 연산:**

- `unlockNextSession`: 현재 세션 완료 시 다음 세션 잠금 해제
- `calculateProgress`: 여정 내 세션 완료율 계산
- `validateStepSubmission`: 스텝 유형별 응답 검증

**포트:**

- `JourneyRepository`: 여정 조회, 세션/스텝 조회
- `JourneyProgressRepository`: 여정/세션 진행 상태 관리

**use case:**

- `enroll-journey`: 여정 참여 시작 → 첫 세션 IN_PROGRESS로 설정
- `start-session`: 이전 세션 완료 확인 → 세션 시작
- `submit-step`: 스텝 유형별 응답 검증 → 저장 → WRITE 스텝이면 AI 피드백 트리거
- `complete-session`: 세션 완료 → 다음 세션 잠금 해제 → 마지막이면 여정 완료

### 2.2 ai-feedback 모듈

소크라테스식 코칭 피드백을 생성하는 AI 도메인입니다.

**핵심 타입:**

- `AiFeedback`: 강점(1~2개), 개선점(1~2개), 사고 촉발 질문(1개)
- `FeedbackLevel`: 사용자 수준별 피드백 전략 (입문: 강점 2:1, 중급: 1:1, 상급: 1:2)
- `RevisionComparison`: 초안-수정본 비교 분석 결과

**핵심 원칙:**

- AI는 완성된 문장이나 대체 표현을 직접 제시하지 않는다
- 피드백은 힌트와 질문 형태로만 개선 방향을 제안한다
- 수준별로 강점:개선점 비율을 조정한다

**포트:**

- `AiCoachingGateway`: AI 제공자에게 피드백 생성을 요청하는 인터페이스

**use case:**

- `generate-feedback`: 글 내용 + 사용자 수준 → AI 피드백 생성 (10초 이내)
- `compare-revisions`: 초안 + 수정본 → 개선 부분 명시 비교 피드백

### 2.3 기존 모듈 변경

**writings 모듈 확장:**

- `Writing`에 `sessionId` 선택 필드 추가 (세션 글쓰기 연결)
- `WritingVersion`에 `aiFeedback` JSON 필드 추가
- 세션 글쓰기 스텝에서 생성되는 글도 서재에 포함

**writing-prompts 모듈 변경:**

- `WritingPrompt` 유형: `SENSORY` | `REFLECTION` | `OPINION`
- 북마크 기능 추가 (bookmark/unbookmark use case)
- 응답 수(responseCount) 관리

**home 모듈 확장:**

- `HomeSnapshot`에 진행 중인 여정 목록, 오늘의 추천 글감 포함

## 3. 모듈 간 의존 규칙

```
shared (커널)             ← 어떤 모듈에도 의존하지 않음
modules/writings           ← shared만 의존
modules/writing-prompts    ← shared만 의존
modules/journeys           ← shared만 의존
modules/ai-feedback        ← shared만 의존
modules/home               ← shared + 다른 모듈의 공개 타입만 의존
```

모듈 간 직접 import 금지. home이 다른 모듈의 타입을 필요로 할 경우 shared 또는 포트를 통해 간접 참조.

## 4. 구현 우선순위

### Phase 1: writing-prompts 모듈 확장

- 글감 유형 분류 (SENSORY/REFLECTION/OPINION)
- 북마크 기능
- 응답 수 관리

### Phase 2: journeys 모듈 신규 도입

- Journey, JourneySession, Step 타입 정의
- UserJourneyProgress, UserSessionProgress 타입 정의
- 선형 진행 구조(이전 세션 완료 → 다음 잠금 해제) 연산
- enroll, start-session, submit-step, complete-session use case

### Phase 3: ai-feedback 모듈 신규 도입

- AiCoachingGateway 포트 정의
- generate-feedback, compare-revisions use case
- 수준별 피드백 전략

### Phase 4: home 모듈 확장

- 진행 중인 여정, 추천 글감 통합

## 5. 테스트 전략

### 원칙

- 각 use-case마다 단위 테스트 (Given-When-Then)
- 순수 함수(operations)는 완전한 단위 테스트
- fake repository는 함수형으로 재작성 (팩토리 함수로 생성)
- 테스트 파일은 같은 디렉토리에 `.test.ts`로 colocation

### 신규 모듈 테스트 파일

```
modules/journeys/
  journey-operations.test.ts
  use-cases/enroll-journey.test.ts
  use-cases/start-session.test.ts
  use-cases/submit-step.test.ts
  use-cases/complete-session.test.ts

modules/ai-feedback/
  use-cases/generate-feedback.test.ts
  use-cases/compare-revisions.test.ts
```

### AI 피드백 테스트 패턴

```typescript
describe("makeGenerateFeedbackUseCase", () => {
  it("글 내용과 수준을 받아 소크라테스식 피드백을 반환한다", async () => {
    const result = await generateFeedback(writingContent, "beginner")

    expect(result.isOk()).toBe(true)
    result.map((feedback) => {
      expect(feedback.strengths.length).toBeGreaterThanOrEqual(1)
      expect(feedback.improvements.length).toBeGreaterThanOrEqual(1)
      expect(feedback.question).toBeDefined()
    })
  })
})
```

## 6. 검증 체크리스트

- [ ] `bun run typecheck` 통과
- [ ] `bun run test` 전체 통과
- [ ] `bun run lint` 통과
- [ ] `bun run build` 통과
- [ ] packages/database 기존 테스트 통과

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-core-guide]]
- [[dependency-injection]]
- [[03-architecture/domain-model]]
- fake repository는 함수형으로 생성
- 테스트 파일은 같은 디렉토리에 `.test.ts`로 colocation

### 신규 테스트 파일

```
modules/journeys/
  journey-operations.test.ts
  use-cases/enroll-journey.test.ts
  use-cases/start-session.test.ts
  use-cases/submit-step.test.ts
  use-cases/complete-session.test.ts

modules/ai-feedback/
  use-cases/generate-feedback.test.ts
  use-cases/compare-revisions.test.ts

modules/writing-prompts/
  use-cases/bookmark-prompt.test.ts
```

### neverthrow 테스트 패턴

```typescript
describe("makeStartSessionUseCase", () => {
  it("이전 세션이 완료되었으면 세션을 시작한다", async () => {
    const result = await startSession(userId, sessionId)

    expect(result.isOk()).toBe(true)
    result.map((progress) => {
      expect(progress.status).toBe("IN_PROGRESS")
    })
  })

  it("이전 세션이 미완료이면 FORBIDDEN 에러를 반환한다", async () => {
    const result = await startSession(userId, lockedSessionId)

    expect(result.isErr()).toBe(true)
    result.mapErr((error) => {
      expect(error.code).toBe("FORBIDDEN")
    })
  })
})
```

## 6. 검증 체크리스트

- [ ] `bun run typecheck` 통과
- [ ] `bun run test` 전체 통과
- [ ] `bun run lint` 통과
- [ ] `bun run build` 통과
- [ ] apps/api 기존 테스트 통과
- [ ] packages/database 기존 테스트 통과

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-core-guide]]
- [[dependency-injection]]
- [[03-architecture/domain-model]]
