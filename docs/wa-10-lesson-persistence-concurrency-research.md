# WA-10 레슨 저장 상태 경쟁 분석

## 2026-06-17 시작

- Notion 이슈: `WA-10 이벤트 핸들러 내의 상태 접근 충돌 (Stale Closure)`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-10 페이지
- 조사 범위: `apps/web/src/features/lessons/use-lesson-persistence.ts`, `apps/web/src/features/lessons/lesson-experience.tsx`, `apps/web/src/features/lessons/lesson-step-renderer.tsx`, 관련 테스트
- 목표: 레슨 시작, 답변 저장, 완료 저장의 비동기 상태 갱신이 실제 경쟁 상태를 만들 수 있는지 판단하고, 같은 문제가 반복되지 않도록 더 안전한 구조 개선 방안을 도출한다.

## 이슈 요약

WA-10은 `useLessonPersistence()`가 `useCallback`으로 감싼 비동기 핸들러 안에서 `answerError`, `completeError`, `startError`, `isSavingStart`, `isCompleting` 같은 개별 React 상태를 직접 갱신하는 구조를 지적한다.

핵심 위험은 단순한 stale closure보다 넓다. 현재 구현은 각 저장 요청을 식별하지 않기 때문에 요청 완료 순서가 사용자 입력 순서와 달라질 때 오래된 응답이 최신 화면 상태를 덮어쓸 수 있다.

## 코드 조사

### 현재 구조

- `useLessonPersistence()`는 레슨 저장과 오류 표시 상태를 한 hook에 모은다.
- `startLesson()`은 첫 스텝에 `lesson-started` 답변을 저장하고, 실패하면 `startError`를 표시한다.
- `saveAnswer()`는 스텝 답변 변경마다 `saveLessonAnswer()`를 호출하고, 실패하면 `answerError`를 표시한다.
- `completeLesson()`은 마지막 스텝에서 완료 진행을 저장하고, 실패하면 `completeError`를 표시한다.
- `LessonExperience`는 이 hook에서 받은 상태와 명령을 그대로 화면과 footer 버튼에 연결한다.
- `LessonStepRenderer`는 하나의 `answerError`만 받아 현재 스텝 카드에 표시한다.

### 타당한 위험

WA-10은 타당하다. 특히 `saveAnswer()`의 위험이 가장 분명하다.

- 사용자가 답변 A를 선택해 저장 요청 1이 나간다.
- 곧바로 답변 B를 선택해 저장 요청 2가 나간다.
- 요청 2가 성공해 최신 답변 저장이 완료된다.
- 요청 1이 늦게 실패하면 `setAnswerError()`가 실행되어 최신 답변이 저장되었는데도 실패 메시지가 표시된다.

이 문제는 `answerError`가 어떤 `stepId`, 어떤 답변 payload, 어떤 요청 순서에 속하는지 표현하지 않기 때문에 생긴다. 현재 Module의 interface는 `saveAnswer(change): Promise<void>`와 전역 `answerError` 하나뿐이라, 호출자는 최신 저장 상태와 오래된 저장 상태를 구분할 수 없다.

`completeLesson()`도 유사한 생명주기 위험이 있다. 완료 요청 중 나가기나 라우팅이 발생하면 응답이 돌아온 뒤 언마운트된 화면의 상태를 갱신할 수 있고, 중복 클릭 방지는 `isCompleting` 렌더 상태에 의존한다. React 이벤트가 빠르게 중첩될 때 명령 자체를 한 번만 실행한다는 보장이 Module 안에 없다.

`startLesson()`은 버튼 disabled로 중복 클릭 가능성이 낮지만, 이 역시 명령 실행 중 여부와 완료 응답의 유효성을 Module 내부 계약으로 보장하지 않는다.

### 현재 테스트의 빈틈

`lesson-experience.test.tsx`는 시작 저장 실패, 답변 저장 호출, 완료 저장 호출을 검증한다. 하지만 다음 회귀 조건은 없다.

- 늦게 도착한 이전 답변 저장 실패가 최신 성공 상태를 덮어쓰지 않는지
- 저장 요청 중 스텝 이동 후 이전 스텝의 실패가 현재 스텝에 표시되지 않는지
- 완료 저장 중 중복 완료 요청이 발생하지 않는지
- 언마운트 또는 라우팅 이후 비동기 응답이 화면 상태를 갱신하지 않는지

## 해결 방안

### 방안 1. 저장 작업 순서 토큰을 hook 내부에 도입

