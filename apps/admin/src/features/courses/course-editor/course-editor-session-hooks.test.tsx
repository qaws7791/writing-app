import * as React from "react"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumDetailDto,
} from "@workspace/core/admin"

import { createCourseEditorWorkingCopy } from "@/features/courses/course-editor/editor-state"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { useCourseEditorSaveCommand } from "@/features/courses/course-editor/use-course-editor-save-command"
import { useCourseEditorUrlState } from "@/features/courses/course-editor/use-course-editor-url-state"
import type { AdminApi } from "@/lib/api/admin-api"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
})

describe("useCourseEditorUrlState", () => {
  it("updates local state and browser URL together", () => {
    render(
      <UrlStateHarness
        urlState={{ view: "lesson", lessonId: "lesson-1", stepId: null }}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "스텝 선택" }))

    expect(screen.getByTestId("url-state").textContent).toBe(
      "step:lesson-1:step-1"
    )
    expect(window.location.pathname).toBe("/courses/course-1")
    expect(window.location.search).toBe(
      "?view=step&lessonId=lesson-1&stepId=step-1"
    )
  })

  it("syncs local state when the route state changes externally", () => {
    const { rerender } = render(
      <UrlStateHarness
        urlState={{ view: "lesson", lessonId: "lesson-1", stepId: null }}
      />
    )

    rerender(
      <UrlStateHarness
        urlState={{ view: "preview", lessonId: "lesson-2", stepId: null }}
      />
    )

    expect(screen.getByTestId("url-state").textContent).toBe(
      "preview:lesson-2:none"
    )
  })
})

describe("useCourseEditorSaveCommand", () => {
  it("stores the saved working copy and success status", async () => {
    const adminApi = createAdminApiMock()

    render(<SaveCommandHarness adminApi={adminApi} />)
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("저장되었습니다.")
    })
    expect(screen.getByTestId("revision").textContent).toBe("2")
  })

  it("shows a dedicated conflict status when saving stale data", async () => {
    const adminApi = createAdminApiMock({
      saveCourseEditorDocument: async () => ({
        status: "error",
        error: {
          code: "conflict",
          message: "Conflict",
        },
      }),
    })

    render(<SaveCommandHarness adminApi={adminApi} />)
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 변경을 다시 적용하세요."
      )
    })
    expect(screen.getByTestId("revision").textContent).toBe("1")
  })
})

type UrlStateHarnessProps = {
  urlState: CourseEditorUrlState
}

function UrlStateHarness({ urlState }: UrlStateHarnessProps) {
  const { localUrlState, replaceEditorUrl } = useCourseEditorUrlState({
    courseId: "course-1",
    urlState,
  })

  return (
    <>
      <output data-testid="url-state">
        {localUrlState.view}:{localUrlState.lessonId ?? "none"}:
        {localUrlState.stepId ?? "none"}
      </output>
      <button
        type="button"
        onClick={() => {
          replaceEditorUrl({
            lessonId: "lesson-1",
            stepId: "step-1",
            view: "step",
          })
        }}
      >
        스텝 선택
      </button>
    </>
  )
}

type SaveCommandHarnessProps = {
  adminApi: AdminApi
}

function SaveCommandHarness({ adminApi }: SaveCommandHarnessProps) {
  const [workingCopy, setWorkingCopy] = React.useState(() =>
    createCourseEditorWorkingCopy({
      course: courseFixture,
      revision: 1,
      curriculum: curriculumFixture,
    })
  )
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const { save } = useCourseEditorSaveCommand({
    adminApi,
    replaceWorkingCopy: setWorkingCopy,
    setStatusMessage,
    workingCopy,
  })

  return (
    <>
      <output data-testid="revision">{workingCopy.revision}</output>
      <output data-testid="status">{statusMessage}</output>
      <button type="button" onClick={() => void save()}>
        저장
      </button>
    </>
  )
}

const courseFixture = {
  id: "course-1",
  title: "기초 문장 만들기",
  description: "문장의 뼈대를 세웁니다.",
  sortOrder: 1,
} satisfies AdminCourseDetailDto

const curriculumFixture = {
  chapters: [
    {
      id: "chapter-1",
      title: "문장 성분 익히기",
      sortOrder: 1,
      status: "active" as const,
      lessons: [
        {
          id: "course-lesson-1",
          lessonId: "lesson-1",
          title: "목적어 붙이기",
          description: "문장에 대상을 더합니다.",
          sortOrder: 1,
          status: "active" as const,
        },
      ],
    },
  ],
  steps: [
    {
      id: "step-1",
      lessonId: "lesson-1",
      type: "INTRO" as const,
      title: "도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active" as const,
      content: {
        title: "목적어 붙이기",
        category: "문장 성분",
        tagTone: "primary" as const,
        bullets: ["문장에 대상을 더합니다."],
        estimatedMinutes: 5,
        totalSteps: 1,
      },
    },
  ],
} satisfies AdminEditorCurriculumDetailDto

function createAdminApiMock(overrides: Partial<AdminApi> = {}): AdminApi {
  return {
    async getSession() {
      throw new Error("Unexpected getSession call.")
    },
    async getCourseDetail() {
      throw new Error("Unexpected getCourseDetail call.")
    },
    async getCourseEditorDocument() {
      throw new Error("Unexpected getCourseEditorDocument call.")
    },
    async getCourseLessonDetail() {
      throw new Error("Unexpected getCourseLessonDetail call.")
    },
    async listCourses() {
      throw new Error("Unexpected listCourses call.")
    },
    async listCourseTree() {
      throw new Error("Unexpected listCourseTree call.")
    },
    async listUsers() {
      throw new Error("Unexpected listUsers call.")
    },
    async saveCourseEditorDocument() {
      return {
        status: "ok",
        value: {
          course: courseFixture,
          revision: 2,
          curriculum: curriculumFixture,
        },
      }
    },
    ...overrides,
  }
}
