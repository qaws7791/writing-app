# 어드민 커리큘럼 저장 동시성 조사

## 요약

어드민 코스 편집기의 현재 저장 방식은 클라이언트가 보낸 편집 문서 전체를 기준으로 현재 커리큘럼을 직접 갱신한다. `saveCurrentCurriculum`은 코스 기본 정보를 갱신한 뒤 기존 `course_chapters`와 `course_lessons`를 삭제하고 요청에 포함된 챕터와 레슨을 다시 삽입한다.

이 구조는 두 명의 관리자가 같은 코스를 동시에 편집할 때 나중에 저장한 요청이 먼저 저장된 변경을 감지하지 못하고 덮어쓰는 Lost Update 문제를 만들 수 있다. 또한 챕터와 레슨 행이 삭제 후 재생성되므로 행 단위 변경 이력, 삭제 원인, DB 내부 감사 로그의 추적성이 약해진다.

## 확인한 구현

- `packages/db/src/repositories/drizzle-admin.repository.ts`
  - `saveCourseEditorDocument`가 `saveCurrentCurriculum` 트랜잭션을 호출한다.
  - `saveCurrentCurriculum`은 `courses`를 `courseId`만으로 갱신한다.
  - 기존 챕터 ID 목록을 조회한 뒤 `course_lessons`를 삭제하고 `course_chapters`를 삭제한다.
  - 이후 요청 본문의 `chapters`, `lessons`를 그대로 삽입한다.
  - `lesson_steps`는 삭제 대신 누락된 스텝을 `archived`로 표시하고, 입력된 스텝은 upsert한다.

- `packages/db/src/schema/content.schema.ts`
  - `courses`, `course_chapters`, `course_lessons`, `lesson_steps`에는 편집 충돌을 검증할 `revision`, `updated_at`, `lock_version` 같은 컬럼이 없다.

- `packages/core/src/admin/admin.dto.ts`
  - 편집 문서 응답과 저장 요청 DTO에는 기준 revision이나 저장 전제 조건이 없다.

- `apps/admin-api/src/routes/curriculum-editor.route.ts`
  - `PUT /courses/:courseId/editor`는 본문 검증과 `courseId` 일치 여부만 확인하고, `If-Match`나 revision 검증을 하지 않는다.

- `apps/admin/src/features/courses/admin-course-detail-page.tsx`
  - 저장 시 현재 working copy 전체를 `saveCourseEditorDocument`로 보낸다.
  - 충돌 감지 상태나 병합 안내 없이 성공 응답을 기준으로 working copy를 초기화한다.

## 위험

- 동시 편집에서 늦게 저장한 관리자의 문서가 먼저 저장된 관리자의 변경을 조용히 덮어쓸 수 있다.
- `course_chapters`와 `course_lessons`가 삭제 후 삽입되므로 DB 변경 이력이 "어떤 필드가 변경되었는지"보다 "전체 삭제와 재생성"으로 남는다.
- 외부 참조가 `course_chapters.id` 또는 `course_lessons.id`에 생기면 삭제 저장 방식이 참조 무결성 실패 또는 의도하지 않은 연결 끊김으로 확장될 수 있다.
- 현재 테스트는 "current curriculum 직접 저장"과 "버전 테이블 없음"을 고정하고 있어 동시 저장 충돌을 막는 회귀 테스트가 없다.

## 개선 방향

1. 코스 편집 문서에 명시적 `revision` 또는 `updatedAt` 기반 편집 토큰을 포함한다.
2. 저장 요청은 클라이언트가 읽은 기준 토큰을 함께 보내고, 서버는 현재 토큰과 다르면 `409 conflict`를 반환한다.
3. 삭제 후 삽입 대신 챕터와 레슨을 ID 기준으로 upsert하고, 빠진 항목은 가능한 한 `archived` 상태로 전환한다.
4. 저장이 성공할 때만 코스 편집 revision을 증가시켜 충돌 검사를 결정적으로 만든다.
5. 두 관리자가 같은 기준 문서를 저장하는 시나리오를 repository 또는 API 테스트로 추가한다.

## 모범 사례 기반 권장 설계

현재 저장소는 단일 현재 커리큘럼 모델로 단순화되어 있다. 따라서 문제 해결을 위해 커리큘럼 버전, draft, publish, 마이그레이션 모델 전체를 되살리는 것은 과하다. 더 적절한 방향은 현재 모델을 유지하면서 편집 경계에 낙관적 동시성 제어와 차등 저장을 추가하는 것이다.

