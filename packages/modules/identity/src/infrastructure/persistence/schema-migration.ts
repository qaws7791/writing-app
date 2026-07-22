import type { Database } from "bun:sqlite"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"

import { adminRoles, parseAdminRole } from "#identity/domain/admin-role"
import { deletedLearnerDisplayName } from "#identity/domain/learner-profile"

export type LegacyAdminIdentity = Readonly<{
  id: string
  role: unknown
}>

const createLearnerProfilesTableSql = `
CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  display_name TEXT,
  deleted_at INTEGER,
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
);
`

export function runIdentitySchemaMigration(
  sqlite: Database,
  input: Readonly<{
    legacyAdminIdentities?: readonly LegacyAdminIdentity[]
  }> = {}
): void {
  sqlite.exec(createLearnerProfilesTableSql)
  sqlite.exec(`
CREATE TABLE IF NOT EXISTS admin_identity_profiles (
  admin_id TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('owner', 'operator')),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
);
`)

  migrateLearnerProfilesTable(sqlite)
  sqlite
    .query(
      "UPDATE learner_profiles SET display_name = ? WHERE status = 'deleted' AND display_name IS NOT ?"
    )
    .run(deletedLearnerDisplayName, deletedLearnerDisplayName)
  backfillAdminIdentities(sqlite, input.legacyAdminIdentities ?? [])
}

function migrateLearnerProfilesTable(sqlite: Database): void {
  const columns = sqlite
    .query<{ readonly name: string }, []>("PRAGMA table_info(learner_profiles)")
    .all()
    .map(({ name }) => name)
  const hasCrossModuleForeignKey = sqlite
    .query<{ readonly table: string }, []>(
      "PRAGMA foreign_key_list(learner_profiles)"
    )
    .all()
    .some(({ table }) => table === "user")

  if (hasCrossModuleForeignKey) {
    rebuildLearnerProfilesTable(sqlite, columns.includes("version"))
    return
  }

  if (!columns.includes("version")) {
    sqlite.exec(
      "ALTER TABLE learner_profiles ADD COLUMN version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)"
    )
  }
}

function rebuildLearnerProfilesTable(
  sqlite: Database,
  hasVersion: boolean
): void {
  sqlite.exec("BEGIN IMMEDIATE")
  try {
    sqlite.exec(
      "ALTER TABLE learner_profiles RENAME TO learner_profiles_legacy_identity"
    )
    sqlite.exec(createLearnerProfilesTableSql)
    sqlite.exec(`
INSERT INTO learner_profiles (
  user_id,
  status,
  display_name,
  deleted_at,
  version
)
SELECT
  user_id,
  status,
  display_name,
  deleted_at,
  ${hasVersion ? "version" : "0"}
FROM learner_profiles_legacy_identity;
DROP TABLE learner_profiles_legacy_identity;
`)
    sqlite.exec("COMMIT")
  } catch (error) {
    sqlite.exec("ROLLBACK")
    throw error
  }
}

function backfillAdminIdentities(
  sqlite: Database,
  identities: readonly LegacyAdminIdentity[]
): void {
  const insert = sqlite.query<void, [string, string]>(`
INSERT INTO admin_identity_profiles (admin_id, role, version)
VALUES (?, ?, 0)
ON CONFLICT(admin_id) DO NOTHING
`)

  for (const identity of identities) {
    const adminId = adminIdSchema.parse(identity.id)
    const role = parseAdminRole(identity.role) ?? adminRoles.operator
    insert.run(adminId, role)
  }
}
