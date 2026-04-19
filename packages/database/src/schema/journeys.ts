import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { JourneyId } from "@workspace/core"

export const journeyCategories = [
  "writing_skill",
  "mindfulness",
  "practical",
] as const
export type JourneyCategory = (typeof journeyCategories)[number]

export const journeys = sqliteTable(
  "journeys",
  {
    id: integer("id").$type<JourneyId>().primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category", { enum: journeyCategories }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("journeys_category_idx").on(table.category)]
)
