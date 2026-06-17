# WA-7 코스 상세 렌더링 데이터 가공 조사

## 이슈 출처

- Notion 데이터베이스: `writing-app 이슈 관리`
- ID: `WA-7`
- 제목: `컴포넌트 렌더링 내의 과도한 데이터 가공`
- 링크: <https://app.notion.com/p/382adaec70b48102ae3ec2e671480bf4>

Notion 이슈는 `apps/web/src/features/courses/course-detail-page.tsx`의 `resolveNextLesson`이 렌더링마다 `course.units.flatMap`과 `progressCourse.lessons.find`를 실행한다고 지적한다. 제안된 개선은 API mapper 레이어에서 백엔드 응답을 변환할 때 다음 레슨을 미리 계산해 `CourseDetail` 객체에 포함하는 것이다.

## 현재 코드 관찰

- `CourseDetailPage`는 클라이언트 컴포넌트이며 `completedLessonCount`, `progressPercent`, `nextLesson`을 렌더링 함수 본문에서 계산한다.
- `resolveNextLesson`은 모든 unit lesson을 펼친 뒤 각 lesson마다 `progressCourse.lessons.find`를 호출하고, 첫 `available` lesson을 다시 찾는다.
- `CourseCurriculum`도 각 unit 완료 여부와 lesson 상태 표시를 위해 `resolveLessonStatus(progressCourse, lesson.id)`를 반복 호출한다.
- `course-api-mappers.ts`는 현재 단일 API 응답을 내부 모델로 옮기는 얇은 mapper다. 코스 상세와 진행 응답을 함께 받는 조합 책임은 아직 없다.
- 백엔드 `/progress`는 이미 lesson 진행 상태와 `nextLessons`를 계산한다. `apps/api/src/routes/progress.route.ts`의 `toCourseProgress`는 `progressByLessonId`, `completedLessonIdSet`, `firstIncompleteLesson`, `nextLessons`를 만든다.

## 문제 성격

WA-7은 한 파일 안의 국소 성능 문제로 시작하지만, 같은 화면의 `CourseCurriculum`까지 보면 진행 상태 조회 규칙이 렌더링 트리 안에 흩어져 있다. 코스 상세 페이지가 현재처럼 코스 상세와 전체 진행 목록을 함께 받아야 한다면, 화면에 전달하기 전에 lesson id 기준 조회 모델로 정규화하는 편이 더 명시적이다.

다만 현재 seed 규모에서는 즉시 장애를 일으킬 정도의 문제라기보다 확장 시 렌더링 비용과 책임 혼재가 커지는 구조적 냄새에 가깝다. 따라서 첫 구현은 API 계약을 크게 바꾸기보다 `apps/web/src/features/courses` 안에서 view model을 만드는 방식이 가장 균형이 좋다.

## 해결안 1. 컴포넌트 내부 최소 변경

`CourseDetailPage`에서 `progressCourse.lessons`를 `Map<lessonId, status>`로 한 번 변환하고, `nextLesson`, `completedLessonCount`, `CourseCurriculum`의 상태 조회에 재사용한다.

예상 변경 범위:

- `apps/web/src/features/courses/course-detail-page.tsx`
- `apps/web/src/features/courses/course-curriculum.tsx`
- 기존 테스트 일부 보강

장점:

- 변경 파일이 가장 적고 되돌리기 쉽다.
- API 계약과 mapper 타입을 건드리지 않는다.
- 렌더링마다 중첩 `find`가 반복되는 문제를 즉시 줄인다.

단점:

- 데이터 결합 규칙이 여전히 클라이언트 컴포넌트 근처에 남는다.
- `CourseDetailPage`와 `CourseCurriculum` 사이에 새 props가 늘어날 수 있다.
- 향후 다른 화면에서 같은 조합이 필요하면 다시 반복될 가능성이 있다.

권장도: 단기 완화에는 적합하지만, WA-7의 의도인 "렌더링 전 데이터 준비"까지는 충분히 해결하지 못한다.

## 해결안 2. 코스 상세 view model 조립 함수 추가

`apps/web/src/features/courses`에 순수 함수 예를 들어 `createCourseDetailViewModel(course, progressCourse)`를 추가한다. 이 함수가 다음 값을 한 번에 만든다.

- `completedLessonCount`
- `progressPercent`
- `nextLesson`
- lesson별 `progressStatus`가 포함된 `units`

`CourseDetailPage`와 `CourseCurriculum`은 이미 조립된 view model만 렌더링한다.

예상 변경 범위:

- `apps/web/src/features/courses/course-detail-view-model.ts`
- `apps/web/src/features/courses/course-types.ts`
- `apps/web/src/features/courses/course-detail-page.tsx`
- `apps/web/src/features/courses/course-curriculum.tsx`
- view model 단위 테스트와 화면 테스트 보정

장점:

- 렌더링 컴포넌트에서 데이터 탐색 규칙을 제거한다.
- 코스 상세 화면의 진행 상태 결합 규칙이 한 순수 함수에 모인다.
- API 응답 계약은 유지하면서도 시스템적 반복을 줄인다.

단점:

- 새 내부 타입이 생긴다.
- mapper와 view model assembler의 책임을 명확히 이름 붙이지 않으면 얇은 pass-through가 될 수 있다.

권장도: 현재 코드베이스에는 이 안이 가장 적절하다. API 계약 변경 없이 문제를 feature 경계 안에 모으고, 테스트 표면도 작다.

## 해결안 3. API adapter의 조합 mapper로 흡수

