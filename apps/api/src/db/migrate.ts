import { createHash } from "node:crypto"

import type { Database } from "bun:sqlite"
import { assertAiFeedbackMigrationPrerequisites } from "@workspace/ai-feedback/migration"
import { assertContentMigrationPrerequisites } from "@workspace/content/migration"
import {
  hasLegacyCurriculumSchema,
  migrateLegacyCurriculumSchema,
  type NormalizeVersionedStepContent,
} from "@/db/legacy-curriculum-migration"
import {
  assertLegacyResourceLibraryMigrationPrerequisites,
  prepareLegacyResourceLibraryState,
} from "@/db/legacy-resource-library-migration"
import {
  runSqliteMigrations,
  type SqliteMigrationResult,
} from "@workspace/db/migration-runner"
import { assertLearningMigrationPrerequisites } from "@workspace/learning/migration"
import { assertResourceLibraryMigrationPrerequisites } from "@workspace/resource-library/migration"

import baselineMigrationSql from "../../drizzle/0000-writing-app-baseline.sql" with { type: "text" }
import moduleOwnershipMigrationSql from "../../drizzle/0001-module-schema-ownership.sql" with { type: "text" }

import {
  assertCurrentApplicationSchema,
  hasBaselineSchema,
  isCurrentApplicationSchema,
  isPreP11ModuleSchema,
} from "@/db/schema-architecture"
import { assertNoDanglingSchemaReferences } from "@/db/schema-reconciliation"

const baselineMigration = readMigration(
  "0000-writing-app-baseline",
  baselineMigrationSql,
  "ca744dd3c34bdd604cfd3de4e57c44dc4299e67bb6685926e4d89aa5821bee25"
)
const moduleOwnershipMigration = readMigration(
  "0001-module-schema-ownership",
  moduleOwnershipMigrationSql,
  "20b1b8a424d4916b565f5b991f221ddc0708a1a654f0cfbeaf6627b53b2636b0"
)

export type ApplicationMigrationOptions = Readonly<{
  normalizeVersionedStepContent?: NormalizeVersionedStepContent
}>

export type ApplicationMigrationHistoryInspection =
  | Readonly<{
      pendingMigrationIds: readonly string[]
      status: "complete"
    }>
  | Readonly<{
      pendingMigrationIds: readonly string[]
      status: "incomplete"
    }>

function assertApplicationMigrationHistory(sqlite: Database): void {
  inspectApplicationMigrationHistory(sqlite)
}

