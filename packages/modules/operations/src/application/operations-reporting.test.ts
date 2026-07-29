import { describe, expect, it, vi } from "vitest"

import { createOperationsReportingQueries } from "#operations/application/operations-reporting"
import type { OperationsReportingRepository } from "#operations/application/ports/operations-reporting-repository"

describe("operations reporting application", () => {
  it("Asia/Seoul 보고일에서 7일 활성 구간과 완전히 성숙한 D7 cohort 경계를 만든다", async () => {
    const repository = createRepository()
    const reporting = createOperationsReportingQueries({
      observer: vi.fn(),
      repository,
    })

    await reporting.readDashboard({
      now: new Date("2026-07-23T15:30:00.000Z"),
    })
    await reporting.readAnalytics({
      days: 30,
      now: new Date("2026-07-23T15:30:00.000Z"),
    })

    expect(repository.readDashboard).toHaveBeenCalledWith({
      activeFrom: "2026-07-18",
      matureCohortThrough: "2026-07-16",
      reportDate: "2026-07-24",
    })
    expect(repository.readAnalytics).toHaveBeenCalledWith({
      from: "2026-06-25",
      matureCohortThrough: "2026-07-16",
      to: "2026-07-24",
    })
  })

  it("query 실패를 0 값으로 숨기지 않고 query 종류와 함께 관측한다", async () => {
    const cause = new Error("reporting database unavailable")
    const observer = vi.fn()
    const repository = createRepository()
    repository.readDashboard.mockImplementation(() => {
      throw cause
    })
    const reporting = createOperationsReportingQueries({
      observer,
      repository,
    })

    const result = await reporting.readDashboard({
      now: new Date("2026-07-24T00:00:00.000Z"),
    })

    expect(result.isErr() && result.error).toEqual({
      cause,
      kind: "reporting-unavailable",
      query: "dashboard",
    })
    expect(observer).toHaveBeenCalledWith({
      cause,
      kind: "operations-reporting-query-failed",
      query: "dashboard",
    })
  })
})

function createRepository() {
  return {
    readAiFeedbackQuality: vi.fn(() => ({
      failureCount: 0,
      failureCounts: [],
      from: "2026-07-01T00:00:00.000Z",
      latency: { averageMs: null, sampleCount: 0, totalMs: 0 },
      requestCount: 0,
      retryCount: 0,
      status: "empty" as const,
      successCount: 0,
      successRate: null,
      to: "2026-07-02T00:00:00.000Z",
      tokens: { input: 0, output: 0, sampleCount: 0 },
    })),
    readAnalytics: vi.fn((input) => ({
      dailySeries: [],
      ...input,
      worstAiFeedbackLessons: [],
      worstLessons: [],
    })),
    readDashboard: vi.fn((input) => ({
      activeWindow: { from: input.activeFrom, to: input.reportDate },
      asOfDate: input.reportDate,
      metrics: {
        activeUsersLast7Days: 0,
        activationRate: {
          denominator: 0,
          numerator: 0,
          percentage: null,
          status: "empty" as const,
        },
        completedLessons: 0,
        d7ReturnRate: {
          denominator: 0,
          matureCohortThrough: input.matureCohortThrough,
          numerator: 0,
          percentage: null,
          status: "empty" as const,
        },
        firstLessonStarts: 0,
        totalUsers: 0,
      },
    })),
    readLessonAnalytics: vi.fn((input) => ({
      items: [],
      page: input.page,
      pageSize: input.pageSize,
      totalItems: 0,
      totalPages: 0,
    })),
  } satisfies {
    [Key in keyof OperationsReportingRepository]: ReturnType<typeof vi.fn>
  }
}
