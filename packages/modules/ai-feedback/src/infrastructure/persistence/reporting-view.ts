import { integer, sqliteView, text } from "drizzle-orm/sqlite-core"

/** 품질·실패 리포팅에 필요한 attempt 컬럼만 노출하는 읽기 계약. 답안 원문은 포함하지 않는다. */
export const aiFeedbackReportingAttempts = sqliteView(
  "ai_feedback_reporting_attempts",
  {
    attemptNumber: integer("attempt_number").notNull(),
    courseId: text("course_id").notNull(),
    createdAt: integer("created_at").notNull(),
    failureCode: text("failure_code"),
    id: text("id").notNull(),
    inputTokenCount: integer("input_token_count"),
    latencyMs: integer("latency_ms"),
    lessonId: text("lesson_id").notNull(),
    outputTokenCount: integer("output_token_count"),
    quotaDate: text("quota_date").notNull(),
    status: text("status").notNull(),
    userId: text("user_id").notNull(),
  }
).existing()
