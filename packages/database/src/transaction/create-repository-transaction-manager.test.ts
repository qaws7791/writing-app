import { eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { toPromptId, toUserId } from "@workspace/core"

import { createTestDb, type TestDatabase } from "../testing/create-test-db"
import { journeySessions } from "../schema/journey-sessions"
import { journeys } from "../schema/journeys"
import { userJourneyProgress } from "../schema/user-journey-progress"
import { userSessionProgress } from "../schema/user-session-progress"
import { writingPrompts } from "../schema/writing-prompts"
import { writings } from "../schema/writings"
import { createRepositoryTransactionManager } from "./create-repository-transaction-manager"

describe("createRepositoryTransactionManager", () => {
  let database: TestDatabase | null = null

  afterEach(async () => {
    if (database) {
      await database.cleanup()
      database = null
    }
  })

  it("글 생성 중 예외가 나면 글과 응답 수 증가를 함께 롤백한다", async () => {
    database = await createTestDb()

    const userId = toUserId("dev-user")
    const promptId = toPromptId(1)
    const transactionManager = createRepositoryTransactionManager(database.db)

    const responseCountBefore = await database.db
      .select({ responseCount: writingPrompts.responseCount })
      .from(writingPrompts)
      .where(eq(writingPrompts.id, promptId))
      .limit(1)
      .then((rows) => rows[0]?.responseCount ?? 0)

    await expect(
      transactionManager.run(async ({ writingRepository }) => {
        await writingRepository.create(userId, {
          title: "트랜잭션 테스트",
          bodyJson: {},
          bodyPlainText: "rollback",
          wordCount: 1,
          sourcePromptId: promptId,
          sourceSessionId: null,
        })

        throw new Error("force rollback")
      })
    ).rejects.toThrow("force rollback")

    const writingCount = await database.db
      .select({ count: writings.id })
      .from(writings)
      .where(eq(writings.userId, userId))
      .then((rows) => rows.length)

    const responseCountAfter = await database.db
      .select({ responseCount: writingPrompts.responseCount })
      .from(writingPrompts)
      .where(eq(writingPrompts.id, promptId))
      .limit(1)
      .then((rows) => rows[0]?.responseCount ?? 0)

    expect(writingCount).toBe(0)
    expect(responseCountAfter).toBe(responseCountBefore)
  })

  it("여정 등록 중 예외가 나면 여정 진행 상태와 세션 진행 상태를 함께 롤백한다", async () => {
    database = await createTestDb()

    const userId = toUserId("dev-user")
    const transactionManager = createRepositoryTransactionManager(database.db)

    const journeyId = await database.db
      .insert(journeys)
      .values({
        title: "트랜잭션 여정",
        description: "rollback 확인용",
        category: "writing_skill",
        thumbnailUrl: null,
      })
      .returning({ id: journeys.id })
      .then((rows) => rows[0]?.id)

    if (!journeyId) {
      throw new Error("여정을 생성하지 못했습니다.")
    }

    await database.db.insert(journeySessions).values([
      {
        journeyId,
        order: 1,
        title: "세션 1",
        description: "첫 세션",
        estimatedMinutes: 10,
      },
      {
        journeyId,
        order: 2,
        title: "세션 2",
        description: "둘째 세션",
        estimatedMinutes: 10,
      },
    ])

    await expect(
      transactionManager.run(async ({ progressRepository }) => {
        await progressRepository.enrollJourney(userId, journeyId)
        await progressRepository.initSessionProgressForJourney(
          userId,
          journeyId
        )

        throw new Error("force rollback")
      })
    ).rejects.toThrow("force rollback")

    const journeyProgressRows = await database.db
      .select()
      .from(userJourneyProgress)
      .where(eq(userJourneyProgress.userId, userId))

    const sessionProgressRows = await database.db
      .select()
      .from(userSessionProgress)
      .where(eq(userSessionProgress.userId, userId))

    expect(journeyProgressRows).toHaveLength(0)
    expect(sessionProgressRows).toHaveLength(0)
  })
})
