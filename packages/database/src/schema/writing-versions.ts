import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { writings } from "./writings"

export const writingVersions = sqliteTable(
  "writing_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    writingId: integer("writing_id")
      .notNull()
      .references(() => writings.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: text("title").notNull(),
    bodyJson: text("body_json", { mode: "json" }).notNull(),
    wordCount: integer("word_count").notNull(),
    aiFeedbackJson: text("ai_feedback_json", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("writing_versions_writing_idx").on(
      table.writingId,
      table.versionNumber
    ),
  ]
)
