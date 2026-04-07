import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { journeySessions } from "./journey-sessions"

export const sessionProgressStatuses = [
  "locked",
  "in_progress",
  "completed",
] as const
export type SessionProgressStatus = (typeof sessionProgressStatuses)[number]

export const userSessionProgress = pgTable(
  "user_session_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => journeySessions.id, { onDelete: "cascade" }),
    currentStepOrder: integer("current_step_order").notNull().default(1),
    status: text("status", { enum: sessionProgressStatuses })
      .notNull()
      .default("locked"),
    stepResponsesJson: jsonb("step_responses_json").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("user_session_progress_user_session_uniq").on(
      table.userId,
      table.sessionId
    ),
    index("user_session_progress_user_idx").on(table.userId),
    index("user_session_progress_status_idx").on(table.userId, table.status),
  ]
)
