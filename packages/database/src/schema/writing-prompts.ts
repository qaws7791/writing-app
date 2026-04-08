import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const promptTypes = ["sensory", "reflection", "opinion"] as const
export type PromptType = (typeof promptTypes)[number]

export const writingPrompts = sqliteTable(
  "writing_prompts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    promptType: text("prompt_type", { enum: promptTypes }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    responseCount: integer("response_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("writing_prompts_type_idx").on(table.promptType)]
)
