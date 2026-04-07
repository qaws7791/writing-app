import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

import { journeys } from "./journeys"

export const journeySessions = pgTable(
  "journey_sessions",
  {
    id: serial("id").primaryKey(),
    journeyId: integer("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("journey_sessions_journey_order_uniq").on(
      table.journeyId,
      table.order
    ),
    index("journey_sessions_journey_idx").on(table.journeyId),
  ]
)
