import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { user } from "./auth.js"
import { writings } from "./writings.js"

export const aiRequests = sqliteTable(
  "ai_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    writingId: integer("writing_id").references(() => writings.id, {
      onDelete: "set null",
    }),
    featureType: text("feature_type").notNull(),
    inputText: text("input_text").notNull(),
    outputJson: text("output_json").notNull(),
    model: text("model").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("ai_requests_user_idx").on(table.userId),
    index("ai_requests_created_idx").on(table.createdAt),
  ]
)
