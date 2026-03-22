import { asc, desc, eq, sql } from "drizzle-orm"
import type { DailyRecommendationRepository } from "@workspace/core"

import { dailyRecommendations } from "../schema/index.js"
import { prompts } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

type Clock = () => string

export function createDailyRecommendationRepository(
  database: DbClient,
  clock: Clock = () => new Date().toISOString()
): DailyRecommendationRepository {
  return {
    async existsForDate(date: string): Promise<boolean> {
      const row =
        database
          .select({ id: dailyRecommendations.id })
          .from(dailyRecommendations)
          .where(eq(dailyRecommendations.date, date))
          .limit(1)
          .get() ?? null

      return row !== null
    },

    async create(
      date: string,
      entries: readonly { promptId: number; displayOrder: number }[]
    ): Promise<void> {
      const now = clock()
      database.transaction((tx) => {
        for (const entry of entries) {
          tx.insert(dailyRecommendations)
            .values({
              createdAt: now,
              date,
              displayOrder: entry.displayOrder,
              promptId: entry.promptId,
            })
            .onConflictDoNothing()
            .run()
        }
      })
    },

    async getRecentHistory(limit: number) {
      const rows = database
        .select({
          date: dailyRecommendations.date,
          promptId: dailyRecommendations.promptId,
        })
        .from(dailyRecommendations)
        .orderBy(desc(dailyRecommendations.date))
        .limit(limit)
        .all()

      return rows
    },

    async getAllPromptIds(): Promise<readonly number[]> {
      const rows = database
        .select({ id: prompts.id })
        .from(prompts)
        .orderBy(asc(prompts.id))
        .all()

      return rows.map((row) => row.id)
    },

    async refreshTodayFlags(
      entries: readonly { promptId: number; displayOrder: number }[]
    ): Promise<void> {
      database.transaction((tx) => {
        tx.update(prompts)
          .set({
            isTodayRecommended: false,
            todayRecommendationOrder: null,
          })
          .run()

        for (const entry of entries) {
          tx.update(prompts)
            .set({
              isTodayRecommended: true,
              todayRecommendationOrder: entry.displayOrder,
            })
            .where(eq(prompts.id, entry.promptId))
            .run()
        }
      })
    },
  }
}
