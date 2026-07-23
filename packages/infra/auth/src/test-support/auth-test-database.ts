import { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

import * as authSchema from "#auth/schema/index"

export type AuthTestDatabase = BunSQLiteDatabase<typeof authSchema>

export function createAuthTestDatabase(): {
  readonly close: () => void
  readonly db: AuthTestDatabase
} {
  const sqlite = new Database(":memory:")

  sqlite.exec("PRAGMA foreign_keys = ON")
  runCurrentTestMigration(sqlite)

  return {
    close: () => sqlite.close(),
    db: drizzle(sqlite, { schema: authSchema }),
  }
}
