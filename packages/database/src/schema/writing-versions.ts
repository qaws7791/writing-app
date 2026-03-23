import type { DraftContent } from "@workspace/core"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { drafts } from "./drafts.js"
import { user } from "./auth.js"

export const writingVersions = sqliteTable(
  "writing_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    draftId: integer("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    contentJson: text("content_json", { mode: "json" })
      .$type<DraftContent>()
      .notNull(),
    createdAt: text("created_at").notNull(),
    reason: text("reason").notNull().$type<"auto" | "manual" | "restore">(),
  },
  (table) => [
    index("writing_versions_draft_idx").on(table.draftId, table.version),
  ]
)
