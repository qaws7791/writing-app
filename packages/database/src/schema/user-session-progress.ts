import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import type { SessionId, UserId } from "@workspace/core"

import { user } from "./auth"
import { journeySessions } from "./journey-sessions"

export const sessionProgressStatuses = [
  "locked",
  "in_progress",
  "completed",
] as const
export type SessionProgressStatus = (typeof sessionProgressStatuses)[number]

export const userSessionProgress = sqliteTable(
  "user_session_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: integer("session_id")
      .$type<SessionId>()
      .notNull()
      .references(() => journeySessions.id, { onDelete: "cascade" }),
    currentStepOrder: integer("current_step_order").notNull().default(1),
    status: text("status", { enum: sessionProgressStatuses })
      .notNull()
      .default("locked"),
    stepResponsesJson: text("step_responses_json", { mode: "json" })
      .notNull()
      .default({}),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
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
