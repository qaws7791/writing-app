# 관리자 커리큘럼 발행 워크플로우 설계

## 배경

커리큘럼 버전 관리 로드맵의 2~5단계에서 코스별 `v1` published 버전, 학습 진행 버전 귀속, 공개/진행 읽기 경계, 노드 상태 정책을 구현했다. 이제 관리자 쪽에서 published 구조를 직접 바꾸지 않고 draft를 만들고 발행하는 최소 워크플로우가 필요하다.

이번 단계의 핵심은 완전한 CMS 편집기가 아니라 발행 경계다. draft가 관리자 전용 상태로 존재하고, publish 시 신규 학습자가 보는 최신 published 버전이 바뀌며, 기존 학습자의 `course_progress.curriculum_version_id`는 자동 변경되지 않아야 한다.

## 목표

- 관리자는 코스의 최신 published 버전을 복제해 draft 버전을 생성할 수 있다.
- 코스별 draft는 한 번에 하나만 허용한다.
- 관리자는 코스의 커리큘럼 버전 목록을 조회할 수 있다.
- 관리자는 특정 커리큘럼 버전의 챕터/레슨 snapshot을 조회할 수 있다.
- draft를 publish하면 해당 코스의 최신 published 버전이 된다.
- published 버전은 직접 수정하지 않는다.
- 기존 학습자의 진행 버전은 publish로 자동 변경되지 않는다.

## 접근 대안

### 대안 A: Draft 생성과 publish만 구현

최신 published 버전을 복제해 next `versionNumber` draft를 만들고, draft를 published로 전환한다. 구조 편집 API는 후속 단계로 남긴다.

장점은 발행 경계를 빠르게 고정하고 기존 공개/진행 버전 정책을 검증할 수 있다. 단점은 실제 구조 변경은 아직 API로 할 수 없다.

### 대안 B: Metadata PATCH까지 포함

draft의 `title`, `changelog`를 수정하는 `PATCH /curriculum-versions/:versionId`를 함께 추가한다.

장점은 운영자가 발행 설명을 수정할 수 있다. 단점은 구조 편집보다 작은 기능이지만 API 계약과 테스트가 늘어난다.

### 대안 C: 노드 편집 API까지 포함

draft 안에서 챕터/레슨 삽입, 이동, 상태 변경까지 구현한다.

장점은 CMS에 가까워진다. 단점은 마이그레이션 맵, 충돌 정책, UI 설계까지 엮여 이번 단계가 과도하게 커진다.

## 결정

대안 A를 채택한다. 이번 단계는 draft/published 발행 경계와 API 표면을 먼저 만든다. `PATCH` 기반 metadata 수정과 구조 편집 API는 draft 발행 경계가 안정된 뒤 별도 단계에서 추가한다.

draft ID는 발행 후에도 바뀌지 않는다. 버전 ID는 영속 참조이므로 상태가 draft에서 published로 바뀌어도 동일한 ID를 유지한다. 새 draft는 코스의 최대 `version_number + 1`을 사용하고, 이미 draft가 있으면 새 draft 생성을 거절한다.

## API 설계

관리자 인증은 기존 `requireAdminSession`을 사용한다.

```text
GET /courses/:courseId/curriculum-versions
POST /courses/:courseId/curriculum-versions
GET /curriculum-versions/:versionId
POST /curriculum-versions/:versionId/publish
```

### `GET /courses/:courseId/curriculum-versions`

코스의 모든 커리큘럼 버전 요약을 `versionNumber` 내림차순으로 반환한다.

### `POST /courses/:courseId/curriculum-versions`

최신 published 버전을 복제해 draft를 생성한다. request body는 받지 않는다. 기본 `title`은 source version의 title을 유지하고, `changelog`는 `Draft from v{sourceVersionNumber}`로 기록한다.

오류 정책:

- 코스 또는 published source가 없으면 `404 not-found`
- 이미 draft가 있으면 `400 invalid-request`
- DB 오류는 `503 database-unavailable`

### `GET /curriculum-versions/:versionId`

관리자 전용 상세 조회다. draft와 published를 모두 조회할 수 있고, 챕터/레슨 노드 상태를 모두 반환한다.

### `POST /curriculum-versions/:versionId/publish`

draft 버전을 published로 전환하고 `publishedAt`을 기록한다.

오류 정책:

- 버전이 없으면 `404 not-found`
- draft가 아니면 `400 invalid-request`
- DB 오류는 `503 database-unavailable`

## DTO 설계

버전 상태는 관리자 DTO에 명시한다.

```ts
type AdminCurriculumVersionStatus = "draft" | "published" | "archived"
```

요약 DTO는 `id`, `courseId`, `versionNumber`, `status`, `title`, `changelog`, `publishedAt`, `createdAt`을 가진다. 상세 DTO는 요약 필드에 `chapters`를 더하고, 각 chapter/lesson은 5단계에서 추가한 노드 상태를 포함한다.

## DB 설계

새 migration은 만들지 않는다. 기존 테이블을 그대로 사용한다.

draft 생성은 하나의 transaction에서 처리한다.

1. 코스의 draft 존재 여부를 확인한다.
2. 최신 published 버전을 찾는다.
3. 코스의 최대 version number를 기준으로 next version number를 계산한다.
4. version row를 `status: "draft"`로 insert한다.
5. source version의 chapter와 lesson snapshot을 새 version id로 복제한다.

publish는 해당 version row가 draft인지 확인한 뒤 `status: "published"`, `publishedAt: now`로 갱신한다.

## 제외 범위

- `PATCH /curriculum-versions/:versionId`
- draft 안의 챕터/레슨 추가, 이동, 상태 변경 API
- publish 전 validation UI
- 마이그레이션 맵
- 학습자 업그레이드 UX
- published 버전 수정 API
- 실제 delete API

## 테스트 전략

- Core admin service 테스트
  - 버전 목록, draft 생성, 버전 상세, publish 성공 결과를 DTO로 검증한다.
  - repository의 invalid/not-found/unavailable 결과를 service 결과로 보존한다.
- DB admin repository 테스트
  - 최신 published에서 draft를 복제한다.
  - 이미 draft가 있으면 거절한다.
  - draft publish 후 공개 content repository가 새 published를 최신으로 선택한다.
  - 기존 학습자의 `course_progress.curriculum_version_id`는 publish 후에도 바뀌지 않는다.
- Admin API route 테스트
  - 새 route들이 인증을 요구한다.
  - 성공 응답과 오류 응답을 HTTP status로 매핑한다.
- 전체 회귀 테스트
  - 기존 공개 콘텐츠, 학습 진행, 관리자 코스 목록/트리 조회가 깨지지 않는다.

## 자체 검토

- 이번 단계는 발행 경계만 만들고 편집 기능은 제외해 범위를 작게 유지한다.
- 새 schema 없이 기존 `curriculum_versions` 모델을 사용한다.
- 기존 학습자 진행이 자동 이동하지 않는 원칙을 DB 테스트로 검증한다.
- public DTO에는 version metadata를 노출하지 않는다.
