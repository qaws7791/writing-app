import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"
import { aAiFeedbackAttempt } from "@workspace/ai-feedback/test-fixtures"
import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"
import { aLearner } from "@workspace/identity/test-fixtures"
import { aLearnerWithProgress } from "@workspace/learning/test-fixtures"
import { aWriting } from "@workspace/writing/test-fixtures"

import { createOperationsReportingQueries } from "#operations/application/operations-reporting"
import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const reportNow = new Date("2026-07-24T03:00:00.000Z")

describe("operations reporting SQL metrics", () => {
  it("dashboard와 D7 cohort는 활성 learner만 집계한다", async () => {
    const fixture = createReportingFixture("dashboard", seedDashboardCohort)

    try {
      const reporting = createReportingQueries(fixture)

      const result = await reporting.readDashboard({ now: reportNow })

      if (result.isErr()) throw new Error("dashboard query failed")
      expect(result.value).toEqual({
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
          writingRevisionAfterSelfCheckRate: {
            denominator: 2,
            numerator: 1,
            percentage: 50,
            status: "available",
          },
          writingSelfCheckStartRate: {
            denominator: 3,
            numerator: 2,
            percentage: 66.7,
            status: "available",
          },
        },
      })
    } finally {
      fixture.close()
    }
  })

  it("learner가 없으면 dashboard 비율을 empty로 반환한다", async () => {
    const fixture = createReportingFixture("empty-dashboard")

    try {
      const reporting = createReportingQueries(fixture)

      const result = await reporting.readDashboard({ now: reportNow })

      if (result.isErr()) throw new Error("empty dashboard query failed")
      expect(result.value.metrics.activationRate).toEqual({
        denominator: 0,
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(result.value.metrics.d7ReturnRate).toEqual({
        denominator: 0,
        matureCohortThrough: "2026-07-16",
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(result.value.metrics.writingSelfCheckStartRate).toEqual({
        denominator: 0,
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(result.value.metrics.writingRevisionAfterSelfCheckRate).toEqual({
        denominator: 0,
        numerator: 0,
        percentage: null,
        status: "empty",
      })
    } finally {
      fixture.close()
    }
  })

  it("daily series는 signup·첫 시작·완료와 cohort 성숙도를 날짜별로 집계한다", async () => {
    const fixture = createReportingFixture("daily", seedDailySeries)

    try {
      const reporting = createReportingQueries(fixture)

      const result = await reporting.readAnalytics({
        days: 15,
        now: reportNow,
      })

      if (result.isErr()) throw new Error("daily analytics query failed")
      expect(readDailyPoint(result.value, "2026-07-10")).toEqual({
        completions: 0,
        date: "2026-07-10",
        returns: 1,
        returnStatus: "available",
        signups: 1,
        starts: 1,
      })
      expect(readDailyPoint(result.value, "2026-07-12")).toEqual({
        completions: 1,
        date: "2026-07-12",
        returns: 0,
        returnStatus: "empty",
        signups: 0,
        starts: 0,
      })
      expect(readDailyPoint(result.value, "2026-07-20")).toEqual({
        completions: 0,
        date: "2026-07-20",
        returns: null,
        returnStatus: "immature",
        signups: 1,
        starts: 1,
      })
      expect(readDailyPoint(result.value, "2026-07-24")).toEqual({
        completions: 0,
        date: "2026-07-24",
        returns: 0,
        returnStatus: "empty",
        signups: 1,
        starts: 0,
      })
    } finally {
      fixture.close()
    }
  })

  it("lesson ranking은 시작 learner의 완료율과 이탈률로 정렬한다", async () => {
    const fixture = createReportingFixture("lesson-ranking", seedLessonRanking)

    try {
      const reporting = createReportingQueries(fixture)

      const result = await reporting.readAnalytics({
        days: 1,
        now: reportNow,
      })

      if (result.isErr()) throw new Error("lesson ranking query failed")
      expect(result.value.worstLessons).toEqual([
        expect.objectContaining({
          completed: 1,
          completionRate: 50,
          dropOffRate: 50,
          lessonId: "lesson-1",
          started: 2,
        }),
      ])
    } finally {
      fixture.close()
    }
  })

  it("lesson 검색·허용 정렬·pagination을 SQL에서 처리한다", () => {
    const fixture = createReportingFixture("lesson-search", seedLessonSearch)

    try {
      const repository = createReportingRepository(fixture)

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

  it("AI 실패 ranking은 삭제 learner·기간 밖 시도·PII 원문을 제외한다", async () => {
    const fixture = createReportingFixture("ai-feedback", seedAiFeedback)

    try {
      const reporting = createReportingQueries(fixture)

      const result = await reporting.readAnalytics({
        days: 15,
        now: reportNow,
      })

      if (result.isErr()) throw new Error("AI feedback analytics query failed")
      expect(result.value.worstAiFeedbackLessons).toEqual([
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
      expect(JSON.stringify(result.value.worstAiFeedbackLessons)).not.toContain(
        "절대 노출하지 않을 답안"
      )
    } finally {
      fixture.close()
    }
  })

  it("reporting repository는 read-only connection의 mutation을 거부한다", () => {
    const fixture = createReportingFixture("read-only")

    try {
      createReportingRepository(fixture)

      expect(() =>
        fixture.readOnly.sqlite.exec(`
          INSERT INTO user (
            id, name, email, email_verified, created_at, updated_at
          )
          VALUES ('mutation', 'mutation', 'mutation@example.com', 1, 0, 0)
        `)
      ).toThrow(/read.?only/i)
    } finally {
      fixture.close()
    }
  })
})

type ReportingFixture = Readonly<{
  close: () => void
  readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase>
}>

function createReportingFixture(
  name: string,
  seed: (sqlite: WritingAppSqlite) => void = () => undefined
): ReportingFixture {
  const directory = mkdtempSync(join(tmpdir(), `operations-reporting-${name}-`))
  const databasePath = join(directory, "reporting.sqlite")
  let readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase> | undefined
  let writer: ReturnType<typeof createWritingAppDatabase> | undefined

  try {
    writer = createWritingAppDatabase(databasePath)
    runCurrentTestMigration(writer.sqlite)
    seed(writer.sqlite)
    writer.close()
    readOnly = createReadOnlyWritingAppDatabase(databasePath)
  } catch (error) {
    try {
      closeReportingDatabases(readOnly, writer, directory)
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Operations reporting fixture setup과 정리에 실패했습니다."
      )
    }
    throw error
  }

  if (readOnly === undefined) {
    closeReportingDatabases(readOnly, writer, directory)
    throw new Error("Operations reporting read-only fixture가 없습니다.")
  }

  const activeReadOnly = readOnly
  let closed = false
  return {
    close() {
      if (closed) return
      closed = true
      closeReportingDatabases(activeReadOnly, writer, directory)
    },
    readOnly: activeReadOnly,
  }
}

function closeReportingDatabases(
  readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase> | undefined,
  writer: ReturnType<typeof createWritingAppDatabase> | undefined,
  directory: string
): void {
  try {
    readOnly?.close()
  } finally {
    try {
      writer?.close()
    } finally {
      rmSync(directory, { recursive: true })
    }
  }
}

function createReportingRepository(fixture: ReportingFixture) {
  return createSqliteOperationsReportingRepository(fixture.readOnly.sqlite)
}

function createReportingQueries(fixture: ReportingFixture) {
  return createOperationsReportingQueries({
    observer: () => undefined,
    repository: createReportingRepository(fixture),
  })
}

function seedDashboardCohort(sqlite: WritingAppSqlite): void {
  const course = aPublishedCourse(sqlite)
  for (const learner of [
    { createdAt: "2026-07-01T09:00:00+09:00", id: "learner-a" },
    { createdAt: "2026-07-01T09:00:00+09:00", id: "learner-b" },
    { createdAt: "2026-07-20T09:00:00+09:00", id: "learner-c" },
    { createdAt: "2026-07-24T09:00:00+09:00", id: "learner-e" },
  ]) {
    aLearner(sqlite, {
      createdAt: Date.parse(learner.createdAt),
      id: learner.id,
      status: "active",
    })
  }
  aLearner(sqlite, {
    createdAt: Date.parse("2026-07-20T09:00:00+09:00"),
    deletedAt: Date.parse("2026-07-20T09:00:00+09:00"),
    id: "learner-d",
    status: "deleted",
  })

  aLearnerWithProgress(sqlite, {
    activityDates: ["2026-07-10", "2026-07-11"],
    completedAt: Date.parse("2026-07-12T10:00:00+09:00"),
    course,
    startedAt: Date.parse("2026-07-10T09:00:00+09:00"),
    status: "completed",
    userId: "learner-a",
  })
  aLearnerWithProgress(sqlite, {
    activityDates: ["2026-07-10"],
    course,
    startedAt: Date.parse("2026-07-10T10:00:00+09:00"),
    userId: "learner-b",
  })
  aLearnerWithProgress(sqlite, {
    activityDates: ["2026-07-20", "2026-07-21"],
    completedAt: Date.parse("2026-07-22T10:00:00+09:00"),
    course,
    startedAt: Date.parse("2026-07-20T09:00:00+09:00"),
    status: "completed",
    userId: "learner-c",
  })
  aLearnerWithProgress(sqlite, {
    activityDates: ["2026-07-10", "2026-07-12"],
    completedAt: Date.parse("2026-07-12T11:00:00+09:00"),
    course,
    startedAt: Date.parse("2026-07-10T11:00:00+09:00"),
    status: "completed",
    userId: "learner-d",
  })

  aWriting(sqlite, {
    eventTypes: [
      "writing_created",
      "self_check_started",
      "revised_after_self_check",
    ],
    id: "writing-a",
    userId: "learner-a",
  })
  aWriting(sqlite, {
    eventTypes: ["writing_created", "self_check_started"],
    id: "writing-b",
    userId: "learner-b",
  })
  aWriting(sqlite, { id: "writing-c", userId: "learner-c" })
  aWriting(sqlite, {
    eventTypes: [
      "writing_created",
      "self_check_started",
      "revised_after_self_check",
    ],
    id: "writing-deleted-learner",
    userId: "learner-d",
  })
}

function seedDailySeries(sqlite: WritingAppSqlite): void {
  const course = aPublishedCourse(sqlite)
  aLearner(sqlite, {
    createdAt: Date.parse("2026-07-10T09:00:00+09:00"),
    id: "learner-a",
  })
  aLearner(sqlite, {
    createdAt: Date.parse("2026-07-20T09:00:00+09:00"),
    id: "learner-b",
  })
  aLearner(sqlite, {
    createdAt: Date.parse("2026-07-24T09:00:00+09:00"),
    id: "learner-c",
  })
  aLearnerWithProgress(sqlite, {
    activityDates: ["2026-07-10", "2026-07-11"],
    completedAt: Date.parse("2026-07-12T10:00:00+09:00"),
    course,
    startedAt: Date.parse("2026-07-10T09:00:00+09:00"),
    status: "completed",
    userId: "learner-a",
  })
  aLearnerWithProgress(sqlite, {
    activityDates: ["2026-07-20", "2026-07-21"],
    course,
    startedAt: Date.parse("2026-07-20T09:00:00+09:00"),
    userId: "learner-b",
  })
}

function seedLessonRanking(sqlite: WritingAppSqlite): void {
  const course = aPublishedCourse(sqlite)
  aLearner(sqlite, { id: "learner-a" })
  aLearner(sqlite, { id: "learner-b" })
  aLearnerWithProgress(sqlite, {
    course,
    completedAt: 2,
    status: "completed",
    userId: "learner-a",
  })
  aLearnerWithProgress(sqlite, {
    course,
    userId: "learner-b",
  })
}

function seedLessonSearch(sqlite: WritingAppSqlite): void {
  const course = aPublishedCourse(sqlite, {
    additionalLessons: [{ lessonTitle: "두 번째 레슨" }],
    lessonTitle: "첫 번째 레슨",
  })
  aLearner(sqlite, { id: "learner-a" })
  aLearnerWithProgress(sqlite, {
    course,
    userId: "learner-a",
  })
}

function seedAiFeedback(sqlite: WritingAppSqlite): void {
  const course = aPublishedCourse(sqlite, {
    additionalLessons: [{ lessonTitle: "두 번째 레슨" }],
    courseTitle: "글쓰기 코스",
    lessonTitle: "첫 번째 레슨",
  })
  aLearner(sqlite, { id: "learner-a" })
  aLearner(sqlite, {
    deletedAt: 2,
    id: "learner-deleted",
    status: "deleted",
  })
  insertAiFeedbackAttempts(sqlite, course)
}

function insertAiFeedbackAttempts(
  sqlite: WritingAppSqlite,
  course: PublishedCourseFixture
): void {
  for (const attempt of [
    {
      createdAt: "2026-07-20T10:00:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-failed",
      lessonId: "lesson-1",
      quotaDate: "2026-07-20",
      status: "failed",
      stepId: "step-1",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:01:00+09:00",
      failureCode: null,
      id: "attempt-succeeded",
      lessonId: "lesson-1",
      quotaDate: "2026-07-20",
      status: "succeeded",
      stepId: "step-1",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:02:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-lesson-2-failed",
      lessonId: "lesson-2",
      quotaDate: "2026-07-20",
      status: "failed",
      stepId: "step-2",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:03:00+09:00",
      failureCode: null,
      id: "attempt-lesson-2-succeeded",
      lessonId: "lesson-2",
      quotaDate: "2026-07-20",
      status: "succeeded",
      stepId: "step-2",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:04:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-deleted-learner",
      lessonId: "lesson-1",
      quotaDate: "2026-07-20",
      status: "failed",
      stepId: "step-1",
      userId: "learner-deleted",
    },
    {
      createdAt: "2026-06-20T10:00:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-outside-period",
      lessonId: "lesson-2",
      quotaDate: "2026-06-20",
      status: "failed",
      stepId: "step-2",
      userId: "learner-a",
    },
  ] as const) {
    aAiFeedbackAttempt(sqlite, {
      answerText: "절대 노출하지 않을 답안",
      attemptId: attempt.id,
      course,
      createdAt: Date.parse(attempt.createdAt),
      failureCode: attempt.failureCode,
      idempotencyKey: attempt.id,
      lessonId: attempt.lessonId,
      quotaDate: attempt.quotaDate,
      resultJson: attempt.status === "succeeded" ? "{}" : null,
      status: attempt.status,
      stepId: attempt.stepId,
      userId: attempt.userId,
    })
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
