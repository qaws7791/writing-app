import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminDashboardPage } from "@/features/dashboard/admin-dashboard-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminDashboardDto } from "@workspace/contracts/admin"

const dashboard: AdminDashboardDto = {
  metrics: {
    activeCourses: 5,
    activeLessons: 44,
    activeUsersLast7Days: 8,
    completedLessons: 72,
    signupsLast7Days: 4,
    signupsToday: 1,
    totalUsers: 36,
  },
  recentActivities: [
    {
      currentStreakDays: 5,
      email: "minji@example.com",
      lastActiveDate: "2026-06-14",
      name: "민지",
      userId: "user-1",
    },
  ],
}

describe("AdminDashboardPage", () => {
  it("dashboard API 응답으로 지표 카드와 최근 활동을 렌더링한다", () => {
    render(<AdminDashboardPage dashboardResult={ok(dashboard)} />)

    expect(screen.getByRole("heading", { name: "대시보드" })).toBeVisible()
    const metrics = screen.getByLabelText("주요 지표")
    expect(within(metrics).getByText("총 사용자")).toBeVisible()
    expect(within(metrics).getByText("36")).toBeVisible()
    expect(within(metrics).getByText("최근 7일 활성")).toBeVisible()
    expect(within(metrics).getByText("8")).toBeVisible()
    expect(within(metrics).getByText("누적 완료 레슨")).toBeVisible()
    expect(within(metrics).getByText("72")).toBeVisible()
    expect(within(metrics).getByText("콘텐츠")).toBeVisible()
    expect(within(metrics).getByText("5개 코스 · 44개 레슨")).toBeVisible()

    const activityList = screen.getByRole("list", { name: "최근 활동" })
    expect(within(activityList).getByText("민지")).toBeVisible()
    expect(within(activityList).getByText("minji@example.com")).toBeVisible()
    expect(within(activityList).getByText("5일 연속")).toBeVisible()
  })

  it("API 오류 상태를 한국어로 보여준다", () => {
    render(
      <AdminDashboardPage
        dashboardResult={{
          error: {
            code: "unauthorized",
            message: "관리자 로그인이 필요합니다.",
            status: 401,
          },
          status: "error",
        }}
      />
    )

    expect(screen.getByText("관리자 로그인이 필요합니다.")).toBeVisible()
  })
})

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
