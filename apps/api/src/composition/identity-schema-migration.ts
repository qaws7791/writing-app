import type { Database } from "bun:sqlite"
import {
  runIdentitySchemaMigration,
  type LegacyAdminIdentity,
} from "@workspace/identity/schema"

export function runApiIdentitySchemaMigration(sqlite: Database): void {
  runIdentitySchemaMigration(sqlite, {
    legacyAdminIdentities: readLegacyAdminIdentities(sqlite),
  })
}

function readLegacyAdminIdentities(
  sqlite: Database
): readonly LegacyAdminIdentity[] {
  const columns = sqlite
    .query<{ readonly name: string }, []>("PRAGMA table_info(admin_user)")
    .all()
    .map(({ name }) => name)
  if (columns.length === 0) return []

  return columns.includes("role")
    ? sqlite
        .query<LegacyAdminIdentity, []>("SELECT id, role FROM admin_user")
        .all()
    : sqlite
        .query<LegacyAdminIdentity, []>(
          "SELECT id, 'operator' AS role FROM admin_user"
        )
        .all()
}
