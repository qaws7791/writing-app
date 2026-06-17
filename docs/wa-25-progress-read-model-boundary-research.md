# WA-25 학습 진행 Read Model 경계 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-25 `과도한 Controller 로직`
- 조사 범위: `apps/api/src/routes/progress.route.ts`, `apps/api/src/routes/course-progress.ts`, `apps/api/src/routes/courses.route.ts`, `packages/core/src/learning`, `packages/core/src/content`

## 이슈 요약

WA-25는 `apps/api/src/routes/progress.route.ts`의 `toCourseProgress`가 route/controller 계층에서 학습 진행률, lesson 상태, 다음 lesson 등을 계산한다고 지적한다.

현재 코드는 이슈 본문과 조금 다르다. `toCourseProgress`와 관련 helper는 `progress.route.ts` 안이 아니라 `apps/api/src/routes/course-progress.ts`로 분리되어 있다. 하지만 이 파일도 여전히 API app의 route 폴더에 있으며, 실제로 학습 진행 read model 생성 책임을 갖고 있다.

## 코드 조사

`progress.route.ts`는 인증된 사용자의 course list, course detail, progress snapshot을 모아 `toCourseProgress()`를 호출한다.

`course-progress.ts`는 다음 책임을 가진다.

- `ProgressReader` port 정의
- 학습자 lesson progress snapshot type 정의
- `toCourseProgress()`로 홈/진행 목록용 course progress DTO 생성
- `withLearnerCourseProgress()`로 course detail DTO에 progress를 주입
- lesson progress snapshot을 lesson id별로 grouping
- 완료 lesson 집합 계산
- 첫 미완료 lesson을 `available`, 이후 lesson을 `locked`로 계산
- progress percentage 계산
- next lesson projection 생성

`courses.route.ts`도 같은 helper의 `withLearnerCourseProgress()`를 호출한다. 즉 `/progress`와 `/courses/:courseId`가 같은 route-layer helper에 의존한다.

반면 `packages/core/src/learning/learning.service.ts`는 현재 저장/완료/답변 저장 mutation만 담당한다. 학습 진행 read model을 만드는 service나 port는 core에 없다. `ProgressReader` 구현도 `apps/api/src/main.ts` 안에서 DB query와 streak 계산을 직접 수행한다.

## 판단

이슈는 타당하다.

다만 “60줄 controller 함수가 route 파일 안에 있다”는 구체적 표현은 현재 코드와 완전히 일치하지 않는다. 로직은 route 파일에서 `course-progress.ts`로 분리되어 있지만, 여전히 API route layer 내부에 있다. 문제의 본질은 controller 길이가 아니라 도메인 read model 규칙이 application adapter에 놓여 있다는 점이다.

첫 미완료 lesson만 available로 만드는 규칙, 완료율 계산, next lesson 선정은 학습 도메인의 정책이다. 이 정책이 `apps/api`에 있으면 web, admin, batch, future API가 같은 학습 진행 규칙을 재사용하기 어렵고, core DTO와 OpenAPI 계약 변경도 route helper 중심으로 흩어진다.

## 개선 방안

### 방안 1. `packages/core/src/learning`에 학습 진행 read model service를 만든다

core에 `createLearningProgressService()`를 추가하고 다음 기능을 제공한다.

- `getLearnerCourseProgressList(userId)`
- `getLearnerCourseDetail(courseId, userId)`
- `resolveLessonAvailability(courseDetail, progressSnapshots)`

API route는 session 확인, path/query parse, HTTP status 변환만 담당한다. 장점은 lesson availability와 progress percentage 규칙이 도메인 계층으로 이동한다. 단점은 content repository와 progress repository를 묶는 read service 계약을 새로 설계해야 한다.

### 방안 2. `ProgressReader` port를 core로 이동하고 repository 책임을 명확히 나눈다

현재 `ProgressReader`는 API route helper에 정의되어 있다. 이를 core로 옮기고 다음 두 port를 명시한다.

- `LearningProgressRepository`: persisted lesson progress snapshot과 activity/streak 원천 데이터 조회
- `ContentRepository`: active course/course detail 조회

core service가 두 port를 조합해 read model을 만든다. 장점은 apps/api/main.ts가 DB query와 streak 계산을 직접 들고 있지 않게 된다.

### 방안 3. lesson availability 정책을 순수 도메인 함수로 분리한다

`resolveLessonProgress()`와 `getLessonStatus()`를 core의 순수 정책 함수로 옮긴다.

- 입력: ordered lessons, persisted progress snapshots
- 출력: lesson availability list, completed count, next lesson

이 함수는 DB와 HTTP를 모르며, core 단위 테스트로 모든 edge case를 검증한다. 장점은 정책을 빠르게 이동시킬 수 있고, 이후 read service가 얇게 얹힌다.

### 방안 4. profile 통계와 course progress 계산을 같은 read model 경계로 통합한다

`apps/api/src/main.ts`의 `createProfileReader()`도 completed lesson count, total lesson count, streak, progress percent를 계산한다. `/profile`, `/progress`, `/courses/:courseId`가 각각 비슷한 진행률 계산을 갖고 있으므로 `LearnerProgressReadModelService`로 통합한다.

장점은 “홈 통계와 코스 진행률이 서로 다르게 계산되는” 오류를 예방한다. 단점은 기존 route tests를 service tests와 adapter tests로 재배치해야 한다.

### 방안 5. route test를 얇게 만들고 core read model contract test를 강화한다

현재 `/progress` route test가 첫 미완료 lesson availability 정책까지 검증한다. 개선 후에는 다음처럼 분리한다.

- core service test: completed, in_progress, locked, next lesson, percentage, empty course edge case 검증
- API route test: 인증 실패/성공, service result의 JSON 변환, repository unavailable 변환 검증
- OpenAPI test: response schema와 예시 동기화 검증

장점은 controller가 정책 테스트의 주 무대가 되지 않는다.

## 권장 진행 순서

1. core에 lesson availability 순수 함수와 테스트를 먼저 추가한다.
2. `ProgressReader`와 progress snapshot type을 core로 이동한다.
3. `LearningProgressReadModelService`를 만들어 content repository와 progress repository를 조합한다.
4. `/progress`와 `/courses/:courseId` route는 service 호출과 HTTP 변환만 남긴다.
5. `createProfileReader()`의 통계 계산도 같은 read model service 또는 shared policy를 사용하게 한다.
6. OpenAPI와 web API mapper 테스트를 갱신해 read model 계약을 고정한다.

## 검증 계획

- `bun --filter @workspace/core test -- learning`
- `bun --filter @workspace/api test -- progress.route courses.route app`
- `bun --filter @workspace/web test -- course-api-mappers`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-25 본문을 읽고 현재 route, route helper, core learning service, content DTO, API main의 progress reader 구현을 조사했다.
- 지적 위치는 일부 변경되었지만 이슈의 핵심은 타당하다고 판단했다.
- 개선 방향은 route helper 이동이 아니라 core read model service, progress repository port, lesson availability 정책 테스트, profile/progress 계산 통합으로 정리했다.
- 학습 진행 read model 정책을 `packages/core/src/learning/learning-progress-read-model.ts`로 이동했다.
- `ProgressReader`, 학습자 progress snapshot type, lesson availability 계산, course progress projection을 core learning interface로 노출했다.
- 기존 `apps/api/src/routes/course-progress.ts`를 제거하고 `/progress`, `/courses/:courseId`, API 조립 루트가 core learning interface를 사용하도록 바꿨다.
- 첫 미완료 lesson availability와 모든 lesson 완료 시 `nextLesson: null` 정책을 core 단위 테스트로 고정했다.
