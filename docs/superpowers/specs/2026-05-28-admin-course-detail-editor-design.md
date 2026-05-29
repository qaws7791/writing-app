# 어드민 코스 상세 에디터 설계

## 목적

어드민 사이트에 코스 상세 페이지를 추가한다. 이 페이지는 코스 기본 정보와 커리큘럼 구조를 수정하고, 챕터, 레슨, 레슨 내부 스텝까지 한 화면에서 관리하는 전문 제작 도구다.

핵심 목표는 단순한 테이블과 폼의 나열이 아니라, 쓰기 학습 플랫폼에 맞춘 조용하고 밀도 있는 코스 스튜디오를 만드는 것이다. 사용자는 커리큘럼 버전 정책을 의식하면서 draft를 편집하고, 상단 저장 액션으로 변경사항을 명시적으로 서버에 반영한다.

## 배경

현재 저장소는 커리큘럼 버전 모델, 학습 진행 버전 귀속, 버전 인식 읽기 경로, 노드 상태 정책, 관리자 draft/published 발행 워크플로우, 마이그레이션 맵, 학습자 업그레이드 UX를 갖추고 있다.

이번 설계는 기존 정책을 따른다.

- published 커리큘럼 버전은 직접 수정하지 않는다.
- 편집은 draft 커리큘럼 버전에만 적용한다.
- 변경사항은 자동 저장하지 않는다.
- 삭제는 실제 삭제가 아니라 아카이브를 기본 정책으로 삼는다.
- 구조 변경은 학습자의 기존 완료 성취를 훼손하지 않아야 한다.

## 범위

### 포함

- 어드민 `/courses/:courseId` 상세 페이지 구현.
- 코스 기본 정보 편집: 제목, 설명, 썸네일, 정렬 정보 등.
- draft 기반 커리큘럼 편집.
- 챕터, 레슨, 스텝 목록 표시와 추가, 수정, 정렬, 아카이브.
- 20개 레슨 스텝 타입 전용 편집 폼.
- 레슨 전체 미리보기와 현재 스텝 미리보기.
- 상단 헤더의 저장, 버전 메뉴, 복원, 발행 진입점.
- 내부 화면 상태의 URL query 저장.
- `@dnd-kit` 기반 드래그 정렬과 키보드 이동 액션.
- 어드민 API, core DTO/service/repository, DB repository 변경.
- 관련 문서 갱신과 테스트.

### 제외

- published 버전 직접 수정.
- 자동 저장.
- 마이그레이션 맵 자동 생성.
- 학습자 진행 데이터 즉시 변경.
- 실제 row 삭제를 기본 동작으로 제공하는 기능.
- `/prototype` 디렉터리 수정.

## 제품 방향

화면은 기존 어드민 사이드바를 유지하되, 코스 상세 본문은 "Course Studio"에 가깝게 설계한다. 첨부 참고 이미지의 2컬럼 원칙은 차용하지만, 시각 언어는 쓰기 학습 커리큘럼을 제작하고 검수하는 도구에 맞춘다.

왼쪽 정보 열은 큰 홍보형 카드가 아니라 코스 제작 요약이다. 썸네일, 제목, 설명, 챕터 수, 레슨 수, 스텝 수, 기본 정보 편집 진입점을 밀도 있게 배치한다.

왼쪽 하단은 `CURRICULUM MAP`이다. 챕터와 레슨을 트리로 표시하고, active, deprecated, archived 상태를 함께 보여준다. 선택된 레슨이 속한 챕터는 자동으로 펼친다.

오른쪽 작업대는 `LESSON WORKSPACE`다. 레슨의 학습 의도, 변경 유형, 필수 스텝 수, 예상 XP를 먼저 보여주고, 그 아래에 `LEARNING SEQUENCE`로 스텝 흐름을 표시한다. 스텝은 타입뿐 아니라 교육적 역할이 보이도록 표현한다.

상단 고정 헤더는 현재 코스, draft 버전, 저장되지 않은 변경 수, 구조 변경 감지 여부, 저장 버튼, 버전 메뉴를 표시한다. 자동 저장 표현은 사용하지 않는다.

## 화면 구조

전체 구조는 다음과 같다.

