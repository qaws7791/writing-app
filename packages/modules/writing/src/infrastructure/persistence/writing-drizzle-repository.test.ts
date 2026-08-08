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

import { createWritingModule } from "#writing/module"
import { writingLearnerDataPurge } from "#writing/infrastructure/persistence/learner-purge"
import {
  writingEvents,
  writings,
} from "#writing/infrastructure/persistence/schema"

const learnerId = learnerIdSchema.parse("learner-1")
const otherLearnerId = learnerIdSchema.parse("learner-2")
const writingId = writingIdSchema.parse("writing-1")
const now = new Date("2026-08-08T03:00:00.000Z")

describe("writing SQLite repository", () => {
  it("글 작성·점검·수정 전이와 version 충돌을 원자적으로 저장한다", async () => {
    await withWritingDatabase(async (client) => {
      const application = createApplication(client)

      const created = await application.create({ learnerId, mode: "free" })
      const saved = (
        await application.save({
          body: "첫 문장입니다.",
          expectedVersion: created.version,
          learnerId,
          title: "첫 글",
          writingId: created.id,
        })
      )._unsafeUnwrap()
      const checking = (
        await application.startSelfCheck({
          expectedVersion: saved.version,
          learnerId,
          writingId: saved.id,
        })
      )._unsafeUnwrap()
      const checked = (
        await application.completeSelfCheck({
          expectedVersion: checking.version,
          learnerId,
          writingId: checking.id,
        })
      )._unsafeUnwrap()
      const revised = (
        await application.save({
          body: "다듬은 첫 문장입니다.",
          expectedVersion: checked.version,
          learnerId,
          title: checked.title,
          writingId: checked.id,
        })
      )._unsafeUnwrap()

      expect(revised).toMatchObject({
        checkedAt: null,
        status: "drafting",
        version: 4,
      })
      expect(
        (
          await application.save({
            body: "오래된 저장",
            expectedVersion: checked.version,
            learnerId,
            title: "충돌",
            writingId: checked.id,
          })
        )._unsafeUnwrapErr()
      ).toEqual({ kind: "writing-version-conflict" })
      expect(
        (
          await application.get({ learnerId, writingId: revised.id })
        )._unsafeUnwrap()
      ).toMatchObject({ body: "다듬은 첫 문장입니다.", title: "첫 글" })
      expect(
        (
          await application.get({
            learnerId: otherLearnerId,
            writingId: revised.id,
          })
        )._unsafeUnwrapErr()
      ).toEqual({ kind: "writing-not-found" })

      expect(
        client.db
          .select({ eventType: writingEvents.eventType })
          .from(writingEvents)
          .where(eq(writingEvents.writingId, writingId))
          .all()
          .map(({ eventType }) => eventType)
          .sort()
      ).toEqual([
        "revised_after_self_check",
        "self_check_completed",
        "self_check_started",
        "writing_created",
      ])
    })
  })

  it("삭제 event는 원문 삭제 뒤 남고 학습자 purge에서 함께 제거된다", async () => {
    await withWritingDatabase(async (client) => {
      const application = createApplication(client)
      const created = await application.create({ learnerId, mode: "argue" })

      expect(
        (
          await application.delete({
            expectedVersion: created.version,
            learnerId,
            writingId: created.id,
          })
        )._unsafeUnwrap()
      ).toBe(writingId)
      expect(client.db.select().from(writings).all()).toEqual([])
      expect(
        client.db
          .select({ eventType: writingEvents.eventType })
          .from(writingEvents)
          .all()
          .map(({ eventType }) => eventType)
          .sort()
      ).toEqual(["writing_created", "writing_deleted"])

      client.db.transaction((transaction) => {
        writingLearnerDataPurge.purge(transaction, [learnerId])
      })
      expect(client.db.select().from(writingEvents).all()).toEqual([])
    })
  })
})

function createApplication(client: WritingAppDatabaseClient) {
  return createWritingModule({
    clock: { now: () => now },
    database: client.db,
    idGenerator: { next: () => writingId },
  }).application
}

async function withWritingDatabase(
  run: (client: WritingAppDatabaseClient) => Promise<void>
): Promise<void> {
  const client = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(client.sqlite)
    aLearner(client.sqlite, { id: learnerId })
    aLearner(client.sqlite, { id: otherLearnerId })
    await run(client)
  } finally {
    client.close()
  }
}
