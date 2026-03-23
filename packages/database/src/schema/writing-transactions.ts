import type { Operation } from "@workspace/core/modules/writings"
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import { drafts } from "./drafts.js"
import { user } from "./auth.js"

export const writingTransactions = sqliteTable(
  "writing_transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    draftId: integer("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    operationsJson: text("operations_json", { mode: "json" })
      .$type<Operation[]>()
      .notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    unique("writing_tx_draft_version_uniq").on(table.draftId, table.version),
    index("writing_tx_draft_since_idx").on(table.draftId, table.version),
  ]
)
