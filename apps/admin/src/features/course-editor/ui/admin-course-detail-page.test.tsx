import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AdminCourseDetailPage } from "@/features/course-editor/ui/admin-course-detail-page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe("AdminCourseDetailPage", () => {
  it("API 오류를 코스 편집 화면에서 보여준다", () => {
    render(
      <AdminCourseDetailPage
        courseResult={{
          error: {
            code: "not-found",
            kind: "http",
            message: "요청한 항목을 찾을 수 없습니다.",
            requestId: "course-detail-request",
            retryAfterSeconds: null,
            status: 404,
          },
          status: "error",
        }}
        publishCourse={async () => ({
          error: {
            code: "not-found",
            kind: "http",
            message: "없음",
            requestId: "publish-course-request",
            retryAfterSeconds: null,
            status: 404,
          },
          status: "error",
        })}
        saveCourse={async () => ({
          error: {
            code: "not-found",
            kind: "http",
            message: "없음",
            requestId: "save-course-request",
            retryAfterSeconds: null,
            status: 404,
          },
          status: "error",
        })}
        uploadAdminContentAsset={vi.fn()}
      />
    )

    expect(screen.getByText("요청한 항목을 찾을 수 없습니다.")).toBeVisible()
  })
})
