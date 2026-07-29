import { err, ok, type Result } from "@workspace/kernel/result"
import { toPlatformDayKey } from "@workspace/kernel/day-boundary"

import type { OperationsError } from "#operations/domain/operations-error"
import type {
  OperationsAiFeedbackQuality,
  OperationsAnalytics,
  OperationsDashboard,
  OperationsLessonAnalyticsPage,
  OperationsLessonAnalyticsSort,
  OperationsReportingRepository,
  OperationsSortDirection,
} from "#operations/application/ports/operations-reporting-repository"

type OperationsReportingQueryName =
  | "ai-feedback-quality"
  | "analytics"
  | "dashboard"
  | "lesson-analytics"

export type OperationsReportingFailureObserver = (
  event: Readonly<{
    cause: unknown
    kind: "operations-reporting-query-failed"
    query: OperationsReportingQueryName
  }>
) => void

export type OperationsReportingQueries = Readonly<{
  readAiFeedbackQuality: (input: {
    readonly from: Date
    readonly to: Date
  }) => Promise<Result<OperationsAiFeedbackQuality, OperationsError>>
  readAnalytics: (
    input: Readonly<{ days: number; now: Date }>
  ) => Promise<Result<OperationsAnalytics, OperationsError>>
  readDashboard: (
    input: Readonly<{ now: Date }>
  ) => Promise<Result<OperationsDashboard, OperationsError>>
  readLessonAnalytics: (
    input: Readonly<{
      direction: OperationsSortDirection
      page: number
      pageSize: number
      query: string
      sort: OperationsLessonAnalyticsSort
    }>
  ) => Promise<Result<OperationsLessonAnalyticsPage, OperationsError>>
}>

export function createOperationsReportingQueries(input: {
  readonly observer: OperationsReportingFailureObserver
  readonly repository: OperationsReportingRepository
}): OperationsReportingQueries {
  return {
    readAiFeedbackQuality(query) {
      return executeReportingQuery(input, "ai-feedback-quality", () =>
        input.repository.readAiFeedbackQuality(query)
      )
    },
    readAnalytics(query) {
      const to = toPlatformDayKey(query.now)
      return executeReportingQuery(input, "analytics", () =>
        input.repository.readAnalytics({
          from: addCalendarDays(to, -(query.days - 1)),
          matureCohortThrough: addCalendarDays(to, -8),
          to,
        })
      )
    },
    readDashboard(query) {
      const reportDate = toPlatformDayKey(query.now)
      return executeReportingQuery(input, "dashboard", () =>
        input.repository.readDashboard({
          activeFrom: addCalendarDays(reportDate, -6),
          matureCohortThrough: addCalendarDays(reportDate, -8),
          reportDate,
        })
      )
    },
    readLessonAnalytics(query) {
      return executeReportingQuery(input, "lesson-analytics", () =>
        input.repository.readLessonAnalytics(query)
      )
    },
  }
}

async function executeReportingQuery<T>(
  input: {
    readonly observer: OperationsReportingFailureObserver
  },
  query: OperationsReportingQueryName,
  operation: () => T
): Promise<Result<T, OperationsError>> {
  try {
    return ok(operation())
  } catch (cause) {
    input.observer({
      cause,
      kind: "operations-reporting-query-failed",
      query,
    })
    return err({ cause, kind: "reporting-unavailable", query })
  }
}

function addCalendarDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
