# 어드민 코스 에디터 정정 설계

## 목적

어드민 코스 상세 페이지를 실제 콘텐츠 제작자가 사용할 수 있는 한국어 커리큘럼 편집 도구로 정정한다. 이번 작업은 시각적 보정이 아니라 편집 모델, API 계약, 클라이언트 상태, 화면 동작을 함께 정리하는 작업이다.

성공 조건은 관리자가 draft 커리큘럼에서 코스 기본 정보, 챕터, 레슨, 스텝을 한 흐름 안에서 추가, 수정, 정렬, 아카이브하고, 저장 전 변경사항과 위험 작업을 명확히 인지할 수 있는 것이다.

## 핵심 원칙

- draft만 편집 가능하다.
- published 버전은 읽기 전용으로 렌더링한다.
- 삭제는 기본적으로 아카이브다.
- 저장은 전체 editor snapshot 저장 모델을 유지한다.
- API와 DB는 UI가 필요한 편집 단위를 숨기지 않는다.
- 한국어 운영 도구에서는 내부 enum, URL 상태, 개발 용어를 그대로 노출하지 않는다.
- 모바일에서는 오른쪽 작업대가 사라지지 않아야 한다.

## 비목표

- 학습자 앱 UI 변경은 포함하지 않는다.
- 실제 파일 업로드 저장소 연동은 이번 범위에서 제외한다. 썸네일 UI는 파일 선택과 미리보기까지 제공하고, 저장값은 기존 `thumbnailPath` 계약에 맞춘다.
- 자동 저장은 추가하지 않는다.
- 마이그레이션 맵 자동 생성은 추가하지 않는다.
- `/prototype` 디렉터리는 수정하지 않는다.

## 편집 모델

클라이언트 working copy는 코스와 커리큘럼 버전을 하나의 editor document로 다룬다.

```ts
type CourseEditorDocument = {
  course: CourseEditorCourse
  version: CourseEditorVersion
  chapters: CourseEditorChapter[]
  lessons: CourseEditorLesson[]
  steps: CourseEditorStep[]
}
```

챕터, 레슨, 스텝은 모두 다음 규칙을 공유한다.

- `id`: 저장된 노드는 서버 id, 새 노드는 `draft-*` 임시 id를 사용한다.
- `status`: `active`, `deprecated`, `archived` 중 하나다.
- `sortOrder`: 저장 payload 생성 시 각 부모 범위 안에서 재계산한다.
- 새로 추가한 뒤 저장 전 아카이브한 노드는 payload에서 제거할 수 있다.
- 저장된 노드는 실제 삭제하지 않고 `archived`로 저장한다.

레슨은 기존 `lessonId`와 curriculum version lesson row id가 혼재되어 있다. UI에서는 curriculum version lesson row id를 편집 행 id로 사용하고, 학습 도메인 레슨 참조는 `lessonId`로 유지한다. 새 레슨은 저장 시 서버가 `lessons` row와 curriculum version lesson row를 함께 만들 수 있도록 `lessonId`도 draft id로 보낸다.

스텝은 curriculum version step row를 편집 원천으로 삼는다. 전역 `lesson_steps`는 published 원본 호환을 위한 source로만 남기고, draft 편집 화면은 `curriculum_version_steps`를 직접 수정한다.

## API 설계

기존 단건 조회 API를 editor document 조회 API로 합친다.

```text
GET /courses/:courseId/editor?version=:versionId
PUT /courses/:courseId/editor
```

`GET /courses/:courseId/editor`는 코스 기본 정보, 버전 목록, 선택된 버전, editor document를 한 번에 반환한다. 서버 컴포넌트가 여러 API를 조합하면서 오류를 로그인 리다이렉트로 과도하게 처리하는 문제를 줄인다.

`PUT /courses/:courseId/editor`는 다음 내용을 저장한다.

```ts
type AdminCourseEditorSaveRequestDto = {
  courseId: string
  versionId: string
  baseRevision: number
  course: {
    title: string
    description: string
    thumbnailPath: string
    sortOrder: number
  }
  chapters: Array<{
    id: string
    label: string
    title: string
    sortOrder: number
    status: "active" | "deprecated" | "archived"
  }>
  lessons: Array<{
    id: string
    lessonId: string
    chapterId: string
    title: string
    description: string
    sortOrder: number
    status: "active" | "deprecated" | "archived"
  }>
  steps: Array<{
    id: string
    lessonId: string
    type: AdminEditorStepType
    title: string
    sortOrder: number
    points: number
    required: boolean
    status: "active" | "deprecated" | "archived"
    content: unknown
  }>
}
```

기존 draft 생성, 복원, 발행, 폐기 route는 유지하되, UI에서는 확인 모달을 거쳐 호출한다.

## DB 저장 정책

DB는 기존 version snapshot 테이블을 계속 사용한다.

