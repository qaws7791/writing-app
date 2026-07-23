import { createHash } from "node:crypto"

import type { Database } from "bun:sqlite"
import {
  runSqliteMigrations,
  type SqliteMigrationResult,
} from "@workspace/db/migration-runner"

import currentSchemaBaselineSql from "../../drizzle/0000-current-schema-baseline.sql" with { type: "text" }

export const currentSchemaBaseline = readMigration(
  "0000-current-schema-baseline",
  currentSchemaBaselineSql,
  "a65960ed40a5fa50559024f72211b18642572f4e612bc85319c9aff6bd146628"
)

const applicationMigrations = Object.freeze([
  {
    apply(database: Database) {
      database.exec(currentSchemaBaseline.sql)
    },
    checksum: currentSchemaBaseline.checksum,
    foreignKeys: "on" as const,
    id: currentSchemaBaseline.id,
  },
])

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
    return Object.freeze({
      pendingMigrationIds: Object.freeze([]),
      status: "complete",
    })
  }

  return incompleteHistory(applicationMigrations.slice(firstPendingIndex))
}

export function runApplicationMigrations(
  sqlite: Database
): readonly SqliteMigrationResult[] {
  if (
    hasApplicationTables(sqlite) &&
    !hasCurrentSchemaBaselineHistory(sqlite)
  ) {
    throw new Error(
      "현재 schema era가 선언되지 않은 database입니다. 검증 백업 뒤 일회성 schema era 전환을 먼저 실행해야 합니다."
    )
  }

  inspectApplicationMigrationHistory(sqlite)
  return runSqliteMigrations(sqlite, applicationMigrations)
}

function incompleteHistory(
  migrations: readonly Readonly<{ id: string }>[]
): ApplicationMigrationHistoryInspection {
  return Object.freeze({
    pendingMigrationIds: Object.freeze(migrations.map(({ id }) => id)),
    status: "incomplete",
  })
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

function hasCurrentSchemaBaselineHistory(sqlite: Database): boolean {
  if (!hasMigrationHistoryTable(sqlite)) return false

  return (
    sqlite
      .query<{ readonly present: number }, [string]>(`
        SELECT EXISTS (
          SELECT 1
          FROM api_schema_migrations
          WHERE id = ?
        ) AS present
      `)
      .get(currentSchemaBaseline.id)?.present === 1
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
  return Object.freeze({ checksum, id, sql })
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}
