import { createHash } from "node:crypto"

import type { Database } from "bun:sqlite"
import {
  runSqliteMigrations,
  type SqliteMigrationResult,
} from "@workspace/db/migration-runner"

import currentSchemaBaselineSql from "../../drizzle/0000-current-schema-baseline.sql" with { type: "text" }
import reportingViewsSql from "../../drizzle/0001-reporting-views.sql" with { type: "text" }
import auditEventsCourseRestoreSql from "../../drizzle/0002-audit-events-course-restore.sql" with { type: "text" }
import focusedWritingSql from "../../drizzle/0003-focused-writing.sql" with { type: "text" }
import adminMcpApprovedContentChangesSql from "../../drizzle/0004-admin-mcp-approved-content-changes.sql" with { type: "text" }
import adminMcpFullAdminToolsSql from "../../drizzle/0005-admin-mcp-full-admin-tools.sql" with { type: "text" }
import adminMcpStaticAccessTokensSql from "../../drizzle/0006-admin-mcp-static-access-tokens.sql" with { type: "text" }
import dropAiFeedbackSql from "../../drizzle/0007-drop-ai-feedback.sql" with { type: "text" }
import applicationMigrationManifest from "../../drizzle/application-migrations.json" with { type: "json" }

const migrationSqlByFileName = {
  "0000-current-schema-baseline.sql": currentSchemaBaselineSql,
  "0001-reporting-views.sql": reportingViewsSql,
  "0002-audit-events-course-restore.sql": auditEventsCourseRestoreSql,
  "0003-focused-writing.sql": focusedWritingSql,
  "0004-admin-mcp-approved-content-changes.sql":
    adminMcpApprovedContentChangesSql,
  "0005-admin-mcp-full-admin-tools.sql": adminMcpFullAdminToolsSql,
  "0006-admin-mcp-static-access-tokens.sql": adminMcpStaticAccessTokensSql,
  "0007-drop-ai-feedback.sql": dropAiFeedbackSql,
} as const

const migrationSources = applicationMigrationManifest.map((migration) => ({
  ...readMigration(
    migration.id,
    readMigrationSql(migration.fileName),
    migration.checksum
  ),
  foreignKeys: readForeignKeysMode(migration.foreignKeys),
}))

export const currentSchemaBaseline = readRequiredMigration(
  migrationSources,
  "0000-current-schema-baseline"
)

const applicationMigrations = migrationSources.map(
  ({ checksum, foreignKeys, id, sql }) => ({
    apply(database: Database) {
      database.exec(sql)
    },
    checksum,
    foreignKeys,
    id,
  })
)

export type ApplicationMigrationHistoryInspection =
  | Readonly<{
      pendingMigrationIds: readonly string[]
      status: "complete"
    }>
  | Readonly<{
      pendingMigrationIds: readonly string[]
      status: "incomplete"
    }>

export function inspectApplicationMigrationHistory(
  sqlite: Database
): ApplicationMigrationHistoryInspection {
  if (!hasMigrationHistoryTable(sqlite)) {
    return incompleteHistory(applicationMigrations)
  }

  const expectedMigrationsById = new Map(
    applicationMigrations.map((migration) => [migration.id, migration])
  )
  const appliedMigrations = sqlite
    .query<{ readonly checksum: string; readonly id: string }, []>(`
      SELECT id, checksum
      FROM api_schema_migrations
      ORDER BY id
    `)
    .all()

  for (const applied of appliedMigrations) {
    const expected = expectedMigrationsById.get(applied.id)
    if (expected === undefined) {
      throw new Error(`알 수 없는 적용 migration입니다: ${applied.id}`)
    }
    if (expected.checksum !== applied.checksum) {
      throw new Error(`적용 migration checksum이 다릅니다: ${applied.id}`)
    }
  }

  const appliedMigrationIds = new Set(appliedMigrations.map(({ id }) => id))
  const firstPendingIndex = applicationMigrations.findIndex(
    ({ id }) => !appliedMigrationIds.has(id)
  )
  if (
    firstPendingIndex >= 0 &&
    applicationMigrations
      .slice(firstPendingIndex + 1)
      .some(({ id }) => appliedMigrationIds.has(id))
  ) {
    throw new Error(
      "적용 migration 순서가 올바르지 않습니다. 이력은 manifest의 연속된 prefix여야 합니다."
    )
  }

  if (firstPendingIndex < 0) {
    return {
      pendingMigrationIds: [],
      status: "complete",
    }
  }

  return incompleteHistory(applicationMigrations.slice(firstPendingIndex))
}

export function runApplicationMigrations(
  sqlite: Database
): readonly SqliteMigrationResult[] {
  if (hasApplicationTables(sqlite) && !hasMigrationHistoryTable(sqlite)) {
    throw new Error(
      "migration 이력이 없는 비어 있지 않은 database에는 baseline을 적용할 수 없습니다."
    )
  }

  inspectApplicationMigrationHistory(sqlite)
  return runSqliteMigrations(sqlite, applicationMigrations)
}

function incompleteHistory(
  migrations: readonly Readonly<{ id: string }>[]
): ApplicationMigrationHistoryInspection {
  return {
    pendingMigrationIds: migrations.map(({ id }) => id),
    status: "incomplete",
  }
}

function hasMigrationHistoryTable(sqlite: Database): boolean {
  return (
    sqlite
      .query<{ readonly present: number }, []>(`
        SELECT EXISTS (
          SELECT 1
          FROM sqlite_master
          WHERE type = 'table' AND name = 'api_schema_migrations'
        ) AS present
      `)
      .get()?.present === 1
  )
}

function hasApplicationTables(sqlite: Database): boolean {
  return (
    sqlite
      .query<{ readonly present: number }, []>(`
        SELECT EXISTS (
          SELECT 1
          FROM sqlite_master
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            AND name <> 'api_schema_migrations'
        ) AS present
      `)
      .get()?.present === 1
  )
}

function readMigration(
  id: string,
  source: string,
  expectedChecksum: string
): Readonly<{ checksum: string; id: string; sql: string }> {
  const sql = normalizeLineEndings(source)
  const checksum = createHash("sha256").update(sql).digest("hex")
  if (checksum !== expectedChecksum) {
    throw new Error(`migration checksum이 변경됐습니다: ${id}`)
  }
  return { checksum, id, sql }
}

function readRequiredMigration<
  TMigration extends Readonly<{ readonly id: string }>,
>(migrations: readonly TMigration[], id: string): TMigration {
  const migration = migrations.find((candidate) => candidate.id === id)
  if (migration === undefined) {
    throw new Error(`필수 application migration이 없습니다: ${id}`)
  }

  return migration
}

function readMigrationSql(fileName: string): string {
  if (fileName in migrationSqlByFileName) {
    return migrationSqlByFileName[
      fileName as keyof typeof migrationSqlByFileName
    ]
  }

  throw new Error(
    `manifest에 알 수 없는 migration 파일이 있습니다: ${fileName}`
  )
}

function readForeignKeysMode(value: string): "on" | "off" {
  if (value === "on" || value === "off") {
    return value
  }

  throw new Error(`manifest의 foreignKeys 값이 잘못되었습니다: ${value}`)
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}
