import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import { journeys } from "./journeys"

export const journeySessions = sqliteTable(
  "journey_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    journeyId: integer("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("journey_sessions_journey_order_uniq").on(
      table.journeyId,
      table.order
    ),
    index("journey_sessions_journey_idx").on(table.journeyId),
  ]
)
