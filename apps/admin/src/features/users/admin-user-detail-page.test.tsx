import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminUserDetailPage } from "@/features/users/admin-user-detail-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminUserDetail } from "@/lib/api/admin-api"

describe("AdminUserDetailPage", () => {
  it("사용자 상세 통계를 렌더링한다", () => {
    render(<AdminUserDetailPage userResult={ok(userDetail)} />)

    expect(screen.getByRole("heading", { name: "사용자 상세" })).toBeVisible()
    expect(screen.getByText("민지")).toBeVisible()
    expect(screen.getByText("minji@example.com")).toBeVisible()
    expect(screen.getByText("12 / 44")).toBeVisible()
    expect(screen.getByText("35%")).toBeVisible()
    expect(screen.getByText("5일 연속")).toBeVisible()
  })

  it("API 오류를 보여준다", () => {
    render(
      <AdminUserDetailPage
        userResult={{
          error: {
            code: "not-found",
            message: "요청한 항목을 찾을 수 없습니다.",
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
  id: "user-1",
  joined: "2026-06-01",
  lastActive: "2026-06-14",
  lessonsDone: 12,
  name: "민지",
  progressPercent: 35,
  status: "active",
  streak: 5,
  totalLessons: 44,
}

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
