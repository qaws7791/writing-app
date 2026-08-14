import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm"
import {
  writingCheckResultSchema,
  writingDifficultySchema,
  writingDomainSchema,
  writingIdSchema,
  writingTaskIdSchema,
  writingTaskPublicationIdSchema,
} from "@workspace/contracts/writing/writing"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"

import type { WritingRepository } from "#writing/application/ports/writing-ports"
import type { WritingCheckResult } from "#writing/domain/writing-check"
import type { WritingEventType, WritingPiece } from "#writing/domain/writing"
import type {
  WritingTaskDraft,
  WritingTaskPublication,
} from "#writing/domain/writing-task"
import {
  writingAiNotices,
  writingChecks,
  writingEvents,
  writings,
  writingTaskPublications,
  writingTasks,
} from "#writing/infrastructure/persistence/schema"

export function createDrizzleWritingRepository(
  database: WritingAppDatabase
): WritingRepository {
  return {
    async acknowledgeAiNotice(input) {
      database
        .insert(writingAiNotices)
        .values({
          acknowledgedAt: input.now,
          userId: input.learnerId,
        })
        .onConflictDoNothing()
        .run()
    },
    async countSuccessfulChecksInRange(input) {
      const row = database
        .select({ value: count() })
        .from(writingChecks)
        .innerJoin(writings, eq(writingChecks.writingId, writings.id))
        .where(
          and(
            eq(writings.userId, input.learnerId),
            gte(writingChecks.succeededAt, input.from),
            lt(writingChecks.succeededAt, input.to)
          )
        )
        .get()
      return row?.value ?? 0
    },
    async createCheck(input) {
      database.transaction((transaction) => {
        transaction
          .insert(writingChecks)
          .values({
            bodyVersion: input.bodyVersion,
            id: input.id,
            resultJson: JSON.stringify(input.result),
            succeededAt: input.now,
            writingId: input.writing.id,
          })
          .onConflictDoUpdate({
            set: {
              bodyVersion: input.bodyVersion,
              id: input.id,
              resultJson: JSON.stringify(input.result),
              succeededAt: input.now,
            },
            target: writingChecks.writingId,
          })
          .run()
        insertEvents(transaction, input.writing, [input.eventType], input.now)
      })
    },
    async createPiece(writing, eventType) {
      database.transaction((transaction) => {
        transaction.insert(writings).values(toWritingValues(writing)).run()
        insertEvents(transaction, writing, [eventType], writing.createdAt)
      })
    },
    async createTask(draft) {
      database.insert(writingTasks).values(toTaskValues(draft)).run()
    },
    async deletePiece(input) {
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
            ? err({ kind: "writing-version-conflict" as const })
            : err({ kind: "writing-not-found" as const })
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
    async findLatestPublicationByTaskId(taskId) {
      const row = database
        .select({
          publication: writingTaskPublications,
        })
        .from(writingTasks)
        .innerJoin(
          writingTaskPublications,
          eq(writingTasks.latestPublicationId, writingTaskPublications.id)
        )
        .where(eq(writingTasks.id, taskId))
        .get()
      return row === undefined ? null : toPublication(row.publication)
    },
    async findPieceById(input) {
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
    async findPublicationById(publicationId) {
      const row = database
        .select()
        .from(writingTaskPublications)
        .where(eq(writingTaskPublications.id, publicationId))
        .get()
      return row === undefined ? null : toPublication(row)
    },
    async findTaskById(taskId) {
      const row = database
        .select()
        .from(writingTasks)
        .where(eq(writingTasks.id, taskId))
        .get()
      return row === undefined ? null : toTask(row)
    },
    async findLatestCheck(writingId) {
      const row = database
        .select()
        .from(writingChecks)
        .where(eq(writingChecks.writingId, writingId))
        .orderBy(desc(writingChecks.succeededAt), desc(writingChecks.id))
        .get()
      return row === undefined ? null : parseCheckResult(row.resultJson)
    },
    async hasAcknowledgedAiNotice(learnerId) {
      return (
        database
          .select({ userId: writingAiNotices.userId })
          .from(writingAiNotices)
          .where(eq(writingAiNotices.userId, learnerId))
          .get() !== undefined
      )
    },
    async hasSucceededCheck(writingId) {
      return (
        database
          .select({ id: writingChecks.id })
          .from(writingChecks)
          .where(eq(writingChecks.writingId, writingId))
          .get() !== undefined
      )
    },
    async listCatalog(input) {
      const rows = database
        .select({
          publication: writingTaskPublications,
          taskId: writingTasks.id,
        })
        .from(writingTasks)
        .innerJoin(
          writingTaskPublications,
          eq(writingTasks.latestPublicationId, writingTaskPublications.id)
        )
        .where(
          and(
            input.domain === undefined
              ? undefined
              : eq(writingTaskPublications.domain, input.domain),
            input.typeName === undefined
              ? undefined
              : eq(writingTaskPublications.typeName, input.typeName)
          )
        )
        .orderBy(
          desc(writingTaskPublications.publishedAt),
          desc(writingTasks.id)
        )
        .all()

      return rows.map((row) => {
        const publication = toPublication(row.publication)
        return {
          audience: publication.audience,
          difficulty: publication.difficulty,
          domain: publication.domain,
          goalChars: publication.goalChars,
          publicationId: publication.id,
          situation: publication.situation,
          taskId: writingTaskIdSchema.parse(row.taskId),
          title: publication.title,
          typeName: publication.typeName,
        }
      })
    },
    async listPiecesByLearner(learnerId) {
      const rows = database
        .select({
          publication: writingTaskPublications,
          writing: writings,
        })
        .from(writings)
        .innerJoin(
          writingTaskPublications,
          eq(writings.publicationId, writingTaskPublications.id)
        )
        .where(eq(writings.userId, learnerId))
        .orderBy(desc(writings.updatedAt), desc(writings.id))
        .all()

      return rows.map((row) => ({
        brief: {
          difficulty: writingDifficultySchema.parse(row.publication.difficulty),
          domain: writingDomainSchema.parse(row.publication.domain),
          title: row.publication.title,
          typeName: row.publication.typeName,
        },
        writing: toWriting(row.writing),
      }))
    },
    async listTasks(filter) {
      const conditions = [
        filter.query.length === 0
          ? undefined
          : sql`instr(lower(${writingTasks.title}), lower(${filter.query})) > 0`,
        filter.domain === undefined
          ? undefined
          : eq(writingTasks.domain, filter.domain),
        filter.status === "draft"
          ? sql`${writingTasks.latestPublicationId} IS NULL`
          : filter.status === "published"
            ? sql`${writingTasks.latestPublicationId} IS NOT NULL`
            : undefined,
      ]
      const where = and(...conditions)
      const total =
        database
          .select({ value: count() })
          .from(writingTasks)
          .where(where)
          .get()?.value ?? 0
      const rows = database
        .select()
        .from(writingTasks)
        .where(where)
        .orderBy(desc(writingTasks.updatedAt), desc(writingTasks.id))
        .limit(filter.pageSize)
        .offset((filter.page - 1) * filter.pageSize)
        .all()

      return {
        items: rows.map(toTask),
        page: filter.page,
        pageSize: filter.pageSize,
        totalItems: total,
      }
    },
    async publishTask(input) {
      return database.transaction((transaction) => {
        transaction
          .insert(writingTaskPublications)
          .values(toPublicationValues(input.publication))
          .run()
        const updated = transaction
          .update(writingTasks)
          .set(toTaskValues(input.draft))
          .where(
            and(
              eq(writingTasks.id, input.draft.id),
              eq(writingTasks.editVersion, input.expectedEditVersion)
            )
          )
          .returning()
          .get()

        if (updated === undefined) {
          return taskExists(transaction, input.draft.id)
            ? err({ kind: "writing-task-version-conflict" as const })
            : err({ kind: "writing-task-not-found" as const })
        }
        return ok(toTask(updated))
      })
    },
    async savePiece(input) {
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
            ? err({ kind: "writing-version-conflict" as const })
            : err({ kind: "writing-not-found" as const })
        }

        insertEvents(
          transaction,
          input.writing,
          input.eventTypes,
          input.writing.updatedAt
        )
        return ok(toWriting(updated))
      })
    },
    async saveTask(input) {
      const updated = database
        .update(writingTasks)
        .set(toTaskValues(input.draft))
        .where(
          and(
            eq(writingTasks.id, input.draft.id),
            eq(writingTasks.editVersion, input.expectedEditVersion)
          )
        )
        .returning()
        .get()

      if (updated === undefined) {
        return taskExists(database, input.draft.id)
          ? err({ kind: "writing-task-version-conflict" as const })
          : err({ kind: "writing-task-not-found" as const })
      }
      return ok(toTask(updated))
    },
  }
}

