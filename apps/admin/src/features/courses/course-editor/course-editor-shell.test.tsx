import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { adminCourseEditorSchema } from "@/features/courses/admin-courses-api"

import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import type { AdminCourseDetail } from "@/features/courses/admin-courses-api"

const course: AdminCourseDetail = adminCourseEditorSchema.parse({
  category: "입문자를 위한 코스",
  description: "글쓰기 입문 과정",
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
  it("Kwep 기준 코스 제목, 강의 정보 탭, 커리큘럼 탭을 렌더링한다", async () => {
    const user = userEvent.setup()

    render(
      <CourseEditorShell
        course={course}
        loadLatestCourse={async () => ({ status: "ok", value: course })}
        saveCourse={async (draft) => ({
          status: "ok",
          value: { ...draft, revision: draft.revision + 1 },
        })}
      />
    )

    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeVisible()
    expect(screen.getByRole("link", { name: "콘텐츠 관리" })).toBeVisible()
    expect(screen.getByRole("button", { name: "강의 정보" })).toBeVisible()
    expect(screen.getByRole("button", { name: "커리큘럼" })).toBeVisible()
    expect(screen.getByLabelText("제목")).toHaveValue("글쓰기 첫걸음 30일")

    await user.click(screen.getByRole("button", { name: "커리큘럼" }))

    expect(screen.getByText("유닛 1개 · 레슨 1개")).toBeVisible()
    expect(screen.getByText("UNIT 1")).toBeVisible()
    expect(screen.getByDisplayValue("1주차")).toBeVisible()
    expect(screen.getByDisplayValue("첫 레슨")).toBeVisible()
  })
})
