import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import {
  insertActivityDays,
  insertAiFeedbackAttempts,
  insertLearner,
  insertProgress,
  insertPublishedCourse,
} from "#operations/test/fixtures/reporting-metrics-seed"

import { createOperationsReportingQueries } from "#operations/application/operations-reporting"
import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const reportNow = new Date("2026-07-24T03:00:00.000Z")

describe("operations reporting SQL metrics", () => {
  it("첫 시작·D7·완료·이탈을 SQL로 집계하고 deleted learner를 전부 제외한다", async () => {
    const fixture = createReportingFixture()

    try {
      const repository = createSqliteOperationsReportingRepository(
        fixture.readOnly.sqlite
      )
      const reporting = createOperationsReportingQueries({
        observer: () => undefined,
        repository,
      })
      const dashboardResult = await reporting.readDashboard({ now: reportNow })
      const analyticsResult = await reporting.readAnalytics({
        days: 15,
        now: reportNow,
      })
      if (dashboardResult.isErr()) throw new Error("dashboard query failed")
      if (analyticsResult.isErr()) throw new Error("analytics query failed")

      expect(dashboardResult.value).toEqual({
        activeWindow: { from: "2026-07-18", to: "2026-07-24" },
        asOfDate: "2026-07-24",
        metrics: {
          activeUsersLast7Days: 1,
          activationRate: {
            denominator: 4,
            numerator: 3,
            percentage: 75,
            status: "available",
          },
          completedLessons: 2,
          d7ReturnRate: {
            denominator: 2,
            matureCohortThrough: "2026-07-16",
            numerator: 1,
            percentage: 50,
            status: "available",
          },
          firstLessonStarts: 3,
          totalUsers: 4,
        },
      })
      expect(readDailyPoint(analyticsResult.value, "2026-07-10")).toEqual({
        completions: 0,
        date: "2026-07-10",
        returns: 1,
        returnStatus: "available",
        signups: 0,
        starts: 2,
      })
      expect(readDailyPoint(analyticsResult.value, "2026-07-12")).toMatchObject(
        {
          completions: 1,
        }
      )
      expect(readDailyPoint(analyticsResult.value, "2026-07-20")).toEqual({
        completions: 0,
        date: "2026-07-20",
        returns: null,
        returnStatus: "immature",
        signups: 1,
        starts: 1,
      })
      expect(readDailyPoint(analyticsResult.value, "2026-07-24")).toMatchObject(
        {
          signups: 1,
        }
      )
      expect(analyticsResult.value.worstLessons[0]).toMatchObject({
        completed: 2,
        completionRate: 67,
        dropOffRate: 33,
        lessonId: "lesson-1",
        started: 3,
      })
      expect(analyticsResult.value.worstAiFeedbackLessons).toEqual([
        {
          courseId: "course-1",
          courseTitle: "글쓰기 코스",
          failureCount: 1,
          failureRate: 50,
          lessonId: "lesson-2",
          lessonTitle: "두 번째 레슨",
          requestCount: 2,
        },
        {
          courseId: "course-1",
          courseTitle: "글쓰기 코스",
          failureCount: 1,
          failureRate: 50,
          lessonId: "lesson-1",
          lessonTitle: "첫 번째 레슨",
          requestCount: 2,
        },
      ])
      expect(
        JSON.stringify(analyticsResult.value.worstAiFeedbackLessons)
      ).not.toContain("절대 노출하지 않을 답안")
    } finally {
      fixture.close()
    }
  })

  it("레슨 검색·허용 정렬·pagination을 SQL에서 처리한다", () => {
    const fixture = createReportingFixture()

    try {
      const repository = createSqliteOperationsReportingRepository(
        fixture.readOnly.sqlite
      )
      const searched = repository.readLessonAnalytics({
        direction: "asc",
        page: 1,
        pageSize: 10,
        query: "두 번째",
        sort: "lesson",
      })
      const secondPage = repository.readLessonAnalytics({
        direction: "desc",
        page: 2,
        pageSize: 1,
        query: "",
        sort: "dropOff",
      })

      expect(searched).toMatchObject({
        items: [{ lessonId: "lesson-2", started: 0 }],
        totalItems: 1,
        totalPages: 1,
      })
      expect(secondPage).toMatchObject({
        items: [{ lessonId: "lesson-2" }],
        page: 2,
        pageSize: 1,
        totalItems: 2,
        totalPages: 2,
      })
    } finally {
      fixture.close()
    }
  })

  it("빈 데이터와 미성숙 cohort를 구분하고 reporting connection의 mutation을 거부한다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "operations-reporting-empty-"))
    const databasePath = join(directory, "reporting.sqlite")
    const writer = createWritingAppDatabase(databasePath)
    runCurrentTestMigration(writer.sqlite)
    writer.close()
    const readOnly = createReadOnlyWritingAppDatabase(databasePath)

    try {
      const repository = createSqliteOperationsReportingRepository(
        readOnly.sqlite
      )
      const reporting = createOperationsReportingQueries({
        observer: () => undefined,
        repository,
      })
      const dashboard = await reporting.readDashboard({ now: reportNow })
      const analytics = await reporting.readAnalytics({
        days: 3,
        now: reportNow,
      })
      if (dashboard.isErr()) throw new Error("empty dashboard query failed")
      if (analytics.isErr()) throw new Error("empty analytics query failed")

      expect(dashboard.value.metrics.activationRate).toEqual({
        denominator: 0,
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(dashboard.value.metrics.d7ReturnRate).toEqual({
        denominator: 0,
        matureCohortThrough: "2026-07-16",
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(analytics.value.dailySeries).toEqual([
        {
          completions: 0,
          date: "2026-07-22",
          returns: 0,
          returnStatus: "empty",
          signups: 0,
          starts: 0,
        },
        {
          completions: 0,
          date: "2026-07-23",
          returns: 0,
          returnStatus: "empty",
          signups: 0,
          starts: 0,
        },
        {
          completions: 0,
          date: "2026-07-24",
          returns: 0,
          returnStatus: "empty",
          signups: 0,
          starts: 0,
        },
      ])
      expect(
        repository.readLessonAnalytics({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "",
          sort: "lesson",
        })
      ).toMatchObject({ items: [], totalItems: 0, totalPages: 0 })
      expect(() =>
        readOnly.sqlite.exec(`
          INSERT INTO user (
            id, name, email, email_verified, created_at, updated_at
          )
          VALUES ('mutation', 'mutation', 'mutation@example.com', 1, 0, 0)
        `)
      ).toThrow(/read.?only/i)
    } finally {
      readOnly.close()
      rmSync(directory, { recursive: true })
    }
  })
})

function createReportingFixture(): Readonly<{
  close: () => void
  readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase>
}> {
  const directory = mkdtempSync(join(tmpdir(), "operations-reporting-"))
  const databasePath = join(directory, "reporting.sqlite")
  const writer = createWritingAppDatabase(databasePath)

  try {
    runCurrentTestMigration(writer.sqlite)
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-01T09:00:00+09:00",
      id: "learner-a",
      status: "active",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-01T09:00:00+09:00",
      id: "learner-b",
      status: "active",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-20T09:00:00+09:00",
      id: "learner-c",
      status: "active",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-20T09:00:00+09:00",
      id: "learner-d",
      status: "deleted",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-24T09:00:00+09:00",
      id: "learner-e",
      status: "active",
    })
    const course = insertPublishedCourse(writer.sqlite)
    insertProgress(writer.sqlite, {
      completedAt: "2026-07-12T10:00:00+09:00",
      course,
      lessonId: course.lessonIds[0],
      startedAt: "2026-07-10T09:00:00+09:00",
      status: "completed",
      userId: "learner-a",
    })
    insertProgress(writer.sqlite, {
      completedAt: null,
      course,
      lessonId: course.lessonIds[0],
      startedAt: "2026-07-10T10:00:00+09:00",
      status: "in_progress",
      userId: "learner-b",
    })
    insertProgress(writer.sqlite, {
      completedAt: "2026-07-22T10:00:00+09:00",
      course,
      lessonId: course.lessonIds[0],
      startedAt: "2026-07-20T09:00:00+09:00",
      status: "completed",
      userId: "learner-c",
    })
    insertProgress(writer.sqlite, {
      completedAt: "2026-07-12T11:00:00+09:00",
      course,
      lessonId: course.lessonIds[0],
      startedAt: "2026-07-10T11:00:00+09:00",
      status: "completed",
      userId: "learner-d",
    })
    insertAiFeedbackAttempts(writer.sqlite, course)
    insertActivityDays(writer.sqlite, "learner-a", ["2026-07-10", "2026-07-11"])
    insertActivityDays(writer.sqlite, "learner-b", ["2026-07-10"])
    insertActivityDays(writer.sqlite, "learner-c", ["2026-07-20", "2026-07-21"])
    insertActivityDays(writer.sqlite, "learner-d", ["2026-07-10", "2026-07-12"])
  } finally {
    writer.close()
  }

  const readOnly = createReadOnlyWritingAppDatabase(databasePath)
  return {
    close() {
      readOnly.close()
      rmSync(directory, { recursive: true })
    },
    readOnly,
  }
}

function readDailyPoint(
  analytics: Readonly<{
    dailySeries: readonly Readonly<{ date: string }>[]
  }>,
  date: string
) {
  const point = analytics.dailySeries.find(
    (candidate) => candidate.date === date
  )
  if (point === undefined) throw new Error(`daily point missing: ${date}`)
  return point
}
