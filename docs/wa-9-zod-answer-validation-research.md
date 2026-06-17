# WA-9 Zod 답변 검증 중복 분석

## 2026-06-17 시작

- Notion 이슈: `WA-9 Zod 스키마 검증의 중복 및 수동 검증 구현`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-9 페이지
- 조사 범위: 학습 답변 저장 경계, 코어 학습 서비스, 학습자 웹 답변 검증, API route 검증
- 목표: `packages/core/src/learning/learning.service.ts`의 수동 타입 체커가 국소 문제인지, 반복된 구조 문제인지 판단하고 해결 방안을 도출한다.

## 이슈 요약

WA-9는 `packages/core/src/learning/learning.service.ts`의 `isValidStepAnswer` 주변 로직이 이미 존재하는 `lessonStepAnswerSchema`를 충분히 활용하지 않고, `readTypedObject`, `readStringArray`, `readNumberArray`, `readObjectArray` 같은 수동 타입 체커를 직접 구현한 점을 지적한다.

답변 저장은 두 종류의 검증을 필요로 한다.

- 구조 검증: payload가 `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT` 등 스텝 답변 union의 형태를 만족하는지 확인한다.
- 콘텐츠 검증: 선택한 option id, 문장 배열, 매칭 pair, 카테고리 id 등이 해당 레슨 스텝의 실제 콘텐츠에 존재하는지 확인한다.

`lessonStepAnswerSchema.safeParse()`는 구조 검증을 담당할 수 있지만, 콘텐츠 검증은 현재 레슨 스텝 데이터를 함께 봐야 하므로 단순히 `safeParse()` 하나만으로 완전히 대체하기는 어렵다.

## 코드 조사

### 이미 Zod로 처리되는 지점

- `packages/core/src/learning/learning.dto.ts`는 `lessonStartedAnswerSchema`, `lessonStepAnswerSchema`, `learningAnswerSchema`를 정의한다.
- `apps/api/src/routes/learning.route.ts`는 `/learning/answers` 요청 body를 `learningAnswerSchema`로 검증한다.
- 따라서 Hono route를 통과한 일반 요청은 이미 문자열화된 답변이나 스텝 답변 union 밖의 형태를 400으로 거절한다.

### 문제가 있는 지점

- `packages/core/src/learning/learning.service.ts`는 `saveStepAnswerCommandSchema`에서 `answer`를 여전히 `jsonValueSchema`로 받는다.
- 같은 파일의 `isValidStepAnswer`는 Zod로 검증된 값을 재사용하지 않고, `unknown`에서 직접 필드를 읽어 각 스텝 타입별 구조를 다시 확인한다.
- 이 방식은 Zod 스키마와 수동 타입 체커가 서로 다른 진실의 원천이 되는 구조다.

### 반복 여부

이 문제는 완전히 국소적이지 않다.

- 수동 타입 체커 자체는 `learning.service.ts` 한 파일에 집중되어 있다.
- 그러나 `apps/web/src/features/lessons/lesson-logic.ts`에도 `isValidLessonStepAnswerPayload`가 있으며, 코어 서비스의 콘텐츠 검증과 유사한 규칙을 별도로 구현한다.
- 이미 정책 차이가 있다. 예를 들어 코어의 `WRITE` 답변 검증은 공백 제거 후 비어 있지 않으면 통과하지만, 웹은 `payload.text.length >= (step.min || 20)`을 요구한다.

따라서 첫 해결은 국소 변경으로 충분하지만, 장기적으로는 답변 검증 정책을 코어의 하나의 깊은 Module로 모으는 편이 같은 문제가 반복되는 것을 줄인다.

## 해결 방안

### 방안 1. 서비스 내부 최소 변경

`learning.service.ts`에서 `lessonStepAnswerSchema.safeParse(answer)`를 한 번 수행하고, 성공한 typed answer를 스텝 타입별 콘텐츠 검증에 넘긴다.

- 삭제 대상: `readTypedObject`, `readStringArray`, `readNumberArray`, `readObjectArray`, `UnknownObject`
- 유지 대상: option id 존재 여부, 배열 길이, 중복 여부, step item/category 존재 여부 같은 콘텐츠 검증
- 추가 조정: `saveStepAnswerCommandSchema.answer`를 `learningAnswerSchema`로 좁힐지 검토한다. route 밖에서 서비스를 직접 호출하는 테스트와 repository fake도 함께 확인해야 한다.

장점은 diff가 작고 WA-9의 핵심 지적을 바로 해결한다는 점이다. 단점은 웹의 중복 검증은 그대로 남아 정책 차이를 계속 만들 수 있다는 점이다.

추천 강도: 높음. 우선 이 방안으로 위험한 수동 구조 검증을 제거하는 것이 좋다.

### 방안 2. 코어에 답변 검증 정책 Module 추가

`packages/core/src/learning/lesson-answer-policy.ts` 같은 Module을 추가하고, 서비스는 이 Module의 좁은 interface만 사용한다.

