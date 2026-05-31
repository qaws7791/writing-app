import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import { lessonId } from "@workspace/core/content"
import { userId } from "@workspace/core/learning"

import { createDatabase } from "../client"
import { runContentMigration } from "../migrations/run-content-migration"
import { createDrizzleFeedbackRepository } from "./drizzle-feedback.repository"
import { user } from "../schema"
import { seedContent } from "../seeds/seed-content"

describe("createDrizzleFeedbackRepository", () => {
  const now = new Date("2026-05-26T00:00:00.000Z")
  let sqlite: Database
  let db: ReturnType<typeof createDatabase>

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    db = createDatabase(sqlite)
    await seedContent(db)
    await db.insert(user).values({
      id: "user-1",
      name: "테스트 사용자",
      email: "learner@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
  })

  it("counts completed feedback attempts", async () => {
    const repository = createDrizzleFeedbackRepository(db, { now: () => now })

    await repository.createCompletedAttempt(createAttemptInput(1))
    await repository.createCompletedAttempt(createAttemptInput(2))

    const count = await repository.countCompletedAttempts(
      userId("user-1"),
      lessonId("sentence-structure-01"),
      "sentence-structure-01-step-2"
    )

    expect(count).toBe(2)
  })

  it("stores completed feedback attempts with incrementing attempt numbers", async () => {
    const repository = createDrizzleFeedbackRepository(db, { now: () => now })

    await repository.createCompletedAttempt(createAttemptInput(1))
    await repository.createCompletedAttempt(createAttemptInput(2))

    const rows = sqlite
      .query<
        { attempt_number: number },
        []
      >("select attempt_number from feedback_attempts order by attempt_number")
      .all()

    expect(rows).toEqual([{ attempt_number: 1 }, { attempt_number: 2 }])
  })
})

function createAttemptInput(attemptNumber: number) {
  return {
    answerSnapshot: `답변 ${attemptNumber}`,
    attemptNumber,
    feedbackStepId: "sentence-structure-01-step-2",
    lessonId: lessonId("sentence-structure-01"),
    result: {
      improvements: ["구체화하세요."],
      nextAction: "수정",
      score: 4,
      scoreRange: [0, 5] as [number, number],
      strengths: ["명확합니다."],
      summary: "좋은 문장입니다.",
    },
    sourceStepId: "sentence-structure-01-step-1",
    userId: userId("user-1"),
  }
}
