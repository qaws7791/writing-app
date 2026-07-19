import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { AdminAnalyticsPage } from "@/features/analytics/ui/admin-analytics-page"
import { networkAdminApiError } from "@/shared/http/admin-api-error"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/entities/admin-analytics/model/admin-analytics"
import { createHttpNetworkError } from "@workspace/http-client"

const analytics: AdminAnalytics = {
  dailySeries: [
    {
      completions: 2,
      date: "2026-06-13",
      signups: 1,
    },
    {
      completions: 5,
      date: "2026-06-14",
      signups: 3,
    },
  ],
  streakBuckets: [
    {
      count: 4,
      label: "1-3일",
    },
  ],
  worstLessons: [],
}

const lessonAnalytics: AdminLessonAnalyticsPage = {
  items: [
    {
      completed: 7,
      completionRate: 70,
      courseId: "c1",
      courseTitle: "글쓰기 첫걸음 30일",
      dropOffRate: 30,
      lessonId: "l1",
      lessonTitle: "문장 시작하기",
      started: 10,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("AdminAnalyticsPage", () => {
  it("Kwep 기준 차트와 레슨별 완료율 목록을 렌더링한다", () => {
    render(
      <AdminAnalyticsPage
        analyticsResult={ok(analytics)}
        lessonAnalyticsResult={ok(lessonAnalytics)}
      />
    )

    expect(screen.getByRole("heading", { name: "분석" })).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "최근 30일 가입 추이" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "일별 레슨 완료" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "스트릭 유지 분포" })
    ).toBeVisible()
    expect(
      screen.getByRole("table", { name: "일별 레슨 완료 데이터" })
    ).toHaveTextContent("2026-06-14")
    expect(screen.getByText("기간 합계 레슨 완료 7건")).toBeVisible()
    expect(
      screen.getByRole("table", { name: "스트릭 유지 분포 데이터" })
    ).toHaveTextContent("1-3일")
    expect(screen.getByRole("heading", { name: "레슨별 완료율" })).toBeVisible()
    expect(
      screen.getByRole("textbox", { name: "레슨 또는 강의 검색" })
    ).toBeVisible()
    const lessonTable = screen.getByRole("table", {
      name: "레슨별 완료율과 이탈률",
    })
    expect(lessonTable).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "레슨" })).toHaveAttribute(
      "aria-sort",
      "none"
    )
    expect(
      screen.getByRole("columnheader", { name: "완료율" })
    ).toHaveAttribute("aria-sort", "ascending")
    expect(
      screen.getByRole("rowheader", { name: "문장 시작하기" })
    ).toBeVisible()
    expect(screen.getByText("70%")).toBeVisible()
    expect(screen.getByText("30%")).toBeVisible()
  })

  it("페이지 이동 버튼에 이름과 비활성 상태를 제공한다", async () => {
    const user = userEvent.setup()
    const firstItem = lessonAnalytics.items[0]
    if (firstItem === undefined) {
      throw new Error("레슨 분석 테스트 fixture가 비어 있습니다.")
    }
    const items = Array.from({ length: 11 }, (_, index) => ({
      ...firstItem,
      lessonId: `lesson-${index}`,
      lessonTitle: `문장 ${index + 1}`,
    }))

    render(
      <AdminAnalyticsPage
        analyticsResult={ok(analytics)}
        lessonAnalyticsResult={ok({ ...lessonAnalytics, items })}
      />
    )

    const previous = screen.getByRole("button", { name: "이전 페이지" })
    const next = screen.getByRole("button", { name: "다음 페이지" })
    expect(previous).toBeDisabled()
    expect(next).toBeEnabled()

    await user.click(next)

    expect(previous).toBeEnabled()
    expect(next).toBeDisabled()
  })

  it("API 오류 상태를 보여준다", () => {
    render(
      <AdminAnalyticsPage
        analyticsResult={{
          error: networkError(),
          status: "error",
        }}
        lessonAnalyticsResult={ok(lessonAnalytics)}
      />
    )

    expect(screen.getByText("네트워크 연결을 확인해 주세요.")).toBeVisible()
  })
})

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

function networkError() {
  return networkAdminApiError(
    createHttpNetworkError(
      new Request("https://api.example.test/api/admin/test"),
      new TypeError("test network failure")
    )
  )
}
