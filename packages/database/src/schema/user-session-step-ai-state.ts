import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import { user } from "./auth"
import { journeySessions } from "./journey-sessions"

export const sessionStepAiStateKinds = ["feedback", "comparison"] as const
export type SessionStepAiStateKind = (typeof sessionStepAiStateKinds)[number]

export const sessionStepAiStateStatuses = [
  "pending",
  "succeeded",
  "failed",
] as const
export type SessionStepAiStateStatus =
  (typeof sessionStepAiStateStatuses)[number]

export const userSessionStepAiState = sqliteTable(
  "user_session_step_ai_state",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => journeySessions.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    kind: text("kind", { enum: sessionStepAiStateKinds }).notNull(),
    sourceStepOrder: integer("source_step_order").notNull(),
    status: text("status", { enum: sessionStepAiStateStatuses })
      .notNull()
      .default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    inputJson: text("input_json", { mode: "json" }).notNull(),
    resultJson: text("result_json", { mode: "json" }),
    errorMessage: text("error_message"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("user_session_step_ai_state_user_session_step_uniq").on(
      table.userId,
      table.sessionId,
      table.stepOrder
    ),
    index("user_session_step_ai_state_user_session_idx").on(
      table.userId,
      table.sessionId
    ),
    index("user_session_step_ai_state_status_idx").on(
      table.status,
      table.updatedAt
    ),
  ]
)
