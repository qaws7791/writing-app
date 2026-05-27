# 버전 인식 읽기 경로 설계

## 배경

커리큘럼 버전 관리 로드맵의 2단계와 3단계에서 공개 콘텐츠는 최신 published 버전 기준으로 조회되고, 학습 진행은 `curriculum_version_id`에 귀속되었다. 이제 필요한 것은 이 두 기준이 API 경계에서 섞이지 않도록 회귀 테스트와 검증 규칙을 고정하는 것이다.

공개 API는 신규 학습자와 비로그인 사용자가 볼 최신 커리큘럼을 보여야 한다. 반대로 인증된 진행 API는 학습자가 이미 시작한 커리큘럼 버전을 기준으로 완료율과 다음 레슨을 계산해야 한다. 최신 published 버전에 새 레슨이 추가되거나 기존 레슨이 빠져도 기존 학습자의 완료 성취가 흔들리면 안 된다.

## 목표

- 공개 콘텐츠 API는 최신 published 커리큘럼 버전을 유지한다.
- 인증된 진행 API는 `course_progress.curriculum_version_id`에 저장된 진행 버전을 유지한다.
- 새 published 버전이 생겨도 기존 학습자의 `totalLessons`, `completedCount`, `nextLessonId`, `progressPercent`가 진행 버전 기준으로 계산됨을 API 통합 테스트로 검증한다.
- 진행 버전에 포함되지 않은 레슨에 대한 진행 저장, 완료, 답변 저장을 거절한다.
- 공개 API 응답 DTO에는 아직 `curriculumVersionId`를 노출하지 않는다.

## 접근 대안

### 대안 A: Core/DB 단위 테스트만 추가

이미 서비스와 repository가 버전 기준을 알고 있으므로 core/db 테스트만 보강한다.

장점은 빠르고 작다. 단점은 실제 Hono route, auth session, service 조립, DB repository가 함께 동작할 때 기준이 섞이지 않는다는 보장이 부족하다.

### 대안 B: 실제 DB 기반 API 통합 테스트 추가

인메모리 SQLite에 seed를 넣고, 실제 content/learning repository와 service를 `createApiApp`에 연결한다. 테스트 안에서 `v2` published 버전을 추가해 공개 API와 진행 API가 서로 다른 기준을 쓰는지 확인한다.

장점은 이번 단계의 핵심 위험을 가장 직접적으로 검증한다. 단점은 API 테스트 fixture가 약간 길어진다.

### 대안 C: API 응답에 버전 ID 노출

공개 콘텐츠와 진행 응답에 `curriculumVersionId`를 노출해 클라이언트도 기준을 알 수 있게 한다.

장점은 디버깅이 쉽다. 단점은 프론트엔드와 공개 계약 변경 범위가 커지고, 지금 필요한 성취 보존 검증보다 앞서간다.

## 결정

대안 B를 채택한다. 이번 단계는 새 제품 기능보다 경계 안정성에 가깝다. 실제 API 조립 상태에서 공개 최신 버전과 학습자 진행 버전이 분리되는지 검증하는 것이 가장 큰 가치를 낸다.

DTO에는 버전 ID를 노출하지 않는다. 공개 API와 진행 API의 외부 응답 형태는 유지하고, 내부 service/repository 경계에서만 버전을 사용한다.

## 상세 설계

### API 통합 테스트 fixture

`apps/api/src/versioned-learning.integration.test.ts`를 추가한다. 테스트는 다음 조합을 실제로 만든다.

- 인메모리 SQLite
- `runContentMigration`
- `seedContent`
- 테스트 사용자 row
- `createDrizzleContentRepository`
- `createDrizzleLearningRepository`
- `createContentService`
- `createLearningService`
- fake auth session
- no-op AI feedback service

테스트 helper는 `sentence-structure-v2` published 버전을 만들 수 있어야 한다. 이 버전은 `sentence-structure-01`만 active 레슨으로 포함해 공개 최신 구조와 기존 `v1` 진행 구조의 차이를 선명하게 만든다.

### 공개 최신 버전과 진행 버전 분리

첫 번째 통합 테스트는 다음 순서로 동작한다.

1. seed 직후 `POST /lessons/sentence-structure-01/complete`를 호출해 사용자의 진행을 `sentence-structure-v1`에 귀속시킨다.
2. 이후 `sentence-structure-v2` published 버전을 추가한다.
3. 공개 `GET /courses/sentence-structure`는 최신 v2 기준으로 `lessonCount: 1`을 반환한다.
4. 인증된 `GET /courses/sentence-structure/progress`는 기존 v1 기준으로 `totalLessons: 12`, `completedCount: 1`, `nextLessonId: "sentence-structure-02"`를 반환한다.

### 진행 버전 밖 레슨 거절

두 번째 통합 테스트는 다음 순서로 동작한다.

1. 먼저 `sentence-structure-v2` published 버전을 추가한다.
2. `PUT /lessons/sentence-structure-01/progress`를 호출해 사용자의 진행을 최신 v2에 귀속시킨다.
3. v2에 포함되지 않은 `sentence-structure-12`에 대해 진행 저장을 시도한다.
4. API는 `400 invalid-request`를 반환한다.

### 답변 저장 버전 검증

3단계에서는 `saveLessonProgress`와 `completeLesson`만 버전 포함 여부를 검증했다. 답변 저장도 진행 버전 밖 레슨에 대해 허용되면 학습자가 현재 커리큘럼에 없는 레슨 답변을 쌓을 수 있다.

따라서 `saveLessonAnswer`도 동일하게 다음 조건을 확인한다.

- 해당 코스의 기존 진행이 있으면 그 `curriculumVersionId`를 사용한다.
- 기존 진행이 없으면 최신 published 버전을 선택한다.
- 대상 레슨이 선택된 버전의 active 레슨이 아니면 `invalid-request`를 반환한다.
- 버전 검증을 통과한 뒤 기존 step 타입 검증과 answer 저장을 수행한다.

## 테스트 전략

- Core learning service 테스트
  - 진행 버전 밖 레슨 답변 저장이 거절되는지 검증한다.
- API 통합 테스트
  - 공개 상세는 최신 published 버전 기준인지 검증한다.
  - 인증 진행은 기존 진행 버전 기준인지 검증한다.
  - 진행 버전 밖 레슨 진행 저장은 400인지 검증한다.
  - 진행 버전 밖 레슨 답변 저장은 400인지 검증한다.
- 기존 core/db/api 전체 테스트를 유지한다.

## 제외 범위

- 공개 DTO의 `curriculumVersionId` 노출
- 학습자 업그레이드 UX
- 관리자 발행 API
- 마이그레이션 맵
- 레슨 step 본문 snapshot
- `lesson_answers` 테이블의 버전 컬럼 추가

## 자체 검토

- 이번 설계는 로드맵 4단계의 핵심인 공개 최신 버전과 진행 버전 분리를 API 경계에서 검증한다.
- 새 DB 테이블이나 외부 API 계약 변경은 추가하지 않는다.
- 답변 저장 버전 검증은 진행 저장/완료 검증과 같은 정책을 따르므로 범위 확장이 아니라 누락된 경계 보강이다.
