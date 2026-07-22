import { fileURLToPath } from "node:url"

import { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

type SqliteSchema = Readonly<Record<string, unknown>>

export type SqliteDatabaseClient<TSchema extends SqliteSchema> = {
  readonly close: () => void
  readonly db: BunSQLiteDatabase<TSchema>
  readonly sqlite: Database
}

export type CreateSqliteDatabaseInput<TSchema extends SqliteSchema> = {
  readonly filename: string
  readonly mode?: "read-only" | "read-write"
  readonly schema: TSchema
}

export function createSqliteDatabase<TSchema extends SqliteSchema>(
  input: CreateSqliteDatabaseInput<TSchema>
): SqliteDatabaseClient<TSchema> {
  const readOnly = input.mode === "read-only"
  const sqlite = new Database(normalizeSqliteFilename(input.filename), {
    ...(readOnly ? { readonly: true } : { create: true }),
  })
  let closed = false

  sqlite.exec("PRAGMA foreign_keys = ON")
  sqlite.exec("PRAGMA busy_timeout = 5000")

  if (!readOnly) {
    sqlite.exec("PRAGMA journal_mode = WAL")
    sqlite.exec("PRAGMA synchronous = NORMAL")
  }

  return {
    close() {
      if (closed) return

      closed = true
      sqlite.close()
    },
    db: drizzle(sqlite, { schema: input.schema }),
    sqlite,
  }
}

export function runInSqliteTransaction<TDatabase, TValue>(
  database: {
    readonly transaction: (
      operation: (transaction: TDatabase) => TValue
    ) => TValue
  },
  operation: (transaction: TDatabase) => TValue
): TValue {
  return database.transaction(operation)
}

function normalizeSqliteFilename(filename: string): string {
  if (filename.startsWith("file://")) {
    return fileURLToPath(filename)
  }

  if (filename.startsWith("file:")) {
    return filename.slice("file:".length)
  }

  return filename
}
