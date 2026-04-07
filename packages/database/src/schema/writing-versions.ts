import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { writings } from "./writings"

export const writingVersions = pgTable(
  "writing_versions",
  {
    id: serial("id").primaryKey(),
    writingId: integer("writing_id")
      .notNull()
      .references(() => writings.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: text("title").notNull(),
    bodyJson: jsonb("body_json").notNull(),
    wordCount: integer("word_count").notNull(),
    aiFeedbackJson: jsonb("ai_feedback_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("writing_versions_writing_idx").on(
      table.writingId,
      table.versionNumber
    ),
  ]
)
