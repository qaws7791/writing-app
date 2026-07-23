import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminCourseDetailPage } from "@/features/course-editor/ui/admin-course-detail-page"

describe("AdminCourseDetailPage", () => {
  it("API 오류를 코스 편집 화면에서 보여준다", () => {
    render(
      <AdminCourseDetailPage
        courseResult={{
          error: {
            code: "not-found",
            message: "요청한 항목을 찾을 수 없습니다.",
            status: 404,
          },
          status: "error",
        }}
        publishCourse={async () => ({
          error: { code: "not-found", message: "없음" },
          status: "error",
        })}
        saveCourse={async () => ({
          error: { code: "not-found", message: "없음" },
          status: "error",
        })}
      />
    )

    expect(screen.getByText("요청한 항목을 찾을 수 없습니다.")).toBeVisible()
  })
})
