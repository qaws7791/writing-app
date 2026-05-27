# 커리큘럼 마이그레이션 맵 설계

## 배경

커리큘럼 버전 관리 로드맵 6단계까지 구현되어 관리자는 최신 published 버전에서 draft를 만들고 새 published 버전으로 발행할 수 있다. 이때 신규 학습자는 새 최신 published 버전을 보지만, 기존 학습자의 `course_progress.curriculum_version_id`는 자동으로 바뀌지 않는다.

7단계의 목표는 기존 학습자를 새 버전으로 옮길 때 사용할 명시적 마이그레이션 맵과 적용 규칙을 먼저 만드는 것이다. 학습자에게 업그레이드 안내를 보여주고 선택받는 UX는 다음 8단계에서 다룬다.

## 목표

- 관리자는 `fromVersionId`와 `toVersionId` 사이의 레슨 매핑을 생성할 수 있다.
- 매핑은 `equivalent`, `split`, `merged`, `removed` 타입을 가진다.
- 매핑이 없으면 기존 학습자 진행은 자동으로 이동하지 않는다.
- 관리자는 마이그레이션 맵을 조회할 수 있다.
- 관리자 API는 특정 사용자 진행을 마이그레이션 맵 기준으로 적용할 수 있다.
- 적용 결과는 재실행해도 같은 결과를 내야 한다.
- 실패한 적용 시도는 DB row로 관측 가능해야 한다.

## 접근 대안

### 대안 A: 맵 테이블만 추가

마이그레이션 맵과 레슨 매핑 테이블만 만들고 적용 로직은 8단계로 미룬다.

장점은 작고 빠르다. 단점은 맵이 실제로 진행을 옮길 수 있는지 검증하지 못해 8단계에서 정책 결함이 늦게 발견된다.

### 대안 B: 맵 생성/조회와 사용자 단위 적용까지 구현

관리자 API로 맵을 만들고, 특정 사용자 진행을 맵 기준으로 적용하는 저장소 로직까지 만든다. learner-facing 업그레이드 UX와 공개 API는 제외한다.

장점은 마이그레이션 정책의 핵심인 idempotency와 완료 성취 보존을 이번 단계에서 검증할 수 있다. 단점은 API와 저장소 구현 범위가 늘어난다.

### 대안 C: 학습자 업그레이드 UX까지 포함

학습자 화면, 공지 배너, 업그레이드/나중에 결정 API까지 함께 구현한다.

장점은 최종 제품 흐름에 가깝다. 단점은 관리자 맵 정책, learner API, 프론트 UX가 한 번에 엮여 변경 범위가 커진다.

## 결정

대안 B를 채택한다. 7단계는 마이그레이션 맵과 관리자용 적용 경계를 만든다. 학습자가 직접 선택하는 업그레이드 UX와 learner-facing route는 8단계로 남긴다.

## 데이터 모델

```text
curriculum_version_migrations
  - id
  - from_version_id
  - to_version_id
  - status
  - created_at

lesson_migration_mappings
  - id
  - migration_id
  - from_lesson_id
  - to_lesson_id
  - mapping_type

curriculum_migration_applications
  - id
  - migration_id
  - user_id
  - course_id
  - from_version_id
  - to_version_id
  - status
  - completed_lesson_count
  - result_json
  - error_message
  - created_at
  - updated_at
```

`curriculum_version_migrations.status`는 이번 단계에서 `active`, `archived`만 사용한다. 맵 수정 API는 만들지 않으므로 생성된 active 맵은 사실상 immutable로 취급한다.

`to_lesson_id`는 `removed`일 때만 `null`이다. `equivalent`, `split`, `merged`는 target lesson을 명시해야 한다.

## 매핑 정책

- `equivalent`: 이전 완료 레슨 하나가 새 레슨 하나의 완료로 이전된다.
- `split`: 이전 완료 레슨 하나가 관리자가 지정한 여러 새 레슨의 완료로 이전된다. 여러 row로 표현한다.
- `merged`: 여러 이전 레슨이 하나의 새 레슨으로 합쳐진다. 같은 target lesson에 연결된 모든 source lesson이 완료되어야 target lesson을 완료로 인정한다.
- `removed`: 새 버전에 대응 레슨이 없다. 기존 완료 row는 보존하지만 새 버전 완료율에는 포함하지 않는다.