export function inspectApplicationMigrationHistory(
  sqlite: Database
): ApplicationMigrationHistoryInspection {
  const expectedMigrations = [baselineMigration, moduleOwnershipMigration]
  if (
    sqlite
      .query<{ readonly present: number }, []>(`
        SELECT EXISTS (
          SELECT 1
          FROM sqlite_master
          WHERE type = 'table' AND name = 'api_schema_migrations'
        ) AS present
      `)
      .get()?.present !== 1
  ) {
    return Object.freeze({
      pendingMigrationIds: Object.freeze(
        expectedMigrations.map(({ id }) => id)
      ),
      status: "incomplete",
    })
  }

  const expectedMigrationsById = new Map(
    expectedMigrations.map((migration) => [migration.id, migration])
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
  const firstPendingIndex = expectedMigrations.findIndex(
    ({ id }) => !appliedMigrationIds.has(id)
  )
  if (
    firstPendingIndex >= 0 &&
    expectedMigrations
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

  return Object.freeze({
    pendingMigrationIds: Object.freeze(
      expectedMigrations.slice(firstPendingIndex).map(({ id }) => id)
    ),
    status: "incomplete",
  })
}

export function runApplicationMigrations(
  sqlite: Database,
  options: ApplicationMigrationOptions = {}
): readonly SqliteMigrationResult[] {
  assertApplicationMigrationHistory(sqlite)
  prepareLegacyCurriculum(sqlite, options)

  const hasApplicationTables = readApplicationTableCount(sqlite) > 0
  const baselineSchemaPresent = hasBaselineSchema(sqlite)
  if (
    hasApplicationTables &&
    !baselineSchemaPresent &&
    !hasKnownLegacyAdminMfaSchema(sqlite)
  ) {
    throw new Error(
      "지원하지 않는 database schema입니다. migration 전에 복구 가능한 backup과 기준 version을 확인해야 합니다."
    )
  }
  if (baselineSchemaPresent && !isCurrentApplicationSchema(sqlite)) {
    assertApplicationMigrationPrerequisites(sqlite)
  }

  return runSqliteMigrations(sqlite, [
    {
      apply(database) {
        database.exec(baselineMigration.sql)
      },
      canAdopt: hasBaselineSchema,
      checksum: baselineMigration.checksum,
      foreignKeys: "on",
      id: baselineMigration.id,
      validate(database) {
        if (!hasBaselineSchema(database)) {
          throw new Error("baseline migration schema 검증에 실패했습니다.")
        }
      },
    },
    {
      apply(database) {
        removeLegacyAdminMfaSchema(database)
        if (isPreP11ModuleSchema(database)) {
          database.exec("ALTER TABLE admin_user DROP COLUMN role")
          return
        }
        database.exec(moduleOwnershipMigration.sql)
      },
      canAdopt: isCurrentApplicationSchema,
      checksum: moduleOwnershipMigration.checksum,
      foreignKeys: "off",
      id: moduleOwnershipMigration.id,
      validate: assertCurrentApplicationSchema,
    },
  ])
}

export function hasKnownLegacyAdminMfaSchema(sqlite: Database): boolean {
  const tables = readApplicationTableNames(sqlite)
  const allowedTables = new Set([
    "admin_mfa_recovery_code",
    "admin_two_factor",
    "admin_user",
  ])
  return (
    tables.has("admin_user") &&
    readColumnNames(sqlite, "admin_user").has("two_factor_enabled") &&
    [...tables].every((table) => allowedTables.has(table))
  )
}

function removeLegacyAdminMfaSchema(sqlite: Database): void {
  sqlite.exec(`
    DROP TABLE IF EXISTS admin_mfa_recovery_code;
    DROP TABLE IF EXISTS admin_two_factor;
  `)
  if (readColumnNames(sqlite, "admin_user").has("two_factor_enabled")) {
    sqlite.exec("ALTER TABLE admin_user DROP COLUMN two_factor_enabled")
  }
}

function prepareLegacyCurriculum(
  sqlite: Database,
  options: ApplicationMigrationOptions
): void {
  if (!hasLegacyCurriculumSchema(sqlite)) return
  if (options.normalizeVersionedStepContent === undefined) {
    throw new Error(
      "legacy curriculum migration에는 content normalization 정책이 필요합니다."
    )
  }
  assertLegacyResourceLibraryMigrationPrerequisites(sqlite)

  migrateLegacyCurriculumSchema(
    sqlite,
    baselineMigration.sql,
    options.normalizeVersionedStepContent,
    prepareLegacyApplicationState
  )
}

function prepareLegacyApplicationState(sqlite: Database): void {
  prepareLegacyAiFeedbackAttemptState(sqlite)
  prepareLegacyResourceLibraryState(sqlite)
}

export function assertApplicationMigrationPrerequisites(
  sqlite: Database
): void {
  const integrity = sqlite
    .query<{ readonly result: string }, []>(
      "SELECT integrity_check AS result FROM pragma_integrity_check"
    )
    .get()?.result
  if (integrity !== "ok") {
    throw new Error(
      `migration prerequisite failed: integrity ${integrity ?? "missing"}`
    )
  }

  const foreignKeyViolation = sqlite
    .query<unknown, []>("PRAGMA foreign_key_check")
    .get()
  if (foreignKeyViolation !== null) {
    throw new Error("migration prerequisite failed: foreign key violation")
  }

  assertNoDanglingSchemaReferences(sqlite)
  assertContentMigrationPrerequisites(sqlite)
  assertAiFeedbackMigrationPrerequisites(sqlite)
  assertLearningMigrationPrerequisites(sqlite)
  assertResourceLibraryMigrationPrerequisites(sqlite)
  assertIdentityValues(sqlite)
  assertOperationsValues(sqlite)
}

function assertIdentityValues(sqlite: Database): void {
  const invalidProfile = sqlite
    .query<{ readonly userId: string }, []>(`
      SELECT user_id AS userId
      FROM learner_profiles
      WHERE status NOT IN ('active', 'suspended', 'deleted')
      LIMIT 1
    `)
    .get()
  if (invalidProfile !== null) {
    throw new Error(
      `migration prerequisite failed: invalid learner profile ${invalidProfile.userId}`
    )
  }
}

function assertOperationsValues(sqlite: Database): void {
  const invalidMessage = sqlite
    .query<{ readonly id: string }, []>(`
      SELECT id
      FROM admin_ai_chat_messages
      WHERE role NOT IN ('assistant', 'user')
      LIMIT 1
    `)
    .get()
  if (invalidMessage !== null) {
    throw new Error(
      `migration prerequisite failed: invalid operations message ${invalidMessage.id}`
    )
  }
}

function readApplicationTableCount(sqlite: Database): number {
  return readApplicationTableNames(sqlite).size
}

function readApplicationTableNames(sqlite: Database): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
          AND name <> 'api_schema_migrations'
      `)
      .all()
      .map((row) => row.name)
  )
}

function readColumnNames(
  sqlite: Database,
  tableName: string
): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
      .all()
      .map((row) => row.name)
  )
}

function prepareLegacyAiFeedbackAttemptState(sqlite: Database): void {
  const columns = sqlite
    .query<{ readonly name: string }, []>(
      "PRAGMA table_info(ai_feedback_attempts)"
    )
    .all()
    .map((row) => row.name)
  if (columns.length === 0 || columns.includes("status")) return

  sqlite.exec(`
    ALTER TABLE ai_feedback_attempts
      RENAME TO ai_feedback_attempts_legacy_state;

    CREATE TABLE ai_feedback_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      step_id TEXT NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
      attempt_number INTEGER NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL
        CHECK (status IN ('pending', 'succeeded', 'failed', 'expired')),
      answer_text TEXT NOT NULL,
      result_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    INSERT INTO ai_feedback_attempts (
      id, user_id, lesson_id, step_id, attempt_number, idempotency_key,
      status, answer_text, result_json, created_at, updated_at, expires_at
    )
    SELECT
      'legacy:' || user_id || ':' || lesson_id || ':' || step_id || ':' || attempt_number,
      user_id, lesson_id, step_id, attempt_number, 'legacy:' || attempt_number,
      'succeeded', answer_text, result_json, created_at, created_at, created_at
    FROM ai_feedback_attempts_legacy_state;

    DROP TABLE ai_feedback_attempts_legacy_state;
  `)
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
