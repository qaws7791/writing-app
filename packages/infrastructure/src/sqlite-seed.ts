import type { Database } from "bun:sqlite"

import { seedPrompts } from "./seed-data.js"

export function seedDatabase(database: Database): void {
  const now = new Date().toISOString()

  const insertPrompt = database.query(
    `
      insert into prompts (
        id,
        slug,
        text,
        description,
        topic,
        level,
        suggested_length_label,
        tags_json,
        outline_json,
        tips_json,
        is_today_recommended,
        today_recommendation_order,
        created_at,
        updated_at
      ) values (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
      on conflict(id) do update set
        slug = excluded.slug,
        text = excluded.text,
        description = excluded.description,
        topic = excluded.topic,
        level = excluded.level,
        suggested_length_label = excluded.suggested_length_label,
        tags_json = excluded.tags_json,
        outline_json = excluded.outline_json,
        tips_json = excluded.tips_json,
        is_today_recommended = excluded.is_today_recommended,
        today_recommendation_order = excluded.today_recommendation_order,
        updated_at = excluded.updated_at
    `
  )

  for (const prompt of seedPrompts) {
    insertPrompt.run(
      prompt.id,
      `prompt-${prompt.id}`,
      prompt.text,
      prompt.description,
      prompt.topic,
      prompt.level,
      prompt.suggestedLengthLabel,
      JSON.stringify(prompt.tags),
      JSON.stringify(prompt.outline),
      JSON.stringify(prompt.tips),
      prompt.isTodayRecommended ? 1 : 0,
      prompt.todayRecommendationOrder,
      now,
      now
    )
  }
}