부분 진행과 답변은 이번 단계에서 이전하지 않는다. 완료 상태만 새 버전 진행으로 이전한다.

## 적용 정책

관리자 API는 `POST /curriculum-migrations/:migrationId/apply`로 특정 `userId`를 받는다.

적용 전제:

- 사용자의 코스 진행이 존재해야 한다.
- 진행 중인 `course_progress.curriculum_version_id`가 migration의 `fromVersionId`여야 한다.
- 이미 같은 migration이 완료되어 있고 사용자가 `toVersionId`에 있으면 기존 적용 결과를 반환한다.

적용 결과:

- target completed lesson rows를 `lesson_progress`에 completed 상태로 upsert한다.
- `course_progress.curriculum_version_id`를 `toVersionId`로 바꾼다.
- `completed_count`는 새 버전에서 완료로 인정된 target lesson 수로 갱신한다.
- `last_lesson_id`는 새 버전 active lesson 순서에서 마지막 completed target lesson으로 설정한다. 완료 target lesson이 없으면 `null`로 둔다.
- removed source lesson의 기존 완료 row는 삭제하지 않는다.

## API 설계

관리자 인증은 기존 `requireAdminSession`을 사용한다.

```text
POST /curriculum-migrations
GET /curriculum-migrations/:migrationId
POST /curriculum-migrations/:migrationId/apply
```

### `POST /curriculum-migrations`

요청 body:

```json
{
  "fromVersionId": "sentence-structure-v1",
  "toVersionId": "sentence-structure-v2",
  "mappings": [
    {
      "fromLessonId": "sentence-structure-01",
      "toLessonId": "sentence-structure-01",
      "mappingType": "equivalent"
    }
  ]
}
```

### `GET /curriculum-migrations/:migrationId`

마이그레이션 요약과 레슨 매핑 목록을 반환한다.

### `POST /curriculum-migrations/:migrationId/apply`

요청 body:

```json
{
  "userId": "learner-1"
}
```

적용 결과는 completed target lesson, removed로 보존된 source lesson, skipped lesson 목록을 포함한다.

## 오류 정책

- 버전, 맵, 사용자 진행을 찾을 수 없으면 `404 not-found`
- from/to 버전이 같은 코스가 아니거나 매핑 타입과 target lesson 유무가 맞지 않으면 `400 invalid-request`
- 사용자가 source version에 있지 않으면 `400 invalid-request`
- DB 오류는 `503 database-unavailable`

## 제외 범위

- 마이그레이션 맵 수정 API
- 마이그레이션 맵 삭제 API
- 여러 사용자 일괄 적용
- learner-facing 업그레이드 API
- 학습자 공지/배너 UX
- lesson answer 이전
- 부분 진행 이전

## 테스트 전략

- Core admin service 테스트
  - 맵 생성, 조회, 적용 결과 DTO를 검증한다.
  - invalid/not-found 결과를 보존한다.
- DB migration/schema 테스트
  - 세 migration table이 생성되는지 검증한다.
- DB admin repository 테스트
  - 맵 생성 시 from/to version과 lesson 매핑을 저장한다.
  - 잘못된 mapping type 조합을 거절한다.
  - equivalent/split/merged/removed 정책으로 사용자 completed progress를 새 버전에 적용한다.
  - 적용을 재실행해도 같은 결과가 반환된다.
  - 실패 적용은 application row로 남는다.
- Admin API route 테스트
  - 세 route가 관리자 인증을 요구한다.
  - 성공 응답과 `400`, `404`, `503` 매핑을 검증한다.

## 자체 검토

- 8단계 UX를 만들지 않고도 마이그레이션 정책의 핵심 위험인 완료 이전과 idempotency를 검증할 수 있다.
- 기존 public DTO에는 버전 metadata를 추가하지 않는다.
- 기존 학습자는 이 API가 호출되기 전까지 계속 자신의 진행 버전을 유지한다.
