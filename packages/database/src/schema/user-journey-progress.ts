import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { journeys } from "./journeys"

export const journeyProgressStatuses = ["in_progress", "completed"] as const
export type JourneyProgressStatus = (typeof journeyProgressStatuses)[number]

export const userJourneyProgress = pgTable(
  "user_journey_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    journeyId: integer("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    currentSessionOrder: integer("current_session_order").notNull().default(1),
    completionRate: real("completion_rate").notNull().default(0),
    status: text("status", { enum: journeyProgressStatuses })
      .notNull()
      .default("in_progress"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("user_journey_progress_user_journey_uniq").on(
      table.userId,
      table.journeyId
    ),
    index("user_journey_progress_user_idx").on(table.userId),
    index("user_journey_progress_status_idx").on(table.userId, table.status),
  ]
)
