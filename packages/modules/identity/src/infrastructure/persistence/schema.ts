import { sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { adminRoleValues } from "#identity/domain/admin-role"
import { userStatusValues } from "#identity/domain/user-status"

export const learnerProfiles = sqliteTable(
  "learner_profiles",
  {
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    displayName: text("display_name"),
    status: text("status", { enum: userStatusValues })
      .notNull()
      .default("active"),
    userId: text("user_id").primaryKey().notNull(),
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

export const adminIdentityProfiles = sqliteTable(
  "admin_identity_profiles",
  {
    adminId: text("admin_id").primaryKey().notNull(),
    role: text("role", { enum: adminRoleValues }).notNull().default("operator"),
    version: integer("version").notNull().default(0),
  },
  (table) => [
    check(
      "admin_identity_profiles_role_check",
      sql`${table.role} IN ('owner', 'operator')`
    ),
    check("admin_identity_profiles_version_check", sql`${table.version} >= 0`),
  ]
)

export {
  runIdentitySchemaMigration,
  type LegacyAdminIdentity,
} from "#identity/infrastructure/persistence/schema-migration"
