import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

describe("operations reporting SQLite repository", () => {
  it("원문 없이 AI 품질을 집계하고 삭제된 학습자를 제외한다", () => {
    const sqlite = createAiFeedbackReportingDatabase()
    try {
      insertLearner(sqlite, "active-learner", "active")
      insertLearner(sqlite, "deleted-learner", "deleted")
      insertAttempt(sqlite, {
        answerText: "분석에 노출되면 안 되는 답안",
        attemptNumber: 1,
        createdAt: 1_000,
        failureCode: null,
        inputTokenCount: 12,
        latencyMs: 100,
        outputTokenCount: 7,
        resultJson: '{"summary":"노출되면 안 되는 피드백"}',
        status: "succeeded",
        userId: "active-learner",
      })
      insertAttempt(sqlite, {
        answerText: "두 번째 답안",
        attemptNumber: 2,
        createdAt: 2_000,
        failureCode: "provider-timeout",
        inputTokenCount: null,
        latencyMs: 300,
        outputTokenCount: null,
        resultJson: null,
        status: "failed",
        userId: "active-learner",
      })
      insertAttempt(sqlite, {
        answerText: "세 번째 답안",
        attemptNumber: 3,
        createdAt: 3_000,
        failureCode: null,
        inputTokenCount: 18,
        latencyMs: 200,
        outputTokenCount: 6,
        resultJson: '{"summary":"좋은 초안입니다."}',
        status: "succeeded",
        userId: "active-learner",
      })
      insertAttempt(sqlite, {
        answerText: "삭제된 학습자 답안",
        attemptNumber: 1,
        createdAt: 2_000,
        failureCode: "provider-unavailable",
        inputTokenCount: null,
        latencyMs: 900,
        outputTokenCount: null,
        resultJson: null,
        status: "failed",
        userId: "deleted-learner",
      })

      const repository = createSqliteOperationsReportingRepository(sqlite)
      const quality = repository.readAiFeedbackQuality({
        from: new Date(999),
        to: new Date(4_000),
      })

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
    } finally {
      sqlite.close()
    }
  })

  it("요청이 없는 구간은 0%가 아닌 empty 상태로 구분한다", () => {
    const sqlite = createAiFeedbackReportingDatabase()
    try {
      const repository = createSqliteOperationsReportingRepository(sqlite)

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
    } finally {
      sqlite.close()
    }
  })
})

function createAiFeedbackReportingDatabase(): Database {
  const sqlite = new Database(":memory:")
  sqlite.exec(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY
    );
    CREATE TABLE learner_profiles (
      user_id TEXT PRIMARY KEY,
      status TEXT NOT NULL
    );
    CREATE TABLE ai_feedback_attempts (
      answer_text TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      failure_code TEXT,
      input_token_count INTEGER,
      latency_ms INTEGER,
      output_token_count INTEGER,
      result_json TEXT,
      status TEXT NOT NULL,
      user_id TEXT NOT NULL
    );
  `)
  return sqlite
}

function insertLearner(
  sqlite: Database,
  userId: string,
  status: "active" | "deleted"
): void {
  sqlite.query("INSERT INTO user (id) VALUES (?1)").run(userId)
  sqlite
    .query("INSERT INTO learner_profiles (user_id, status) VALUES (?1, ?2)")
    .run(userId, status)
}

function insertAttempt(
  sqlite: Database,
  input: Readonly<{
    answerText: string
    attemptNumber: number
    createdAt: number
    failureCode: string | null
    inputTokenCount: number | null
    latencyMs: number
    outputTokenCount: number | null
    resultJson: string | null
    status: "failed" | "succeeded"
    userId: string
  }>
): void {
  sqlite
    .query(`
      INSERT INTO ai_feedback_attempts (
        answer_text,
        attempt_number,
        created_at,
        failure_code,
        input_token_count,
        latency_ms,
        output_token_count,
        result_json,
        status,
        user_id
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `)
    .run(
      input.answerText,
      input.attemptNumber,
      input.createdAt,
      input.failureCode,
      input.inputTokenCount,
      input.latencyMs,
      input.outputTokenCount,
      input.resultJson,
      input.status,
      input.userId
    )
}
