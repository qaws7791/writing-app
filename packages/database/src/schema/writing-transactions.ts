import type { Operation } from "@workspace/core/modules/writings"
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import { writings } from "./writings.js"
import { user } from "./auth.js"

export const writingTransactions = sqliteTable(
  "writing_transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    writingId: integer("writing_id")
      .notNull()
      .references(() => writings.id, { onDelete: "cascade" }),
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
    unique("writing_tx_writing_version_uniq").on(
      table.writingId,
      table.version
    ),
    index("writing_tx_writing_since_idx").on(table.writingId, table.version),
  ]
)
