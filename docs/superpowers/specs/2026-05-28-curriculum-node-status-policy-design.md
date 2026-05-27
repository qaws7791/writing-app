# 커리큘럼 노드 상태 정책 설계

## 배경

커리큘럼 버전 관리 로드맵의 2단계에서 `curriculum_version_chapters`와 `curriculum_version_lessons`에 `active`, `deprecated`, `archived` 상태 컬럼을 이미 추가했다. 3단계와 4단계에서는 학습 진행이 커리큘럼 버전에 귀속되고, 공개 최신 버전과 학습자 진행 버전의 읽기 경계가 분리되었다.

5단계의 목적은 실제 삭제 기능을 만들기 전에 상태 정책을 코드 계약으로 고정하는 것이다. 삭제 API를 열지 않고도 운영자는 deprecated/archived 상태를 확인할 수 있어야 하고, 학습자 공개 경로는 신규 학습자에게 보여야 할 active 노드만 반환해야 한다.

## 목표

- 챕터와 레슨 노드 상태를 도메인 DTO와 repository 계약에서 명시한다.
- 공개 콘텐츠 목록, 검색, 상세 조회는 최신 published 버전 안의 active 챕터와 active 레슨만 노출한다.
- 학습 진행 계산과 진행 저장 검증은 학습자의 진행 버전 안의 active 레슨만 다음 학습 대상으로 사용한다.
- 이미 완료된 archived 레슨의 완료 카운트는 학습자의 진행 row 기준으로 보존한다.
- 관리자 코스 트리 조회는 최신 published 버전의 챕터와 레슨을 상태와 함께 반환한다.
- 실제 delete API와 archive mutation API는 아직 제공하지 않는다.

## 접근 대안

### 대안 A: 공개 조회 필터만 테스트로 고정

공개 콘텐츠 repository에 archived/deprecated 필터 테스트만 추가한다.

장점은 가장 작다. 단점은 관리자 조회에서 상태를 볼 방법이 없어 5단계 완료 조건인 상태 표시를 만족하지 못한다.

### 대안 B: 관리자 조회에 노드 상태를 노출

Core admin DTO에 노드 상태를 추가하고, admin repository의 코스 트리 조회를 최신 published 커리큘럼 버전 기준으로 바꾼다. 관리자 조회는 active/deprecated/archived를 모두 반환하고, 공개 콘텐츠와 학습 진행 repository는 active만 사용한다.

장점은 delete API 없이도 운영자가 상태를 확인할 수 있고, 기존 상태 컬럼을 실제 계약으로 만든다. 단점은 admin tree 응답에 `status` 필드가 추가된다.

### 대안 C: archive mutation API까지 추가

관리자가 특정 챕터나 레슨을 archived로 바꾸는 API를 추가한다.

장점은 운영 기능이 바로 생긴다. 단점은 draft/published 발행 워크플로우보다 앞서 published 구조를 직접 바꿀 위험이 있다.

## 결정

대안 B를 채택한다. 이번 단계는 삭제 기능 구현이 아니라 삭제를 대체할 상태 정책의 읽기 경계를 고정하는 단계다. 상태 mutation은 6단계의 draft/published 발행 워크플로우 안에서 다루고, 지금은 관리자 조회가 최신 published 버전의 상태를 투명하게 보여주는 것에 집중한다.

새 DB migration은 만들지 않는다. 상태 컬럼은 이미 존재하고 seed는 `active` 상태를 채운다.

## 상세 설계

### 도메인 타입

`packages/core/src/admin/admin.dto.ts`에 관리자용 커리큘럼 노드 상태 schema를 추가한다.

```ts
export const adminCurriculumNodeStatusSchema = z.enum([
  "active",
  "deprecated",
  "archived",
])
```

`AdminChapterSummaryDto`와 `AdminLessonSummaryDto`는 `status`를 필수 필드로 가진다. 이 상태는 관리자 화면과 API 소비자가 노드가 신규 학습자 경로에 노출되는지 판단할 수 있게 한다.

### 관리자 코스 트리 조회

`createDrizzleAdminRepository().listCourseTree()`는 기존 `course_chapters`, `course_lessons` 원본 트리가 아니라 최신 published `curriculum_versions`의 snapshot을 조회한다.

- 코스는 기존 `courses.sort_order` 기준으로 정렬한다.
- 코스별 최신 published 버전이 없으면 해당 코스의 `chapters`는 빈 배열이다.
- 챕터와 레슨은 `sort_order` 기준으로 정렬한다.
- 관리자 조회는 `active`, `deprecated`, `archived`를 모두 반환한다.
- 공개 API와 달리 archived/deprecated를 필터링하지 않는다.

### 공개 콘텐츠 조회

공개 콘텐츠 repository는 이미 active 챕터와 active 레슨만 조회한다. 이번 단계에서는 테스트를 추가해 다음을 명시한다.

- 최신 published 버전에 archived 챕터가 있으면 해당 챕터와 하위 레슨은 공개 상세에 나오지 않는다.
- active 챕터 안의 archived/deprecated 레슨은 공개 상세와 lessonCount에서 제외된다.
- 코스 목록과 검색의 lessonCount도 active 레슨만 계산한다.

### 학습 진행 조회

학습 repository는 `listCurriculumVersionLessonIds`와 `curriculumVersionIncludesLesson`에서 active 챕터와 active 레슨만 사용한다. 이번 단계에서는 테스트를 추가해 archived/deprecated 레슨이 다음 학습 후보와 저장 가능 레슨에서 제외됨을 명시한다.

이미 완료된 archived 레슨의 완료 카운트는 `lesson_progress` row 기준으로 유지한다. 진행률 계산의 총 레슨 수는 active 레슨 수를 기준으로 두고, 완료 카운트는 이미 저장된 완료 성취를 보존한다.

## 제외 범위

- 관리자 archive/deprecate mutation API
- 관리자 draft/published 발행 API
- 학습자 업그레이드 UX
- 마이그레이션 맵
- 실제 delete API
- public DTO에 노드 상태 노출

## 테스트 전략

- Core admin service 테스트
  - repository가 반환한 chapter/lesson status가 DTO 검증을 통과한다.
  - 알 수 없는 status는 `database-unavailable`로 변환된다.
- DB admin repository 테스트
  - 최신 published 버전의 모든 노드 상태를 관리자 코스 트리에 반환한다.
- DB content repository 테스트
  - archived/deprecated 노드는 공개 상세와 lessonCount에서 제외된다.
- DB learning repository 테스트
  - archived/deprecated 레슨은 진행 버전의 active lesson id 목록과 membership 검사에서 제외된다.
- Core learning service 테스트
  - 이미 완료된 archived 레슨은 진행 조회 완료 카운트에 남는다.
- Admin API route 테스트
  - `GET /courses?include=chapters,lessons` 응답에 status 필드가 포함된다.

## 자체 검토

- 상태 mutation을 추가하지 않으므로 published 구조를 직접 바꾸는 위험을 만들지 않는다.
- 관리자 조회만 status를 노출하고, 학습자 공개 DTO는 변경하지 않는다.
- 이미 있는 DB 상태 컬럼을 사용하는 범위라 migration이 필요 없다.
- 5단계 완료 조건인 archived 노드 숨김, 완료 성취 보존, 관리자 상태 표시를 모두 테스트로 확인한다.
