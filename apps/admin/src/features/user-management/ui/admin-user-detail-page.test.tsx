import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminUserDetailPage } from "@/features/user-management/ui/admin-user-detail-page"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminUserDetail } from "@/entities/learner-account/model/admin-learner-account"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"

describe("AdminUserDetailPage", () => {
  it("사용자 상세 통계를 렌더링한다", () => {
    render(<AdminUserDetailPage userResult={ok(userDetail)} />)

    expect(screen.getByRole("heading", { name: "민지" })).toBeVisible()
    expect(screen.getByText("minji@example.com")).toBeVisible()
    expect(screen.getByText("12 / 44 레슨 완료")).toBeVisible()
    expect(screen.getByText("35%")).toBeVisible()
    expect(screen.getByText("5일")).toBeVisible()
  })

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

const userDetail: AdminUserDetail = {
  email: "minji@example.com",
  id: userIdSchema.parse("user-1"),
  joined: "2026-06-01",
  lastActive: "2026-06-14",
  lessonsDone: 12,
  name: "민지",
  progressPercent: 35,
  status: "active",
  streak: 5,
  totalLessons: 44,
}

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
