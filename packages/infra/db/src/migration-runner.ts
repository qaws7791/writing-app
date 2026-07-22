import type { Database } from "bun:sqlite"

export type SqliteMigration = Readonly<{
  apply: (sqlite: Database) => void
  canAdopt?: (sqlite: Database) => boolean
  checksum: string
  foreignKeys: "off" | "on"
  id: string
  validate?: (sqlite: Database) => void
}>

export type SqliteMigrationResult = Readonly<{
  execution: "adopted" | "applied" | "skipped"
  id: string
}>

type AppliedMigrationRow = Readonly<{
  checksum: string
  id: string
}>

const migrationTable = "api_schema_migrations"

export function runSqliteMigrations(
  sqlite: Database,
  migrations: readonly SqliteMigration[]
): readonly SqliteMigrationResult[] {
  assertMigrationManifest(migrations)
  createMigrationTable(sqlite)

  const expectedMigrations = new Map(
    migrations.map((migration) => [migration.id, migration])
  )
  const appliedMigrations = readAppliedMigrations(sqlite)

  for (const applied of appliedMigrations.values()) {
    const expected = expectedMigrations.get(applied.id)
    if (expected === undefined) {
      throw new Error(`알 수 없는 적용 migration입니다: ${applied.id}`)
    }
    if (expected.checksum !== applied.checksum) {
      throw new Error(`적용 migration checksum이 다릅니다: ${applied.id}`)
    }
  }

  return migrations.map((migration) => {
    if (appliedMigrations.has(migration.id)) {
      migration.validate?.(sqlite)
      return { execution: "skipped", id: migration.id }
    }

    const execution =
      migration.canAdopt?.(sqlite) === true ? "adopted" : "applied"
    const foreignKeysEnabled = readForeignKeysEnabled(sqlite)
    let transactionStarted = false

    try {
      setForeignKeysEnabled(sqlite, migration.foreignKeys === "on")
      sqlite.exec("BEGIN IMMEDIATE")
      transactionStarted = true

      if (execution === "applied") migration.apply(sqlite)
      migration.validate?.(sqlite)

      if (migration.foreignKeys === "off") {
        const violation = sqlite
          .query<unknown, []>("PRAGMA foreign_key_check")
          .get()
        if (violation !== null) {
          throw new Error(
            `migration 이후 foreign key 위반이 남았습니다: ${migration.id}`
          )
        }
      }

      sqlite
        .query<void, [string, string, string]>(`
          INSERT INTO ${migrationTable} (id, checksum, execution)
          VALUES (?, ?, ?)
        `)
        .run(migration.id, migration.checksum, execution)
      sqlite.exec("COMMIT")
      transactionStarted = false
    } catch (error) {
      if (transactionStarted) sqlite.exec("ROLLBACK")
      throw error
    } finally {
      setForeignKeysEnabled(sqlite, foreignKeysEnabled)
    }

    return { execution, id: migration.id }
  })
}

function assertMigrationManifest(migrations: readonly SqliteMigration[]): void {
  const migrationIds = migrations.map((migration) => migration.id)
  const sortedIds = [...migrationIds].sort()

  if (
    new Set(migrationIds).size !== migrationIds.length ||
    migrationIds.some((id) => !/^\d{4}-[a-z0-9-]+$/u.test(id)) ||
    JSON.stringify(migrationIds) !== JSON.stringify(sortedIds)
  ) {
    throw new Error("migration ID는 고유한 오름차순 kebab-case여야 합니다.")
  }

  if (
    migrations.some((migration) => !/^[a-f\d]{64}$/u.test(migration.checksum))
  ) {
    throw new Error("migration checksum은 SHA-256이어야 합니다.")
  }
}

function createMigrationTable(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ${migrationTable} (
      id TEXT PRIMARY KEY NOT NULL,
      checksum TEXT NOT NULL,
      execution TEXT NOT NULL CHECK (execution IN ('applied', 'adopted')),
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
}

function readAppliedMigrations(
  sqlite: Database
): ReadonlyMap<string, AppliedMigrationRow> {
  return new Map(
    sqlite
      .query<AppliedMigrationRow, []>(`
        SELECT id, checksum
        FROM ${migrationTable}
        ORDER BY id
      `)
      .all()
      .map((migration) => [migration.id, migration])
  )
}

function readForeignKeysEnabled(sqlite: Database): boolean {
  return (
    sqlite
      .query<{ readonly enabled: number }, []>(
        "SELECT foreign_keys AS enabled FROM pragma_foreign_keys"
      )
      .get()?.enabled === 1
  )
}

function setForeignKeysEnabled(sqlite: Database, enabled: boolean): void {
  sqlite.exec(`PRAGMA foreign_keys = ${enabled ? "ON" : "OFF"}`)
}
