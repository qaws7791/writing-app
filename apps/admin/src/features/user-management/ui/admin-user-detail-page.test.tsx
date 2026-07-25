import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminUserDetailPage } from "@/features/user-management/ui/admin-user-detail-page"

describe("AdminUserDetailPage", () => {
  it("API 오류를 보여준다", () => {
    render(
      <AdminUserDetailPage
        userResult={{
          error: {
            code: "not-found",
            kind: "http",
            message: "요청한 항목을 찾을 수 없습니다.",
            requestId: "user-detail-request",
            retryAfterSeconds: null,
            status: 404,
          },
          status: "error",
        }}
      />
    )

    expect(screen.getByText("요청한 항목을 찾을 수 없습니다.")).toBeVisible()
  })
})
