import type { Database } from "bun:sqlite"

import { normalizeLegacyVersionedStepContentOrThrow } from "@workspace/content/normalization"

import {
  assertLegacyCurriculumMigrationPrerequisites,
  hasLegacyCurriculumSchema,
} from "@/db/legacy-curriculum-migration"
import { assertLegacyResourceLibraryMigrationPrerequisites } from "@/db/legacy-resource-library-migration"
import {
  assertApplicationMigrationPrerequisites,
  hasKnownLegacyAdminMfaSchema,
  inspectApplicationMigrationHistory,
} from "@/db/migrate"
import {
  hasBaselineSchema,
  isCurrentApplicationSchema,
} from "@/db/schema-architecture"
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
    | "migration-prerequisite-failed"
    | "unknown-schema"
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
        legacySchema: "admin-mfa" | "baseline" | "curriculum"
        schema: "legacy"
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

  const tableNames = readUserTableNames(sqlite)
  if (tableNames.length === 0) {
    return Object.freeze({
      checks,
      issues: Object.freeze([]),
      kind: "application-database-diagnostic",
      schema: "empty",
      status: "migration-required",
    })
  }

  if (isCurrentApplicationSchema(sqlite)) {
    if (migrationHistory.status === "incomplete") {
      return Object.freeze({
        checks,
        issues: Object.freeze([]),
        kind: "application-database-diagnostic",
        pendingMigrationIds: migrationHistory.pendingMigrationIds,
        schema: "current",
        status: "migration-required",
      })
    }
    return Object.freeze({
      checks,
      issues: Object.freeze([]),
      kind: "application-database-diagnostic",
      schema: "current",
      status: "ok",
    })
  }

  if (hasLegacyCurriculumSchema(sqlite)) {
    try {
      assertLegacyCurriculumMigrationPrerequisites(
        sqlite,
        normalizeLegacyVersionedStepContentOrThrow
      )
      assertLegacyResourceLibraryMigrationPrerequisites(sqlite)
      return legacyDiagnostic(checks, "curriculum")
    } catch (error) {
      return blockedDiagnostic(
        checks,
        "migration-prerequisite-failed",
        `legacy curriculum prerequisite failed: ${readErrorMessage(error)}`
      )
    }
  }

  if (hasBaselineSchema(sqlite)) {
    try {
      assertApplicationMigrationPrerequisites(sqlite)
      return legacyDiagnostic(checks, "baseline")
    } catch (error) {
      return blockedDiagnostic(
        checks,
        "migration-prerequisite-failed",
        `baseline migration prerequisite failed: ${readErrorMessage(error)}`
      )
    }
  }

  if (hasKnownLegacyAdminMfaSchema(sqlite)) {
    return legacyDiagnostic(checks, "admin-mfa")
  }

  return blockedDiagnostic(
    checks,
    "unknown-schema",
    `unknown application schema tables: ${tableNames.join(", ")}`
  )
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

function legacyDiagnostic(
  checks: ApplicationDatabaseChecks,
  legacySchema: Extract<
    ApplicationDatabaseDiagnostic,
    { readonly schema: "legacy" }
  >["legacySchema"]
): ApplicationDatabaseDiagnostic {
  return Object.freeze({
    checks,
    issues: Object.freeze([]),
    kind: "application-database-diagnostic",
    legacySchema,
    schema: "legacy",
    status: "migration-required",
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

function readUserTableNames(sqlite: Database): readonly string[] {
  return readApplicationDatabaseBackupTables(sqlite).filter(
    (tableName) => tableName !== "api_schema_migrations"
  )
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error"
}
