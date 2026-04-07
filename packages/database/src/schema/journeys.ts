import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const journeyCategories = [
  "writing_skill",
  "mindfulness",
  "practical",
] as const
export type JourneyCategory = (typeof journeyCategories)[number]

export const journeys = pgTable(
  "journeys",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category", { enum: journeyCategories }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("journeys_category_idx").on(table.category)]
)
