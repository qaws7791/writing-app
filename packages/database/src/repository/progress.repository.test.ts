import { and, eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { toUserId } from "@workspace/core"

import { journeys } from "../schema/journeys"
import { userSessionProgress } from "../schema/user-session-progress"
import { journeySessions } from "../schema/journey-sessions"
import { createTestDb, type TestDatabase } from "../testing/create-test-db"
import { createProgressRepository } from "./progress.repository"

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
    const journeyId = await database.db
      .insert(journeys)
      .values({
        title: "응답 검증 여정",
        description: "세션 응답 검증 테스트",
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
        title: "세션 응답 검증",
        description: "세션 설명",
        estimatedMinutes: 10,
      })
      .returning({ id: journeySessions.id })
      .then((rows) => rows[0]?.id)

    if (!sessionId) {
      throw new Error("테스트용 세션을 만들지 못했습니다.")
    }

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
    const journeyId = await database.db
      .insert(journeys)
      .values({
        title: "응답 저장 검증 여정",
        description: "세션 응답 저장 검증 테스트",
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
        title: "세션 응답 저장 검증",
        description: "세션 설명",
        estimatedMinutes: 10,
      })
      .returning({ id: journeySessions.id })
      .then((rows) => rows[0]?.id)

    if (!sessionId) {
      throw new Error("테스트용 세션을 만들지 못했습니다.")
    }

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
})
