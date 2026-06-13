import { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import * as schema from "@/schema"

export type KwepDatabase = BunSQLiteDatabase<typeof schema>

export type KwepDatabaseClient = {
  readonly sqlite: Database
  readonly db: KwepDatabase
  readonly close: () => void
}

export function createKwepDatabase(
  url = process.env["DATABASE_URL"] ?? "data/api.sqlite"
): KwepDatabaseClient {
  const sqlite = new Database(url)

  sqlite.exec("PRAGMA foreign_keys = ON")

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  }
}

export function createInMemoryKwepDatabase(): KwepDatabaseClient {
  return createKwepDatabase(":memory:")
}
