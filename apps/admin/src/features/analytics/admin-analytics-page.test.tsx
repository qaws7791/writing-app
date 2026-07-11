import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminAnalyticsPage } from "@/features/analytics/admin-analytics-page"
import { networkAdminApiError } from "@/lib/api/api-error"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/lib/api/admin-api"
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
    expect(screen.getByText("문장 시작하기")).toBeVisible()
    expect(screen.getByText("70%")).toBeVisible()
    expect(screen.getByText("30%")).toBeVisible()
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
      new Request("https://admin-api.example.test/test"),
      new TypeError("test network failure")
    )
  )
}
