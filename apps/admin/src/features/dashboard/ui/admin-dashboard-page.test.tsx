import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminDashboardPage } from "@/features/dashboard/ui/admin-dashboard-page"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminDashboard } from "@/features/dashboard/model/admin-dashboard"

const dashboard: AdminDashboard = {
  activeWindow: {
    from: "2026-07-18",
    to: "2026-07-24",
  },
  asOfDate: "2026-07-24",
  metrics: {
    activeUsersLast7Days: 8,
    activationRate: {
      denominator: 36,
      numerator: 12,
      percentage: 33.3,
      status: "available",
    },
    completedLessons: 72,
    d7ReturnRate: {
      denominator: 10,
      matureCohortThrough: "2026-07-16",
      numerator: 4,
      percentage: 40,
      status: "available",
    },
    firstLessonStarts: 12,
    totalUsers: 36,
  },
}

describe("AdminDashboardPage", () => {
  it("canonical 순서로 여섯 운영 지표와 집계 근거를 렌더링한다", () => {
    render(<AdminDashboardPage dashboardResult={ok(dashboard)} />)

    expect(screen.getByRole("heading", { name: "대시보드" })).toBeVisible()
    expect(
      screen.getByText(
        "2026-07-24 기준 · 첫 시작과 7일 재방문을 포함한 핵심 운영 지표입니다."
      )
    ).toBeVisible()
    const cards = within(screen.getByLabelText("주요 지표")).getAllByRole(
      "article"
    )
    expect(cards).toHaveLength(6)
    expect(cards.map((card) => card.textContent)).toEqual([
      expect.stringContaining("총 사용자36"),
      expect.stringContaining("최근 7일 활성8"),
      expect.stringContaining("첫 레슨 시작12"),
      expect.stringContaining("활성화율33.3%"),
      expect.stringContaining("7일 내 재방문40%"),
      expect.stringContaining("완료 레슨72"),
    ])
    expect(cards[3]).toHaveTextContent("12 / 36명 첫 시작")
    expect(cards[4]).toHaveTextContent("4 / 10명 · 2026-07-16까지")
    expect(screen.queryByText("최근 활동")).not.toBeInTheDocument()
  })

  it("빈 비율과 아직 성숙하지 않은 D7 cohort를 0%와 구분한다", () => {
    render(
      <AdminDashboardPage
        dashboardResult={ok({
          ...dashboard,
          metrics: {
            ...dashboard.metrics,
            activationRate: {
              denominator: 0,
              numerator: 0,
              percentage: null,
              status: "empty",
            },
            d7ReturnRate: {
              denominator: 0,
              matureCohortThrough: "2026-07-16",
              numerator: 0,
              percentage: null,
              status: "immature",
            },
          },
        })}
      />
    )

    expect(screen.getByText("표본 없음")).toBeVisible()
    expect(screen.getByText("집계 중")).toBeVisible()
    expect(screen.queryByText("0%")).not.toBeInTheDocument()
  })

  it("API 오류 상태를 한국어 alert로 보여준다", () => {
    render(
      <AdminDashboardPage
        dashboardResult={{
          error: {
            code: "unauthorized",
            kind: "http",
            message: "관리자 로그인이 필요합니다.",
            requestId: "dashboard-request",
            retryAfterSeconds: null,
            status: 401,
          },
          status: "error",
        }}
      />
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "관리자 로그인이 필요합니다."
    )
  })
})

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