예상 interface:

```ts
validateLessonAnswerForStep({
  answer,
  firstStepId,
  step,
  stepId,
})
```

반환값은 `Result<ValidatedLessonAnswer, "step-answer-shape-invalid" | "step-answer-not-supported" | "step-answer-invalid">`처럼 명시적인 variant가 적합하다.

장점은 구조 검증, lesson-started 예외, 스텝 타입 일치, 콘텐츠 검증이 하나의 Module에 모여 locality가 좋아진다는 점이다. 단점은 파일이 하나 늘어나고, 지금 단계에서는 방안 1보다 변경 범위가 조금 커진다.

추천 강도: 중간 이상. 웹 중복 검증까지 정리할 계획이 있다면 이 방안이 더 낫다.

### 방안 3. 스텝 기반 Zod schema factory로 통합

`createLessonStepAnswerSchema(step)` 또는 `createLearningAnswerSchemaForStep(step, firstStepId)`처럼 레슨 스텝 데이터를 받아 Zod schema를 생성한다. 기본 union은 `lessonStepAnswerSchema`로 재사용하고, `superRefine`에서 콘텐츠 존재 여부와 중복 여부를 검증한다.

장점은 WA-9의 표현처럼 `safeParse()` 중심의 단일 검증 흐름으로 만들 수 있다는 점이다. 구조 검증과 콘텐츠 검증 실패를 Zod issue로 함께 표현할 수 있다.

단점은 Zod schema factory가 도메인 정책까지 포함하게 되므로, 단순 predicate보다 interface가 커질 수 있다. 또한 실패 사유를 현재 서비스 error reason으로 안정적으로 매핑하는 코드가 필요하다.

추천 강도: 탐색 가치 있음. route, service, OpenAPI validation 흐름을 모두 Zod 중심으로 일관화하려는 목표가 있을 때 적합하다.

### 방안 4. 웹 검증을 코어 정책으로 수렴

웹의 `isValidLessonStepAnswerPayload`를 유지하더라도, 최종 정책은 코어의 답변 검증 Module에서 내보낸 타입이나 helper를 기준으로 맞춘다. 가능하면 웹은 UI 활성화에 필요한 가벼운 검증만 하고, 저장 가능 여부의 최종 판정은 코어 정책과 같은 규칙을 사용한다.

장점은 `WRITE` 최소 길이처럼 프론트엔드와 백엔드의 정책 차이를 줄인다. 단점은 클라이언트 bundle에 `@workspace/core`의 Zod 의존성이 들어갈 수 있으므로, 순수 함수 Module과 schema Module의 import 경계를 조심해야 한다.

추천 강도: 중간. 방안 1 완료 후 중복 정책이 실제로 더 늘어날 때 진행해도 늦지 않다.

## 판단

WA-9는 "해당 코드 부분만 국소적으로 문제"라고 보기에는 절반만 맞다. 위험한 수동 타입 체커는 한 파일에 집중되어 있으므로 최소 변경으로 먼저 고치는 것이 좋다. 그러나 답변 검증 규칙 자체는 웹과 코어에 반복되어 이미 차이가 발생했으므로, 동일 문제가 다시 생기지 않게 하려면 답변 검증 정책 Module을 만드는 방향이 더 오래 간다.

권장 순서는 다음과 같다.

1. 방안 1로 `learning.service.ts`의 수동 구조 검증을 제거한다.
2. 같은 PR에서 `WRITE` 검증 정책을 명확히 정한다. 서버가 `step.min`을 따라야 한다면 테스트를 추가한다.
3. 이후 웹과 코어의 검증 정책 차이가 계속 문제되면 방안 2 또는 방안 3으로 Module을 깊게 만든다.

## 검증 계획

- `bun --filter @workspace/core test src/learning/learning.service.test.ts`
- `bun --filter @workspace/api test src/routes/learning.route.test.ts`
- 필요 시 `bun --filter @workspace/web test src/features/lessons/lesson-logic.test.ts src/features/lessons/lesson-step-renderer.test.tsx`

## 2026-06-17 완료

- Notion `WA-9` 내용을 확인했다.
- 관련 코드와 기존 `LOL-29` 답변 payload 경계 문서를 대조했다.
- 최소 변경, 정책 Module, Zod schema factory, 웹 검증 수렴의 4가지 해결 방안을 도출했다.
- 1차 해결은 방안 1로 진행했다.
- `packages/core/src/learning/learning.service.ts`에서 `lessonStepAnswerSchema.safeParse()`를 한 번만 수행하고, 이후 콘텐츠 검증은 Zod가 보장한 `LessonStepAnswer` 타입을 사용하게 했다.
- `readTypedObject`, `readStringArray`, `readNumberArray`, `readObjectArray`, `UnknownObject`를 삭제해 수동 구조 파싱을 제거했다.
- `packages/core/src/learning/learning.service.test.ts`에 수동 타입 리더 재도입을 막는 회귀 테스트를 추가했다.
