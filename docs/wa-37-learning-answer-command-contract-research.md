# WA-37 학습 답변 command 타입 계약 조사

- 작성일: 2026-06-17
- 대상 이슈: WA-37 `과도하게 넓은 타입 선언 (Type Safety 저하)`
- 조사 범위: `packages/core/src/learning/learning.dto.ts`, `learning.service.ts`, API learning route, DB learning repository, WA-9/LOL-29 기존 개선 기록

## 결론

WA-37은 타당하다. 다만 현재 HTTP route 경계에서는 이미 일부 보완되어 있다. `apps/api/src/routes/learning.route.ts`의 `/answers` body는 `learningAnswerSchema`를 사용하므로 일반 API 요청의 `answer`는 아무 JSON이나 통과하지 않는다.

남은 문제는 core command 계약이다. `saveStepAnswerCommandSchema.answer`가 여전히 `jsonValueSchema`라서 `LearningService.saveStepAnswer()`를 직접 호출하는 내부 caller와 테스트, repository contract에서는 임의 JSON 값이 타입상 허용된다. service가 다시 `lessonStepAnswerSchema.safeParse()`를 수행해 저장 전 차단하지만, 타입은 여전히 넓은 값을 통과시키는 구조다.

## 근거

- `packages/core/src/learning/learning.dto.ts`
  - `lessonStartedAnswerSchema`, `lessonStepAnswerSchema`, `learningAnswerSchema`가 이미 존재한다.
  - 그러나 `saveStepAnswerCommandSchema`는 `answer: jsonValueSchema`를 사용한다.
  - `SaveStepAnswerCommand["answer"]` 타입은 `LearningAnswer`가 아니라 넓은 `JsonValue`다.
- `packages/core/src/learning/learning.service.ts`
  - command 전체를 `saveStepAnswerCommandSchema.parse()`로 파싱한 뒤, 다시 `lessonStepAnswerSchema.safeParse(parsedCommand.answer)`를 수행한다.
  - `lesson-started` 예외와 step type 일치 여부, 콘텐츠 존재 여부를 service에서 처리한다.
  - 저장 시 `learningRepository.saveStepAnswer(parsedCommand)`를 호출하므로 repository로 전달되는 타입도 넓게 유지된다.
- `apps/api/src/routes/learning.route.ts`
  - `saveAnswerBodySchema`는 `answer: learningAnswerSchema`를 사용한다.
  - 즉 API controller는 이미 무작위 JSON body를 400으로 거절한다.
- `packages/db/src/repositories/learning.repository.ts`
  - DB adapter의 `SaveStepAnswerInput.answer`는 `unknown`이다.
  - DB 저장소는 최종 저장 경계에서 `JSON.stringify(input.answer)`를 수행한다.
- 기존 문서
  - `docs/linear-lol-29-answer-payload-boundary.md`는 API route와 웹 payload를 typed answer로 좁힌 작업을 기록한다.
  - `docs/wa-9-zod-answer-validation-research.md`는 `saveStepAnswerCommandSchema.answer`를 `learningAnswerSchema`로 좁힐지 추가 검토해야 한다고 남겼다.

## 위험

- `LearningService.saveStepAnswer()` 타입만 보면 caller가 아무 JSON이나 넘겨도 되는 것처럼 보인다.
- 서비스가 shape invalid를 값으로 반환하더라도, 잘못된 command는 controller가 아니라 application boundary까지 들어온 뒤 거절된다.
- repository interface가 넓은 command를 받아 DB adapter까지 타입 불확실성이 전파된다.
- `lesson-started`와 step answer의 차이가 command 타입에 드러나지 않아 예외 정책이 service 내부 조건문으로 숨어 있다.
- API route, core service, DB repository가 서로 다른 수준의 타입 엄격도를 갖는다.

## 개선 방안

### 방안 1. `SaveStepAnswerCommand.answer`를 `learningAnswerSchema`로 좁힌다

`saveStepAnswerCommandSchema`의 `answer`를 `learningAnswerSchema`로 바꾼다. service는 command parse 이후 `LearningAnswer` 타입을 전제로 처리하고, step별 콘텐츠 검증만 수행한다.

장점은 core service boundary가 API route와 같은 구조 계약을 갖게 된다는 점이다. 단점은 `lesson-started`와 step answer가 같은 command에 남아 있어 step type 지원 여부 검증은 여전히 필요하다.

### 방안 2. 저장 command를 discriminated union으로 나눈다

