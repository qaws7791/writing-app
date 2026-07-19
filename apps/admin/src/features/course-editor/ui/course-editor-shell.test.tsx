import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"
import { readAdminApiBaseUrl } from "@/shared/config/admin-runtime-config"

const { getCourseEditorMock } = vi.hoisted(() => ({
  getCourseEditorMock: vi.fn(),
}))

vi.mock(
  "@/features/course-editor/api/create-browser-course-editor-api",
  () => ({
    createBrowserCourseEditorApi: () => ({
      getCourseEditor: getCourseEditorMock,
    }),
  })
)

const course: AdminCourseDetail = adminCourseEditorSchema.parse({
  category: "입문자를 위한 코스",
  curriculumVersionId: "c1-v3",
  description: "글쓰기 입문 과정",
  editVersion: 2,
  id: "c1",
  revision: 3,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "기초",
          description: "문장을 시작합니다.",
          estimatedMinutes: 7,
          id: "l1",
          sortOrder: 1,
          status: "active",
          summary: ["좋은 문장은 모호하지 않다"],
          steps: [],
          title: "첫 레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "1주차",
    },
  ],
})

describe("CourseEditorShell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCourseEditorMock.mockResolvedValue({ status: "ok", value: course })
  })

  it("Kwep 기준 코스 제목, 강의 정보 탭, 커리큘럼 탭을 렌더링한다", async () => {
    const user = userEvent.setup()

    render(
      <CourseEditorShell
        apiBaseUrl={readAdminApiBaseUrl({})}
        course={course}
        publishCourse={async () => ({
          status: "ok",
          value: {
            curriculumVersionId: course.curriculumVersionId,
            publishedAt: "2026-07-17T00:00:00.000Z",
            revision: course.revision,
          },
        })}
        saveCourse={async (draft) => ({
          status: "ok",
          value: { ...draft, editVersion: draft.editVersion + 1 },
        })}
      />
    )

    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeVisible()
    expect(screen.getByRole("link", { name: "콘텐츠 관리" })).toBeVisible()
    expect(screen.getByRole("button", { name: "강의 정보" })).toBeVisible()
    expect(screen.getByRole("button", { name: "커리큘럼" })).toBeVisible()
    expect(screen.getByRole("button", { name: "초안 발행" })).toBeVisible()
    expect(screen.getByLabelText("제목")).toHaveValue("글쓰기 첫걸음 30일")

    await user.click(screen.getByRole("button", { name: "커리큘럼" }))

    expect(screen.getByText("유닛 1개 · 레슨 1개")).toBeVisible()
    expect(screen.getByText("UNIT 1")).toBeVisible()
    expect(screen.getByDisplayValue("1주차")).toBeVisible()
    expect(screen.getByDisplayValue("첫 레슨")).toBeVisible()
  })

  it("저장된 draft를 확인 뒤 발행하고 다음 draft를 다시 읽는다", async () => {
    const user = userEvent.setup()
    const nextDraft = {
      ...course,
      curriculumVersionId: "c1-v4",
      editVersion: 0,
      revision: 4,
    }
    const publishCourse = vi.fn(async () => ({
      status: "ok" as const,
      value: {
        curriculumVersionId: course.curriculumVersionId,
        publishedAt: "2026-07-17T00:00:00.000Z",
        revision: course.revision,
      },
    }))
    const loadLatestCourse = vi.fn(async () => ({
      status: "ok" as const,
      value: nextDraft,
    }))
    getCourseEditorMock.mockImplementation(loadLatestCourse)
    vi.spyOn(window, "confirm").mockReturnValue(true)

    render(
      <CourseEditorShell
        apiBaseUrl={readAdminApiBaseUrl({})}
        course={course}
        publishCourse={publishCourse}
        saveCourse={async (draft) => ({ status: "ok", value: draft })}
      />
    )

    await user.click(screen.getByRole("button", { name: "초안 발행" }))

    expect(publishCourse).toHaveBeenCalledWith(course)
    expect(loadLatestCourse).toHaveBeenCalledWith(course.id)
    expect(await screen.findByText("리비전 3을 발행했습니다.")).toBeVisible()
  })
})
