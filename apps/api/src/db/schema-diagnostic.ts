import type { Database } from "bun:sqlite"

import {
  currentSchemaBaseline,
  inspectApplicationMigrationHistory,
} from "@/db/migrate"

type DatabaseForeignKeyViolation = Readonly<{
  foreignKeyIndex: number
  parentTable: string
  rowId: number | null
  table: string
}>

type ApplicationDatabaseChecks = Readonly<{
  foreignKeyViolations: readonly DatabaseForeignKeyViolation[]
  integrity: string
}>

type ApplicationDatabaseDiagnosticIssue = Readonly<{
  code:
    | "database-check-unavailable"
    | "foreign-key-check-failed"
    | "integrity-check-failed"
    | "migration-history-invalid"
    | "schema-era-missing"
  message: string
}>

type DiagnosticBase = Readonly<{
  checks: ApplicationDatabaseChecks
  issues: readonly ApplicationDatabaseDiagnosticIssue[]
  kind: "application-database-diagnostic"
}>

export type ApplicationDatabaseDiagnostic =
  | (DiagnosticBase &
      Readonly<{
        schema: "current"
        status: "ok"
      }>)
  | (DiagnosticBase &
      Readonly<{
        pendingMigrationIds: readonly string[]
        schema: "current"
        status: "migration-required"
      }>)
  | (DiagnosticBase &
      Readonly<{
        schema: "empty"
        status: "migration-required"
      }>)
  | (DiagnosticBase &
      Readonly<{
        reason: string
        schema: "unsupported"
        status: "blocked"
      }>)

export function inspectApplicationDatabase(
  sqlite: Database
): ApplicationDatabaseDiagnostic {
  let checks: ApplicationDatabaseChecks
  try {
    checks = readDatabaseChecks(sqlite)
  } catch (error) {
    return blockedDiagnostic(
      createChecks("unavailable"),
      "database-check-unavailable",
      `database checks could not be read: ${readErrorMessage(error)}`
    )
  }

  if (checks.integrity !== "ok") {
    return blockedDiagnostic(
      checks,
      "integrity-check-failed",
      `SQLite integrity_check failed: ${checks.integrity}`
    )
  }
  if (checks.foreignKeyViolations.length > 0) {
    return blockedDiagnostic(
      checks,
      "foreign-key-check-failed",
      "SQLite foreign_key_check failed"
    )
  }

  let migrationHistory: ReturnType<typeof inspectApplicationMigrationHistory>
  try {
    migrationHistory = inspectApplicationMigrationHistory(sqlite)
  } catch (error) {
    return blockedDiagnostic(
      checks,
      "migration-history-invalid",
      readErrorMessage(error)
    )
  }

  const applicationTables = readApplicationDatabaseBackupTables(sqlite).filter(
    (tableName) => tableName !== "api_schema_migrations"
  )
  if (applicationTables.length === 0) {
    return Object.freeze({
      checks,
      issues: Object.freeze([]),
      kind: "application-database-diagnostic",
      schema: "empty",
      status: "migration-required",
    })
  }

  if (migrationHistory.status === "complete") {
    return Object.freeze({
      checks,
      issues: Object.freeze([]),
      kind: "application-database-diagnostic",
      schema: "current",
      status: "ok",
    })
  }

  if (migrationHistory.pendingMigrationIds.includes(currentSchemaBaseline.id)) {
    return blockedDiagnostic(
      checks,
      "schema-era-missing",
      "현재 schema era가 선언되지 않았습니다."
    )
  }

  return Object.freeze({
    checks,
    issues: Object.freeze([]),
    kind: "application-database-diagnostic",
    pendingMigrationIds: migrationHistory.pendingMigrationIds,
    schema: "current",
    status: "migration-required",
  })
}

export function readApplicationDatabaseBackupTables(
  sqlite: Database
): readonly string[] {
  return Object.freeze(
    sqlite
      .query<{ readonly name: string }, []>(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `)
      .all()
      .map(({ name }) => name)
  )
}

function readDatabaseChecks(sqlite: Database): ApplicationDatabaseChecks {
  const integrity =
    sqlite
      .query<{ readonly result: string }, []>(
        "SELECT integrity_check AS result FROM pragma_integrity_check"
      )
      .get()?.result ?? "missing"
  const foreignKeyViolations = sqlite
    .query<
      {
        readonly fkid: number
        readonly parent: string
        readonly rowid: number | null
        readonly table: string
      },
      []
    >("PRAGMA foreign_key_check")
    .all()
    .map((violation) =>
      Object.freeze({
        foreignKeyIndex: violation.fkid,
        parentTable: violation.parent,
        rowId: violation.rowid,
        table: violation.table,
      })
    )

  return createChecks(integrity, foreignKeyViolations)
}

function createChecks(
  integrity: string,
  foreignKeyViolations: readonly DatabaseForeignKeyViolation[] = []
): ApplicationDatabaseChecks {
  return Object.freeze({
    foreignKeyViolations: Object.freeze([...foreignKeyViolations]),
    integrity,
  })
}

function blockedDiagnostic(
  checks: ApplicationDatabaseChecks,
  code: ApplicationDatabaseDiagnosticIssue["code"],
  reason: string
): ApplicationDatabaseDiagnostic {
  return Object.freeze({
    checks,
    issues: Object.freeze([Object.freeze({ code, message: reason })]),
    kind: "application-database-diagnostic",
    reason,
    schema: "unsupported",
    status: "blocked",
  })
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error"
}
