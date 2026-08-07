import { describe, expect, it } from "vitest"
import { aAiFeedbackAttempt } from "@workspace/ai-feedback/test-fixtures"
import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import type { WritingAppDatabaseClient } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { aLearner } from "@workspace/identity/test-fixtures"

import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const period = { from: new Date(999), to: new Date(4_000) }

describe("operations reporting SQLite repository", () => {
  it("활성 학습자 attempt를 요청·성공·실패·재시도·latency·token으로 집계한다", () => {
    withReportingDatabase((client, course) => {
      aLearner(client.sqlite, { id: "active-learner", status: "active" })
      insertActiveLearnerAttempts(client, course)

      const repository = createSqliteOperationsReportingRepository(
        client.sqlite
      )

      const quality = repository.readAiFeedbackQuality(period)

      expect(quality).toEqual({
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
      expect(JSON.stringify(quality)).not.toContain("답안")
      expect(JSON.stringify(quality)).not.toContain("피드백")
    })
  })

  it("삭제된 학습자의 attempt는 집계 대상에서 제외한다", () => {
    withReportingDatabase((client, course) => {
      aLearner(client.sqlite, {
        deletedAt: 0,
        id: "deleted-learner",
        status: "deleted",
      })
      aAiFeedbackAttempt(client.sqlite, {
        attemptId: "attempt-deleted",
        course,
        createdAt: 2_000,
        failureCode: "provider-unavailable",
        idempotencyKey: "deleted-1",
        latencyMs: 900,
        quotaDate: "1970-01-01",
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
  run: (
    client: WritingAppDatabaseClient,
    course: PublishedCourseFixture
  ) => void
): void {
  const client = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(client.sqlite)
    run(client, aPublishedCourse(client.sqlite))
  } finally {
    client.close()
  }
}

function insertActiveLearnerAttempts(
  client: WritingAppDatabaseClient,
  course: PublishedCourseFixture
): void {
  aAiFeedbackAttempt(client.sqlite, {
    answerText: "절대 노출하지 않을 답안",
    attemptId: "attempt-1",
    course,
    createdAt: 1_000,
    idempotencyKey: "active-1",
    inputTokenCount: 12,
    latencyMs: 100,
    outputTokenCount: 7,
    quotaDate: "1970-01-01",
    resultJson: '{"summary":"노출되면 안 되는 피드백"}',
    status: "succeeded",
    userId: "active-learner",
  })
  aAiFeedbackAttempt(client.sqlite, {
    answerText: "절대 노출하지 않을 답안",
    attemptId: "attempt-2",
    attemptNumber: 2,
    course,
    createdAt: 2_000,
    failureCode: "provider-timeout",
    idempotencyKey: "active-2",
    latencyMs: 300,
    quotaDate: "1970-01-01",
    userId: "active-learner",
  })
  aAiFeedbackAttempt(client.sqlite, {
    answerText: "절대 노출하지 않을 답안",
    attemptId: "attempt-3",
    attemptNumber: 3,
    course,
    createdAt: 3_000,
    idempotencyKey: "active-3",
    inputTokenCount: 18,
    latencyMs: 200,
    outputTokenCount: 6,
    quotaDate: "1970-01-01",
    resultJson: '{"summary":"좋은 초안입니다."}',
    status: "succeeded",
    userId: "active-learner",
  })
}