```text
AdminShell
  사이드바
  CourseDetailPage
    FixedHeader
    Content
      CourseInfoColumn
        CourseSummary
        CurriculumMap
      WorkspaceColumn
        LessonWorkspace | StepWorkspace | LessonPreview | Settings
```

오른쪽 작업대는 URL 상태에 따라 전환된다.

- `view=lesson`: 선택한 레슨의 학습 의도와 스텝 흐름을 표시한다.
- `view=step`: 선택한 스텝의 전용 편집 폼을 표시한다.
- `view=preview`: 학습자가 보는 레슨 화면에 가까운 미리보기를 표시한다.
- `view=settings`: 코스 또는 버전 설정을 표시한다.

좁은 화면에서는 두 컬럼을 유지하기보다 왼쪽 `CurriculumMap`을 접을 수 있는 패널로 전환한다. 텍스트 겹침과 버튼 폭 문제를 피하기 위해 헤더 액션은 메뉴로 축약한다.

## URL 상태

페이지 새로고침 후에도 현재 내부 화면으로 돌아올 수 있도록 오른쪽 작업대의 위치를 URL query에 저장한다.

```text
/courses/:courseId?version=:versionId&view=lesson&lessonId=:lessonId
/courses/:courseId?version=:versionId&view=step&lessonId=:lessonId&stepId=:stepId
/courses/:courseId?version=:versionId&view=preview&lessonId=:lessonId
/courses/:courseId?version=:versionId&view=settings
```

`version`은 현재 보는 커리큘럼 버전이다. draft가 있으면 기본값은 draft이고, 없으면 최신 published다. 왼쪽 트리의 접힘 상태는 URL에 저장하지 않는다. 선택된 레슨이 있는 챕터는 자동으로 펼친다.

저장하지 않은 `workingCopy`는 새로고침 후 복원하지 않는다. 대신 저장되지 않은 변경이 있으면 브라우저 이탈 경고와 내부 이동 확인을 띄운다.

## API 설계

조회 API는 코스 하위 리소스 경계를 명확히 드러내는 RESTful 구조를 사용한다.

```text
GET /courses/:courseId
GET /courses/:courseId/curriculum/versions
GET /courses/:courseId/curriculum/versions/:versionId
GET /courses/:courseId/lessons/:lessonId
```

작업 API는 짧고 의도가 드러나는 이름을 사용한다.

```text
POST /courses/:courseId/curriculum/drafts
POST /courses/:courseId/curriculum/restores
PUT /courses/:courseId/curriculum/versions/:versionId/content
POST /courses/:courseId/curriculum/versions/:versionId/publish
POST /courses/:courseId/curriculum/versions/:versionId/discard
```

### 조회

`GET /courses/:courseId`는 코스 기본 정보를 반환한다.

`GET /courses/:courseId/curriculum/versions`는 코스의 커리큘럼 버전 목록을 반환한다.

`GET /courses/:courseId/curriculum/versions/:versionId`는 선택한 커리큘럼 버전의 챕터와 레슨 snapshot을 반환한다. 에디터에서 필요한 step 요약도 포함한다.

`GET /courses/:courseId/lessons/:lessonId`는 선택한 커리큘럼 버전의 레슨 상세와 스텝 content를 반환한다. 요청은 `version` query를 포함하고, 서버는 해당 버전의 `curriculum_version_steps` snapshot을 읽는다. 에디터는 선택된 레슨의 상세 content를 지연 조회할 수 있다.

### 작업

`POST /courses/:courseId/curriculum/drafts`는 최신 published 버전을 복제해 새 draft를 만든다.

`POST /courses/:courseId/curriculum/restores`는 과거 published 버전을 복제해 새 draft를 만든다. 요청 body는 다음 형태를 사용한다.

```ts
type RestoreCurriculumDraftRequest = {
  sourceVersionId: string
  replaceDraft: boolean
}
```

이미 draft가 있고 `replaceDraft`가 `false`면 `400 invalid-request`를 반환한다. `replaceDraft`가 `true`면 현재 draft를 폐기하고 source 버전을 복제한다.

`PUT /courses/:courseId/curriculum/versions/:versionId/content`는 상단 저장 버튼의 유일한 저장 API다. draft의 코스 기본 정보, 챕터, 레슨, 스텝 content 전체 snapshot과 `baseRevision`을 보낸다. 서버는 draft 상태에서만 저장하고, `baseRevision`이 맞지 않으면 `409 conflict`를 반환한다.

