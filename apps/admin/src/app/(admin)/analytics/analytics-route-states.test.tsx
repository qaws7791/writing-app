import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import AdminAnalyticsError from "@/app/(admin)/analytics/error"
import AdminAnalyticsLoading from "@/app/(admin)/analytics/loading"

describe("분석 route 상태", () => {
  it("한국어 로딩 상태를 제공한다", () => {
    render(<AdminAnalyticsLoading />)

    expect(
      screen.getByRole("status", { name: "분석 화면을 불러오는 중" })
    ).toBeInTheDocument()
  })

  it("화면 오류를 격리하고 다시 시도할 수 있다", () => {
    const reset = vi.fn()
    render(
      <AdminAnalyticsError error={new Error("chart failed")} reset={reset} />
    )

    expect(
      screen.getByRole("alert", {
        name: "분석 화면을 불러오지 못했습니다.",
      })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
    expect(reset).toHaveBeenCalledOnce()
  })
})
