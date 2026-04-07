import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { writingPrompts } from "./writing-prompts"
import { journeySessions } from "./journey-sessions"

export const writingStatuses = ["draft", "completed", "archived"] as const
export type WritingStatus = (typeof writingStatuses)[number]

export const writings = pgTable(
  "writings",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    bodyJson: jsonb("body_json").notNull(),
    bodyPlainText: text("body_plain_text").notNull(),
    wordCount: integer("word_count").notNull(),
    status: text("status", { enum: writingStatuses })
      .notNull()
      .default("draft"),
    sourcePromptId: integer("source_prompt_id").references(
      () => writingPrompts.id,
      { onDelete: "set null" }
    ),
    sourceSessionId: integer("source_session_id").references(
      () => journeySessions.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("writings_user_updated_idx").on(table.userId, table.updatedAt),
    index("writings_user_status_idx").on(table.userId, table.status),
  ]
)
