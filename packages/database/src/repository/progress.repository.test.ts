import { and, eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { toUserId } from "@workspace/core"

import { journeys } from "../schema/journeys"
import { userSessionProgress } from "../schema/user-session-progress"
import { journeySessions } from "../schema/journey-sessions"
import { userSessionStepAiState } from "../schema/user-session-step-ai-state"
import { createTestDb, type TestDatabase } from "../testing/create-test-db"
import { createProgressRepository } from "./progress.repository"

async function createJourneySession(database: TestDatabase, title: string) {
  const journeyId = await database.db
    .insert(journeys)
    .values({
      title,
      description: `${title} 설명`,
      category: "writing_skill",
      thumbnailUrl: null,
    })
    .returning({ id: journeys.id })
    .then((rows) => rows[0]?.id)

  if (!journeyId) {
    throw new Error("테스트용 여정을 만들지 못했습니다.")
  }

  const sessionId = await database.db
    .insert(journeySessions)
    .values({
      journeyId,
      order: 1,
      title: `${title} 세션`,
      description: "세션 설명",
      estimatedMinutes: 10,
    })
    .returning({ id: journeySessions.id })
    .then((rows) => rows[0]?.id)

  if (!sessionId) {
    throw new Error("테스트용 세션을 만들지 못했습니다.")
  }

  return { journeyId, sessionId }
}

describe("createProgressRepository", () => {
  let database: TestDatabase | null = null

  afterEach(async () => {
    if (database) {
      await database.cleanup()
      database = null
    }
  })

  it("손상된 stepResponsesJson을 읽을 때 validation error를 던진다", async () => {
    database = await createTestDb()

    const userId = toUserId("dev-user")
    const { sessionId } = await createJourneySession(database, "응답 검증 여정")

    await database.db.insert(userSessionProgress).values({
      userId,
      sessionId,
      currentStepOrder: 1,
      status: "in_progress",
      stepResponsesJson: {
        "5": {
          kind: "feedback",
          status: "succeeded",
          resultJson: null,
        },
      },
    })

    const repository = createProgressRepository(database.db)

    await expect(
      repository.getSessionProgress(userId, sessionId)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      field: "stepResponsesJson",
    })
  })

  it("손상된 stepResponsesJson을 저장하려 할 때 validation error를 던진다", async () => {
    database = await createTestDb()

    const userId = toUserId("dev-user")
    const { sessionId } = await createJourneySession(
      database,
      "응답 저장 검증 여정"
    )

    await database.db.insert(userSessionProgress).values({
      userId,
      sessionId,
      currentStepOrder: 1,
      status: "in_progress",
      stepResponsesJson: {},
    })

    const repository = createProgressRepository(database.db)

    await expect(
      repository.updateSessionProgress(userId, sessionId, {
        stepResponsesJson: {
          "1": {
            kind: "feedback",
            status: "succeeded",
            resultJson: null,
          },
        } as never,
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      field: "stepResponsesJson",
    })

    const row = await database.db
      .select({ stepResponsesJson: userSessionProgress.stepResponsesJson })
      .from(userSessionProgress)
      .where(
        and(
          eq(userSessionProgress.sessionId, sessionId),
          eq(userSessionProgress.userId, userId)
        )
      )
      .limit(1)
      .then((rows) => rows[0])

    expect(row?.stepResponsesJson).toEqual({})
  })

  it("정상적인 session ai 결과를 저장하고 다시 읽는다", async () => {
    database = await createTestDb()

    const userId = toUserId("dev-user")
    const { sessionId } = await createJourneySession(
      database,
      "AI 결과 저장 검증 여정"
    )
    const repository = createProgressRepository(database.db)

    await repository.saveSessionStepAiState(userId, sessionId, 2, {
      kind: "feedback",
      sourceStepOrder: 1,
      status: "succeeded",
      attemptCount: 1,
      inputJson: {
        bodyPlainText: "초안",
        level: "beginner",
      },
      resultJson: {
        strengths: ["도입이 선명합니다."],
        improvements: ["근거를 더 보강해 보세요."],
        question: "독자가 더 궁금해할 부분은 어디인가요?",
      },
      errorMessage: null,
    })

    await expect(
      repository.getSessionStepAiState(userId, sessionId, 2)
    ).resolves.toMatchObject({
      status: "succeeded",
      resultJson: {
        strengths: ["도입이 선명합니다."],
        improvements: ["근거를 더 보강해 보세요."],
        question: "독자가 더 궁금해할 부분은 어디인가요?",
      },
    })
  })

  it("손상된 session ai 결과를 읽을 때 validation error를 던진다", async () => {
    database = await createTestDb()

    const userId = toUserId("dev-user")
    const { sessionId } = await createJourneySession(
      database,
      "AI 결과 읽기 검증 여정"
    )

    await database.db.insert(userSessionStepAiState).values({
      userId,
      sessionId,
      stepOrder: 2,
      kind: "feedback",
      sourceStepOrder: 1,
      status: "succeeded",
      attemptCount: 1,
      inputJson: {
        bodyPlainText: "초안",
        level: "beginner",
      },
      resultJson: {
        strengths: ["강점"],
        improvements: "문자열 개선점",
      },
    })

    const repository = createProgressRepository(database.db)

    await expect(
      repository.getSessionStepAiState(userId, sessionId, 2)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      field: "resultJson",
    })
  })
})
