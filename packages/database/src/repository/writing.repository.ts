import { and, desc, eq, lt, or } from "drizzle-orm"

import type {
  WritingId,
  UserId,
  PromptId,
  WritingRepository,
  WritingDetail,
  WritingSummary,
  WritingCreateInput,
  WritingUpdateInput,
  WritingAccessResult,
  WritingUpdateResult,
  WritingDeleteResult,
} from "@workspace/core"

import { writings } from "../schema/writings"
import { writingPrompts } from "../schema/writing-prompts"
import { sql } from "drizzle-orm"
import type { DbClient } from "../types/index"

function createPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

type WritingRow = {
  id: number
  userId: string
  title: string
  bodyJson: unknown
  bodyPlainText: string
  wordCount: number
  sourcePromptId: number | null
  sourceSessionId: number | null
  createdAt: Date
  updatedAt: Date
}

function mapWritingSummary(row: WritingRow): WritingSummary {
  return {
    id: row.id as unknown as WritingId,
    title: row.title,
    preview: createPreview(row.bodyPlainText),
    wordCount: row.wordCount,
    sourcePromptId: row.sourcePromptId as unknown as PromptId | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    async create(
      userId: UserId,
      input: WritingCreateInput
    ): Promise<WritingDetail> {
      const now = new Date()
      const created = await database
        .insert(writings)
        .values({
          userId: userId as unknown as string,
          title: input.title,
          bodyJson: input.bodyJson,
          bodyPlainText: input.bodyPlainText,
          wordCount: input.wordCount,
          sourcePromptId:
            (input.sourcePromptId as unknown as number | null) ?? null,
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
          .where(
            eq(writingPrompts.id, input.sourcePromptId as unknown as number)
          )
      }

      return mapWritingDetail(created)
    },

    async getById(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingAccessResult> {
      const row = await loadRow(writingId as unknown as number)
      if (!row) return { kind: "not-found" }
      if (row.userId !== (userId as unknown as string))
        return { kind: "forbidden" }
      return { kind: "writing", writing: mapWritingDetail(row) }
    },

    async list(
      userId: UserId,
      params: { limit?: number; cursor?: string } = {}
    ): Promise<{ items: WritingSummary[]; nextCursor: string | null }> {
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
        .where(
          and(eq(writings.userId, userId as unknown as string), cursorCondition)
        )
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
                u: lastItem.updatedAt,
                i: lastItem.id as unknown as number,
              })
            ).toString("base64url")
          : null

      return { items, nextCursor }
    },

    async update(
      userId: UserId,
      writingId: WritingId,
      input: WritingUpdateInput
    ): Promise<WritingUpdateResult> {
      const row = await loadRow(writingId as unknown as number)
      if (!row) return { kind: "not-found" }
      if (row.userId !== (userId as unknown as string))
        return { kind: "forbidden" }

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
          updatedAt: now,
        })
        .where(eq(writings.id, writingId as unknown as number))

      const updated = await loadRow(writingId as unknown as number)
      if (!updated) return { kind: "not-found" }

      return { kind: "updated", writing: mapWritingDetail(updated) }
    },

    async delete(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingDeleteResult> {
      const row = await loadRow(writingId as unknown as number)
      if (!row) return { kind: "not-found" }
      if (row.userId !== (userId as unknown as string))
        return { kind: "forbidden" }

      await database
        .delete(writings)
        .where(eq(writings.id, writingId as unknown as number))
      return { kind: "deleted" }
    },
  }
}
