import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { writingIdSchema } from "@workspace/contracts/writing/writing"
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

      const firstResult = await repository.save({
        eventTypes: [],
        expectedVersion: firstSnapshot.version,
        writing: {
          ...firstSnapshot,
          body: "서버에 먼저 저장된 본문",
          title: "서버에 먼저 저장된 제목",
          updatedAt: firstSaveAt,
          version: firstSnapshot.version + 1,
        },
      })
      if (firstResult.isErr()) {
        throw new Error(`첫 저장이 실패했습니다: ${firstResult.error.kind}`)
      }

      const staleResult = await repository.save({
        eventTypes: [],
        expectedVersion: staleSnapshot.version,
        writing: {
          ...staleSnapshot,
          body: "뒤늦게 도착한 본문",
          title: "뒤늦게 도착한 제목",
          updatedAt: staleSaveAt,
          version: staleSnapshot.version + 1,
        },
      })

      expect(staleResult._unsafeUnwrapErr()).toEqual({
        kind: "writing-version-conflict",
      })
      await expect(readWriting(repository)).resolves.toMatchObject({
        body: "서버에 먼저 저장된 본문",
        title: "서버에 먼저 저장된 제목",
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
        repository.delete({
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
          title: "Test writing",
          version: 0,
        }),
      })
    })
  })
})

type WritingRepository = ReturnType<typeof createDrizzleWritingRepository>

async function readWriting(repository: WritingRepository) {
  const writing = await repository.findById({ learnerId, writingId })
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