`useLessonPersistence()` 안에 작업별 sequence ref를 둔다. `saveAnswer()`는 호출마다 증가한 sequence와 `stepId`를 캡처하고, 응답이 돌아왔을 때 현재 sequence와 일치하는 경우에만 `answerError`를 갱신한다. `startLesson()`과 `completeLesson()`도 같은 방식으로 최신 요청만 `isSavingStart`, `isCompleting`, 오류 상태를 바꾼다.

예상 변경:

- `useRef` 기반 `startSequence`, `answerSequence`, `completeSequence` 추가
- `saveAnswer()` 실패 반영 전에 최신 sequence와 `stepId` 확인
- 완료 저장 중 재진입 방지를 위한 in-flight ref 추가
- 지연 응답 순서가 뒤집히는 테스트 추가

장점은 현재 Module의 interface를 거의 유지하면서 실제 경쟁 상태를 바로 막는다는 점이다. 단점은 저장 상태가 여전히 `answerError` 하나라서 스텝별 상태나 자동 저장 진행 상태를 풍부하게 표현하기 어렵다.

추천 강도: 높음. WA-10의 직접적인 결함을 가장 작은 interface 변화로 제거한다.

### 방안 2. 레슨 저장을 reducer 기반 상태 기계로 바꾸기

개별 `useState`를 `useReducer`로 모으고, 저장 명령을 명시적인 이벤트로 처리한다.

예상 상태:

```ts
type LessonPersistenceState =
  | { readonly status: "idle" }
  | {
      readonly operation: "start"
      readonly requestId: number
      readonly status: "pending"
    }
  | {
      readonly operation: "answer"
      readonly requestId: number
      readonly status: "pending"
      readonly stepId: string
    }
  | {
      readonly operation: "complete"
      readonly requestId: number
      readonly status: "pending"
    }
  | {
      readonly message: string
      readonly operation: "start" | "answer" | "complete"
      readonly status: "failed"
      readonly stepId?: string
    }
```

저장 응답은 `requestId`가 현재 상태와 일치할 때만 성공 또는 실패 이벤트로 반영한다. 호출자는 `answerError`, `completeError` 같은 파생값을 hook에서 받아도 되지만, 원천 상태는 하나가 된다.

장점은 정상 경로와 실패 경로가 한 곳에 모여 상태 전이가 설명 가능해진다는 점이다. 여러 boolean과 error string이 서로 모순되는 상태를 줄이고 테스트 표면도 reducer interface로 좁아진다.

단점은 현재 코드보다 변경 범위가 크고, 여러 operation이 동시에 일어날 수 있는 정책을 먼저 정해야 한다. 답변 저장과 완료 저장을 동시에 허용할지, 완료 전에 마지막 답변 저장을 기다릴지도 함께 결정해야 한다.

추천 강도: 높음. 같은 종류의 상태 경쟁이 반복되지 않게 만드는 구조 개선으로 가장 균형이 좋다.

### 방안 3. 레슨 진행 orchestration Module을 만들기

`LessonExperience`가 현재 스텝, 답변 payload, 저장 명령, 완료 명령을 각각 조합하는 대신, 레슨 진행 전체를 소유하는 깊은 Module을 둔다. 예를 들어 `useLessonSession()`이 현재 스텝, 제출 가능 여부, 저장 상태, 다음 이동, 완료 저장을 하나의 interface로 제공한다.

예상 책임:

- 현재 스텝 인덱스와 `checked` 상태
- 스텝별 답변 payload
- 답변 자동 저장
- 시작 저장
- 완료 저장
- 저장 오류의 step 귀속
- 중복 완료 방지

장점은 `LessonExperience`가 UI shell과 렌더링에 집중하고, 레슨 진행 규칙과 저장 생명주기가 한 Module에 모인다는 점이다. 삭제 테스트를 해보면 이 Module이 사라질 때 복잡도가 `LessonExperience`, `LessonStepRenderer`, 각 답변 입력에 다시 퍼지므로 깊은 Module이 될 가능성이 높다.

단점은 한 번에 옮기면 diff가 커질 수 있다. 먼저 reducer 기반 저장 상태를 만든 뒤, 현재 스텝 전이를 점진적으로 흡수하는 순서가 안전하다.

추천 강도: 중간 이상. 레슨 기능이 더 커질 예정이라면 장기적으로 가장 안정적이다.

### 방안 4. 서버 상태 라이브러리 또는 React action 계층으로 위임

