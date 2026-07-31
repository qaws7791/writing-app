// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminAnalyticsPage } from "@/features/analytics/ui/admin-analytics-page"
import type {
  AdminRequestError,
  AdminRequestResult,
} from "@/shared/http/admin-api-client"
import type { AdminAnalyticsFilters } from "@/features/analytics/model/admin-analytics-filters"
import type {
  AdminAiFeedbackQuality,
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

const aiFeedbackQuality: AdminAiFeedbackQuality = {
  failureCount: 3,
  failureCounts: [
    { code: "provider-timeout", count: 2 },
    { code: "pending-expired", count: 1 },
  ],
  from: "2026-05-15T00:00:00.000Z",
  latency: { averageMs: 1234.6, sampleCount: 9, totalMs: 11111 },
  requestCount: 12,
  retryCount: 4,
  status: "available",
  successCount: 9,
  successRate: 0.75,
  to: "2026-06-14T00:00:00.000Z",
  tokens: { input: 5000, output: 2500, sampleCount: 9 },
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

  it("요약 조회가 실패하면 레슨 목록까지 열지 않고 요약 오류만 보여준다", () => {
    render(
      <AdminAnalyticsPage
        aiFeedbackQualityResult={ok(aiFeedbackQuality)}
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
    expect(
      screen.queryByRole("table", { name: "레슨별 성과" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "레슨별 성과" })
    ).not.toBeInTheDocument()
  })

  it("레슨 목록 조회만 실패하면 요약은 유지하고 레슨별 성과에만 오류를 보여준다", () => {
    render(
      <AdminAnalyticsPage
        aiFeedbackQualityResult={ok(aiFeedbackQuality)}
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
    expect(
      screen.getByRole("table", {
        name: "일별 가입, 첫 시작, 완료와 D7 재방문",
      })
    ).toBeVisible()
    expect(screen.getByRole("heading", { name: "레슨별 성과" })).toBeVisible()
    expect(
      screen.queryByRole("table", { name: "레슨별 성과" })
    ).not.toBeInTheDocument()
  })

  it("AI 품질 집계를 원문 없이 요청·실패·지연·token으로 보여준다", () => {
    renderPage()

    const quality = within(
      screen.getByRole("region", { name: "AI 코칭 서비스 품질" })
    )

    expect(quality.getByText("12건")).toBeVisible()
    expect(quality.getByText("75%")).toBeVisible()
    expect(quality.getByText("1,235ms")).toBeVisible()
    expect(quality.getByText("제공자 timeout")).toBeVisible()
    expect(quality.getByText("5,000")).toBeVisible()
  })

  it("AI 품질 조회만 실패하면 다른 영역을 유지하고 해당 영역에만 오류를 보여준다", () => {
    render(
      <AdminAnalyticsPage
        aiFeedbackQualityResult={{ error: networkError(), status: "error" }}
        analyticsResult={ok(analytics)}
        filters={filters}
        lessonAnalyticsResult={ok(lessonAnalytics)}
      />
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "네트워크 연결을 확인해 주세요."
    )
    expect(screen.getByRole("table", { name: "레슨별 성과" })).toBeVisible()
  })
})

function renderPage() {
  return render(
    <AdminAnalyticsPage
      aiFeedbackQualityResult={ok(aiFeedbackQuality)}
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
