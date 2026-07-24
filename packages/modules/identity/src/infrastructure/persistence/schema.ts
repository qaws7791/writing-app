import { sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { authUsers } from "@workspace/auth/schema"

import { userStatusValues } from "#identity/domain/user-status"

export const learnerProfiles = sqliteTable(
  "learner_profiles",
  {
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    displayName: text("display_name"),
    status: text("status", { enum: userStatusValues })
      .notNull()
      .default("active"),
    userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(0),
  },
  (table) => [
    check(
      "learner_profiles_status_check",
      sql`${table.status} IN ('active', 'suspended', 'deleted')`
    ),
    check("learner_profiles_version_check", sql`${table.version} >= 0`),
  ]
)
