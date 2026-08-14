import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import {
  writingCheckIdSchema,
  writingIdSchema,
} from "@workspace/contracts/writing/writing"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { aLearner } from "@workspace/identity/test-fixtures"

import { createDrizzleWritingRepository } from "#writing/infrastructure/persistence/writing-drizzle-repository"
import { writingEvents } from "#writing/infrastructure/persistence/schema"
import { aWriting } from "#writing/test/fixtures/a-writing"

const learnerId = learnerIdSchema.parse("learner-writing-repository")
const writingId = writingIdSchema.parse("writing-repository")
const firstSaveAt = new Date("2026-08-10T01:00:00.000Z")
const staleSaveAt = new Date("2026-08-10T01:00:01.000Z")

describe("writing SQLite repository", () => {
  it("같은 version을 읽은 두 저장 중 첫 저장만 반영한다", async () => {
    await withWritingDatabase(async (client) => {
      const repository = createDrizzleWritingRepository(client.db)
      const firstSnapshot = await readWriting(repository)
      const staleSnapshot = await readWriting(repository)

      const firstResult = await repository.savePiece({
        eventTypes: [],
        expectedVersion: firstSnapshot.version,
        writing: {
          ...firstSnapshot,
          body: "서버에 먼저 저장된 본문",
          updatedAt: firstSaveAt,
          version: firstSnapshot.version + 1,
        },
      })
      if (firstResult.isErr()) {
        throw new Error(`첫 저장이 실패했습니다: ${firstResult.error.kind}`)
      }

      const staleResult = await repository.savePiece({
        eventTypes: [],
        expectedVersion: staleSnapshot.version,
        writing: {
          ...staleSnapshot,
          body: "뒤늦게 도착한 본문",
          updatedAt: staleSaveAt,
          version: staleSnapshot.version + 1,
        },
      })

      expect(staleResult._unsafeUnwrapErr()).toEqual({
        kind: "writing-version-conflict",
      })
      await expect(readWriting(repository)).resolves.toMatchObject({
        body: "서버에 먼저 저장된 본문",
        updatedAt: firstSaveAt,
        version: 1,
      })
    })
  })

  it("삭제 event 저장이 실패하면 글 삭제도 rollback한다", async () => {
    await withWritingDatabase(async (client) => {
      const repository = createDrizzleWritingRepository(client.db)
      client.sqlite.exec(`
        CREATE TRIGGER fail_writing_deletion_event
        BEFORE INSERT ON writing_events
        WHEN NEW.event_type = 'writing_deleted'
        BEGIN
          SELECT RAISE(ABORT, 'forced writing deletion event failure');
        END;
      `)

      await expect(
        repository.deletePiece({
          eventType: "writing_deleted",
          expectedVersion: 0,
          learnerId,
          now: new Date("2026-08-10T02:00:00.000Z"),
          writingId,
        })
      ).rejects.toThrow("forced writing deletion event failure")

      const eventTypes = client.db
        .select({ eventType: writingEvents.eventType })
        .from(writingEvents)
        .where(eq(writingEvents.writingId, writingId))
        .all()
        .map(({ eventType }) => eventType)

      expect({
        eventTypes,
        writing: await readWriting(repository),
      }).toEqual({
        eventTypes: ["writing_created"],
        writing: expect.objectContaining({
          body: "Test writing body",
          id: writingId,
          version: 0,
        }),
      })
    })
  })

  it("본문이 바뀌어도 최근 점검을 조회하고 새 점검이 그 1건을 바꾼다", async () => {
    await withWritingDatabase(async (client) => {
      const repository = createDrizzleWritingRepository(client.db)
      const writing = await readWriting(repository)
      const firstResult = {
        revisions: [],
        strengths: ["첫 점검"],
        unmetRequirements: [],
      }
      const secondResult = {
        revisions: [],
        strengths: ["둘째 점검"],
        unmetRequirements: [],
      }

      await repository.createCheck({
        bodyVersion: writing.version,
        eventType: "check_succeeded",
        id: writingCheckIdSchema.parse("check-first"),
        now: firstSaveAt,
        result: firstResult,
        writing,
      })

      const saved = await repository.savePiece({
        eventTypes: ["revised_after_check"],
        expectedVersion: writing.version,
        writing: {
          ...writing,
          body: "고친 본문",
          updatedAt: staleSaveAt,
          version: writing.version + 1,
        },
      })
      if (saved.isErr()) {
        throw new Error(`본문 저장이 실패했습니다: ${saved.error.kind}`)
      }

      await expect(repository.findLatestCheck(writingId)).resolves.toEqual(
        firstResult
      )

      await repository.createCheck({
        bodyVersion: saved.value.version,
        eventType: "check_succeeded",
        id: writingCheckIdSchema.parse("check-second"),
        now: staleSaveAt,
        result: secondResult,
        writing: saved.value,
      })

      await expect(repository.findLatestCheck(writingId)).resolves.toEqual(
        secondResult
      )
      expect(
        client.sqlite
          .query<{ count: number }, []>(
            `SELECT COUNT(*) AS count FROM writing_checks WHERE writing_id = '${writingId}'`
          )
          .get()
      ).toEqual({ count: 1 })
    })
  })
})

type WritingRepository = ReturnType<typeof createDrizzleWritingRepository>

async function readWriting(repository: WritingRepository) {
  const writing = await repository.findPieceById({ learnerId, writingId })
  if (writing === null) throw new Error("쓰기 fixture를 찾을 수 없습니다.")
  return writing
}

async function withWritingDatabase(
  run: (client: WritingAppDatabaseClient) => Promise<void>
): Promise<void> {
  const client = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(client.sqlite)
    aLearner(client.sqlite, { id: learnerId })
    aWriting(client.sqlite, { id: writingId, userId: learnerId })
    await run(client)
  } finally {
    client.close()
  }
}
