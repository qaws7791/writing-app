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

export const steps = pgTable(
  "steps",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => journeySessions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    type: text("type", { enum: stepTypes }).notNull(),
    contentJson: jsonb("content_json").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("steps_session_order_uniq").on(table.sessionId, table.order),
    index("steps_session_idx").on(table.sessionId),
  ]
)