`POST /courses/:courseId/curriculum/versions/:versionId/publish`는 draft를 published로 승격한다.

`POST /courses/:courseId/curriculum/versions/:versionId/discard`는 현재 draft를 폐기한다. UI는 위험 작업 확인을 요구한다.

## 일괄 저장 모델

화면은 서버 응답 snapshot을 클라이언트 `workingCopy`로 복사한다. 사용자가 코스 메타, 챕터, 레슨, 스텝을 수정하면 서버가 아니라 `workingCopy`만 바뀐다.

저장은 전체 편집본 snapshot 저장 방식이다. 부분 patch 연산 목록이나 변경 DSL을 만들지 않는다. 첫 구현에서는 전체 snapshot이 더 단순하고 결정적이며, 서버 검증도 명확하다.

서버 저장은 트랜잭션으로 처리한다.

1. 대상 코스와 커리큘럼 버전이 일치하는지 확인한다.
2. 대상 버전이 draft인지 확인한다.
3. `baseRevision`이 서버 revision과 같은지 확인한다.
4. 코스 기본 정보 변경을 반영한다.
5. 챕터 snapshot을 반영한다.
6. 레슨 snapshot을 반영한다.
7. 버전별 스텝 snapshot content와 정렬을 반영한다.
8. 새 revision을 반환한다.

충돌이 발생하면 저장하지 않고 `409 conflict`를 반환한다. UI는 최신 서버 상태를 다시 불러오거나 현재 변경을 폐기하는 선택지를 제공한다.

## 변경 상태와 변경 유형

클라이언트는 `workingCopy`와 마지막 저장 snapshot을 비교해 dirty 상태를 계산한다.

```ts
type DirtyState = {
  hasChanges: boolean
  changedFields: string[]
  changeKind: "minor-edit" | "additive" | "structural" | "major-revision"
}
```

변경 유형 정책은 다음과 같다.

- `minor-edit`: 제목, 설명, 문구, 썸네일, 포인트 같은 기존 항목의 내용 수정.
- `additive`: 기존 레슨 안에 스텝 추가, 보충 설명 추가.
- `structural`: 챕터/레슨 추가, 이동, 아카이브, 레슨 간 이동.
- `major-revision`: 다수 레슨 아카이브, 다수 레슨 이동, 레슨 분할/병합으로 판단되는 큰 변경.

`structural` 이상이면 발행 전 마이그레이션 맵 검토가 필요하다는 배지를 표시한다. 이번 구현은 자동 마이그레이션 맵 생성은 하지 않는다.

## 스텝 편집

스텝 편집은 20개 타입 전용 폼을 모두 제공한다. JSON 문자열 직접 편집은 기본 UI로 제공하지 않는다.

공통 필드는 다음과 같다.

```ts
type CommonStepFields = {
  type: string
  title: string
  required: boolean
  points: number
  sortOrder: number
  status: "active" | "deprecated" | "archived"
}
```

타입별 폼은 `packages/core/src/content/content.dto.ts`의 discriminated union 구조를 기준으로 만든다. 저장 대상은 전역 `lesson_steps`가 아니라 `curriculum_version_steps` snapshot이다. draft 저장 API는 published 버전의 스텝 snapshot이나 원본 `lesson_steps`를 직접 수정하지 않는다.

```text
step-forms/
  intro-step-form.tsx
  concept-step-form.tsx
  reading-passage-step-form.tsx
  example-reveal-step-form.tsx
  compare-step-form.tsx
  multiple-choice-step-form.tsx
  fill-blank-step-form.tsx
  word-select-step-form.tsx
  reorder-step-form.tsx
  match-step-form.tsx
  classify-step-form.tsx
  short-write-step-form.tsx
  long-write-step-form.tsx
  ai-feedback-step-form.tsx
  revision-step-form.tsx
  checklist-step-form.tsx
  reflection-step-form.tsx
  summary-step-form.tsx
  transcribe-step-form.tsx
  complete-step-form.tsx
```

