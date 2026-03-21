import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

import { prompts } from "./prompts.js"
import { user } from "./auth.js"

export const savedPrompts = sqliteTable(
  "saved_prompts",
  {
    promptId: integer("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    savedAt: text("saved_at").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.promptId] }),
    index("saved_prompts_saved_at_idx").on(table.userId, table.savedAt),
  ]
)
