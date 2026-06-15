# Linear LOL-29 답변 payload 경계 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-29 JSON.stringify의 남용`
- 조사 범위: 학습 답변 저장 API, 코어 학습 서비스, DB 저장소, 학습자 웹 답변 생성 로직, OpenAPI 문서
- 목표: 답변 저장 경계에서 `JSON.stringify`된 문자열이나 느슨한 JSON 값이 스텝 타입별 검증 없이 통과하는지 확인하고, 필요한 경우 typed payload 계약으로 좁힌다.

## 판단

이슈는 타당하다.

- `apps/api/src/routes/learning.route.ts`의 답변 저장 body는 `jsonValueSchema`만 사용해 임의 JSON 값을 허용했다.
- `packages/core/src/learning/learning.service.ts`는 답변 가능한 스텝 타입만 확인했고, 실제 답변 payload의 `type`과 레슨 스텝 타입이 일치하는지 검증하지 않았다.
- `apps/web/src/features/lessons/lesson-logic.ts`는 스텝 답변을 `JSON.stringify`한 문자열로 만들어 API에 전달했다.
- `packages/db/src/repositories/learning.repository.ts`가 DB 컬럼에 저장하기 위해 최종적으로 `JSON.stringify`하는 것은 저장 경계 책임이므로 유지해도 된다.
- `contentJson`은 레슨 읽기 경계에서 `lessonStepDtoSchema`로 스텝별 content shape를 검증하고 있어, 이번 결함의 핵심은 `answerJson` 저장 전 답변 payload 검증 누락이다.

## 2026-06-15 완료

- 코어에 `lessonStepAnswerSchema`, `lessonStartedAnswerSchema`, `learningAnswerSchema`를 추가해 답변 payload 계약을 명시했다.
- 학습 서비스는 레슨의 실제 `step.type`과 답변 payload의 `type`이 일치할 때만 저장하고, 문자열화된 답변이나 타입 불일치 payload는 `step-answer-shape-invalid`로 거절한다.
- API route는 공유 `learningAnswerSchema`로 요청 body를 검증해 잘못된 payload를 400으로 반환한다.
- 학습자 웹은 `saveLessonAnswer`에 문자열이 아니라 typed payload 객체를 전달한다. HTTP 클라이언트의 request body 직렬화만 남겼다.
- OpenAPI 문서와 웹 generated API 타입을 새 답변 payload union에 맞게 갱신했다.

## 검증

- `bun --filter @workspace/core test src/learning/learning.service.test.ts`
- `bun --filter @workspace/api test src/openapi/openapi-document.test.ts src/routes/learning.route.test.ts`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/web api:generate`
- `bun --filter @workspace/web test src/lib/api/http/create-http-writing-app-api.test.ts src/features/lessons/lesson-step-renderer.test.tsx src/features/lessons/lesson-experience.test.tsx`
- `bun --filter @workspace/web typecheck`
