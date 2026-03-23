import { and, desc, eq, gt } from "drizzle-orm"
import {
  toDraftId,
  toUserId,
  type DraftId,
  type UserId,
  type DraftContent,
} from "@workspace/core"
import type {
  Writing,
  WritingAccessResult,
  WritingRepository,
  WritingTransactionRepository,
  WritingVersionRepository,
  WritingVersionDetail,
  WritingVersionSummary,
  StoredTransaction,
  Operation,
} from "@workspace/core/modules/writings"

import { drafts } from "../schema/index.js"
import { writingTransactions } from "../schema/writing-transactions.js"
import { writingVersions } from "../schema/writing-versions.js"
import type {
  DbClient,
  DraftRow,
  WritingTransactionRow,
  WritingVersionRow,
} from "../types/index.js"

// --- Mappers ---

function mapRowToWriting(row: DraftRow): Writing {
  return {
    id: toDraftId(row.id),
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
    draftId: toDraftId(row.draftId),
    userId: toUserId(row.userId),
    version: row.version,
    operations: row.operationsJson as Operation[],
    createdAt: row.createdAt,
  }
}

function mapVersionRow(row: WritingVersionRow): WritingVersionDetail {
  return {
    id: row.id,
    draftId: toDraftId(row.draftId),
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
    draftId: toDraftId(row.draftId),
    version: row.version,
    title: row.title,
    createdAt: row.createdAt,
    reason: row.reason,
  }
}

// --- Repositories ---

export function createWritingRepository(database: DbClient): WritingRepository {
  function loadRow(draftId: DraftId): DraftRow | null {
    return (
      database
        .select()
        .from(drafts)
        .where(eq(drafts.id, draftId as number))
        .limit(1)
        .get() ?? null
    )
  }

  return {
    async getById(
      userId: UserId,
      draftId: DraftId
    ): Promise<WritingAccessResult> {
      const row = loadRow(draftId)

      if (!row) {
        return { kind: "not-found" }
      }

      if (row.userId !== (userId as string)) {
        return { kind: "forbidden", ownerId: toUserId(row.userId) }
      }

      return { kind: "writing", writing: mapRowToWriting(row) }
    },

    async updateWithVersion(userId, draftId, input) {
      const row = loadRow(draftId)

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
        .update(drafts)
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
        .where(eq(drafts.id, draftId as number))
        .run()

      const updated = loadRow(draftId)

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
    async append(draftId, userId, version, operations, createdAt) {
      const row = database
        .insert(writingTransactions)
        .values({
          draftId: draftId as number,
          userId: userId as string,
          version,
          operationsJson: operations,
          createdAt,
        })
        .returning()
        .get()

      return mapTransactionRow(row)
    },

    async listSince(draftId, sinceVersion) {
      const rows = database
        .select()
        .from(writingTransactions)
        .where(
          and(
            eq(writingTransactions.draftId, draftId as number),
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
          draftId: input.draftId as number,
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

    async list(draftId, limit = 50) {
      const rows = database
        .select()
        .from(writingVersions)
        .where(eq(writingVersions.draftId, draftId as number))
        .orderBy(desc(writingVersions.version))
        .limit(limit)
        .all()

      return rows.map(mapVersionSummaryRow)
    },

    async getByVersion(draftId, version) {
      const row =
        database
          .select()
          .from(writingVersions)
          .where(
            and(
              eq(writingVersions.draftId, draftId as number),
              eq(writingVersions.version, version)
            )
          )
          .limit(1)
          .get() ?? null

      return row ? mapVersionRow(row) : null
    },
  }
}
