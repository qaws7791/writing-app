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
const removeCourseThumbnailSql = readFileSync(
  new URL("./0010-remove-course-thumbnail.sql", import.meta.url),
  "utf8"
)

export function runContentMigration(sqlite: Database) {
  sqlite.exec(contentMigrationSql)
  sqlite.exec(platformBackendMigrationSql)
  sqlite.exec(adminAuthMigrationSql)
  addColumnIfMissing(
    sqlite,
    "course_chapters",
    "status",
    "alter table course_chapters add column status text not null default 'active'"
  )
  addColumnIfMissing(
    sqlite,
    "course_lessons",
    "status",
    "alter table course_lessons add column status text not null default 'active'"
  )
  addColumnIfMissing(
    sqlite,
    "lesson_steps",
    "status",
    "alter table lesson_steps add column status text not null default 'active'"
  )
  dropColumnIfExists(
    sqlite,
    "course_progress",
    "curriculum_version_id",
    "alter table course_progress drop column curriculum_version_id"
  )
  dropColumnIfExists(
    sqlite,
    "lesson_progress",
    "curriculum_version_id",
    "alter table lesson_progress drop column curriculum_version_id"
  )
  dropColumnIfExists(
    sqlite,
    "course_chapters",
    "label",
    "alter table course_chapters drop column label"
  )
  dropColumnIfExists(
    sqlite,
    "curriculum_version_chapters",
    "label",
    "alter table curriculum_version_chapters drop column label"
  )
  dropColumnIfExists(
    sqlite,
    "courses",
    "thumbnail_path",
    removeCourseThumbnailSql
  )
  sqlite.exec("drop table if exists curriculum_upgrade_dismissals")
  sqlite.exec("drop table if exists curriculum_migration_applications")
  sqlite.exec("drop table if exists lesson_migration_mappings")
  sqlite.exec("drop table if exists curriculum_version_migrations")
  sqlite.exec("drop table if exists curriculum_version_steps")
  sqlite.exec("drop table if exists curriculum_version_lessons")
  sqlite.exec("drop table if exists curriculum_version_chapters")
  sqlite.exec("drop table if exists curriculum_versions")
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

function dropColumnIfExists(
  sqlite: Database,
  tableName: string,
  columnName: string,
  alterTableSql: string
) {
  const columns = sqlite
    .query<{ name: string }, []>(`pragma table_info(${tableName})`)
    .all()

  if (!columns.some((column) => column.name === columnName)) {
    return
  }

  sqlite.exec(alterTableSql)
}
