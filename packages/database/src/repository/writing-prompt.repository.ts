import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  isNull,
  like,
  or,
  sql,
} from "drizzle-orm"

import type {
  PromptId,
  UserId,
  PromptRepository,
  PromptSummary,
  PromptListFilters,
  PromptBookmarkResult,
} from "@workspace/core"

import { writingPrompts } from "../schema/writing-prompts"
import { savedPrompts } from "../schema/saved-prompts"
import type { DbClient } from "../types/index"

const bookmarkedExpression = sql<number>`case when ${savedPrompts.promptId} is null then 0 else 1 end`

function mapPromptSummary(row: {
  id: number
  promptType: string
  title: string
  body: string
  responseCount: number
  isBookmarked: number | boolean
}): PromptSummary {
  return {
    id: row.id as unknown as PromptId,
    promptType: row.promptType as PromptSummary["promptType"],
    title: row.title,
    body: row.body,
    responseCount: row.responseCount,
    isBookmarked:
      typeof row.isBookmarked === "number"
        ? row.isBookmarked === 1
        : row.isBookmarked,
  }
}

export function createWritingPromptRepository(
  database: DbClient
): PromptRepository {
  return {
    async list(
      userId: UserId | null,
      filters?: PromptListFilters
    ): Promise<PromptSummary[]> {
      const conditions = []

      if (filters?.promptType) {
        conditions.push(eq(writingPrompts.promptType, filters.promptType))
      }

      const rows = await database
        .select({
          id: writingPrompts.id,
          promptType: writingPrompts.promptType,
          title: writingPrompts.title,
          body: writingPrompts.body,
          responseCount: writingPrompts.responseCount,
          isBookmarked: userId ? bookmarkedExpression : sql<number>`0`,
        })
        .from(writingPrompts)
        .leftJoin(
          savedPrompts,
          userId
            ? and(
                eq(savedPrompts.promptId, writingPrompts.id),
                eq(savedPrompts.userId, userId as unknown as string)
              )
            : sql`false`
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(writingPrompts.id))

      return rows.map(mapPromptSummary)
    },

    async getById(
      promptId: PromptId,
      userId: UserId | null
    ): Promise<PromptSummary | null> {
      const row = await database
        .select({
          id: writingPrompts.id,
          promptType: writingPrompts.promptType,
          title: writingPrompts.title,
          body: writingPrompts.body,
          responseCount: writingPrompts.responseCount,
          isBookmarked: userId ? bookmarkedExpression : sql<number>`0`,
        })
        .from(writingPrompts)
        .leftJoin(
          savedPrompts,
          userId
            ? and(
                eq(savedPrompts.promptId, writingPrompts.id),
                eq(savedPrompts.userId, userId as unknown as string)
              )
            : sql`false`
        )
        .where(eq(writingPrompts.id, promptId as unknown as number))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null
      return mapPromptSummary(row)
    },

    async getDailyPrompt(
      userId: UserId | null,
      dateKey: string
    ): Promise<PromptSummary | null> {
      // Deterministic selection: use dateKey hash to pick a prompt
      const total = await database
        .select({ count: sql<number>`count(*)` })
        .from(writingPrompts)
        .then((rows) => Number(rows[0]?.count ?? 0))

      if (total === 0) return null

      // Simple hash of dateKey to pick an index
      let hash = 0
      for (let i = 0; i < dateKey.length; i++) {
        hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
      }
      const offset = hash % total

      const row = await database
        .select({
          id: writingPrompts.id,
          promptType: writingPrompts.promptType,
          title: writingPrompts.title,
          body: writingPrompts.body,
          responseCount: writingPrompts.responseCount,
          isBookmarked: userId ? bookmarkedExpression : sql<number>`0`,
        })
        .from(writingPrompts)
        .leftJoin(
          savedPrompts,
          userId
            ? and(
                eq(savedPrompts.promptId, writingPrompts.id),
                eq(savedPrompts.userId, userId as unknown as string)
              )
            : sql`false`
        )
        .orderBy(asc(writingPrompts.id))
        .limit(1)
        .offset(offset)
        .then((rows) => rows[0] ?? null)

      if (!row) return null
      return mapPromptSummary(row)
    },

    async bookmark(
      userId: UserId,
      promptId: PromptId
    ): Promise<PromptBookmarkResult> {
      const exists = await database
        .select({ id: writingPrompts.id })
        .from(writingPrompts)
        .where(eq(writingPrompts.id, promptId as unknown as number))
        .limit(1)
        .then((rows) => rows.length > 0)

      if (!exists) return { kind: "not-found" }

      const savedAt = new Date()
      await database
        .insert(savedPrompts)
        .values({
          userId: userId as unknown as string,
          promptId: promptId as unknown as number,
          savedAt,
        })
        .onConflictDoUpdate({
          set: { savedAt },
          target: [savedPrompts.userId, savedPrompts.promptId],
        })

      return { kind: "bookmarked", savedAt: savedAt.toISOString() }
    },

    async unbookmark(userId: UserId, promptId: PromptId): Promise<void> {
      await database
        .delete(savedPrompts)
        .where(
          and(
            eq(savedPrompts.userId, userId as unknown as string),
            eq(savedPrompts.promptId, promptId as unknown as number)
          )
        )
    },
  }
}
