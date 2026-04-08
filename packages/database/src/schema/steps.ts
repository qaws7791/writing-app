import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

import { journeySessions } from "./journey-sessions"

export const stepTypes = [
  "learn",
  "read",
  "guided_question",
  "write",
  "feedback",
  "revise",
] as const
export type StepType = (typeof stepTypes)[number]

export const steps = sqliteTable(
  "steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => journeySessions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    type: text("type", { enum: stepTypes }).notNull(),
    contentJson: text("content_json", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("steps_session_order_uniq").on(table.sessionId, table.order),
    index("steps_session_idx").on(table.sessionId),
  ]
)
