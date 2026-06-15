# 홈 진행 중 코스 미표시 버그 조사 보고서

## 조사 일시

- 2026-06-15

## 증상

- `/app` 홈 화면의 오른쪽 영역에 `이어서 학습하기`와 `1개 코스` 문구는 표시된다.
- 그러나 실제 진행 중 코스 카드, 다음 레슨, 진행률, 진입 버튼은 표시되지 않는다.

## 데이터 흐름 확인

- `apps/web/src/app/app/page.tsx`는 서버에서 `api.getProgress()`를 호출하고, 성공 시 `HomePage`에 `progressResult.value`를 전달한다.
- `apps/api/src/routes/progress.route.ts`의 `/progress` 응답은 각 코스에 대해 `id`, `title`, `lessons`, `nextLessons`, `progressPercent`를 계산해 반환한다.
- `apps/web/src/features/courses/course-api-mappers.ts`의 `mapProgress`는 API 응답의 진행 코스 데이터를 홈 화면 모델인 `ProgressCourseList`로 유지한다.

## 직접 원인

`apps/web/src/features/home/home-page.tsx`에서 진행 중 코스 목록을 계산한 뒤, 목록 본문을 렌더링하지 않는다.

- `inProgress`는 `progressPercent > 0`이거나 완료된 레슨이 있는 코스를 필터링한다.
- `hasProgress`가 참이면 `이어서 학습하기` 헤더와 `{Math.min(inProgress.length, 5)}개 코스` 카운트만 렌더링한다.
- 같은 분기 안에서 `inProgress.map(...)` 또는 이에 준하는 코스 카드 렌더링이 없다.

따라서 현재 화면처럼 서버와 매퍼가 진행 코스 데이터를 제공하더라도 홈 화면은 헤더만 표시하고 카드 영역을 비워 둔다.

## 테스트 공백

`apps/web/src/features/home/home-page.test.tsx`는 진행 데이터가 없는 fresh 상태만 검증한다.

- `progress.courses`가 비어 있을 때의 인사, 통계, `코스 둘러보기` 진입점은 검증한다.
- 진행 중 코스가 있을 때 코스 제목, 다음 레슨, 진행률, 학습 재개 동작이 보이는지 검증하는 테스트가 없다.

이 테스트 공백 때문에 `hasProgress` 분기에서 카드 본문이 누락되어도 회귀가 잡히지 않는다.

## 결론

이번 버그의 원인은 API 또는 데이터 매핑 실패가 아니라 홈 화면 컴포넌트의 진행 상태 렌더링 누락이다. `HomePage`의 `hasProgress` 분기에 진행 중 코스 카드 목록을 렌더링하고, 같은 조건을 검증하는 컴포넌트 테스트를 추가해야 한다.

## 구현 결과

- `apps/web/src/features/home/home-page.tsx`의 `hasProgress` 분기에 진행 중 코스 카드 목록을 추가했다.
- Kwep 프로토타입의 홈 화면 구조를 제품 코드에 맞춰 반영했다.
  - 모바일은 가로 스크롤 카드 목록으로 표시한다.
  - 데스크톱은 세로 카드 목록으로 표시한다.
- 코스 카드에는 코스 이미지, 제목, 진행률, 완료 레슨 수, 최대 2개의 다음 레슨 진입점을 표시한다.
- 코스 영역 클릭 시 `/app/courses/{courseId}`로 이동하고, 다음 레슨 클릭 시 `/app/lesson?lesson_id={lessonId}`로 이동한다.
- 다음 레슨이 없으면 `모든 레슨을 완료했어요` 메시지를 표시한다.

## 검증

- `bun --filter @workspace/web test -- src/features/home/home-page.test.tsx`
  - 홈 fresh 상태, 진행 중 코스 표시, 다음 레슨 진입, 완료 코스 메시지를 검증한다.
