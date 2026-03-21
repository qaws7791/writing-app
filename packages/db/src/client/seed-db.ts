import { seedPrompts } from "../seed-data.js"
import { prompts } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

export function seedDatabase(database: DbClient): void {
  const now = new Date().toISOString()

  for (const prompt of seedPrompts) {
    database
      .insert(prompts)
      .values({
        createdAt: now,
        description: prompt.description,
        id: prompt.id,
        isTodayRecommended: prompt.isTodayRecommended,
        level: prompt.level,
        outlineJson: prompt.outline,
        slug: `prompt-${prompt.id}`,
        suggestedLengthLabel: prompt.suggestedLengthLabel,
        tagsJson: prompt.tags,
        text: prompt.text,
        tipsJson: prompt.tips,
        todayRecommendationOrder: prompt.todayRecommendationOrder,
        topic: prompt.topic,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        set: {
          description: prompt.description,
          isTodayRecommended: prompt.isTodayRecommended,
          level: prompt.level,
          outlineJson: prompt.outline,
          slug: `prompt-${prompt.id}`,
          suggestedLengthLabel: prompt.suggestedLengthLabel,
          tagsJson: prompt.tags,
          text: prompt.text,
          tipsJson: prompt.tips,
          todayRecommendationOrder: prompt.todayRecommendationOrder,
          topic: prompt.topic,
          updatedAt: now,
        },
        target: prompts.id,
      })
      .run()
  }
}