`SaveLessonStartedCommand`와 `SaveLessonStepAnswerCommand`를 분리하거나, command 자체에 `kind: "lesson-started" | "step-answer"`를 둔다. `lesson-started`는 첫 step id 정책을 별도 handler에서 검증하고, step answer는 `LessonStepAnswer`만 받게 한다.

장점은 marker 저장과 실제 스텝 답변 저장의 정책이 타입으로 분리된다. 단점은 API route와 repository 호출부를 함께 바꿔야 한다.

### 방안 3. lesson answer policy module이 `ValidatedLearningAnswer`를 반환하게 한다

`validateLearningAnswerForStep({ answer, lesson, stepId })`가 `Result<ValidatedLearningAnswer, LearningAnswerValidationError>`를 반환하게 한다. repository는 `ValidatedLearningAnswer`만 받을 수 있게 좁힌다.

장점은 구조 검증, step type 일치, lesson-started 예외, 콘텐츠 존재 검증이 하나의 깊은 module에 모인다. DB 저장소는 검증이 끝난 값만 직렬화한다.

### 방안 4. DB repository input도 core command 타입 또는 validated 타입으로 맞춘다

현재 DB adapter의 `SaveStepAnswerInput.answer`는 `unknown`이다. 저장소 경계에서 아무 값이나 직렬화할 수 있으므로, core `SaveStepAnswerCommand` 또는 `ValidatedLearningAnswer` 타입을 사용하게 바꾼다.

장점은 넓은 타입이 infrastructure layer까지 흘러가지 않는다. 단점은 DB package가 core learning 타입을 어디까지 import할지 package boundary를 점검해야 한다.

### 방안 5. 계약 drift 테스트를 추가한다

`saveAnswerBodySchema`의 answer 타입, `saveStepAnswerCommandSchema`의 answer 타입, repository input answer 타입이 같은 수준으로 좁혀져 있는지 compile-time 또는 schema test로 고정한다.

장점은 API route만 좁히고 core command가 넓게 남는 상태를 다시 만들지 않는다.

## 권장 진행 순서

1. `saveStepAnswerCommandSchema.answer`를 `learningAnswerSchema`로 좁히고 core service 테스트를 조정한다.
2. service 내부에서 `lessonStepAnswerSchema.safeParse()` 중복 파싱을 줄이고, `lessonStartedAnswerSchema`와 step answer 분기를 명시한다.
3. `ValidatedLearningAnswer` 또는 `SaveStepAnswerCommand`를 repository 경계까지 전달해 `unknown`을 제거한다.
4. `lesson-started` marker와 실제 step answer command를 분리할지 별도 설계한다.
5. API route, core command, repository input 계약 일치 테스트를 추가한다.

## Notion 업데이트 요약

- WA-37 본문을 읽고 core learning DTO/service, API route, DB repository, 기존 WA-9/LOL-29 문서를 조사했다.
- API controller는 이미 `learningAnswerSchema`를 사용하지만, core command와 repository 경계는 여전히 넓은 타입을 허용하므로 이슈는 타당하다.
- 해결은 단순 schema 교체를 넘어 validated answer type, command union, repository input 축소, 계약 drift 테스트까지 확장하는 방향이 안전하다.

## 2026-06-17 구현 완료

- `packages/core/src/learning/learning.dto.ts`의 `saveStepAnswerCommandSchema.answer`를 `jsonValueSchema`에서 `learningAnswerSchema`로 좁혔다.
- `packages/core/src/learning/learning.dto.test.ts`를 추가해 저장 command가 정의된 학습 답변만 허용하고 임의 JSON 객체를 거절하는지 검증했다.
- `packages/core/src/learning/learning.service.ts`는 command parse 이후 `LearningAnswer`를 전제로 처리한다. `lessonStepAnswerSchema.safeParse()` 중복 구조 파싱을 제거하고, `lesson-started`와 step answer 분기를 타입 가드로 명시했다.
- `packages/db/src/repositories/learning.repository.ts`의 `SaveStepAnswerInput`을 core `SaveStepAnswerCommand`로 맞춰 DB adapter까지 `unknown` answer가 흘러가지 않게 했다.
- DB repository 테스트는 실제 `LearningAnswer`와 branded id schema를 사용하도록 조정했다.
- `BACKEND.md`에 API route, core service command, DB learning repository가 같은 학습 답변 계약을 사용한다는 운영 규칙을 기록했다.

## 검증 결과

- `bun --filter @workspace/core test src/learning/learning.dto.test.ts src/learning/learning.service.test.ts`
- `bun --filter @workspace/db test src/repositories/learning.repository.test.ts`
- `bun --filter @workspace/api test src/routes/learning.route.test.ts src/app.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/core lint`
- `bun --filter @workspace/db lint`
