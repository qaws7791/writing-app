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

import { writingPrompts, type PromptType } from "../schema/writing-prompts"
import { savedPrompts } from "../schema/saved-prompts"
import type { DbClient } from "../types/index"

export type WritingPromptSummary = {
  id: number
  promptType: string
  title: string
  body: string
  responseCount: number
  saved: boolean
}

export type WritingPromptDetail = WritingPromptSummary & {
  createdAt: Date
  updatedAt: Date
}

export type WritingPromptListFilters = {
  promptType?: PromptType
  query?: string
  saved?: boolean
}

export type WritingPromptRepository = {
  exists: (promptId: number) => Promise<boolean>
  getById: (
    userId: string,
    promptId: number
  ) => Promise<WritingPromptDetail | null>
  list: (
    userId: string,
    filters: WritingPromptListFilters
  ) => Promise<WritingPromptSummary[]>
  listSaved: (userId: string, limit?: number) => Promise<WritingPromptSummary[]>
  save: (
    userId: string,
    promptId: number
  ) => Promise<{ kind: "saved"; savedAt: Date } | { kind: "not-found" }>
  unsave: (userId: string, promptId: number) => Promise<boolean>
}

const savedExpression = sql<number>`case when ${savedPrompts.promptId} is null then 0 else 1 end`

export function createWritingPromptRepository(
  database: DbClient
): WritingPromptRepository {
  return {
    async exists(promptId) {
      const row = await database
        .select({ id: writingPrompts.id })
        .from(writingPrompts)
        .where(eq(writingPrompts.id, promptId))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      return row !== null
    },

    async getById(userId, promptId) {
      const row = await database
        .select({
          id: writingPrompts.id,
          promptType: writingPrompts.promptType,
          title: writingPrompts.title,
          body: writingPrompts.body,
          responseCount: writingPrompts.responseCount,
          saved: savedExpression,
          createdAt: writingPrompts.createdAt,
          updatedAt: writingPrompts.updatedAt,
        })
        .from(writingPrompts)
        .leftJoin(
          savedPrompts,
          and(
            eq(savedPrompts.promptId, writingPrompts.id),
            eq(savedPrompts.userId, userId)
          )
        )
        .where(eq(writingPrompts.id, promptId))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null

      return {
        id: row.id,
        promptType: row.promptType,
        title: row.title,
        body: row.body,
        responseCount: row.responseCount,
        saved: row.saved === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }
    },

    async list(userId, filters) {
      const conditions = buildListConditions(filters)

      const rows = await database
        .select({
          id: writingPrompts.id,
          promptType: writingPrompts.promptType,
          title: writingPrompts.title,
          body: writingPrompts.body,
          responseCount: writingPrompts.responseCount,
          saved: savedExpression,
        })
        .from(writingPrompts)
        .leftJoin(
          savedPrompts,
          and(
            eq(savedPrompts.promptId, writingPrompts.id),
            eq(savedPrompts.userId, userId)
          )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(writingPrompts.id))

      return rows.map((row) => ({
        id: row.id,
        promptType: row.promptType,
        title: row.title,
        body: row.body,
        responseCount: row.responseCount,
        saved: row.saved === 1,
      }))
    },

    async listSaved(userId, limit = 10) {
      const rows = await database
        .select({
          id: writingPrompts.id,
          promptType: writingPrompts.promptType,
          title: writingPrompts.title,
          body: writingPrompts.body,
          responseCount: writingPrompts.responseCount,
        })
        .from(savedPrompts)
        .innerJoin(writingPrompts, eq(writingPrompts.id, savedPrompts.promptId))
        .where(eq(savedPrompts.userId, userId))
        .orderBy(desc(savedPrompts.savedAt))
        .limit(limit)

      return rows.map((row) => ({
        id: row.id,
        promptType: row.promptType,
        title: row.title,
        body: row.body,
        responseCount: row.responseCount,
        saved: true,
      }))
    },

    async save(userId, promptId) {
      const exists = await this.exists(promptId)
      if (!exists) return { kind: "not-found" }

      const savedAt = new Date()
      await database
        .insert(savedPrompts)
        .values({ userId, promptId, savedAt })
        .onConflictDoUpdate({
          set: { savedAt },
          target: [savedPrompts.userId, savedPrompts.promptId],
        })

      return { kind: "saved", savedAt }
    },

    async unsave(userId, promptId) {
      const existing = await database
        .select({ promptId: savedPrompts.promptId })
        .from(savedPrompts)
        .where(
          and(
            eq(savedPrompts.userId, userId),
            eq(savedPrompts.promptId, promptId)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!existing) return false

      await database
        .delete(savedPrompts)
        .where(
          and(
            eq(savedPrompts.userId, userId),
            eq(savedPrompts.promptId, promptId)
          )
        )

      return true
    },
  }
}

function buildListConditions(filters: WritingPromptListFilters) {
  const conditions = []

  if (filters.query) {
    const likeQuery = `%${filters.query}%`
    conditions.push(
      or(
        like(writingPrompts.title, likeQuery),
        like(writingPrompts.body, likeQuery)
      )!
    )
  }

  if (filters.promptType) {
    conditions.push(eq(writingPrompts.promptType, filters.promptType))
  }

  if (filters.saved === true) {
    conditions.push(isNotNull(savedPrompts.promptId))
  }

  if (filters.saved === false) {
    conditions.push(isNull(savedPrompts.promptId))
  }

  return conditions
}
