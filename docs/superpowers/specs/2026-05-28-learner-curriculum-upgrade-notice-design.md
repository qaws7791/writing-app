# 학습자 커리큘럼 업그레이드 공지 설계

## 배경

커리큘럼 버전 관리 로드맵 7단계까지 구현되어 관리자는 커리큘럼 버전 사이의 마이그레이션 맵을 만들고, 특정 사용자 진행을 새 버전에 적용할 수 있다. 하지만 학습자가 직접 새 버전으로 이동할 수 있는 선택 UX는 아직 없다.

8단계의 목표는 구조 변경을 학습자에게 갑자기 강제하지 않고, 현재 진행 버전을 유지한 상태에서 새 커리큘럼 공지와 명시적 선택지를 제공하는 것이다.

## 목표

- 학습자는 코스 상세에서 새 커리큘럼이 있는지 확인할 수 있다.
- 학습자가 선택하기 전까지 `course_progress.curriculum_version_id`는 현재 버전을 유지한다.
- 업그레이드 선택 시 active 마이그레이션 맵을 적용해 완료 성취를 새 버전으로 이전한다.
- 나중에 결정 선택 시 학습 흐름을 막지 않고 해당 version pair의 공지를 숨긴다.
- 공지는 변경 이유와 기대 효과를 짧게 설명한다.
- 신규 학습자나 이미 최신 버전에 있는 학습자에게는 업그레이드 공지를 보여주지 않는다.

## 제외 범위

- 학습자가 숨긴 공지를 다시 여는 별도 설정 화면
- 코스 완료 후 자동 업그레이드
- 부분 진행과 lesson answer 이전
- 여러 커리큘럼 버전 후보 중 수동 선택
- 관리자 마이그레이션 맵 편집 UI

## 접근 대안

### 대안 A: 프론트 배너만 추가

프론트엔드에서 최신 published 코스와 진행률을 비교해 배너를 표시한다.

장점은 빠르다. 단점은 마이그레이션 맵 존재 여부와 적용 가능 여부를 클라이언트가 알 수 없어 잘못된 업그레이드 버튼을 보여줄 수 있다.

### 대안 B: learner-facing API와 코스 상세 공지

백엔드가 active 마이그레이션 맵, 진행 버전, 최신 published 버전, dismiss 상태를 기준으로 업그레이드 가능 여부를 계산한다. 웹은 코스 상세에서 그 결과만 렌더링한다.

장점은 진행 버전 변경 정책이 서버에 남고, 기존 완료 성취 이전 로직을 재사용할 수 있다. 단점은 API와 웹 클라이언트가 함께 바뀐다.

### 대안 C: 홈 전체 공지 센터

모든 코스의 업그레이드 가능 상태를 홈에서 모아 보여주고, 별도 공지 센터를 만든다.

장점은 대규모 서비스 UX에 가깝다. 단점은 현재 제품 단계에 비해 넓고, 코스 상세의 직접 선택 문제를 해결하기 전에 화면 범위가 커진다.

## 결정

대안 B를 채택한다. 이번 단계는 코스 상세에서 새 커리큘럼 공지를 보여주고, 학습자가 직접 업그레이드하거나 나중에 결정할 수 있는 최소 수직 경로를 구현한다.

## API 설계

인증된 학습자 API에 다음 route를 추가한다.

```text
GET /courses/:courseId/curriculum-upgrade
POST /courses/:courseId/curriculum-upgrade
POST /courses/:courseId/curriculum-upgrade/dismiss
```

### `GET /courses/:courseId/curriculum-upgrade`

현재 학습자의 코스 진행 버전이 최신 published 버전보다 오래되었고, 두 버전 사이에 active 마이그레이션 맵이 있으며, 해당 pair를 dismiss하지 않았을 때만 `status: "available"`을 반환한다.

응답 예시:

```json
{
  "status": "available",
  "courseId": "sentence-structure",
  "migrationId": "sentence-structure-v1-to-sentence-structure-v2",
  "fromVersion": {
    "id": "sentence-structure-v1",
    "versionNumber": 1,
    "title": "문장 구조의 기본"
  },
  "toVersion": {
    "id": "sentence-structure-v2",
    "versionNumber": 2,
    "title": "문장 구조의 기본 v2",
    "changelog": "새 예제와 복습 경로를 추가했습니다."
  },
  "completedCount": 3,
  "totalLessons": 12,
  "message": "새 커리큘럼에는 새 예제와 복습 경로가 포함됩니다."
}
```

