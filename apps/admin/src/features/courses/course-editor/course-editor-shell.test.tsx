import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import "@/test/ui-overlay-mocks"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import { CourseEditorProvider } from "@/features/courses/course-editor/course-editor-session"
import type { AdminApi } from "@/lib/api/admin-api"

type ButtonProps = React.ComponentProps<"button">

vi.mock("@workspace/ui/components/ui/button", async () => {
  const ReactModule = await import("react")

  return {
    Button: ({ children, ...props }: ButtonProps) =>
      ReactModule.createElement("button", props, children),
    buttonVariants: () => "",
  }
})

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

    expect(screen.getByRole("heading", { name: "커리큘럼" })).toBeTruthy()
    expect(screen.getByDisplayValue("기초 문장 만들기")).toBeTruthy()
    expect(screen.getByDisplayValue("목적어 붙이기")).toBeTruthy()
  })
})

const courseFixture = {
  id: "sentence-structure",
  title: "기초 문장 만들기",
  description: "문장의 뼈대를 세웁니다.",
  sortOrder: 1,
}

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
      content: {},
    },
  ],
}

function createAdminApiMock(overrides: Partial<AdminApi> = {}): AdminApi {
  return {
    async getSession() {
      return {
        status: "ok",
        value: {
          session: { id: "session-1" },
          user: {
            email: "admin@example.com",
            id: "admin-1",
            image: null,
            name: "운영자",
          },
        },
      }
    },
    async getCourseDetail() {
      return { status: "ok", value: courseFixture }
    },
    async getCourseEditorDocument() {
      return {
        status: "ok",
        value: {
          course: courseFixture,
          revision: 0,
          curriculum: curriculumFixture,
        },
      }
    },
    async getCourseLessonDetail() {
      return {
        status: "ok",
        value: {
          id: "lesson-1",
          courseId: "sentence-structure",
          title: "목적어 붙이기",
          categoryId: "grammar",
          unitNumber: 1,
          nextLessonId: null,
          steps: curriculumFixture.steps,
        },
      }
    },
    async listCourses() {
      return {
        status: "ok",
        value: {
          courses: [courseFixture],
          pagination: {
            page: 1,
            pageSize: 10,
            totalCount: 1,
            totalPages: 1,
          },
          query: "",
        },
      }
    },
    async listCourseTree() {
      return {
        status: "ok",
        value: {
          courses: [
            {
              ...courseFixture,
              chapters: curriculumFixture.chapters,
            },
          ],
        },
      }
    },
    async listUsers() {
      return {
        status: "ok",
        value: {
          users: [],
        },
      }
    },
    async saveCourseEditorDocument() {
      return {
        status: "ok",
        value: {
          course: courseFixture,
          revision: 1,
          curriculum: curriculumFixture,
        },
      }
    },
    ...overrides,
  }
}