TanStack Query mutation, React 19 action 계열, 또는 framework action layer를 사용해 mutation의 pending/error 상태와 최신성 관리를 외부 계층에 맡긴다.

장점은 재시도, mutation lifecycle, 캐시 무효화 같은 기능을 표준 방식으로 얻을 수 있다는 점이다. 이후 레슨 목록, 프로필, 진행률 재조회까지 같은 서버 상태 모델로 묶을 수 있다면 Leverage가 있다.

단점은 현재 `apps/web`에는 TanStack Query 의존성이 없고, 이 이슈 하나만 해결하려고 새 런타임 개념을 추가하면 interface가 얕아질 수 있다. React action 계층도 이 앱의 API client, 토큰 경계, 클라이언트 상호작용 흐름과 맞는지 먼저 검증해야 한다.

추천 강도: 탐색 가치 있음. 서버 상태 관리가 여러 화면의 반복 문제로 확인될 때 도입하는 편이 좋다.

## 판단

WA-10은 실제 결함 가능성이 있는 이슈다. 가장 직접적인 문제는 `useCallback` 자체가 아니라, 비동기 저장 작업의 identity가 상태에 표현되지 않는 점이다. 오래된 응답과 최신 응답이 같은 `answerError`를 갱신할 수 있고, 오류가 어느 스텝의 어느 저장에서 왔는지도 보존되지 않는다.

권장 순서는 다음과 같다.

1. 방안 2의 reducer 상태 기계를 1차 해결로 적용한다.
2. reducer 안에서 방안 1의 requestId/sequence 검증을 사용해 오래된 응답을 무시한다.
3. `lesson-experience.test.tsx`에 out-of-order 응답 회귀 테스트와 완료 중복 요청 테스트를 추가한다.
4. 레슨 진행 규칙이 더 늘어나면 방안 3으로 `useLessonSession()`을 만들고 `LessonExperience`의 진행 orchestration을 옮긴다.
5. 여러 화면에서 동일한 서버 상태 문제가 반복될 때만 방안 4를 다시 검토한다.

## 검증 계획

- `bun --filter @workspace/web test src/features/lessons/lesson-experience.test.tsx`
- `bun --filter @workspace/web typecheck`
- `bun lint`
- 필요 시 `bun lefthook run pre-commit`

## 2026-06-17 완료

- Notion `WA-10` 내용을 확인했다.
- 관련 hook, 레슨 화면, 스텝 렌더러, API client interface, 기존 테스트를 조사했다.
- WA-10은 타당하다고 판단했다.
- 요청 순서 토큰, reducer 상태 기계, 레슨 진행 orchestration Module, 서버 상태 계층 위임의 4가지 해결 방안을 도출했다.
- 같은 문제가 반복되지 않게 하려면 reducer 상태 기계와 requestId 검증을 우선 적용하고, 이후 `useLessonSession()`으로 레슨 진행 Module을 깊게 만드는 순서를 추천한다.

## 2026-06-17 구현 완료

- 선택 방안: 방안 3 `useLessonSession()` 기반 레슨 진행 orchestration Module.
- `apps/web/src/features/lessons/use-lesson-session.ts`를 추가해 시작 여부, 현재 스텝, 채점 상태, 스텝별 답변 payload, 답변 저장 최신성, 완료 저장 생명주기를 한 Module에 모았다.
- 기존 `useLessonPersistence()`는 제거하고, `LessonExperience`는 화면 shell, 나가기 modal, 완료 화면, 라우팅만 담당하게 줄였다.
- 답변 저장은 request id와 step id를 함께 기록한다. 늦게 도착한 이전 요청은 최신 상태를 덮어쓰지 않고, 답변 오류는 현재 스텝에 귀속된 최신 오류만 표시한다.
- 마지막 스텝 완료는 현재 스텝의 최신 답변 저장이 끝난 뒤 진행한다. 최신 답변 저장이 실패하면 완료 저장을 호출하지 않고 답변 저장 오류를 표시한다.
- 완료 저장은 in-flight guard로 중복 호출을 막는다.
- `LessonStepRenderer`는 standalone 스텝에서도 답변 저장 오류를 표시한다.
- AI 코칭은 계획대로 API 요청 명령만 `useLessonSession()`이 제공하고, 피드백 결과와 로딩 UI 상태는 기존 `AiFeedbackAnswer`가 계속 소유한다.

검증:

- `bun --filter @workspace/web test src/features/lessons/lesson-experience.test.tsx`
- `bun --filter @workspace/web typecheck`
