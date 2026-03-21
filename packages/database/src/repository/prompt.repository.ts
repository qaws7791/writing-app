import { and, asc, desc, eq, sql } from "drizzle-orm"
import type {
  PromptDetail,
  PromptId,
  PromptListFilters,
  PromptRepository,
  PromptSaveResult,
  PromptSummary,
  UserId,
} from "@workspace/core"

import { prompts, savedPrompts } from "../schema/index.js"
import type { DbClient } from "../types/index.js"
import {
  buildPromptListConditions,
  mapPromptDetail,
  mapPromptSummary,
  savedExpression,
  toPromptIdValue,
} from "./prompt.mappers.js"

type Clock = () => string

function loadPromptDetailRow(
  database: DbClient,
  userId: UserId,
  promptId: PromptId
) {
  return (
    database
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
      .get() ?? null
  )
}

export function createPromptRepository(
  database: DbClient,
  clock: Clock = () => new Date().toISOString()
): PromptRepository {
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
        .all()

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
        .all()

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
        .all()

      return rows.map(mapPromptSummary)
    },

    async save(userId: UserId, promptId: PromptId): Promise<PromptSaveResult> {
      const exists = await this.exists(promptId)

      if (!exists) {
        return { kind: "not-found" }
      }

      const savedAt = clock()
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
