import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
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
const courseCurriculumRevisionSql = readFileSync(
  new URL("./0011-course-curriculum-revision.sql", import.meta.url),
  "utf8"
)

type Migration = {
  apply(sqlite: Database): void
  checksumSource: string
  version: string
}

const curriculumStatusColumnsSql = [
  "alter table course_chapters add column status text not null default 'active'",
  "alter table course_lessons add column status text not null default 'active'",
  "alter table lesson_steps add column status text not null default 'active'",
].join("\n")

const removeCurriculumVersioningChecksumSource = [
  "alter table course_progress drop column curriculum_version_id",
  "alter table lesson_progress drop column curriculum_version_id",
  "alter table course_chapters drop column label",
  "alter table curriculum_version_chapters drop column label",
].join("\n")

const removeCurriculumVersioningSql = [
  "drop table if exists curriculum_upgrade_dismissals",
  "drop table if exists curriculum_migration_applications",
  "drop table if exists lesson_migration_mappings",
  "drop table if exists curriculum_version_migrations",
  "drop table if exists curriculum_version_steps",
  "drop table if exists curriculum_version_lessons",
  "drop table if exists curriculum_version_chapters",
  "drop table if exists curriculum_versions",
].join(";\n")

const migrations: Migration[] = [
  {
    version: "0000-initial-content",
    checksumSource: contentMigrationSql,
    apply(sqlite) {
      sqlite.exec(contentMigrationSql)
    },
  },
  {
    version: "0001-platform-backend",
    checksumSource: platformBackendMigrationSql,
    apply(sqlite) {
      sqlite.exec(platformBackendMigrationSql)
    },
  },
  {
    version: "0002-admin-auth",
    checksumSource: adminAuthMigrationSql,
    apply(sqlite) {
      sqlite.exec(adminAuthMigrationSql)
    },
  },
  {
    version: "0003-curriculum-status-columns",
    checksumSource: curriculumStatusColumnsSql,
    apply(sqlite) {
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
    },
  },
  {
    version: "0010-remove-course-thumbnail",
    checksumSource: removeCourseThumbnailSql,
    apply(sqlite) {
      dropColumnIfExists(
        sqlite,
        "courses",
        "thumbnail_path",
        removeCourseThumbnailSql
      )
    },
  },
  {
    version: "0011-course-curriculum-revision",
    checksumSource: courseCurriculumRevisionSql,
    apply(sqlite) {
      addColumnIfMissing(
        sqlite,
        "courses",
        "curriculum_revision",
        courseCurriculumRevisionSql
      )
    },
  },
  {
    version: "0012-remove-curriculum-versioning",
    checksumSource: [
      removeCurriculumVersioningChecksumSource,
      removeCurriculumVersioningSql,
    ].join("\n"),
    apply(sqlite) {
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
      sqlite.exec(removeCurriculumVersioningSql)
    },
  },
]

export function runContentMigration(sqlite: Database) {
  ensureMigrationLedger(sqlite)

  for (const migration of migrations) {
    runMigration(sqlite, migration)
  }
}

function ensureMigrationLedger(sqlite: Database) {
  sqlite.exec(`
    create table if not exists schema_migrations (
      version text primary key,
      checksum text not null,
      applied_at text not null default current_timestamp
    )
  `)
}

function runMigration(sqlite: Database, migration: Migration) {
  const checksum = createChecksum(migration.checksumSource)
  const applied = sqlite
    .query<
      { checksum: string },
      [string]
    >("select checksum from schema_migrations where version = ?")
    .get(migration.version)

  if (applied) {
    if (applied.checksum !== checksum) {
      throw new Error(`Migration checksum mismatch: ${migration.version}`)
    }

    return
  }

  migration.apply(sqlite)
  sqlite
    .query("insert into schema_migrations (version, checksum) values (?, ?)")
    .run(migration.version, checksum)
}

function createChecksum(value: string) {
  return createHash("sha256").update(value).digest("hex")
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