- `curriculum_version_chapters`: 챕터 편집 snapshot.
- `curriculum_version_lessons`: 레슨 편집 snapshot.
- `curriculum_version_steps`: 스텝 편집 snapshot.

저장 API는 draft 버전만 허용한다. 저장 시 서버는 트랜잭션 안에서 다음을 수행한다.

1. 코스와 버전이 일치하는지 확인한다.
2. 버전 상태가 `draft`인지 확인한다.
3. `baseRevision` 충돌을 확인한다.
4. 코스 기본 정보를 갱신한다.
5. 챕터 snapshot을 upsert한다.
6. 새 레슨 draft id가 있으면 `lessons` row를 만든 뒤 curriculum version lesson row를 upsert한다.
7. 레슨 snapshot을 upsert한다.
8. 새 스텝 draft id가 있으면 curriculum version step row를 만든다.
9. 스텝 snapshot을 upsert한다.
10. revision을 증가시킨다.

이미 저장된 row는 실제 삭제하지 않는다. 저장 전 생성 후 제거된 draft 노드만 payload에서 제외한다.

## UI 구조

화면 제목은 `코스 편집`으로 바꾸고, 상단에는 선택 버전과 상태를 한국어 배지로 표시한다. 코스 제목은 상단 설명에 실시간 반영하지 않는다.

왼쪽 영역은 다음 섹션으로 구성한다.

- 코스 기본 정보: 썸네일 미리보기, 썸네일 변경 버튼, 제목, 설명.
- 커리큘럼: 챕터 목록, 챕터 추가, 챕터 수정, 챕터 아카이브, 레슨 추가, 레슨 선택, 레슨 이동.

오른쪽 작업대는 선택 상태에 따라 전환한다.

- 레슨 작업대: 선택 레슨의 제목, 설명, 상태, 스텝 목록, 스텝 추가, 스텝 이동, 스텝 아카이브.
- 스텝 작업대: 선택 스텝의 공통 정보와 타입별 content 편집 폼.
- 미리보기: working copy 기준의 레슨 흐름 미리보기.
- 설정: 선택 레슨의 상태와 고급 속성.

`LEARNING SEQUENCE`는 `학습 흐름`으로 표시한다. 스텝 타입, 버전 상태, 변경 유형은 표시 전용 한국어 매핑을 사용한다.

## 반응형

데스크톱은 좌측 커리큘럼 패널과 우측 작업대 2컬럼을 유지한다. 좁은 화면에서는 상단 segmented control로 `커리큘럼`과 `작업대`를 전환한다. 작업대 폭이 0이 되는 레이아웃은 허용하지 않는다.

## 위험 작업과 변경 보호

- 저장하지 않은 변경이 있으면 브라우저 이탈 경고를 등록한다.
- 버전 전환, draft 폐기, published 복원, 발행은 변경사항이 있을 때 확인 모달을 거친다.
- draft 폐기와 발행은 항상 확인 모달을 거친다.
- published 버전은 모든 입력과 구조 변경 버튼을 비활성화하고, 읽기 전용 안내를 표시한다.

## 스텝 폼 정책

스텝 content는 타입별 schema에 맞춰 읽고 쓴다. 숫자 필드는 숫자로 저장하고, 배열 필드는 줄 단위 UI를 배열로 변환한다. 참조 스텝 필드는 자유 입력 대신 같은 레슨의 스텝 선택으로 제공한다.

기존 content key와 다른 임의 key를 만들지 않는다. 예를 들어 INTRO는 `title`, `category`, `bullets`, `estimatedMinutes`, `totalSteps`, `xpAvailable`를 편집한다.

## 테스트 전략

- core DTO/service 테스트: editor document 조회/저장 계약, draft-only 저장, revision conflict.
- DB 테스트: 챕터/레슨/스텝 추가, 아카이브, 정렬, 새 draft id 저장.
- admin-api 테스트: 신규 editor route와 기존 버전 action route 오류 매핑.
- admin UI 테스트: 한국어 라벨, 읽기 전용 published, 챕터/레슨/스텝 추가/아카이브/선택, 설정 화면, 변경 guard.
- 브라우저 검증: 데스크톱과 모바일에서 작업대 접근, 스텝 선택 후 상세 전환, 위험 작업 확인 모달, 저장 성공.

## 자체 검토

- 이번 설계는 편집 모델과 화면 동작을 하나의 editor document로 묶어 기존 다중 조회 조합의 우발 복잡성을 줄인다.
- DB는 새 테이블을 늘리기보다 이미 도입된 version snapshot 테이블을 정식 편집 원천으로 삼는다.
- 새 파일 업로드 인프라는 이번 작업의 본질이 아니므로 제외하고, UI와 저장 계약은 기존 썸네일 경로 모델에 맞춘다.
- published 직접 수정과 자동 저장은 기존 도메인 정책과 충돌하므로 제외한다.
- 모바일 레이아웃, 위험 작업 확인, content schema 보존은 현재 감사에서 확인된 실제 결함을 직접 해결한다.
