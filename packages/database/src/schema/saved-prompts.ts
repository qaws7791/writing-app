import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { writingPrompts } from "./writing-prompts"

export const savedPrompts = pgTable(
  "saved_prompts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => writingPrompts.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.promptId] }),
    index("saved_prompts_user_saved_idx").on(table.userId, table.savedAt),
  ]
)
