import { err, ok, type Result } from "@workspace/kernel/result"
import { toPlatformDayKey } from "@workspace/kernel/day-boundary"
import type { LessonId } from "@workspace/types/ids"

import type { OperationsError } from "#operations/domain/operations-error"
import type {
  OperationsAnalytics,
  OperationsDashboard,
  OperationsLessonAnalyticsCursor,
  OperationsLessonAnalyticsItem,
  OperationsLessonAnalyticsPage,
  OperationsLessonAnalyticsSort,
  OperationsReportingRepository,
  OperationsSortDirection,
} from "#operations/application/ports/operations-reporting-repository"

type OperationsReportingQueryName =
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
  readAnalytics: (
    input: Readonly<{ days: number; now: Date }>
  ) => Promise<Result<OperationsAnalytics, OperationsError>>
  readDashboard: (
    input: Readonly<{ now: Date }>
  ) => Promise<Result<OperationsDashboard, OperationsError>>
  readLessonAnalytics: (
    input: Readonly<{
      cursor?: string
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
      const cursor = decodeLessonAnalyticsCursor(
        query.cursor ?? null,
        query.sort,
        query.direction
      )
      if (query.cursor !== undefined && cursor === null) {
        return Promise.resolve(
          err({
            kind: "invalid-reporting-query",
            query: "lesson-analytics",
          })
        )
      }
      return executeReportingQuery(input, "lesson-analytics", () =>
        addLessonAnalyticsCursors(
          input.repository.readLessonAnalytics({ ...query, cursor }),
          query.sort,
          query.direction
        )
      )
    },
  }
}

function addLessonAnalyticsCursors(
  page: OperationsLessonAnalyticsPage,
  sort: OperationsLessonAnalyticsSort,
  direction: OperationsSortDirection
): OperationsLessonAnalyticsPage {
  return {
    ...page,
    nextCursor:
      page.hasNextPage === true
        ? encodeLessonAnalyticsCursor(
            page.items.at(-1),
            "older",
            sort,
            direction
          )
        : null,
    previousCursor:
      page.hasPreviousPage === true
        ? encodeLessonAnalyticsCursor(page.items[0], "newer", sort, direction)
        : null,
  }
}

function encodeLessonAnalyticsCursor(
  item: OperationsLessonAnalyticsItem | undefined,
  navigation: OperationsLessonAnalyticsCursor["direction"],
  sort: OperationsLessonAnalyticsSort,
  direction: OperationsSortDirection
): string | null {
  if (item === undefined) return null
  const primary = readLessonAnalyticsPrimary(item, sort)
  return Buffer.from(
    JSON.stringify([
      navigation,
      sort,
      direction,
      primary,
      item.courseTitle,
      item.lessonTitle,
      item.lessonId,
    ]),
    "utf8"
  ).toString("base64url")
}

function decodeLessonAnalyticsCursor(
  value: string | null,
  sort: OperationsLessonAnalyticsSort,
  direction: OperationsSortDirection
): OperationsLessonAnalyticsCursor | null {
  if (value === null) return null
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    )
    if (
      !Array.isArray(decoded) ||
      decoded.length !== 7 ||
      (decoded[0] !== "newer" && decoded[0] !== "older") ||
      decoded[1] !== sort ||
      decoded[2] !== direction ||
      !isValidLessonAnalyticsPrimary(decoded[3], sort) ||
      typeof decoded[4] !== "string" ||
      decoded[4].length === 0 ||
      typeof decoded[5] !== "string" ||
      decoded[5].length === 0 ||
      typeof decoded[6] !== "string" ||
      decoded[6].length === 0
    ) {
      return null
    }
    return {
      courseTitle: decoded[4],
      direction: decoded[0],
      lessonId: decoded[6] as LessonId,
      lessonTitle: decoded[5],
      primary: decoded[3],
    }
  } catch {
    return null
  }
}

function isValidLessonAnalyticsPrimary(
  value: unknown,
  sort: OperationsLessonAnalyticsSort
): value is number | string {
  return sort === "course" || sort === "lesson"
    ? typeof value === "string" && value.length > 0
    : typeof value === "number" && Number.isFinite(value)
}

function readLessonAnalyticsPrimary(
  item: OperationsLessonAnalyticsItem,
  sort: OperationsLessonAnalyticsSort
): number | string {
  switch (sort) {
    case "completionRate":
      return item.completionRate
    case "course":
      return item.courseTitle
    case "dropOff":
      return item.dropOffRate
    case "lesson":
      return item.lessonTitle
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
