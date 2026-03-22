import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { prompts } from "./prompts.js"

export const dailyRecommendations = sqliteTable(
  "daily_recommendations",
  {
    createdAt: text("created_at").notNull(),
    date: text("date").notNull(),
    displayOrder: integer("display_order").notNull(),
    id: integer("id").primaryKey({ autoIncrement: true }),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("daily_rec_date_order_idx").on(table.date, table.displayOrder),
    uniqueIndex("daily_rec_date_prompt_idx").on(table.date, table.promptId),
    index("daily_rec_date_idx").on(table.date),
  ]
)
