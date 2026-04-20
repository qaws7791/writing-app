import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import { stepTypeValues, type SessionId, type StepId } from "@workspace/core"

import { journeySessions } from "./journey-sessions"

export const stepTypes = stepTypeValues
export type StepType = (typeof stepTypes)[number]

export const steps = sqliteTable(
  "steps",
  {
    id: integer("id").$type<StepId>().primaryKey({ autoIncrement: true }),
    sessionId: integer("session_id")
      .$type<SessionId>()
      .notNull()
      .references(() => journeySessions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    type: text("type", { enum: stepTypes }).notNull(),
    contentJson: text("content_json", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("steps_session_order_uniq").on(table.sessionId, table.order),
    index("steps_session_idx").on(table.sessionId),
  ]
)
