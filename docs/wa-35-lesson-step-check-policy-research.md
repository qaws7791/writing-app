# WA-35 레슨 스텝 채점 정책 조건 구조 조사

- 작성일: 2026-06-17
- 대상 이슈: WA-35 `불필요한 중첩 조건문 (Arrow Anti-pattern)`
- 조사 범위: `apps/web/src/features/lessons/lesson-step-policy.ts`, `use-lesson-session.ts`, `lesson-experience.tsx`, `lesson-logic.ts`, `packages/core/src/learning/learning.service.ts`, 관련 테스트

## 결론

WA-35는 타당하다. `getLessonStepCheckedResult`의 `switch` 분기 안에는 `payload?.type === ... && ... ? "correct" : "wrong"` 형태가 반복되고, `SELECT`만 다른 객체 결과를 반환한다. 표면적으로는 조건식 가독성 문제지만, 실제 위험은 더 넓다.

현재 웹의 채점 정책, 제출 가능 조건, answer payload 검증, 서버 저장 유효성 검증이 서로 다른 함수와 package에 흩어져 있다. 이 때문에 새 스텝 타입이나 기존 스텝의 정답 기준이 바뀔 때 UI 채점, 버튼 활성화, 서버 저장 검증이 서로 다른 기준으로 움직일 수 있다.

## 근거

- `apps/web/src/features/lessons/lesson-step-policy.ts`
  - `isLessonStepSubmittable`, `isLessonStepCheckable`, `getLessonStepCheckedResult`, `getLessonStepExplanation`, `getLessonStepWrongText`, `getLessonStepActionLabel`이 모두 타입별 switch를 가진다.
  - `getLessonStepCheckedResult`는 checkable 타입에 대한 방어적 계약이 타입으로 표현되지 않아 `default: "correct"`를 반환한다.
  - `FILL_BLANK`, `ORDER`는 `JSON.stringify` 배열 비교를 사용한다.
  - `SELECT`만 상세 결과 객체를 반환하고 나머지는 `"correct" | "wrong"`으로 축약한다.
- `apps/web/src/features/lessons/use-lesson-session.ts`
  - `isLessonStepCheckable(step)`일 때만 `getLessonStepCheckedResult(step, answerPayload)`를 호출한다. 이 전제는 함수 타입이나 이름만으로는 강제되지 않는다.
- `apps/web/src/features/lessons/lesson-logic.ts`
  - 클라이언트 answer payload 유효성 검증이 별도로 존재한다.
- `packages/core/src/learning/learning.service.ts`
  - 서버 저장 검증도 별도 switch와 helper를 사용한다.
  - 서버 검증은 "저장 가능한 payload인가"를 확인하고, 웹 채점은 "정답인가"를 확인하므로 목적은 다르지만 같은 step contract를 반복해서 읽는다.
- 테스트
  - `lesson-step-policy.test.ts`는 일부 타입의 대표 경로만 확인한다.
  - 잘못된 payload type, non-checkable step 호출, SELECT 상세 결과, 배열 순서 비교 정책을 포괄하는 정책 테스트는 부족하다.

## 위험

- `default: "correct"`가 checkable 전제를 벗어난 호출을 숨긴다.
- payload type mismatch가 모든 분기에서 같은 방식으로 처리되는지 코드만 보고 알기 어렵다.
- step별 채점 결과 타입이 균일하지 않아 feedback UI가 `string | object` union을 해석해야 한다.
- 제출 가능 조건과 채점 조건이 서로 달라질 때 사용자는 제출 가능한 답을 냈지만 채점 결과가 예측 불가능해질 수 있다.
- 서버 저장 검증과 웹 채점 정책의 drift를 자동으로 잡는 테스트가 부족하다.

## 개선 방안

### 방안 1. checkable step 전용 판정 타입과 registry를 만든다

`CheckableLessonStep`과 `CheckableAnswerPayload`를 분리하고, `getLessonStepCheckedResult`가 checkable step만 받도록 타입을 좁힌다. 타입별 판정 함수는 `checkPolicyByStepType` registry에 둔다.

장점은 `default: "correct"` 같은 숨은 fallback을 제거하고, 새 checkable step을 추가할 때 판정 함수 누락을 컴파일러가 드러낼 수 있다는 점이다.

