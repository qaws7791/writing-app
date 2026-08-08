import { and, desc, eq } from "drizzle-orm"
import {
  writingIdSchema,
  writingModeSchema,
  writingStatusSchema,
} from "@workspace/contracts/writing/writing"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"

import type { WritingRepository } from "#writing/application/ports/writing-ports"
import type { Writing, WritingEventType } from "#writing/domain/writing"
import {
  writingEvents,
  writings,
} from "#writing/infrastructure/persistence/schema"

export function createDrizzleWritingRepository(
  database: WritingAppDatabase
): WritingRepository {
  return {
    async create(writing, eventType) {
      database.transaction((transaction) => {
        transaction.insert(writings).values(toWritingValues(writing)).run()
        insertEvents(transaction, writing, [eventType])
      })
    },
    async delete(input) {
      return database.transaction((transaction) => {
        const deleted = transaction
          .delete(writings)
          .where(
            and(
              eq(writings.id, input.writingId),
              eq(writings.userId, input.learnerId),
              eq(writings.version, input.expectedVersion)
            )
          )
          .returning({ id: writings.id })
          .get()

        if (deleted === undefined) {
          return writingExists(transaction, input)
            ? err({ kind: "writing-version-conflict" })
            : err({ kind: "writing-not-found" })
        }

        transaction
          .insert(writingEvents)
          .values({
            eventType: input.eventType,
            recordedAt: input.now,
            userId: input.learnerId,
            writingId: input.writingId,
          })
          .onConflictDoNothing()
          .run()
        return ok(writingIdSchema.parse(deleted.id))
      })
    },
    async findById(input) {
      const row = database
        .select()
        .from(writings)
        .where(
          and(
            eq(writings.id, input.writingId),
            eq(writings.userId, input.learnerId)
          )
        )
        .get()
      return row === undefined ? null : toWriting(row)
    },
    async listByLearner(learnerId) {
      return database
        .select()
        .from(writings)
        .where(eq(writings.userId, learnerId))
        .orderBy(desc(writings.updatedAt), desc(writings.id))
        .all()
        .map(toWriting)
    },
    async save(input) {
      return database.transaction((transaction) => {
        const updated = transaction
          .update(writings)
          .set(toWritingValues(input.writing))
          .where(
            and(
              eq(writings.id, input.writing.id),
              eq(writings.userId, input.writing.learnerId),
              eq(writings.version, input.expectedVersion)
            )
          )
          .returning()
          .get()

        if (updated === undefined) {
          return writingExists(transaction, {
            learnerId: input.writing.learnerId,
            writingId: input.writing.id,
          })
            ? err({ kind: "writing-version-conflict" })
            : err({ kind: "writing-not-found" })
        }

        insertEvents(transaction, input.writing, input.eventTypes)
        return ok(toWriting(updated))
      })
    },
  }
}

function insertEvents(
  database: WritingAppDatabase,
  writing: Writing,
  eventTypes: readonly WritingEventType[]
): void {
  if (eventTypes.length === 0) return

  database
    .insert(writingEvents)
    .values(
      eventTypes.map((eventType) => ({
        eventType,
        recordedAt: writing.updatedAt,
        userId: writing.learnerId,
        writingId: writing.id,
      }))
    )
    .onConflictDoNothing()
    .run()
}

function writingExists(
  database: WritingAppDatabase,
  input: Readonly<{ learnerId: string; writingId: string }>
): boolean {
  return (
    database
      .select({ id: writings.id })
      .from(writings)
      .where(
        and(
          eq(writings.id, input.writingId),
          eq(writings.userId, input.learnerId)
        )
      )
      .get() !== undefined
  )
}

function toWritingValues(writing: Writing) {
  return {
    body: writing.body,
    checkedAt: writing.checkedAt,
    createdAt: writing.createdAt,
    id: writing.id,
    mode: writing.mode,
    selfCheckStartedAt: writing.selfCheckStartedAt,
    status: writing.status,
    title: writing.title,
    updatedAt: writing.updatedAt,
    userId: writing.learnerId,
    version: writing.version,
  }
}

function toWriting(row: typeof writings.$inferSelect): Writing {
  return {
    body: row.body,
    checkedAt: row.checkedAt,
    createdAt: row.createdAt,
    id: writingIdSchema.parse(row.id),
    learnerId: learnerIdSchema.parse(row.userId),
    mode: writingModeSchema.parse(row.mode),
    selfCheckStartedAt: row.selfCheckStartedAt,
    status: writingStatusSchema.parse(row.status),
    title: row.title,
    updatedAt: row.updatedAt,
    version: row.version,
  }
}
