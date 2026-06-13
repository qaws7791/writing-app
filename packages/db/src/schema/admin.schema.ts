import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const adminSettings = sqliteTable("admin_settings", {
  key: text("key").primaryKey().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  value: text("value").notNull(),
})
