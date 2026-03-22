import { seedPrompts } from "../seed-data/index.js"
import { prompts } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

export function seedDatabase(database: DbClient): void {
  const now = new Date().toISOString()

  database.transaction((tx) => {
    for (const prompt of seedPrompts) {
      tx.insert(prompts)
        .values({
          createdAt: now,
          description: prompt.description,
          id: prompt.id,
          isTodayRecommended: false,
          level: prompt.level,
          outlineJson: prompt.outline,
          slug: `prompt-${prompt.id}`,
          suggestedLengthLabel: prompt.suggestedLengthLabel,
          tagsJson: prompt.tags,
          text: prompt.text,
          tipsJson: prompt.tips,
          todayRecommendationOrder: null,
          topic: prompt.topic,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          set: {
            description: prompt.description,
            level: prompt.level,
            outlineJson: prompt.outline,
            slug: `prompt-${prompt.id}`,
            suggestedLengthLabel: prompt.suggestedLengthLabel,
            tagsJson: prompt.tags,
            text: prompt.text,
            tipsJson: prompt.tips,
            topic: prompt.topic,
            updatedAt: now,
          },
          target: prompts.id,
        })
        .run()
    }
  })
}
