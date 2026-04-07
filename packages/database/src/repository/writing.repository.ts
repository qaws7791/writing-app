import { and, desc, eq, lt, or, sql } from "drizzle-orm"

import { writings, type WritingStatus } from "../schema/writings"
import { writingPrompts } from "../schema/writing-prompts"
import type { DbClient, WritingRow } from "../types/index"

export type WritingSummary = {
  id: number
  title: string
  preview: string
  wordCount: number
  status: string
  sourcePromptId: number | null
  sourceSessionId: number | null
  createdAt: Date
  updatedAt: Date
}

export type WritingDetail = WritingSummary & {
  bodyJson: unknown
  bodyPlainText: string
}

export type WritingCreateInput = {
  title: string
  bodyJson: unknown
  bodyPlainText: string
  wordCount: number
  sourcePromptId?: number | null
  sourceSessionId?: number | null
}

export type WritingUpdateInput = {
  title?: string
  bodyJson?: unknown
  bodyPlainText?: string
  wordCount?: number
  status?: WritingStatus
}

export type WritingRepository = {
  create: (userId: string, input: WritingCreateInput) => Promise<WritingDetail>
  delete: (
    userId: string,
    writingId: number
  ) => Promise<
    { kind: "deleted" } | { kind: "not-found" } | { kind: "forbidden" }
  >
  getById: (userId: string, writingId: number) => Promise<WritingDetail | null>
  list: (
    userId: string,
    params?: { limit?: number; cursor?: string }
  ) => Promise<{ items: WritingSummary[]; nextCursor: string | null }>
  update: (
    userId: string,
    writingId: number,
    input: WritingUpdateInput
  ) => Promise<
    | { kind: "updated"; writing: WritingDetail }
    | { kind: "not-found" }
    | { kind: "forbidden" }
  >
  resume: (userId: string) => Promise<WritingSummary | null>
}

function createPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

function mapWritingSummary(row: WritingRow): WritingSummary {
  return {
    id: row.id,
    title: row.title,
    preview: createPreview(row.bodyPlainText),
    wordCount: row.wordCount,
    status: row.status,
    sourcePromptId: row.sourcePromptId,
    sourceSessionId: row.sourceSessionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapWritingDetail(row: WritingRow): WritingDetail {
  return {
    ...mapWritingSummary(row),
    bodyJson: row.bodyJson,
    bodyPlainText: row.bodyPlainText,
  }
}

export function createWritingRepository(database: DbClient): WritingRepository {
  async function loadRow(writingId: number): Promise<WritingRow | null> {
    return database
      .select()
      .from(writings)
      .where(eq(writings.id, writingId))
      .limit(1)
      .then((rows) => rows[0] ?? null)
  }

  return {
    async create(userId, input) {
      const now = new Date()
      const created = await database
        .insert(writings)
        .values({
          userId,
          title: input.title,
          bodyJson: input.bodyJson,
          bodyPlainText: input.bodyPlainText,
          wordCount: input.wordCount,
          sourcePromptId: input.sourcePromptId ?? null,
          sourceSessionId: input.sourceSessionId ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .then((rows) => rows[0])

      if (!created) {
        throw new Error("글을 생성하지 못했습니다.")
      }

      if (input.sourcePromptId) {
        await database
          .update(writingPrompts)
          .set({
            responseCount: sql`${writingPrompts.responseCount} + 1`,
          })
          .where(eq(writingPrompts.id, input.sourcePromptId))
      }

      return mapWritingDetail(created)
    },

    async delete(userId, writingId) {
      const row = await loadRow(writingId)
      if (!row) return { kind: "not-found" }
      if (row.userId !== userId) return { kind: "forbidden" }

      await database.delete(writings).where(eq(writings.id, writingId))
      return { kind: "deleted" }
    },

    async getById(userId, writingId) {
      const row = await loadRow(writingId)
      if (!row || row.userId !== userId) return null
      return mapWritingDetail(row)
    },

    async list(userId, params = {}) {
      const limit = params.limit ?? 20

      let cursorCondition
      if (params.cursor) {
        const decoded = JSON.parse(
          Buffer.from(params.cursor, "base64url").toString()
        ) as { u: string; i: number }
        cursorCondition = or(
          lt(writings.updatedAt, new Date(decoded.u)),
          and(
            eq(writings.updatedAt, new Date(decoded.u)),
            lt(writings.id, decoded.i)
          )
        )
      }

      const rows = await database
        .select()
        .from(writings)
        .where(and(eq(writings.userId, userId), cursorCondition))
        .orderBy(desc(writings.updatedAt), desc(writings.id))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const items = (hasMore ? rows.slice(0, limit) : rows).map(
        mapWritingSummary
      )

      const lastItem = items[items.length - 1]
      const nextCursor =
        hasMore && lastItem
          ? Buffer.from(
              JSON.stringify({
                u: lastItem.updatedAt.toISOString(),
                i: lastItem.id,
              })
            ).toString("base64url")
          : null

      return { items, nextCursor }
    },

    async update(userId, writingId, input) {
      const row = await loadRow(writingId)
      if (!row) return { kind: "not-found" }
      if (row.userId !== userId) return { kind: "forbidden" }

      const now = new Date()
      await database
        .update(writings)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.bodyJson !== undefined && { bodyJson: input.bodyJson }),
          ...(input.bodyPlainText !== undefined && {
            bodyPlainText: input.bodyPlainText,
          }),
          ...(input.wordCount !== undefined && { wordCount: input.wordCount }),
          ...(input.status !== undefined && { status: input.status }),
          updatedAt: now,
        })
        .where(eq(writings.id, writingId))

      const updated = await loadRow(writingId)
      if (!updated) return { kind: "not-found" }

      return { kind: "updated", writing: mapWritingDetail(updated) }
    },

    async resume(userId) {
      const row = await database
        .select()
        .from(writings)
        .where(and(eq(writings.userId, userId), eq(writings.status, "draft")))
        .orderBy(desc(writings.updatedAt), desc(writings.id))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      return row ? mapWritingSummary(row) : null
    },
  }
}
