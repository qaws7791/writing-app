import type { PromptLengthLabel, PromptTopic } from "@workspace/backend-core"
import { promptTopics } from "@workspace/backend-core"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

const promptLengthLabels = [
  "깊이",
  "보통",
  "짧음",
] as const satisfies readonly PromptLengthLabel[]

export const prompts = sqliteTable(
  "prompts",
  {
    createdAt: text("created_at").notNull(),
    description: text("description").notNull(),
    id: integer("id").primaryKey(),
    isTodayRecommended: integer("is_today_recommended", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    level: integer("level").$type<1 | 2 | 3>().notNull(),
    outlineJson: text("outline_json", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    slug: text("slug").notNull().unique(),
    suggestedLengthLabel: text("suggested_length_label", {
      enum: promptLengthLabels,
    }).notNull(),
    tagsJson: text("tags_json", { mode: "json" }).$type<string[]>().notNull(),
    text: text("text").notNull(),
    tipsJson: text("tips_json", { mode: "json" }).$type<string[]>().notNull(),
    todayRecommendationOrder: integer("today_recommendation_order"),
    topic: text("topic", { enum: promptTopics }).$type<PromptTopic>().notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("prompts_today_idx").on(
      table.isTodayRecommended,
      table.todayRecommendationOrder
    ),
  ]
)
