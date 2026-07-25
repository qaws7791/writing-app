import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminAnalyticsPage } from "@/features/analytics/ui/admin-analytics-page"
import type {
  AdminRequestError,
  AdminRequestResult,
} from "@/shared/http/admin-api-client"
import type { AdminAnalyticsFilters } from "@/features/analytics/model/admin-analytics-filters"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/entities/admin-analytics/model/admin-analytics"
import {
  courseIdSchema,
  lessonIdSchema,
} from "@workspace/contracts/content/ids"

const filters: AdminAnalyticsFilters = {
  direction: "asc",
  page: 1,
  pageSize: 10,
  query: "문장",
  sort: "completionRate",
}

const analytics: AdminAnalytics = {
  dailySeries: [
    {
      completions: 2,
      date: "2026-06-13",
      returns: 1,
      returnStatus: "available",
      signups: 1,
      starts: 1,
    },
    {
      completions: 5,
      date: "2026-06-14",
      returns: null,
      returnStatus: "immature",
      signups: 3,
      starts: 2,
    },
  ],
  from: "2026-06-13",
  matureCohortThrough: "2026-06-06",
  to: "2026-06-14",
  worstAiFeedbackLessons: [
    {
      courseId: courseIdSchema.parse("c1"),
      courseTitle: "글쓰기 첫걸음 30일",
      failureCount: 2,
      failureRate: 66.7,
      lessonId: lessonIdSchema.parse("l1"),
      lessonTitle: "문장 시작하기",
      requestCount: 3,
    },
  ],
  worstLessons: [
    {
      completed: 7,
      completionRate: 70,
      courseId: courseIdSchema.parse("c1"),
      courseTitle: "글쓰기 첫걸음 30일",
      dropOffRate: 30,
      lessonId: lessonIdSchema.parse("l1"),
      lessonTitle: "문장 시작하기",
      started: 10,
    },
  ],
}

const lessonAnalytics: AdminLessonAnalyticsPage = {
  items: analytics.worstLessons,
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 21,
    totalPages: 3,
  },
}

describe("AdminAnalyticsPage", () => {
  it("서버 검색·정렬·페이지 상태를 URL 링크와 form에 보존한다", () => {
    renderPage()

    expect(
      screen.getByRole("textbox", { name: "레슨 또는 강의 검색" })
    ).toHaveValue("문장")
    expect(screen.getByRole("combobox", { name: "페이지당 행" })).toHaveValue(
      "10"
    )
    expect(
      screen.getByRole("columnheader", { name: "완료율 내림차순 정렬" })
    ).toHaveAttribute("aria-sort", "ascending")
    expect(
      screen.getByRole("link", { name: "완료율 내림차순 정렬" })
    ).toHaveAttribute(
      "href",
      "?direction=desc&page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5&sort=completionRate"
    )
    expect(screen.getByRole("link", { name: "이전 페이지" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(screen.getByRole("link", { name: "다음 페이지" })).toHaveAttribute(
      "href",
      "?direction=asc&page=2&pageSize=10&query=%EB%AC%B8%EC%9E%A5&sort=completionRate"
    )
    expect(
      screen.getByRole("table", { name: "레슨별 성과" })
    ).toHaveTextContent("문장 시작하기")
  })

  it("요약과 레슨 목록 오류를 한국어 alert로 구분한다", () => {
    const { rerender } = render(
      <AdminAnalyticsPage
        analyticsResult={{
          error: networkError(),
          status: "error",
        }}
        filters={filters}
        lessonAnalyticsResult={ok(lessonAnalytics)}
      />
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "네트워크 연결을 확인해 주세요."
    )

    rerender(
      <AdminAnalyticsPage
        analyticsResult={ok(analytics)}
        filters={filters}
        lessonAnalyticsResult={{
          error: networkError(),
          status: "error",
        }}
      />
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "네트워크 연결을 확인해 주세요."
    )
    expect(screen.getByRole("heading", { name: "레슨별 성과" })).toBeVisible()
  })
})

function renderPage() {
  return render(
    <AdminAnalyticsPage
      analyticsResult={ok(analytics)}
      filters={filters}
      lessonAnalyticsResult={ok(lessonAnalytics)}
    />
  )
}

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

function networkError() {
  return {
    code: "NETWORK_ERROR",
    kind: "network",
    message: "네트워크 연결을 확인해 주세요.",
    requestId: "client",
    retryAfterSeconds: null,
    status: null,
  } satisfies AdminRequestError
}
