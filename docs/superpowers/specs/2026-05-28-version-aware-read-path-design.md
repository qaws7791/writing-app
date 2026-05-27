# 버전 인식 읽기 경로 설계

## 배경

커리큘럼 버전 관리 로드맵의 2단계와 3단계에서 공개 콘텐츠는 최신 published 버전 기준으로 조회되고, 학습 진행은 `curriculum_version_id`에 귀속되었다. 이제 필요한 것은 이 두 기준이 API 경계에서 섞이지 않도록 회귀 테스트와 검증 규칙을 고정하는 것이다.

공개 API는 신규 학습자와 비로그인 사용자가 볼 최신 커리큘럼을 보여야 한다. 반대로 인증된 진행 API는 학습자가 이미 시작한 커리큘럼 버전을 기준으로 완료율과 다음 레슨을 계산해야 한다. 최신 published 버전에 새 레슨이 추가되거나 기존 레슨이 빠져도 기존 학습자의 완료 성취가 흔들리면 안 된다.

## 목표

- 공개 콘텐츠 API는 최신 published 커리큘럼 버전을 유지한다.
- 인증된 진행 API는 `course_progress.curriculum_version_id`에 저장된 진행 버전을 유지한다.
- 새 published 버전이 생겨도 기존 학습자의 `totalLessons`, `completedCount`, `nextLessonId`, `progressPercent`가 진행 버전 기준으로 계산됨을 core/db 테스트와 API route 통합 테스트 조합으로 검증한다.
- 진행 버전에 포함되지 않은 레슨에 대한 진행 저장, 완료, 답변 저장을 거절한다.
- 공개 API 응답 DTO에는 아직 `curriculumVersionId`를 노출하지 않는다.

## 접근 대안

### 대안 A: Core/DB 단위 테스트만 추가

이미 서비스와 repository가 버전 기준을 알고 있으므로 core/db 테스트만 보강한다.

장점은 빠르고 작다. 단점은 실제 Hono route, auth session, service 조립, DB repository가 함께 동작할 때 기준이 섞이지 않는다는 보장이 부족하다.

### 대안 B: 실제 DB 기반 API 통합 테스트 추가

인메모리 SQLite에 seed를 넣고, 실제 content/learning repository와 service를 `createApiApp`에 연결한다. 테스트 안에서 `v2` published 버전을 추가해 공개 API와 진행 API가 서로 다른 기준을 쓰는지 확인한다.

장점은 이번 단계의 핵심 위험을 가장 직접적으로 검증한다. 단점은 `apps/api` 테스트가 Node Vitest로 실행되고 SQLite 접근은 Bun 런타임에 묶여 있어 테스트 런타임 전환이 필요하다는 점이다. 이 전환은 이번 변경보다 파급이 크다.

### 대안 C: Core/DB 실동작 테스트와 API route 통합 테스트 분리

Core와 DB 테스트는 실제 version repository와 진행 계산을 검증하고, API 테스트는 Hono route가 공개 콘텐츠 결과와 인증 진행 결과를 섞지 않고 각각 반환하는지 검증한다.

장점은 기존 테스트 런타임 경계를 유지하면서 각 레이어의 책임을 명확히 검증한다. 단점은 단일 테스트가 모든 레이어를 한 번에 지나가지는 않는다.

### 대안 D: API 응답에 버전 ID 노출

공개 콘텐츠와 진행 응답에 `curriculumVersionId`를 노출해 클라이언트도 기준을 알 수 있게 한다.

장점은 디버깅이 쉽다. 단점은 프론트엔드와 공개 계약 변경 범위가 커지고, 지금 필요한 성취 보존 검증보다 앞서간다.

## 결정

대안 C를 채택한다. 이번 단계는 새 제품 기능보다 경계 안정성에 가깝다. 실제 version 계산은 core/db 테스트로 검증하고, API route는 공개 콘텐츠 응답과 학습자 진행 응답을 분리해 반환하는지 검증한다. API 테스트 런타임을 Bun으로 바꾸는 것은 별도 인프라 결정으로 남긴다.

DTO에는 버전 ID를 노출하지 않는다. 공개 API와 진행 API의 외부 응답 형태는 유지하고, 내부 service/repository 경계에서만 버전을 사용한다.

## 상세 설계

### API route 통합 테스트 fixture

`apps/api/src/versioned-learning.integration.test.ts`를 추가한다. 테스트는 기존 API 테스트와 같은 방식으로 fake content/learning service를 `createApiApp`에 연결한다.

- fake auth session
- latest public content를 반환하는 content service
- learner version progress를 반환하는 learning service
- no-op AI feedback service

DB와 repository의 실제 version 계산은 이미 `packages/db`와 `packages/core` 테스트가 검증한다. API route 테스트는 공개 응답과 진행 응답이 서로 다른 DTO를 그대로 반환하는지, 그리고 진행 버전 밖 쓰기 거절이 `400 invalid-request`로 매핑되는지 확인한다.

### 공개 최신 버전과 진행 버전 분리

첫 번째 API route 통합 테스트는 다음을 검증한다.

1. 공개 `GET /courses/sentence-structure`는 최신 공개 콘텐츠 service 결과인 `lessonCount: 1`을 반환한다.
2. 인증된 `GET /courses/sentence-structure/progress`는 학습자 진행 service 결과인 `totalLessons: 12`, `completedCount: 1`, `nextLessonId: "sentence-structure-02"`를 반환한다.
3. 인증된 `GET /progress`도 같은 진행 버전 기준 값을 반환한다.

### 진행 버전 밖 레슨 거절

두 번째 API route 통합 테스트는 다음을 검증한다.

1. learning service가 진행 버전 밖 쓰기를 `invalid-request`로 반환한다.
2. `PUT /lessons/:lessonId/progress`, `PUT /lessons/:lessonId/answers`, `POST /lessons/:lessonId/complete`가 모두 `400 invalid-request`로 매핑된다.

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
- API route 통합 테스트
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
