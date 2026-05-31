# 어드민 에디터 Prop Drilling 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `CourseEditorShell`이 편집 명령 콜백을 대량으로 중계하지 않도록 편집 세션 Provider와 도메인별 패널 경계를 도입한다.

**Architecture:** `AdminCourseDetailPage`는 초기 데이터와 API 경계만 Provider에 넘긴다. `CourseEditorProvider`는 `workingCopy`, 저장 상태, URL 상태, 편집 명령을 소유하고, `CourseEditorShell`은 context 기반 패널을 배치하는 레이아웃 컴포넌트로 축소한다.

**Tech Stack:** Next.js client component, React Context, TypeScript, Vitest, Testing Library, existing `editor-state.ts` pure helpers.

---

## 파일 구조

- Create: `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`
  - 편집 상태, 저장, URL 전환, 편집 명령 context를 제공한다.
- Create: `apps/admin/src/features/courses/course-editor/course-editor-panel.tsx`
  - context에서 필요한 값만 읽어 기존 순수 UI 컴포넌트에 연결한다.
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
  - 상태 변경 콜백 생성 책임을 Provider로 옮긴다.
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
  - 15개 콜백 props를 제거하고 레이아웃과 view 전환만 맡는다.
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`
  - 기존 저장/충돌 테스트가 새 Provider 구조에서도 통과하도록 유지한다.
- Create or Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.test.tsx`
  - Shell이 편집 명령 props 없이 Provider 아래에서 렌더링되는지 고정한다.
- Modify: `docs/admin-site.md`
  - 작업 시작/완료 기록을 추가한다.

## Task 1: 문서 시작 로그

- [ ] **Step 1: 시작 로그 추가**

`docs/admin-site.md` 상단에 다음 항목을 추가한다.

```md
## 2026-05-31 어드민 에디터 Prop Drilling 개선 시작

- 조사 문서의 권장안에 따라 편집 세션 Provider와 도메인별 패널 컨테이너를 도입한다.
- `CourseEditorShell`은 레이아웃과 view 전환에 집중하고, 편집 명령 중계 책임을 제거한다.
- 기존 저장, URL 전환, 커리큘럼/레슨/스텝 편집 동작은 유지한다.
```

- [ ] **Step 2: 문서 포맷 확인**

Run: `bunx prettier --check docs/admin-site.md docs/superpowers/plans/2026-05-31-admin-editor-prop-drilling.md`

Expected: exit 0.

## Task 2: Shell 계약 실패 테스트

- [ ] **Step 1: 실패 테스트 작성**

`apps/admin/src/features/courses/course-editor/course-editor-shell.test.tsx`를 만들고 Provider 아래에서 `CourseEditorShell`이 편집 콜백 props 없이 렌더링되는지 테스트한다.

