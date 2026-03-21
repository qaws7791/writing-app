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
  type SQL,
} from "drizzle-orm"
import {
  toPromptId,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptRepository,
  type PromptSaveResult,
  type PromptSummary,
  type UserId,
} from "@workspace/core"

import { prompts, savedPrompts } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

type PromptSummaryRow = {
  id: number
  level: 1 | 2 | 3
  saved: number
  suggestedLengthLabel: "깊이" | "보통" | "짧음"
  tagsJson: string[]
  text: string
  topic:
    | "감정"
    | "경험"
    | "관계"
    | "기술"
    | "기억"
    | "문화"
    | "사회"
    | "상상"
    | "성장"
    | "여행"
    | "일상"
    | "자기이해"
    | "진로"
}

type PromptDetailRow = PromptSummaryRow & {
  description: string
  outlineJson: string[]
  tipsJson: string[]
}

const savedExpression = sql<number>`case when ${savedPrompts.promptId} is null then 0 else 1 end`

function toPromptIdValue(promptId: PromptId): number {
  return promptId as number
}

function buildPromptListConditions(filters: PromptListFilters): SQL[] {
  const conditions: SQL[] = []

  if (filters.query) {
    const likeQuery = `%${filters.query}%`
    conditions.push(
      or(like(prompts.text, likeQuery), like(prompts.description, likeQuery))!
    )
  }

  if (filters.topic) {
    conditions.push(eq(prompts.topic, filters.topic))
  }

  if (filters.level) {
    conditions.push(eq(prompts.level, filters.level))
  }

  if (filters.saved === true) {
    conditions.push(isNotNull(savedPrompts.promptId))
  }

  if (filters.saved === false) {
    conditions.push(isNull(savedPrompts.promptId))
  }

  return conditions
}

function mapPromptSummary(row: PromptSummaryRow): PromptSummary {
  return {
    id: toPromptId(row.id),
    level: row.level,
    saved: row.saved === 1,
    suggestedLengthLabel: row.suggestedLengthLabel,
    tags: row.tagsJson,
    text: row.text,
    topic: row.topic,
  }
}

function mapPromptDetail(row: PromptDetailRow): PromptDetail {
  return {
    ...mapPromptSummary(row),
    description: row.description,
    outline: row.outlineJson,
    tips: row.tipsJson,
  }
}

function loadPromptDetailRow(
  database: DbClient,
  userId: UserId,
  promptId: PromptId
): PromptDetailRow | null {
  return database
    .select({
      description: prompts.description,
      id: prompts.id,
      level: prompts.level,
      outlineJson: prompts.outlineJson,
      saved: savedExpression,
      suggestedLengthLabel: prompts.suggestedLengthLabel,
      tagsJson: prompts.tagsJson,
      text: prompts.text,
      tipsJson: prompts.tipsJson,
      topic: prompts.topic,
    })
    .from(prompts)
    .leftJoin(
      savedPrompts,
      and(
        eq(savedPrompts.promptId, prompts.id),
        eq(savedPrompts.userId, userId)
      )
    )
    .where(eq(prompts.id, toPromptIdValue(promptId)))
    .limit(1)
    .get() as PromptDetailRow | null
}

export function createPromptRepository(database: DbClient): PromptRepository {
  return {
    async exists(promptId: PromptId): Promise<boolean> {
      const row =
        database
          .select({ id: prompts.id })
          .from(prompts)
          .where(eq(prompts.id, toPromptIdValue(promptId)))
          .limit(1)
          .get() ?? null

      return row !== null
    },

    async getById(
      userId: UserId,
      promptId: PromptId
    ): Promise<PromptDetail | null> {
      const row = loadPromptDetailRow(database, userId, promptId)
      return row ? mapPromptDetail(row) : null
    },

    async list(
      userId: UserId,
      filters: PromptListFilters
    ): Promise<PromptSummary[]> {
      const conditions = buildPromptListConditions(filters)
      const rows = database
        .select({
          id: prompts.id,
          level: prompts.level,
          saved: savedExpression,
          suggestedLengthLabel: prompts.suggestedLengthLabel,
          tagsJson: prompts.tagsJson,
          text: prompts.text,
          topic: prompts.topic,
        })
        .from(prompts)
        .leftJoin(
          savedPrompts,
          and(
            eq(savedPrompts.promptId, prompts.id),
            eq(savedPrompts.userId, userId)
          )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(prompts.id))
        .all() as PromptSummaryRow[]

      return rows.map(mapPromptSummary)
    },

    async listSaved(userId: UserId, limit = 10): Promise<PromptSummary[]> {
      const rows = database
        .select({
          id: prompts.id,
          level: prompts.level,
          saved: sql<number>`1`,
          suggestedLengthLabel: prompts.suggestedLengthLabel,
          tagsJson: prompts.tagsJson,
          text: prompts.text,
          topic: prompts.topic,
        })
        .from(savedPrompts)
        .innerJoin(prompts, eq(prompts.id, savedPrompts.promptId))
        .where(eq(savedPrompts.userId, userId))
        .orderBy(desc(savedPrompts.savedAt), asc(prompts.id))
        .limit(limit)
        .all() as PromptSummaryRow[]

      return rows.map(mapPromptSummary)
    },

    async listTodayPrompts(
      userId: UserId,
      limit: number
    ): Promise<PromptSummary[]> {
      const rows = database
        .select({
          id: prompts.id,
          level: prompts.level,
          saved: savedExpression,
          suggestedLengthLabel: prompts.suggestedLengthLabel,
          tagsJson: prompts.tagsJson,
          text: prompts.text,
          topic: prompts.topic,
        })
        .from(prompts)
        .leftJoin(
          savedPrompts,
          and(
            eq(savedPrompts.promptId, prompts.id),
            eq(savedPrompts.userId, userId)
          )
        )
        .where(eq(prompts.isTodayRecommended, true))
        .orderBy(asc(prompts.todayRecommendationOrder), asc(prompts.id))
        .limit(limit)
        .all() as PromptSummaryRow[]

      return rows.map(mapPromptSummary)
    },

    async save(userId: UserId, promptId: PromptId): Promise<PromptSaveResult> {
      const exists = await this.exists(promptId)

      if (!exists) {
        return { kind: "not-found" }
      }

      const savedAt = new Date().toISOString()
      database
        .insert(savedPrompts)
        .values({
          promptId: toPromptIdValue(promptId),
          savedAt,
          userId,
        })
        .onConflictDoUpdate({
          set: {
            savedAt,
          },
          target: [savedPrompts.userId, savedPrompts.promptId],
        })
        .run()

      return {
        kind: "saved",
        savedAt,
      }
    },

    async unsave(userId: UserId, promptId: PromptId): Promise<boolean> {
      const existing = database
        .select({ promptId: savedPrompts.promptId })
        .from(savedPrompts)
        .where(
          and(
            eq(savedPrompts.userId, userId),
            eq(savedPrompts.promptId, toPromptIdValue(promptId))
          )
        )
        .limit(1)
        .get()

      if (!existing) {
        return false
      }

      database
        .delete(savedPrompts)
        .where(
          and(
            eq(savedPrompts.userId, userId),
            eq(savedPrompts.promptId, toPromptIdValue(promptId))
          )
        )
        .run()

      return true
    },
  }
}
