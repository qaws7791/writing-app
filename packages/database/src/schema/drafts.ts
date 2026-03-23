import type { DraftContent } from "@workspace/core"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { prompts } from "./prompts.js"
import { user } from "./auth.js"

export const drafts = sqliteTable(
  "drafts",
  {
    bodyJson: text("body_json", { mode: "json" })
      .$type<DraftContent>()
      .notNull(),
    bodyPlainText: text("body_plain_text").notNull(),
    characterCount: integer("character_count").notNull(),
    createdAt: text("created_at").notNull(),
    id: integer("id").primaryKey({ autoIncrement: true }),
    lastSavedAt: text("last_saved_at").notNull(),
    sourcePromptId: integer("source_prompt_id").references(() => prompts.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    updatedAt: text("updated_at").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    wordCount: integer("word_count").notNull(),
  },
  (table) => [
    index("drafts_user_updated_idx").on(table.userId, table.updatedAt),
  ]
)
