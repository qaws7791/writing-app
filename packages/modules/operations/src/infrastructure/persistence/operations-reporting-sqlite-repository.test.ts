import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import type { WritingAppDatabaseClient } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import {
  insertAiFeedbackAttempt,
  insertLearner,
  insertPublishedCourse,
  type PublishedCourseSeed,
} from "#operations/test/fixtures/reporting-metrics-seed"

import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const period = { from: new Date(999), to: new Date(4_000) }

describe("operations reporting SQLite repository", () => {
  it("활성 학습자 attempt를 요청·성공·실패·재시도·latency·token으로 집계한다", () => {
    withReportingDatabase((client, course) => {
      insertLearner(client.sqlite, {
        createdAt: "1970-01-01T00:00:00.000Z",
        id: "active-learner",
        status: "active",
      })
      insertActiveLearnerAttempts(client, course)

      const repository = createSqliteOperationsReportingRepository(
        client.sqlite
      )

      expect(repository.readAiFeedbackQuality(period)).toEqual({
        failureCount: 1,
        failureCounts: [{ code: "provider-timeout", count: 1 }],
        from: "1970-01-01T00:00:00.999Z",
        latency: { averageMs: 200, sampleCount: 3, totalMs: 600 },
        requestCount: 3,
        retryCount: 2,
        status: "available",
        successCount: 2,
        successRate: 2 / 3,
        to: "1970-01-01T00:00:04.000Z",
        tokens: { input: 30, output: 13, sampleCount: 2 },
      })
    })
  })

  it("삭제된 학습자의 attempt는 집계 대상에서 제외한다", () => {
    withReportingDatabase((client, course) => {
      insertLearner(client.sqlite, {
        createdAt: "1970-01-01T00:00:00.000Z",
        id: "deleted-learner",
        status: "deleted",
      })
      insertAiFeedbackAttempt(client.sqlite, {
        course,
        createdAt: "1970-01-01T00:00:02.000Z",
        failureCode: "provider-unavailable",
        id: "attempt-deleted",
        idempotencyKey: "deleted-1",
        latencyMs: 900,
        lessonId: course.lessonIds[0],
        quotaDate: "1970-01-01",
        status: "failed",
        stepId: course.stepIds[0],
        userId: "deleted-learner",
      })

      const repository = createSqliteOperationsReportingRepository(
        client.sqlite
      )

      expect(repository.readAiFeedbackQuality(period)).toMatchObject({
        failureCount: 0,
        failureCounts: [],
        requestCount: 0,
        status: "empty",
      })
    })
  })

  it("집계 결과에 학습자 답안과 provider 피드백 원문을 담지 않는다", () => {
    withReportingDatabase((client, course) => {
      insertLearner(client.sqlite, {
        createdAt: "1970-01-01T00:00:00.000Z",
        id: "active-learner",
        status: "active",
      })
      insertActiveLearnerAttempts(client, course)

      const repository = createSqliteOperationsReportingRepository(
        client.sqlite
      )
      const quality = JSON.stringify(repository.readAiFeedbackQuality(period))

      expect(quality).not.toContain("답안")
      expect(quality).not.toContain("피드백")
    })
  })

  it("요청이 없는 구간은 0%가 아닌 empty 상태로 구분한다", () => {
    withReportingDatabase((client) => {
      const repository = createSqliteOperationsReportingRepository(
        client.sqlite
      )

      expect(
        repository.readAiFeedbackQuality({
          from: new Date(0),
          to: new Date(1_000),
        })
      ).toEqual({
        failureCount: 0,
        failureCounts: [],
        from: "1970-01-01T00:00:00.000Z",
        latency: { averageMs: null, sampleCount: 0, totalMs: 0 },
        requestCount: 0,
        retryCount: 0,
        status: "empty",
        successCount: 0,
        successRate: null,
        to: "1970-01-01T00:00:01.000Z",
        tokens: { input: 0, output: 0, sampleCount: 0 },
      })
    })
  })
})

function withReportingDatabase(
  run: (client: WritingAppDatabaseClient, course: PublishedCourseSeed) => void
): void {
  const client = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(client.sqlite)
    run(client, insertPublishedCourse(client.sqlite))
  } finally {
    client.close()
  }
}

function insertActiveLearnerAttempts(
  client: WritingAppDatabaseClient,
  course: PublishedCourseSeed
): void {
  insertAiFeedbackAttempt(client.sqlite, {
    course,
    createdAt: "1970-01-01T00:00:01.000Z",
    failureCode: null,
    id: "attempt-1",
    idempotencyKey: "active-1",
    inputTokenCount: 12,
    latencyMs: 100,
    lessonId: course.lessonIds[0],
    outputTokenCount: 7,
    quotaDate: "1970-01-01",
    resultJson: '{"summary":"노출되면 안 되는 피드백"}',
    status: "succeeded",
    stepId: course.stepIds[0],
    userId: "active-learner",
  })
  insertAiFeedbackAttempt(client.sqlite, {
    attemptNumber: 2,
    course,
    createdAt: "1970-01-01T00:00:02.000Z",
    failureCode: "provider-timeout",
    id: "attempt-2",
    idempotencyKey: "active-2",
    latencyMs: 300,
    lessonId: course.lessonIds[0],
    quotaDate: "1970-01-01",
    status: "failed",
    stepId: course.stepIds[0],
    userId: "active-learner",
  })
  insertAiFeedbackAttempt(client.sqlite, {
    attemptNumber: 3,
    course,
    createdAt: "1970-01-01T00:00:03.000Z",
    failureCode: null,
    id: "attempt-3",
    idempotencyKey: "active-3",
    inputTokenCount: 18,
    latencyMs: 200,
    lessonId: course.lessonIds[0],
    outputTokenCount: 6,
    quotaDate: "1970-01-01",
    resultJson: '{"summary":"좋은 초안입니다."}',
    status: "succeeded",
    stepId: course.stepIds[0],
    userId: "active-learner",
  })
}