```tsx
import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import "@/test/ui-overlay-mocks"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import { CourseEditorProvider } from "@/features/courses/course-editor/course-editor-session"
import type { AdminApi } from "@/lib/api/admin-api"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
})

describe("CourseEditorShell", () => {
  it("renders editor panels without command callback props", () => {
    render(
      <CourseEditorProvider
        adminApi={createAdminApiMock()}
        course={courseFixture}
        curriculum={curriculumFixture}
        revision={0}
        urlState={{ view: "lesson", lessonId: "lesson-1", stepId: null }}
      >
        <CourseEditorShell />
      </CourseEditorProvider>
    )

    expect(screen.getByText("커리큘럼")).toBeTruthy()
    expect(screen.getByDisplayValue("기초 문장 만들기")).toBeTruthy()
    expect(screen.getByDisplayValue("목적어 붙이기")).toBeTruthy()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `bun --filter @workspace/admin test -- course-editor-shell`

Expected: FAIL because `course-editor-session` does not exist or `CourseEditorShell` still requires old props.

## Task 3: 편집 세션 Provider 구현

- [ ] **Step 1: Provider 파일 추가**

`course-editor-session.tsx`를 추가한다. 상태 context와 명령 context를 분리하고, hook은 Provider 밖에서 호출되면 명시적으로 실패하게 만든다.

- [ ] **Step 2: 명령 구현**

기존 `admin-course-detail-page.tsx`의 `handleAddChapter`, `handleAddLesson`, `handleAddStep`, archive, move, update, save, URL 전환 로직을 Provider 내부로 옮긴다. 상태 업데이트는 계속 `editor-state.ts`의 순수 helper를 호출한다.

- [ ] **Step 3: 테스트 실행**

Run: `bun --filter @workspace/admin test -- course-editor-shell`

Expected: Provider import 오류가 사라지고 다음 미구현 지점에서 실패한다.

## Task 4: 패널 컨테이너 구현

- [ ] **Step 1: 패널 파일 추가**

`course-editor-panel.tsx`에 다음 컴포넌트를 추가한다.

- `CourseSummaryPanelContainer`
- `CurriculumMapPanel`
- `LessonWorkspacePanel`
- `StepWorkspacePanel`
- `LessonPreviewPanel`

각 패널은 context에서 필요한 상태와 명령만 읽고 기존 UI 컴포넌트에 props로 연결한다.

- [ ] **Step 2: Shell 전환**

`CourseEditorShell`에서 편집 콜백 props 타입을 제거한다. Shell은 `useCourseEditorState()`와 패널 컴포넌트만 사용한다.

- [ ] **Step 3: 테스트 실행**

Run: `bun --filter @workspace/admin test -- course-editor-shell`

Expected: PASS.

## Task 5: 상세 페이지 전환

- [ ] **Step 1: Page 단순화**

`AdminCourseDetailPage`에서 `workingCopy`, 저장 상태, URL 상태, 편집 핸들러를 제거하고 다음 구조로 바꾼다.

```tsx
<CourseEditorProvider
  adminApi={api}
  course={course}
  curriculum={curriculum}
  revision={revision}
  urlState={urlState}
>
  <AdminHeader actions={<CourseEditorHeaderContainer />} ... />
  <CourseEditorStatusToast />
  <main className="min-h-0 flex-1">
    <CourseEditorShell />
  </main>
</CourseEditorProvider>
```

- [ ] **Step 2: 기존 통합 테스트 실행**

Run: `bun --filter @workspace/admin test -- admin-course-detail-page`

Expected: 기존 저장 성공과 conflict 테스트가 PASS.

## Task 6: 회귀 검증과 문서 완료 로그

- [ ] **Step 1: 어드민 관련 테스트 실행**

Run: `bun --filter @workspace/admin test -- admin-course-detail-page course-editor-shell curriculum-map lesson-workspace step-workspace`

Expected: PASS.

- [ ] **Step 2: 타입체크 실행**

Run: `bun --filter @workspace/admin typecheck`

Expected: exit 0.

- [ ] **Step 3: 린트 실행**

Run: `bun --filter @workspace/admin lint`

Expected: exit 0.

- [ ] **Step 4: 문서 완료 로그 추가**

`docs/admin-site.md` 상단에 다음 항목을 추가한다.

```md
## 2026-05-31 어드민 에디터 Prop Drilling 개선 완료

- 편집 세션 Provider를 추가해 `workingCopy`, 저장 상태, URL 상태, 편집 명령을 한 경계로 모았다.
- `CourseEditorShell`에서 편집 명령 콜백 props를 제거하고 레이아웃과 view 전환 책임만 남겼다.
- 커리큘럼, 레슨, 스텝 작업대는 도메인별 패널 컨테이너를 통해 기존 순수 UI 컴포넌트와 연결한다.
```

- [ ] **Step 5: 최종 포맷 확인**

Run: `bunx prettier --check docs/admin-site.md docs/admin-editor-prop-drilling-research.md docs/superpowers/plans/2026-05-31-admin-editor-prop-drilling.md`

Expected: exit 0.

## 자체 검토

- 조사 문서의 권장안인 Provider와 도메인별 패널 컨테이너를 구현 범위로 삼았다.
- 새 외부 상태 관리 의존성은 추가하지 않는다.
- 기존 `editor-state.ts` 순수 helper는 유지한다.
- 기존 `CurriculumMap`, `LessonWorkspace`, `StepWorkspace`의 순수 UI 테스트는 가능한 한 유지한다.
- 작업은 `/prototype`을 건드리지 않는다.
