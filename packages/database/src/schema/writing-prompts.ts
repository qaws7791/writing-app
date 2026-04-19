import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { PromptId } from "@workspace/core"

export const promptTypes = ["sensory", "reflection", "opinion"] as const
export type PromptType = (typeof promptTypes)[number]

export const writingPrompts = sqliteTable(
  "writing_prompts",
  {
    id: integer("id").$type<PromptId>().primaryKey({ autoIncrement: true }),
    promptType: text("prompt_type", { enum: promptTypes }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    responseCount: integer("response_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("writing_prompts_type_idx").on(table.promptType)]
)
