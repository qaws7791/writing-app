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
const progressCurriculumVersionMigrationSql = readFileSync(
  new URL("./0004-progress-curriculum-version.sql", import.meta.url),
  "utf8"
)
const curriculumMigrationMapSql = readFileSync(
  new URL("./0005-curriculum-migration-map.sql", import.meta.url),
  "utf8"
)
const curriculumUpgradeDismissalSql = readFileSync(
  new URL("./0006-curriculum-upgrade-dismissal.sql", import.meta.url),
  "utf8"
)
const curriculumVersionStepsSql = readFileSync(
  new URL("./0008-curriculum-version-steps.sql", import.meta.url),
  "utf8"
)

export function runContentMigration(sqlite: Database) {
  sqlite.exec(contentMigrationSql)
  sqlite.exec(platformBackendMigrationSql)
  sqlite.exec(adminAuthMigrationSql)
  sqlite.exec(curriculumVersioningMigrationSql)
  addColumnIfMissing(
    sqlite,
    "course_progress",
    "curriculum_version_id",
    "alter table course_progress add column curriculum_version_id text references curriculum_versions(id)"
  )
  addColumnIfMissing(
    sqlite,
    "lesson_progress",
    "curriculum_version_id",
    "alter table lesson_progress add column curriculum_version_id text references curriculum_versions(id)"
  )
  sqlite.exec(progressCurriculumVersionMigrationSql)
  sqlite.exec(curriculumMigrationMapSql)
  sqlite.exec(curriculumUpgradeDismissalSql)
  addColumnIfMissing(
    sqlite,
    "curriculum_versions",
    "revision",
    "alter table curriculum_versions add column revision integer not null default 1"
  )
  addColumnIfMissing(
    sqlite,
    "lesson_steps",
    "status",
    "alter table lesson_steps add column status text not null default 'active'"
  )
  sqlite.exec(curriculumVersionStepsSql)
}

function addColumnIfMissing(
  sqlite: Database,
  tableName: string,
  columnName: string,
  alterTableSql: string
) {
  const columns = sqlite
    .query<{ name: string }, []>(`pragma table_info(${tableName})`)
    .all()

  if (columns.some((column) => column.name === columnName)) {
    return
  }

  sqlite.exec(alterTableSql)
}
