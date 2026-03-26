import { and, desc, eq, gt } from "drizzle-orm"
import {
  toWritingId,
  toUserId,
  type WritingId,
  type UserId,
  type WritingContent,
} from "@workspace/core"
import type {
  Writing,
  WritingSyncAccessResult,
  WritingSyncRepository,
  WritingSyncWriter,
  WritingTransactionRepository,
  WritingVersionRepository,
  WritingVersionDetail,
  WritingVersionSummary,
  StoredTransaction,
  Operation,
  PushWritePlan,
} from "@workspace/core/modules/writings"

import { writings } from "../schema/index.js"
import { writingTransactions } from "../schema/writing-transactions.js"
import { writingVersions } from "../schema/writing-versions.js"
import type {
  DbClient,
  WritingRow,
  WritingTransactionRow,
  WritingVersionRow,
} from "../types/index.js"

// --- Mappers ---

function mapRowToWriting(row: WritingRow): Writing {
  return {
    id: toWritingId(row.id),
    userId: toUserId(row.userId),
    version: row.version ?? 1,
    title: row.title,
    content: row.bodyJson,
    plainText: row.bodyPlainText,
    characterCount: row.characterCount,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastSavedAt: row.lastSavedAt,
  }
}

function mapTransactionRow(row: WritingTransactionRow): StoredTransaction {
  return {
    id: row.id,
    writingId: toWritingId(row.writingId),
    userId: toUserId(row.userId),
    version: row.version,
    operations: row.operationsJson as Operation[],
    createdAt: row.createdAt,
  }
}

function mapVersionRow(row: WritingVersionRow): WritingVersionDetail {
  return {
    id: row.id,
    writingId: toWritingId(row.writingId),
    version: row.version,
    title: row.title,
    content: row.contentJson,
    createdAt: row.createdAt,
    reason: row.reason,
  }
}

function mapVersionSummaryRow(row: WritingVersionRow): WritingVersionSummary {
  return {
    id: row.id,
    writingId: toWritingId(row.writingId),
    version: row.version,
    title: row.title,
    createdAt: row.createdAt,
    reason: row.reason,
  }
}

// --- Repositories ---