업그레이드가 없으면 다음 응답을 반환한다.

```json
{
  "status": "not-available",
  "courseId": "sentence-structure"
}
```

### `POST /courses/:courseId/curriculum-upgrade`

현재 학습자의 available upgrade를 적용한다. body는 받지 않는다. 적용은 7단계 마이그레이션 정책과 동일하다.

성공 응답은 새 버전에서 완료로 인정된 target lesson, removed로 보존된 source lesson, 아직 완료하지 않아 건너뛴 source lesson을 포함한다.

### `POST /courses/:courseId/curriculum-upgrade/dismiss`

현재 available upgrade pair를 숨긴다. 이 작업은 진행 버전을 바꾸지 않는다.

## 데이터 모델

학습자가 version pair 공지를 숨겼는지 기록하기 위해 다음 테이블을 추가한다.

```text
curriculum_upgrade_dismissals
  - id
  - user_id
  - course_id
  - from_version_id
  - to_version_id
  - created_at
  - updated_at
```

unique key는 `user_id`, `course_id`, `from_version_id`, `to_version_id`다. 같은 pair를 여러 번 dismiss해도 하나의 row만 유지한다.

## 백엔드 경계

`packages/core/learning`은 업그레이드 DTO와 service 메서드를 제공한다.

- `getCurriculumUpgrade`
- `applyCurriculumUpgrade`
- `dismissCurriculumUpgrade`

`packages/db`는 진행 버전, 최신 published 버전, active migration, dismiss 상태를 조합해 available upgrade를 계산한다. 마이그레이션 적용 알고리즘은 관리자 경계와 학습자 경계가 같은 정책을 쓰도록 shared helper로 분리한다.

`apps/api`는 인증을 요구하고, core learning service 결과를 기존 학습 API와 같은 오류 정책으로 매핑한다.

## 웹 UX

코스 상세 화면의 진행 카드 위에 업그레이드 안내를 표시한다.

- 제목은 새 커리큘럼 도착을 직접적으로 알린다.
- 본문은 changelog 기반의 짧은 설명을 보여준다.
- 기본 동작은 "새 버전으로 업그레이드"다.
- 보조 동작은 "나중에 결정"이며, dismiss API를 호출한다.

코스 상세 page는 서버에서 코스 상세와 업그레이드 상태를 병렬 조회한다. 클라이언트 상호작용은 작은 client component로 분리하고, 서버 컴포넌트에는 직렬화 가능한 DTO만 전달한다.

## 오류 정책

- 인증이 없으면 `401 unauthorized`
- 코스를 찾을 수 없으면 `404 course-not-found`
- 진행이 없거나 적용 가능한 active migration이 없으면 apply/dismiss에서 `404 not-found`
- 이미 source version이 아니면 `400 invalid-request`
- DB 오류는 `503 database-unavailable`

## 테스트 전략

- Core learning service 테스트
  - available upgrade DTO를 반환한다.
  - 업그레이드가 없으면 `not-available`을 반환한다.
  - apply/dismiss repository 결과를 보존한다.
- DB learning repository 테스트
  - active migration이 있을 때 notice를 반환한다.
  - dismiss 후 notice를 숨긴다.
  - apply가 동일한 shared migration policy로 진행 버전을 이동한다.
- API route 테스트
  - 세 route가 인증을 요구한다.
  - GET available/not-available, POST apply, POST dismiss 응답을 검증한다.
  - OpenAPI path를 포함한다.
- Web API client 테스트
  - HTTP route와 DTO mapping을 검증한다.
  - fake API가 dismiss 후 notice를 숨긴다.
- UI 테스트
  - 코스 상세에서 available notice를 렌더링한다.
  - not-available이면 notice를 렌더링하지 않는다.

## 자체 검토

- 공개 코스 DTO에는 version metadata를 추가하지 않는다.
- 학습자가 명시적으로 apply를 호출하기 전까지 진행 버전을 바꾸지 않는다.
- dismiss는 진행 상태를 변경하지 않으며, 해당 pair의 공지만 숨긴다.
- 적용 정책은 관리자 적용과 learner 적용이 갈라지지 않도록 shared helper로 분리한다.
