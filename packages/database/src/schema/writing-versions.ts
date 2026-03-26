import type { WritingContent } from "@workspace/core"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { writings } from "./writings.js"
import { user } from "./auth.js"

export const writingVersions = sqliteTable(
  "writing_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    writingId: integer("writing_id")
      .notNull()
      .references(() => writings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    contentJson: text("content_json", { mode: "json" })
      .$type<WritingContent>()
      .notNull(),
    createdAt: text("created_at").notNull(),
    reason: text("reason").notNull().$type<"auto" | "manual" | "restore">(),
  },
  (table) => [
    index("writing_versions_writing_idx").on(table.writingId, table.version),
  ]
)