반복 필드는 추가, 삭제, 정렬 컨트롤을 제공한다. 정답, 참조 스텝, AI 피드백 source step처럼 연결 오류가 날 수 있는 값은 현재 레슨의 스텝 목록에서 선택하게 한다.

## 미리보기

미리보기는 두 층으로 제공한다.

- `view=preview`: 학습자가 보는 전체 레슨 흐름을 보여준다.
- `view=step`: 현재 스텝 편집 화면 안에서 접이식 현재 스텝 미리보기를 제공한다.

미리보기는 서버 저장 상태가 아니라 `workingCopy`를 렌더링한다. 따라서 저장 전에도 수정 결과를 확인할 수 있지만, 자동 저장은 발생하지 않는다.

## 정렬과 아카이브

챕터, 레슨, 스텝 정렬은 `@dnd-kit`을 사용한다. 드래그 결과는 `workingCopy`에만 반영한다. 접근성을 위해 각 항목에는 위/아래 이동 액션을 함께 제공한다.

삭제는 기본적으로 `archived` 상태 전환이다. 새로 추가했지만 아직 저장하지 않은 항목은 작업 상태에서 제거할 수 있다. 이미 서버에 있던 챕터, 레슨, 스텝은 아카이브 처리하고, UI는 학습자 완료 기록 보존을 위해 숨김 처리된다는 설명을 보여준다.

저장 시 서버는 `sortOrder`를 재계산해 연속된 양의 정수로 저장한다.

## 코드 구조

프론트엔드는 기존 vertical인 `apps/admin/src/features/courses` 안에 코스 상세 에디터 구조를 둔다.

```text
features/courses/
  admin-course-detail-page.tsx
  course-editor/
    course-editor-shell.tsx
    course-editor-header.tsx
    course-summary-panel.tsx
    curriculum-map.tsx
    lesson-workspace.tsx
    step-workspace.tsx
    lesson-preview.tsx
    editor-state.ts
    editor-url-state.ts
    editor-change-kind.ts
    step-forms/
```

서버 계약은 `packages/core/src/admin`의 DTO, service, repository 경계에 추가한다. DB 구현은 `packages/db/src/repositories/drizzle-admin.repository.ts`에 둔다. Admin API route는 기존 파일이 커지면 `apps/admin-api/src/routes/curriculum-editor.route.ts`로 분리한다.

## 테스트 전략

Core 테스트는 DTO 파싱, draft content 저장 요청, 변경 유형 계산 순수 로직을 검증한다.

DB/API 테스트는 draft content snapshot 저장이 코스 메타, 챕터, 레슨, 스텝을 트랜잭션으로 반영하는지 검증한다. published 버전 저장 거부, `baseRevision` 충돌, restore, discard, publish 경계도 검증한다.

UI 테스트는 코스 상세 진입, URL 파라미터 복원, 레슨 선택, 스텝 선택, dirty 상태 표시, 저장 버튼, 버전 메뉴, 스텝 폼 렌더링, 정렬 결과를 검증한다. DnD는 실제 포인터 이벤트보다 상태 변경 함수와 키보드 이동 액션을 중심으로 테스트한다.

브라우저 검증은 구현 후 로컬 admin 앱에서 데스크톱과 좁은 화면을 확인한다. 2컬럼 반응형, 텍스트 겹침, 스텝 폼 스크롤, 미리보기 전환, 저장/복원 메뉴 동작을 확인한다.

## 문서화

작업 시작과 완료 시 `docs/admin-site.md`를 갱신한다. 모든 문서는 한국어로 작성한다.

## 자체 검토

- 설계는 코스 상세 페이지 하나와 그 내부 화면에 집중한다.
- published 직접 수정, 자동 저장, 실제 삭제는 제외해 기존 도메인 정책과 충돌하지 않는다.
- 조회 API는 코스 하위 curriculum 리소스 경계를 명확히 드러낸다.
- 작업 API는 하이픈이 많은 긴 이름을 피하고, 짧은 리소스 이름으로 의도를 표현한다.
- `versionId`는 항상 코스의 curriculum 하위에 있어 어떤 버전인지 모호하지 않다.
- 저장은 전체 snapshot 방식으로 정해 충돌 처리와 서버 검증이 단순하다.
- 20개 스텝 타입 전용 폼을 모두 포함해 도메인 최적화 에디터라는 목표를 만족한다.
