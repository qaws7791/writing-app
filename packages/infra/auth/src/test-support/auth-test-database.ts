import { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import * as authSchema from "#auth/schema/index"
import { runAuthSchemaMigration } from "#auth/schema/migration"

export type AuthTestDatabase = BunSQLiteDatabase<typeof authSchema>

export function createAuthTestDatabase(): {
  readonly close: () => void
  readonly db: AuthTestDatabase
} {
  const sqlite = new Database(":memory:")

  sqlite.exec("PRAGMA foreign_keys = ON")
  runAuthSchemaMigration(sqlite)

  return {
    close: () => sqlite.close(),
    db: drizzle(sqlite, { schema: authSchema }),
  }
}
