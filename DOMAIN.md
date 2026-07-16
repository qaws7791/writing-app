# 도메인 가이드

## 현재 제품 콘텐츠 모델

현재 제품의 콘텐츠 단위는 다음 계층으로 정의한다.

```text
Course
  -> Unit
    -> Lesson
      -> Step
```

초기 baseline seed는 기준 콘텐츠 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 기준으로 한다. 런타임은 변환된 DB seed와 repository를 통해서만 콘텐츠를 조회한다.

표준 스텝 타입은 다음 10개다.

```text
READING
COMPARE
MULTIPLE_CHOICE
FILL_BLANK
SELECT
ORDER
WRITE
AI_FEEDBACK
MATCH
CATEGORIZE
```

짧은 쓰기와 긴 쓰기는 별도 타입으로 나누지 않고 `WRITE`의 `min`, `goal`, `max`, `mode`, `sample` 같은 콘텐츠 속성으로 표현한다.

## 콘텐츠 변경 정책

코스마다 변경 가능한 draft 하나와 변경할 수 없는 published revision들을 운영한다. 관리자의 저장은 draft에만 반영되고, 명시적 발행이 성공해야 신규 학습자 경로가 새 revision을 가리킨다. 기존 학습자는 코스 시작 시점의 published revision에 고정된다.

## 변경 유형

| 변경 유형        | 예시                                     | 현재 정책                                                       |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `minor-edit`     | 오탈자 수정, 설명 보완                   | draft에 저장하고 검토 뒤 발행한다.                              |
| `additive`       | 기존 레슨 안의 예제 추가, 보충 설명 추가 | draft에 저장하며 기존 published revision은 유지한다.            |
| `structural`     | 새 레슨 삽입, 유닛 순서 변경, 레슨 이동  | 논리 ID를 가능한 한 유지해 다음 revision으로 발행한다.          |
| `major-revision` | 다수 레슨 병합·분할, 커리큘럼 전면 개편  | 새 revision으로 발행한다. 기존 학습자를 자동 이동시키지 않는다. |

## 완료 성취 보존

학습자가 이미 완료한 성취는 가능한 한 유지한다.

- 학습 시작 시 `learner_course_progress`에 published curriculum version을 고정한다.
- 완료 레슨, 현재 스텝과 답변은 해당 curriculum version 범위에 남긴다.
- 코스 진행률과 다음 레슨은 학습자에게 고정된 version의 active 계층 기준으로 계산한다.
- 새 revision 발행과 코스 보관은 기존 진행·답안·AI 시도를 이동하거나 삭제하지 않는다.

## 현재 커리큘럼 모델

커리큘럼은 코스 identity와 관계형 version 구조로 표현한다.

```text
Course
  -> CurriculumVersion (draft | published)
    -> UnitVersion
      -> LessonVersion
        -> StepVersion
```

학습 진행은 코스와 고정된 published version에 귀속한다.

```text
LearnerProgress
  - userId
  - courseId
  - curriculumVersionId
  - lessonId
  - currentStepId
```

## 삭제 대신 아카이빙

코스 보관은 코스 identity를 `archived`로 바꾼다. published version과 학습자 참조는 실제 삭제하지 않는다. mutable draft 저장에서는 제거된 하위 row를 같은 draft 안에서 삭제하고 전체 문서를 다시 삽입할 수 있다.

```ts
type CurriculumNodeStatus = "active" | "archived"
```

- `active`: 신규 학습 경로에 포함한다.
- `archived`: 신규 학습 경로에서는 숨긴다. 기존 진행 데이터와 복구 가능성을 위해 데이터는 보존한다.

실제 삭제는 진행 데이터 참조, 복구 기간, 운영 감사 필요성을 확인한 뒤 별도 정리 작업에서만 다룬다.

사용자 삭제 요청도 Better Auth provider 테이블을 직접 훼손하지 않는다. 앱 소유 프로필 상태를 `deleted`로 전환하고 노출 데이터를 비식별화하며, 학습 진행과 답변 row는 감사와 복구 판단을 위해 보존한다.

## 답변과 연속 학습일

상호작용형 스텝 답변은 `learner_lesson_answers`에 course·curriculum version·lesson·step 범위로 저장한다. 답변 본문은 스텝 타입별 JSON으로 저장하고, 타입별 파싱과 검증은 `packages/core`의 DTO와 서비스 계약에서 명시한다.

매칭 스텝은 학습 콘텐츠의 텍스트와 화면 선택지 식별자를 분리한다. 왼쪽과 오른쪽 선택지는 pair index에서 만든 stable choice id를 갖고, 오른쪽 표시 순서는 `packages/core`의 매칭 표시 정책이 결정적으로 섞는다. 중복 텍스트가 있어도 화면 key, 선택 전이, 정답 판정은 텍스트가 아니라 choice id를 기준으로 처리하고, 저장 payload만 기존 `left`, `right` 텍스트 pair로 변환한다.

연속 학습일은 클라이언트 상태가 아니라 서버 이벤트에서 계산한다. 학습 진행 저장, 답변 저장, 레슨 완료 같은 활동은 사용자별 학습 활동 날짜를 갱신하고, 현재 연속 학습일은 조회 시점에 결정적으로 계산한다.

학습 활동 날짜는 UTC timestamp가 아니라 플랫폼 학습 시간대 기준의 논리 날짜다. 현재 플랫폼 학습 시간대는 `Asia/Seoul`이며, 날짜 키 생성과 연속 학습일 계산은 `packages/core`의 `LearningDateKey` 정책을 단일 출처로 사용한다.

## 어드민 편집 정책

어드민 코스 편집기는 현재 mutable draft 전체 문서를 `editVersion` 조건으로 저장하고 별도 행동으로 발행한다.

- 코스 편집 문서는 `GET /courses/:courseId/editor`로 조회한다.
- 코스 편집 문서는 `PUT /courses/:courseId/editor`로 원자적으로 저장한다.
- 저장 문서는 branded 코스·유닛·레슨·스텝 ID와 구조화된 10종 step union을 사용한다.
- `If-Match`가 현재 draft의 `editVersion`과 같을 때만 저장하며 충돌은 `409 STALE_REVISION`으로 반환한다. 자동 병합하지 않는다.
- 저장은 `editVersion`만 증가시키고 발행 순서인 `revision`은 바꾸지 않는다.
- `POST /courses/:courseId/publish`는 draft 전체를 검증해 published로 전환하고 같은 내용의 다음 revision draft를 복제한다.
- 코스 생성은 `POST /courses`, 코스 보관은 `DELETE /courses/:courseId`를 사용한다. 새 코스는 빈 revision `1` draft로 시작해 발행 전까지 학습자에게 보이지 않는다.

## 현재 구현 상태

현재 baseline schema, seed, content·admin·learning repository는 관계형 curriculum version을 기준으로 구현되어 있다. 기존 mutable DB는 revision `1` published와 revision `2` draft로 일회성 이관하며 진행·답안·AI 시도는 revision `1`에 고정한다.

재수강, 학습자 version 업그레이드 선택, published version 자동 정리와 둘 이상의 mutable branch는 현재 범위 밖이다.
