import { readFileSync } from "node:fs"
import type { Database } from "bun:sqlite"

const contentMigrationSql = readFileSync(
  new URL("./0000-initial-content.sql", import.meta.url),
  "utf8"
)
const platformBackendMigrationSql = readFileSync(
  new URL("./0001-platform-backend.sql", import.meta.url),
  "utf8"
)
const adminAuthMigrationSql = readFileSync(
  new URL("./0002-admin-auth.sql", import.meta.url),
  "utf8"
)
const curriculumVersioningMigrationSql = readFileSync(
  new URL("./0003-curriculum-versioning.sql", import.meta.url),
  "utf8"
)

export function runContentMigration(sqlite: Database) {
  sqlite.exec(contentMigrationSql)
  sqlite.exec(platformBackendMigrationSql)
  sqlite.exec(adminAuthMigrationSql)
  sqlite.exec(curriculumVersioningMigrationSql)
}