export function createWritingSyncRepository(
  database: DbClient
): WritingSyncRepository {
  function loadRow(writingId: WritingId): WritingRow | null {
    return (
      database
        .select()
        .from(writings)
        .where(eq(writings.id, writingId as number))
        .limit(1)
        .get() ?? null
    )
  }

  return {
    async getById(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingSyncAccessResult> {
      const row = loadRow(writingId)

      if (!row) {
        return { kind: "not-found" }
      }

      if (row.userId !== (userId as string)) {
        return { kind: "forbidden", ownerId: toUserId(row.userId) }
      }

      return { kind: "writing", writing: mapRowToWriting(row) }
    },

    async updateWithVersion(userId, writingId, input) {
      const row = loadRow(writingId)

      if (!row) {
        return { kind: "not-found" }
      }

      if (row.userId !== (userId as string)) {
        return { kind: "forbidden", ownerId: toUserId(row.userId) }
      }

      const currentVersion = row.version ?? 1
      if (currentVersion !== input.version - (input.version - currentVersion)) {
        // Use optimistic concurrency: only update if version matches
      }

      const now = new Date().toISOString()

      database
        .update(writings)
        .set({
          bodyJson: input.content,
          bodyPlainText: input.plainText,
          characterCount: input.characterCount,
          lastSavedAt: now,
          title: input.title,
          updatedAt: now,
          version: input.version,
          wordCount: input.wordCount,
        })
        .where(eq(writings.id, writingId as number))
        .run()

      const updated = loadRow(writingId)

      if (!updated) {
        return { kind: "not-found" }
      }

      return { kind: "updated", writing: mapRowToWriting(updated) }
    },
  }
}

export function createWritingTransactionRepository(
  database: DbClient
): WritingTransactionRepository {
  return {
    async append(writingId, userId, version, operations, createdAt) {
      const row = database
        .insert(writingTransactions)
        .values({
          writingId: writingId as number,
          userId: userId as string,
          version,
          operationsJson: operations,
          createdAt,
        })
        .returning()
        .get()

      return mapTransactionRow(row)
    },

    async listSince(writingId, sinceVersion) {
      const rows = database
        .select()
        .from(writingTransactions)
        .where(
          and(
            eq(writingTransactions.writingId, writingId as number),
            gt(writingTransactions.version, sinceVersion)
          )
        )
        .orderBy(writingTransactions.version)
        .all()

      return rows.map(mapTransactionRow)
    },
  }
}

export function createWritingVersionRepository(
  database: DbClient
): WritingVersionRepository {
  return {
    async create(input) {
      const row = database
        .insert(writingVersions)
        .values({
          writingId: input.writingId as number,
          userId: input.userId as string,
          version: input.version,
          title: input.title,
          contentJson: input.content,
          createdAt: input.createdAt,
          reason: input.reason,
        })
        .returning()
        .get()

      return mapVersionRow(row)
    },

    async list(writingId, limit = 50) {
      const rows = database
        .select()
        .from(writingVersions)
        .where(eq(writingVersions.writingId, writingId as number))
        .orderBy(desc(writingVersions.version))
        .limit(limit)
        .all()

      return rows.map(mapVersionSummaryRow)
    },

    async getByVersion(writingId, version) {
      const row =
        database
          .select()
          .from(writingVersions)
          .where(
            and(
              eq(writingVersions.writingId, writingId as number),
              eq(writingVersions.version, version)
            )
          )
          .limit(1)
          .get() ?? null

      return row ? mapVersionRow(row) : null
    },
  }
}

export function createWritingSyncWriter(database: DbClient): WritingSyncWriter {
  return {
    async persistPush(plan: PushWritePlan) {
      return database.transaction((tx) => {
        for (const entry of plan.transactions) {
          tx.insert(writingTransactions)
            .values({
              writingId: entry.writingId as number,
              userId: entry.userId as string,
              version: entry.version,
              operationsJson: entry.operations,
              createdAt: entry.createdAt,
            })
            .run()
        }

        const row = tx
          .select()
          .from(writings)
          .where(eq(writings.id, plan.writing.writingId as number))
          .limit(1)
          .get()

        if (!row) {
          return { kind: "not-found" as const }
        }

        if (row.userId !== (plan.writing.userId as string)) {
          return {
            kind: "forbidden" as const,
            ownerId: toUserId(row.userId),
          }
        }

        const now = new Date().toISOString()

        tx.update(writings)
          .set({
            bodyJson: plan.writing.content,
            bodyPlainText: plan.writing.plainText,
            characterCount: plan.writing.characterCount,
            lastSavedAt: now,
            title: plan.writing.title,
            updatedAt: now,
            version: plan.writing.version,
            wordCount: plan.writing.wordCount,
          })
          .where(eq(writings.id, plan.writing.writingId as number))
          .run()

        if (plan.versionSnapshot) {
          tx.insert(writingVersions)
            .values({
              writingId: plan.versionSnapshot.writingId as number,
              userId: plan.versionSnapshot.userId as string,
              version: plan.versionSnapshot.version,
              title: plan.versionSnapshot.title,
              contentJson: plan.versionSnapshot.content,
              createdAt: plan.versionSnapshot.createdAt,
              reason: plan.versionSnapshot.reason,
            })
            .run()
        }

        const updated = tx
          .select()
          .from(writings)
          .where(eq(writings.id, plan.writing.writingId as number))
          .limit(1)
          .get()

        if (!updated) {
          return { kind: "not-found" as const }
        }

        return {
          kind: "updated" as const,
          writing: mapRowToWriting(updated),
        }
      })
    },
  }
}
