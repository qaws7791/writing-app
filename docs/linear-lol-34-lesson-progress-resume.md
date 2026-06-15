# LOL-34 레슨 진행 상태 재개

## 문제

레슨 화면은 클라이언트 상태의 `currentStepIndex`를 항상 `0`으로 초기화했다. 학습자가 진행 중인 레슨을 새로고침하면 DB에는 `learner_lesson_progress.current_step_index`가 저장되어 있어도 화면은 시작 화면으로 돌아갔다.

## 변경

- `/progress` 응답의 각 lesson과 next lesson에 `currentStepIndex`를 포함했다.
- 진행 row가 없는 레슨은 `currentStepIndex: null`로 내려서, 첫 스텝 진행 중인 상태의 `0`과 구분했다.
- 웹 progress mapper와 generated OpenAPI 타입이 `currentStepIndex`를 보존하도록 갱신했다.
- 레슨 라우트가 레슨 상세와 함께 진행 상태를 조회하고, 미완료 레슨의 저장된 진행 단계가 있으면 `LessonExperience` 초기 상태로 전달한다.
- `LessonExperience`는 전달된 진행 상태가 있으면 시작 화면 없이 저장된 스텝에서 바로 렌더링한다.

## 검증

- API progress route 테스트가 저장된 `currentStepIndex`를 응답에 포함하는지 확인한다.
- 웹 progress mapper 테스트가 `currentStepIndex`를 잃지 않는지 확인한다.
- 레슨 화면 테스트가 저장된 진행 단계에서 시작 화면 없이 재개되는지 확인한다.