### 1순위: 낙관적 동시성 제어

코스 편집 문서를 하나의 aggregate로 보고 `courses`에 `curriculum_revision` 같은 정수 revision을 추가한다. `GET /courses/:courseId/editor` 응답은 현재 revision을 함께 반환하고, `PUT /courses/:courseId/editor` 요청은 클라이언트가 읽은 `expectedRevision`을 반드시 포함한다.

저장 트랜잭션은 먼저 `courseId`와 `expectedRevision`이 모두 일치하는 경우에만 코스 row를 갱신하고 revision을 1 증가시킨다. 갱신 row 수가 0이면 이미 다른 관리자가 저장한 것이므로 이후 챕터, 레슨, 스텝 저장을 실행하지 않고 `409 conflict`를 반환한다.

이 방식은 잠금 기반 편집보다 단순하고, 관리자가 오래 화면을 열어둔 상황에서도 서버가 마지막 저장 덮어쓰기를 결정적으로 거절할 수 있다.

### 2순위: 삭제 후 삽입 제거

`course_chapters`와 `course_lessons`는 ID 기준으로 유지한다. 저장 시 기존 row를 전부 삭제하지 않고, 요청에 포함된 row는 insert 또는 update하고, 요청에서 빠진 기존 row는 삭제 대신 `archived` 상태로 전환한다.

레슨 이동은 `course_lessons.chapter_id`와 `sort_order` 업데이트로 표현하고, 제목, 설명, 상태 변경도 같은 row의 update로 남긴다. 이렇게 하면 row ID가 안정적으로 유지되고, DB 감사 로그나 향후 변경 이력 테이블이 "삭제 후 재생성"이 아니라 실제 변경을 추적할 수 있다.

### 3순위: 명시적 충돌 UX

클라이언트는 `409 conflict`를 일반 오류처럼 보여주지 않는다. "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 변경을 다시 적용하세요." 같은 별도 상태로 처리한다.

초기 구현에서는 자동 병합을 하지 않는 편이 낫다. 현재 저장 payload는 문서 전체 스냅샷이고 챕터 이동, 레슨 이동, 스텝 내용 변경이 섞일 수 있으므로 안전한 병합 규칙을 단번에 만들기 어렵다. 먼저 충돌을 감지하고 손실 저장을 막은 뒤, 실제 운영에서 자주 충돌하는 필드가 확인되면 필드 단위 병합을 별도 설계한다.

### 제외할 방향

- 비관적 잠금: 잠금 만료, 브라우저 종료, 관리자 세션 만료 같은 운영 복잡도가 커진다. 현재 문제는 낙관적 동시성 제어로 충분히 막을 수 있다.
- 전체 커리큘럼 버전 모델 재도입: 학습자 진행 버전 고정과 마이그레이션 요구가 다시 명확해질 때 검토할 문제다. 이번 문제의 핵심은 관리자 편집 저장의 Lost Update와 추적성이다.
- 클라이언트 자동 병합 우선 구현: 현재 변경 단위가 거칠어 잘못된 병합이 조용한 데이터 손상으로 이어질 수 있다.

## 구현 성공 기준

- 같은 revision에서 시작한 두 저장 요청 중 먼저 성공한 요청만 반영되고, 나중 요청은 `409 conflict`로 거절된다.
- conflict가 발생한 요청은 `course_chapters`, `course_lessons`, `lesson_steps`를 변경하지 않는다.
- 챕터 제목 변경, 레슨 이동, 레슨 보관은 기존 row ID를 유지한 update로 저장된다.
- 저장 요청에서 빠진 기존 챕터와 레슨은 hard delete가 아니라 `archived`로 전환된다.
- repository 테스트와 Admin API 테스트가 동시 저장 충돌을 고정한다.

## 구현 완료 기준 반영

개선 후 저장 경계는 `curriculum_revision` 기반 낙관적 동시성 제어를 사용한다. stale 저장은 `409 conflict`로 거절되며, 충돌 요청은 챕터, 레슨, 스텝 row를 변경하지 않는다. 챕터와 레슨 저장은 ID 기준 upsert/update와 `archived` 전환으로 처리해 row ID를 유지한다.
