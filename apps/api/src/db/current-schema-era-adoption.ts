import type { Database } from "bun:sqlite"

import { currentSchemaBaseline } from "@/db/migrate"

type MigrationHistoryRow = Readonly<{
  checksum: string
  id: string
}>

export type CurrentSchemaEraAdoptionInspection =
  | Readonly<{
      status: "already-current"
    }>
  | Readonly<{
      previousMigrationIds: readonly string[]
      status: "ready"
    }>

export type CurrentSchemaEraAdoptionResult =
  | Readonly<{
      status: "already-current"
    }>
  | Readonly<{
      previousMigrationIds: readonly string[]
      status: "adopted"
    }>

const previousMigrationLineage = Object.freeze([
  {
    checksum:
      "ca744dd3c34bdd604cfd3de4e57c44dc4299e67bb6685926e4d89aa5821bee25",
    id: "0000-writing-app-baseline",
  },
  {
    checksum:
      "20b1b8a424d4916b565f5b991f221ddc0708a1a654f0cfbeaf6627b53b2636b0",
    id: "0001-module-schema-ownership",
  },
  {
    checksum:
      "86451557db525a8dd446daeca77dca54d8f241cb64c2cf5be08d7a2b6deb8d65",
    id: "0002-cross-module-reference-integrity",
  },
  {
    checksum:
      "f757d500fc548052b97de4938d94f86c41377df3ca25ba0868b7923a537ea622",
    id: "0003-remove-unused-operations",
  },
])

export function inspectCurrentSchemaEraAdoption(
  sqlite: Database
): CurrentSchemaEraAdoptionInspection {
  assertDatabaseChecks(sqlite)

  const history = readMigrationHistory(sqlite)
  if (matchesLineage(history, [currentSchemaBaseline])) {
    return Object.freeze({ status: "already-current" })
  }
  if (!matchesLineage(history, previousMigrationLineage)) {
    throw new Error(
      "일회성 schema era 전환은 최종 이전 migration 계보만 지원합니다."
    )
  }

  return Object.freeze({
    previousMigrationIds: Object.freeze(history.map(({ id }) => id)),
    status: "ready",
  })
}

export function adoptCurrentSchemaEra(
  sqlite: Database
): CurrentSchemaEraAdoptionResult {
  const initialInspection = inspectCurrentSchemaEraAdoption(sqlite)
  if (initialInspection.status === "already-current") return initialInspection

  sqlite.exec("BEGIN IMMEDIATE")
  try {
    const lockedInspection = inspectCurrentSchemaEraAdoption(sqlite)
    if (lockedInspection.status === "already-current") {
      sqlite.exec("COMMIT")
      return lockedInspection
    }

    sqlite.exec(`
      DROP TABLE api_schema_migrations;
      CREATE TABLE api_schema_migrations (
        id TEXT PRIMARY KEY NOT NULL,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `)
    sqlite
      .query<void, [string, string]>(`
        INSERT INTO api_schema_migrations (id, checksum)
        VALUES (?, ?)
      `)
      .run(currentSchemaBaseline.id, currentSchemaBaseline.checksum)

    inspectCurrentSchemaEraAdoption(sqlite)
    sqlite.exec("COMMIT")
    return Object.freeze({
      previousMigrationIds: lockedInspection.previousMigrationIds,
      status: "adopted",
    })
  } catch (error) {
    sqlite.exec("ROLLBACK")
    throw error
  }
}

function assertDatabaseChecks(sqlite: Database): void {
  const integrity = sqlite
    .query<{ readonly result: string }, []>(
      "SELECT integrity_check AS result FROM pragma_integrity_check"
    )
    .get()?.result
  if (integrity !== "ok") {
    throw new Error(`SQLite integrity_check 실패: ${integrity ?? "missing"}`)
  }

  if (sqlite.query<unknown, []>("PRAGMA foreign_key_check").get() !== null) {
    throw new Error("SQLite foreign_key_check 실패")
  }
}

function readMigrationHistory(
  sqlite: Database
): readonly MigrationHistoryRow[] {
  const historyTableExists =
    sqlite
      .query<{ readonly present: number }, []>(`
        SELECT EXISTS (
          SELECT 1
          FROM sqlite_master
          WHERE type = 'table' AND name = 'api_schema_migrations'
        ) AS present
      `)
      .get()?.present === 1
  if (!historyTableExists) {
    throw new Error("migration 이력 table이 없습니다.")
  }

  return sqlite
    .query<MigrationHistoryRow, []>(`
      SELECT id, checksum
      FROM api_schema_migrations
      ORDER BY id
    `)
    .all()
}

function matchesLineage(
  actual: readonly MigrationHistoryRow[],
  expected: readonly MigrationHistoryRow[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (migration, index) =>
        migration.id === expected[index]?.id &&
        migration.checksum === expected[index]?.checksum
    )
  )
}