`mapCourseDetail` 자체는 단일 응답 mapper로 유지하고, HTTP adapter 또는 route page 가까이에 `mapCourseDetailWithProgress(course, progressCourse)` 같은 조합 mapper를 둔다. 기존 `/progress` 응답의 `nextLessons`를 우선 사용하고, lesson 표시 상태는 `progressCourse.lessons`를 `Map`으로 정규화한다.

예상 변경 범위:

- `apps/web/src/features/courses/course-api-mappers.ts`
- `apps/web/src/features/courses/course-api-mappers.test.ts`
- `apps/web/src/app/(learner)/app/courses/[id]/page.tsx`
- 코스 상세 컴포넌트 타입

장점:

- Notion 이슈의 "API Mapper 레이어에서 미리 계산" 제안과 가장 가깝다.
- 화면은 조합 완료된 모델만 받는다.
- 기존 `/progress`가 계산한 `nextLessons`를 재사용할 수 있다.

단점:

- `course-api-mappers.ts`가 단일 응답 변환뿐 아니라 여러 응답의 조합 책임을 갖게 된다.
- `WritingAppApi.getCourseDetail()`은 progress를 모르는 구조라, 실제 조합 위치를 잘못 잡으면 mapper 책임이 흐려진다.
- 코스 상세 라우트가 이미 `getCourseDetail`과 `getProgress`를 병렬 호출하므로, 조합 책임은 HTTP adapter보다 route 또는 feature assembler가 더 자연스럽다.

권장도: 가능하지만 이름을 `course-api-mappers`에 억지로 넣기보다 해결안 2의 feature view model이 더 명시적이다.

## 해결안 4. 백엔드 코스 상세 계약 확장

`GET /courses/:courseId`가 인증된 학습자 기준으로 lesson 진행 상태와 다음 lesson까지 포함한 응답을 내려준다. 코스 상세 route는 `/progress` 전체 목록을 추가로 호출하지 않아도 된다.

예상 변경 범위:

- `packages/core/src/content/content.dto.ts`
- `apps/api/src/routes/courses.route.ts`
- `apps/api/src/openapi/openapi-document.ts`
- `docs/openapi/writing-app-api.json`
- `apps/web/src/lib/api/generated/writing-app-api.d.ts`
- 웹 mapper와 테스트

장점:

- 화면에 필요한 데이터를 API가 바로 제공한다.
- 코스 상세 진입 시 전체 progress를 내려받는 비용을 줄일 수 있다.
- 진행 상태 계산의 단일 원천을 백엔드로 옮긴다.

단점:

- 공개 콘텐츠 상세 DTO와 사용자 진행 상태가 결합된다.
- API 계약 변경 범위가 크고, OpenAPI/generated type까지 갱신해야 한다.
- 지금 문제의 규모에 비해 변경 비용이 크다.

권장도: 코스 상세 성능이 실제 병목이 되거나, 여러 클라이언트가 같은 learner-scoped course detail을 요구할 때 재검토한다. 현재 WA-7 단독 처리로는 과하다.

## 최종 권장

1차 구현은 해결안 2를 권장한다. `CourseDetail` 원본 모델은 API 응답의 내부 표현으로 유지하고, 코스 상세 화면 전용 view model을 순수 함수로 만든다. 이 함수 안에서 `progressCourse.lessons`를 `Map`으로 정규화하고, `progressCourse.nextLessons[0]` 또는 첫 `available` lesson을 기준으로 CTA를 계산한다.

이 접근은 최소 변경 원칙과 시스템 개선 사이의 균형이 좋다. 문제는 `apps/web/src/features/courses` 안에서 닫히고, API 계약은 그대로 유지되며, 렌더링 컴포넌트는 표시 책임에 집중한다.

## 2026-06-17 구현 방향 변경

적용 비용보다 적용 후 시스템 안정성을 우선해 해결안 4를 선택했다. `GET /courses/:courseId`의 `progress`를 현재 인증 학습자 기준 계약으로 재정의하고, 백엔드가 완료 수, 진행률, lesson별 진행 상태, 다음 lesson을 계산해 내려준다.

이 구현에서는 `/progress`와 코스 상세가 같은 진행 계산 모듈을 사용한다. 프론트엔드는 코스 상세에서 `/progress`를 추가 호출하지 않고, 다음 lesson 또는 lesson 잠금 규칙을 자체 재계산하지 않는다.

## 2026-06-17 구현 완료

- `CourseDetail.progress`에 `lessons`와 `nextLesson`을 추가해 코스 상세 응답이 현재 학습자의 진행 상태를 직접 포함한다.
- `apps/api/src/routes/course-progress.ts`로 진행률, lesson 상태, 다음 lesson 계산을 분리해 `/progress`와 `/courses/:courseId`가 같은 규칙을 사용한다.
- 코스 상세 route는 `/progress` 전체 목록을 추가 조회하지 않고 `getCourseDetail` 응답만으로 화면을 렌더링한다.
- `CourseDetailPage`는 `course.units.flatMap(...).find(...)`로 다음 lesson을 계산하지 않고 `course.progress.nextLesson`을 사용한다.
- `CourseCurriculum`은 `course.progress.lessons`의 상태 목록만 참조해 lesson 잠금/완료 표시를 결정한다.

## 검증 계획

- `courseDetailDtoSchema`는 learner-scoped `progress.lessons`와 nullable `progress.nextLesson`을 검증한다.
- API route 테스트는 부분 완료와 전체 완료 코스 상세의 `progress` 응답을 검증한다.
- 웹 mapper와 화면 테스트는 코스 상세 진행 계약 보존, CTA, 커리큘럼 잠금 상태, `/progress` 추가 호출 제거를 검증한다.
- 구현 후 core, api, web의 test, typecheck, lint와 `bun lefthook run pre-commit`을 실행한다.
