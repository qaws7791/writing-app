import * as React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import "@/test/ui-overlay-mocks"
import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"
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

vi.mock("@/components/admin-header", async () => {
  const ReactModule = await import("react")

  return {
    AdminHeader: ({
      actions,
      description,
      title,
    }: {
      actions?: React.ReactNode
      description?: string
      title: string
    }) =>
      ReactModule.createElement("header", null, [
        ReactModule.createElement("h1", { key: "title" }, title),
        description
          ? ReactModule.createElement("p", { key: "description" }, description)
          : null,
        actions
          ? ReactModule.createElement("div", { key: "actions" }, actions)
          : null,
      ]),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
})

describe("AdminCourseDetailPage", () => {
  it("renders the direct curriculum editor shell", () => {
    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock()}
        course={courseFixture}
        revision={0}
        curriculum={curriculumFixture}
        urlState={{
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
      />
    )

    expect(screen.getByText("코스 편집")).toBeTruthy()
    expect(
      screen.getByText("현재 공개 커리큘럼을 직접 편집합니다.")
    ).toBeTruthy()
    expect(screen.getByDisplayValue("기초 문장 만들기")).toBeTruthy()
    expect(screen.getByRole("button", { name: "저장" })).toBeTruthy()
  })

  it("saves edited course and lesson fields through the admin API", async () => {
    const user = userEvent.setup()
    const saveCourseEditorDocument = vi.fn<
      AdminApi["saveCourseEditorDocument"]
    >(async (input) => ({
      status: "ok",
      value: {
        course: {
          id: input.courseId,
          title: input.course.title,
          description: input.course.description,
          sortOrder: input.course.sortOrder,
        },
        revision: input.expectedRevision + 1,
        curriculum: {
          chapters: input.chapters.map((chapter) => ({
            ...chapter,
            lessons: input.lessons
              .filter((lesson) => lesson.chapterId === chapter.id)
              .map((lesson) => lesson),
          })),
          steps: input.steps,
        },
      },
    }))

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          saveCourseEditorDocument,
        })}
        course={courseFixture}
        revision={0}
        curriculum={curriculumFixture}
        urlState={{
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
      />
    )

    await user.clear(screen.getByLabelText("코스 제목"))
    await user.type(screen.getByLabelText("코스 제목"), "수정 코스")
    await user.clear(screen.getByLabelText("레슨 제목"))
    await user.type(screen.getByLabelText("레슨 제목"), "수정 레슨")
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(saveCourseEditorDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "sentence-structure",
        expectedRevision: 0,
        course: expect.objectContaining({
          title: "수정 코스",
        }),
        lessons: [
          expect.objectContaining({
            lessonId: "sentence-structure-01",
            title: "수정 레슨",
          }),
        ],
        steps: [
          expect.objectContaining({
            id: "sentence-structure-step-1",
            content: expect.objectContaining({
              bullets: ["원본 목표"],
            }),
          }),
        ],
      })
    )
    await waitFor(() => {
      expect(screen.getByText("저장되었습니다.")).toBeTruthy()
    })
  })

  it("shows a conflict message when another admin saved first", async () => {
    const user = userEvent.setup()

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          async saveCourseEditorDocument() {
            return {
              status: "error",
              error: {
                code: "conflict",
                message: "다른 관리자가 먼저 저장했습니다.",
              },
              httpStatus: 409,
            }
          },
        })}
        course={courseFixture}
        revision={0}
        curriculum={curriculumFixture}
        urlState={{
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
      />
    )

    await user.clear(screen.getByLabelText("코스 제목"))
    await user.type(screen.getByLabelText("코스 제목"), "충돌 코스")
    await user.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => {
      expect(
        screen.getByText(
          "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 변경을 다시 적용하세요."
        )
      ).toBeTruthy()
    })
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
      id: "sentence-structure-chapter-1",
      title: "문장의 뼈대",
      sortOrder: 1,
      status: "active" as const,
      lessons: [
        {
          id: "sentence-structure-course-lesson-1",
          lessonId: "sentence-structure-01",
          title: "주어와 서술어 찾기",
          description: "중심 성분을 구분합니다.",
          sortOrder: 1,
          status: "active" as const,
        },
      ],
    },
  ],
  steps: [
    {
      id: "sentence-structure-step-1",
      lessonId: "sentence-structure-01",
      type: "INTRO" as const,
      title: "도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active" as const,
      content: {
        bullets: ["원본 목표"],
      },
    },
  ],
}

function createAdminApiMock(overrides: Partial<AdminApi> = {}): AdminApi {
  return {
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
          id: "sentence-structure-01",
          courseId: "sentence-structure",
          title: "주어와 서술어 찾기",
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
