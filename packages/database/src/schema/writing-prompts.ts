import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const promptTypes = ["sensory", "reflection", "opinion"] as const
export type PromptType = (typeof promptTypes)[number]

export const writingPrompts = pgTable(
  "writing_prompts",
  {
    id: serial("id").primaryKey(),
    promptType: text("prompt_type", { enum: promptTypes }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    responseCount: integer("response_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("writing_prompts_type_idx").on(table.promptType)]
)