### 방안 2. 채점 결과를 명시적 result variant로 통일한다

`"correct" | "wrong" | { missed; wrong }` 대신 `LessonStepCheckResult`를 discriminated union으로 만든다.

예상 형태:

```ts
type LessonStepCheckResult =
  | { readonly kind: "correct"; readonly explanation: string }
  | {
      readonly kind: "wrong"
      readonly explanation: string
      readonly reason?: string
    }
  | {
      readonly kind: "partial"
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
      readonly explanation: string
    }
```

장점은 feedback UI가 문자열과 객체를 추측하지 않고 결과 의미를 직접 읽을 수 있다는 점이다.

### 방안 3. step answer policy를 core/shared contract로 이동한다

웹 전용 `lesson-step-policy.ts`에 있는 제출 가능 여부, checkable 여부, 채점 가능 여부, 정답 판정의 순수 규칙을 core의 learning 또는 content step policy로 이동한다. 웹은 이 결과를 UI label과 스타일에만 매핑한다.

장점은 서버 저장 검증, 웹 채점, 관리자 미리보기가 같은 규칙을 재사용할 수 있다는 점이다. 단점은 core가 UI 문구를 가져서는 안 되므로, domain rule과 presentation copy를 분리해야 한다.

### 방안 4. 정책 테스트를 타입 매트릭스로 만든다

각 answerable step 타입에 대해 `submittable`, `valid payload`, `check result`, `wrong payload type`을 같은 fixture에서 검증한다. core 저장 검증과 웹 policy fixture를 공유하거나 같은 JSON fixture를 사용해 drift를 줄인다.

장점은 새 스텝 타입 추가 시 빠진 정책이 테스트에서 바로 드러난다.

## 권장 진행 순서

1. `CheckableLessonStep`과 `CheckableStepType`을 명시하고 `default` fallback을 제거한다.
2. `getLessonStepCheckedResult`를 타입별 작은 판정 함수로 나누고 early return을 적용한다.
3. `LessonStepCheckResult`를 discriminated union으로 바꾸어 feedback UI의 해석을 명시화한다.
4. answerable/checkable/submittable/check policy matrix 테스트를 추가한다.
5. core 저장 검증과 웹 채점 정책 사이의 공통 fixture 또는 shared policy module 도입 범위를 결정한다.

## Notion 업데이트 요약

- WA-35 본문을 읽고 `lesson-step-policy.ts`, session hook, feedback UI, 클라이언트 payload 검증, core 저장 검증을 조사했다.
- 이슈는 타당하지만, 단순 early return 리팩터링보다 채점 정책의 타입 경계와 registry화를 우선해야 한다.
- 같은 문제가 반복되지 않게 하려면 checkable step 전용 타입, 명시적 result variant, shared step answer policy, matrix 테스트가 필요하다.

## 완료 기록

- `CheckableStepType`과 `CheckableLessonStep`을 도입하고 `isLessonStepCheckable`을 타입 가드로 바꾸었다.
- `getLessonStepCheckedResult`는 checkable step만 받도록 좁히고, checkable이 아닌 스텝을 `"correct"`로 처리하던 fallback을 제거했다.
- 타입별 채점 규칙을 `checkPolicyByStepType` registry와 작은 함수로 분리해 중첩 삼항 조건을 없앴다.
- 잘못된 payload 타입은 모든 checkable step에서 명시적으로 `"wrong"`을 반환한다.
- 빈칸과 순서 배열 비교는 `JSON.stringify` 대신 길이와 index 비교가 드러나는 순수 함수로 고정했다.
- `lesson-step-policy.test.ts`에 checkable step별 정답, 오답, 잘못된 payload 타입 매트릭스 테스트를 추가했다.

## 남은 판단

- `LessonStepCheckedState`를 discriminated union으로 바꾸는 작업은 footer와 스텝 렌더러 표시 계약까지 함께 바꾸는 범위라 이번 커밋에서는 보류했다.
- 서버 저장 검증과 웹 채점 정책의 공통 fixture 또는 core shared policy 이동은 다음 중복 사례가 생기면 별도 이슈로 다룬다.