function insertEvents(
  database: WritingAppDatabase,
  writing: WritingPiece,
  eventTypes: readonly WritingEventType[],
  recordedAt: Date
): void {
  if (eventTypes.length === 0) return

  database
    .insert(writingEvents)
    .values(
      eventTypes.map((eventType) => ({
        eventType,
        recordedAt,
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

function taskExists(database: WritingAppDatabase, taskId: string): boolean {
  return (
    database
      .select({ id: writingTasks.id })
      .from(writingTasks)
      .where(eq(writingTasks.id, taskId))
      .get() !== undefined
  )
}

function toWritingValues(writing: WritingPiece) {
  return {
    body: writing.body,
    createdAt: writing.createdAt,
    id: writing.id,
    publicationId: writing.publicationId,
    updatedAt: writing.updatedAt,
    userId: writing.learnerId,
    version: writing.version,
  }
}

function toWriting(row: typeof writings.$inferSelect): WritingPiece {
  return {
    body: row.body,
    createdAt: row.createdAt,
    id: writingIdSchema.parse(row.id),
    learnerId: learnerIdSchema.parse(row.userId),
    publicationId: writingTaskPublicationIdSchema.parse(row.publicationId),
    updatedAt: row.updatedAt,
    version: row.version,
  }
}

function toTaskValues(draft: WritingTaskDraft) {
  return {
    audience: draft.audience,
    createdAt: draft.createdAt,
    difficulty: draft.difficulty,
    domain: draft.domain,
    editVersion: draft.editVersion,
    goalChars: draft.goalChars,
    id: draft.id,
    latestPublicationId: draft.latestPublicationId,
    minChars: draft.minChars,
    requiredElementsJson: JSON.stringify(draft.requiredElements),
    situation: draft.situation,
    title: draft.title,
    typeName: draft.typeName,
    updatedAt: draft.updatedAt,
  }
}

function toTask(row: typeof writingTasks.$inferSelect): WritingTaskDraft {
  return {
    audience: row.audience,
    createdAt: row.createdAt,
    difficulty: writingDifficultySchema.parse(row.difficulty),
    domain: writingDomainSchema.parse(row.domain),
    editVersion: row.editVersion,
    goalChars: row.goalChars,
    id: writingTaskIdSchema.parse(row.id),
    latestPublicationId:
      row.latestPublicationId === null
        ? null
        : writingTaskPublicationIdSchema.parse(row.latestPublicationId),
    minChars: row.minChars,
    requiredElements: parseStringArray(row.requiredElementsJson),
    situation: row.situation,
    title: row.title,
    typeName: row.typeName,
    updatedAt: row.updatedAt,
  }
}

function toPublicationValues(publication: WritingTaskPublication) {
  return {
    audience: publication.audience,
    difficulty: publication.difficulty,
    domain: publication.domain,
    goalChars: publication.goalChars,
    id: publication.id,
    minChars: publication.minChars,
    publishedAt: publication.publishedAt,
    requiredElementsJson: JSON.stringify(publication.requiredElements),
    situation: publication.situation,
    taskId: publication.taskId,
    title: publication.title,
    typeName: publication.typeName,
  }
}

function toPublication(
  row: typeof writingTaskPublications.$inferSelect
): WritingTaskPublication {
  return {
    audience: row.audience,
    difficulty: writingDifficultySchema.parse(row.difficulty),
    domain: writingDomainSchema.parse(row.domain),
    goalChars: row.goalChars,
    id: writingTaskPublicationIdSchema.parse(row.id),
    minChars: row.minChars,
    publishedAt: row.publishedAt,
    requiredElements: parseStringArray(row.requiredElementsJson),
    situation: row.situation,
    taskId: writingTaskIdSchema.parse(row.taskId),
    title: row.title,
    typeName: row.typeName,
  }
}

function parseCheckResult(value: string): WritingCheckResult {
  return writingCheckResultSchema.parse(JSON.parse(value))
}

function parseStringArray(value: string): readonly string[] {
  const parsed: unknown = JSON.parse(value)
  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== "string")
  ) {
    throw new Error("쓰기 과제 필수 요소가 올바르지 않습니다.")
  }
  return parsed
}
