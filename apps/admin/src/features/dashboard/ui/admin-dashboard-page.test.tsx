// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
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
  },
}

describe("AdminDashboardPage", () => {
  it("운영 판단에 쓰이는 세 지표만 카드로 표시한다", () => {
    render(<AdminDashboardPage dashboardResult={ok(dashboard)} />)

    expect(readMetricCard("활성화율")).toHaveTextContent("33.3%")
    expect(readMetricCard("7일 내 재방문")).toHaveTextContent("40%")
    expect(readMetricCard("최근 7일 활성")).toHaveTextContent("8")
    expect(
      screen.queryByRole("article", { name: "총 사용자" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("article", { name: "완료 레슨" })
    ).not.toBeInTheDocument()
  })

  it("비율 지표는 분자·분모와 cohort 성숙 기준일을 집계 근거로 함께 보여준다", () => {
    render(<AdminDashboardPage dashboardResult={ok(dashboard)} />)

    expect(readMetricCard("활성화율")).toHaveTextContent("12 / 36명 첫 시작")
    expect(readMetricCard("7일 내 재방문")).toHaveTextContent(
      "4 / 10명 · 2026-07-16까지"
    )
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

    expect(readMetricCard("활성화율")).toHaveTextContent("표본 없음")
    expect(readMetricCard("7일 내 재방문")).toHaveTextContent("집계 중")
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

function readMetricCard(name: string): HTMLElement {
  return screen.getByRole("article", { name })
}

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
