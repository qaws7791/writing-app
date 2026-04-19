import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

import type { PromptId, UserId } from "@workspace/core"

import { user } from "./auth"
import { writingPrompts } from "./writing-prompts"

export const savedPrompts = sqliteTable(
  "saved_prompts",
  {
    userId: text("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    promptId: integer("prompt_id")
      .$type<PromptId>()
      .notNull()
      .references(() => writingPrompts.id, { onDelete: "cascade" }),
    savedAt: integer("saved_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.promptId] }),
    index("saved_prompts_user_saved_idx").on(table.userId, table.savedAt),
  ]
)
