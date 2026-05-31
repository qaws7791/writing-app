# 어드민 에디터 Prop Drilling 조사

## 조사 목적

어드민 코스 편집기에서 `CourseEditorShell`이 많은 상태 변경 콜백을 받아 하위 컴포넌트로 중계하는 구조를 점검했다. 초점은 기능 추가가 아니라 응집성, 가독성, 직교성을 회복하는 구조 개선 방향이다.

## 현재 구조

대상 코드는 `apps/admin/src/features/courses` 아래에 있다.

- `admin-course-detail-page.tsx`는 편집 문서 조회 결과를 `workingCopy`로 만들고, 저장, URL 상태, 토스트, 이탈 경고, 편집 명령을 모두 소유한다.
- `course-editor-shell.tsx`는 `workingCopy`와 `urlState`에서 선택된 레슨과 스텝을 파생하고, 15개의 콜백을 `CourseSummaryPanel`, `CurriculumMap`, `LessonWorkspace`, `StepWorkspace`, `LessonPreview`로 다시 전달한다.
- `curriculum-map.tsx`는 챕터/레슨 표시 UI지만 `onAddChapter`, `onAddLesson`, `onArchiveChapter`, `onArchiveLesson`, `onMoveLesson`, `onSelectLesson`, `onUpdateChapterField`를 다시 `ChapterSection`, `SortableLessonButton`으로 전달한다.
- `lesson-workspace.tsx`는 레슨 작업대 UI지만 `onAddStep`, `onArchiveStep`, `onMoveStep`, `onOpenPreview`, `onSelectStep`, `onUpdateLessonField`를 내부 row와 메뉴까지 전달한다.

현재 테스트는 이 콜백 계약을 직접 검증한다. 예를 들어 `curriculum-map.test.tsx`는 레슨 선택, 챕터 추가, 레슨 추가, 챕터 보관, 레슨 보관 콜백이 호출되는지를 확인하고, `lesson-workspace.test.tsx`는 스텝 추가와 보관 콜백 호출을 확인한다.

## 문제 진단

가장 큰 문제는 props 개수 자체보다 책임 경계가 흐려진 점이다.

- `CourseEditorShell`은 레이아웃 컴포넌트인데 편집 명령의 라우터 역할까지 맡는다.
- 중간 컴포넌트가 자기 관심사가 아닌 명령 이름과 시그니처를 알아야 한다.
- 새 편집 명령을 추가하면 페이지, 셸, 대상 컴포넌트, 테스트 fixture가 함께 흔들릴 가능성이 높다.
- 하위 컴포넌트는 명령의 출처를 알 필요가 없지만 현재 구조에서는 명령이 props 체인에 노출된다.
- 콜백 일부는 `selectedLessonId`를 보강하기 위해 셸에서 래핑되며, 이로 인해 선택 상태와 명령 실행의 결합이 셸에 집중된다.

이 구조는 읽는 사람이 "이 버튼이 실제로 무엇을 바꾸는가"를 추적하기 위해 페이지, 셸, 작업대 컴포넌트, 상태 helper를 순서대로 따라가야 한다. 투명성이 떨어지고, 변경 영향 범위도 넓어진다.

## 모범 사례 기준

React 공식 문서는 깊은 props 전달이 반복될 때 Context를 사용해 중간 컴포넌트가 값을 직접 전달하지 않아도 되게 할 수 있다고 설명한다. 또한 복잡한 화면 상태는 reducer와 context를 결합해 상태 업데이트 로직을 모으는 방식을 제시한다.

- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [useCallback Reference](https://react.dev/reference/react/useCallback)

이 저장소에는 Zustand, Redux, Jotai 같은 외부 상태 관리 의존성이 없다. 어드민 에디터 하나의 국소 문제이므로 새 전역 상태 라이브러리를 추가하는 것은 현재 범위에 비해 무겁다. 기존 순수 상태 helper인 `editor-state.ts`를 유지하고, React 기본 기능으로 편집 세션 경계를 만드는 편이 더 작고 되돌리기 쉽다.

## 대안

### 대안 1. 콜백을 명령 객체로 그룹화

`CourseEditorShell` props를 `editorActions` 하나로 묶고, 내부에서는 `curriculumActions`, `lessonActions`, `stepActions`, `navigationActions`처럼 필요한 묶음만 하위 컴포넌트에 넘긴다.

장점은 변경 범위가 작고 테스트 수정이 적다는 점이다. 단점은 prop drilling 자체가 사라지지 않고 이름만 묶인다는 점이다. 중간 컴포넌트가 여전히 명령 전달을 의식한다.

### 대안 2. 편집 세션 Provider와 도메인별 hooks 도입

`course-editor-session.tsx`를 추가해 `CourseEditorProvider`가 `workingCopy`, `urlState`, 저장 상태, 편집 명령을 소유한다. 하위 컴포넌트는 props 대신 `useCourseEditorDocument`, `useCourseEditorSelection`, `useCourseEditorCommands`, `useCourseEditorNavigation` 같은 hook으로 필요한 계약만 읽는다.

장점은 중간 컴포넌트의 중계 책임이 사라지고, 편집 세션의 상태와 명령 경계가 한 파일에 모인다는 점이다. 단점은 context 값 설계를 잘못하면 모든 소비자가 자주 다시 렌더링될 수 있다는 점이다. 이 위험은 상태 context와 명령 context를 분리하고, 명령 객체를 안정적으로 유지해 줄일 수 있다.

### 대안 3. 도메인별 컨테이너 컴포넌트 도입

Provider는 얇게 두고 `CurriculumMapContainer`, `LessonWorkspaceContainer`, `StepWorkspaceContainer`가 각각 필요한 상태와 명령을 꺼내 순수 UI 컴포넌트에 전달한다. `CourseEditorShell`은 레이아웃만 맡는다.

장점은 현재 UI 컴포넌트 테스트를 큰 폭으로 유지할 수 있고, props 계약도 leaf에 가까운 곳에 남아 명시성이 높다. 단점은 컨테이너 파일이 늘어나며, Provider와 컨테이너의 역할을 중복되게 설계하면 오히려 복잡해진다.

## 권장 접근

권장은 대안 2와 대안 3의 절충이다.

편집 세션 Provider를 만들되, 모든 컴포넌트가 직접 context를 읽도록 한 번에 바꾸지 않는다. 먼저 `CourseEditorShell`의 props를 `isReadOnly`와 `children`에 가까운 레이아웃 책임으로 줄이고, `CurriculumMapPanel`, `LessonWorkspacePanel`, `StepWorkspacePanel` 같은 국소 컨테이너가 context에서 필요한 값만 읽어 기존 순수 UI 컴포넌트에 전달하게 한다.

이 접근은 다음 원칙에 맞다.

- 응집성: 편집 상태 변경 규칙은 세션 경계에 모으고, UI 컴포넌트는 표시와 사용자 입력 수집에 집중한다.
- 가독성: 버튼에서 실행되는 명령은 `useCourseEditorCommands()`의 도메인 언어로 추적할 수 있다.
- 직교성: 레이아웃 컴포넌트는 챕터 보관, 스텝 추가 같은 업무 명령을 알 필요가 없다.
- 국소 변경: 기존 `editor-state.ts`의 순수 helper와 테스트 자산을 재사용한다.
- 되돌리기 쉬움: 새 외부 라이브러리 없이 React Context와 hook만 추가한다.

## 제안 구조

```text
course-editor/
  course-editor-session.tsx
  course-editor-shell.tsx
  curriculum-map-panel.tsx
  lesson-workspace-panel.tsx
  step-workspace-panel.tsx
  course-summary-panel.tsx
  curriculum-map.tsx
  lesson-workspace.tsx
  step-workspace.tsx
  editor-state.ts
  editor-url-state.ts
```

`course-editor-session.tsx`의 책임은 다음으로 제한한다.

- 서버에서 받은 `course`, `revision`, `curriculum`을 `workingCopy`로 초기화한다.
- 저장 상태와 상태 메시지를 소유한다.
- URL view, lessonId, stepId 전환을 명령으로 제공한다.
- `editor-state.ts`의 순수 helper를 호출하는 명령을 제공한다.
- 저장 요청과 conflict 메시지 처리를 제공한다.

상태 context와 명령 context는 분리한다.

```ts
type CourseEditorCommands = {
  addChapter(): void
  addLesson(chapterId: string): void
  addStep(lessonId: string, type: AdminEditorStepType): void
  archiveChapter(chapterId: string): void
  archiveLesson(lessonId: string): void
  archiveStep(stepId: string): void
  moveLesson(lessonId: string, targetIndex: number): void
  moveStep(lessonId: string, stepId: string, targetIndex: number): void
  updateChapterTitle(chapterId: string, value: string): void
  updateCourseField(field: "description" | "title", value: string): void
  updateLessonField(
    lessonId: string,
    field: "description" | "title",
    value: string
  ): void
  updateStepContent(stepId: string, key: string, value: unknown): void
}
```

명령 이름은 UI 이벤트 이름보다 도메인 행동을 드러내게 한다. 예를 들어 `onUpdateChapterField`를 그대로 퍼뜨리기보다 `updateChapterTitle`처럼 실제 허용 범위를 표현한다.

## 단계별 적용안

1. `course-editor-session.tsx`를 추가하고 `AdminCourseDetailPage`의 편집 상태, 저장, URL 전환, 명령 생성 로직을 옮긴다.
2. `AdminCourseDetailPage`는 API 생성과 초기 props 전달, 헤더/토스트 배치만 맡게 줄인다.
3. `CourseEditorShell`은 context에서 `workingCopy`, `urlState`, 선택 파생 상태를 읽고 레이아웃과 view 전환만 맡는다.
4. `CurriculumMapPanel`, `LessonWorkspacePanel`, `StepWorkspacePanel`을 추가해 기존 UI 컴포넌트에 필요한 props만 연결한다.
5. `CurriculumMap`, `LessonWorkspace`, `StepWorkspace`는 가능하면 순수 UI 컴포넌트로 유지한다. 이 컴포넌트들의 현재 단위 테스트는 대부분 유지한다.
6. 이후 안정화되면 내부 `ChapterSection`, `SortableLessonButton`, `SortableStepRow`까지 필요한 경우 context 직접 사용으로 더 줄인다. 첫 변경에서는 여기까지 들어가지 않는다.

## 테스트 전략

- `course-editor-session` 단위 테스트를 추가해 명령이 `editor-state.ts` helper를 통해 `workingCopy`를 바꾸는지 검증한다.
- `admin-course-detail-page.test.tsx`는 저장 성공, conflict 메시지, URL 전환, 필드 편집 저장 payload를 유지한다.
- `curriculum-map.test.tsx`와 `lesson-workspace.test.tsx`는 순수 UI 콜백 계약을 유지한다.
- Provider와 패널 연결은 작은 통합 테스트로 추가한다.
- 구현 후 `bun --filter @workspace/admin test`, `bun --filter @workspace/admin typecheck`, `bun --filter @workspace/admin lint`를 실행한다.

## 하지 않을 것

- 전역 상태 라이브러리를 새로 추가하지 않는다.
- `editor-state.ts`의 불변 업데이트 helper를 reducer로 전면 재작성하지 않는다.
- `CurriculumMap`과 `LessonWorkspace`를 한 번에 context 전용 컴포넌트로 바꾸지 않는다.
- props 수를 줄이기 위해 의미 없는 `Record<string, unknown>` 또는 약한 명령 bag을 만들지 않는다.

## 결론

현재 구조는 편집 명령이 UI 트리를 따라 흘러가면서 레이아웃 컴포넌트의 책임을 넓힌다. 가장 안전한 개선은 편집 세션이라는 좁은 Provider 경계를 만들고, 도메인별 패널 컨테이너가 필요한 상태와 명령만 꺼내 기존 순수 UI 컴포넌트에 연결하는 것이다. 이렇게 하면 기능 동작은 유지하면서 `CourseEditorShell`의 책임을 레이아웃과 선택 화면 구성으로 되돌릴 수 있다.
