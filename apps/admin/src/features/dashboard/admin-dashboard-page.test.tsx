import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminDashboardPage } from "@/features/dashboard/admin-dashboard-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminAnalytics } from "@/features/analytics/admin-analytics-api"
import type { AdminDashboard } from "@/features/dashboard/admin-dashboard-api"

const dashboard: AdminDashboard = {
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

const analytics: AdminAnalytics = {
  dailySeries: [
    { completions: 2, date: "2026-06-01", signups: 1 },
    { completions: 4, date: "2026-06-02", signups: 0 },
  ],
  streakBuckets: [{ count: 3, label: "0일" }],
  worstLessons: [],
}

describe("AdminDashboardPage", () => {
  it("dashboard API 응답으로 Kwep 기준 지표 카드와 최근 활동을 렌더링한다", () => {
    render(
      <AdminDashboardPage
        analyticsResult={ok(analytics)}
        dashboardResult={ok(dashboard)}
      />
    )

    expect(screen.getByRole("heading", { name: "대시보드" })).toBeVisible()
    const metrics = screen.getByLabelText("주요 지표")
    expect(within(metrics).getByText("총 사용자")).toBeVisible()
    expect(within(metrics).getByText("36")).toBeVisible()
    expect(within(metrics).getByText("활성 8명 (최근 7일)")).toBeVisible()
    expect(within(metrics).getByText("신규 가입")).toBeVisible()
    expect(within(metrics).getByText("+4")).toBeVisible()
    expect(within(metrics).getByText("오늘 1명")).toBeVisible()
    expect(within(metrics).getByText("총 레슨 완료")).toBeVisible()
    expect(within(metrics).getByText("72")).toBeVisible()
    expect(within(metrics).getByText("누적 완료 수")).toBeVisible()
    expect(within(metrics).getByText("콘텐츠")).toBeVisible()
    expect(within(metrics).getByText("44")).toBeVisible()
    expect(within(metrics).getByText("5개 강의의 레슨")).toBeVisible()
    expect(screen.getByRole("heading", { name: "최근 활동" })).toBeVisible()
    expect(screen.getByRole("link", { name: /민지/ })).toBeVisible()
    expect(
      screen.getByRole("table", { name: "최근 30일 가입 추이 데이터" })
    ).toHaveTextContent("2026-06-01")
    expect(screen.getByText("기간 합계 가입 1건")).toBeVisible()
    expect(
      screen.getByRole("table", { name: "스트릭 유지 분포 데이터" })
    ).toHaveTextContent("0일")
  })

  it("API 오류 상태를 한국어로 보여준다", () => {
    render(
      <AdminDashboardPage
        analyticsResult={ok(analytics)}
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
