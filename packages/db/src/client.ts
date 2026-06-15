import { fileURLToPath } from "node:url"

import { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import * as schema from "@workspace/db/schema"

export type KwepDatabase = BunSQLiteDatabase<typeof schema>

export type KwepDatabaseClient = {
  readonly sqlite: Database
  readonly db: KwepDatabase
  readonly close: () => void
}

export function getDefaultDatabaseUrl(): string {
  return fileURLToPath(new URL("../../../data/api.sqlite", import.meta.url))
}

export function createKwepDatabase(
  url = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
): KwepDatabaseClient {
  const sqlite = new Database(normalizeDatabaseUrl(url))

  sqlite.exec("PRAGMA foreign_keys = ON")
  sqlite.exec("PRAGMA journal_mode = WAL")
  sqlite.exec("PRAGMA busy_timeout = 5000")
  sqlite.exec("PRAGMA synchronous = NORMAL")

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  }
}

export function createInMemoryKwepDatabase(): KwepDatabaseClient {
  return createKwepDatabase(":memory:")
}

function normalizeDatabaseUrl(url: string): string {
  if (url.startsWith("file://")) {
    return fileURLToPath(url)
  }

  if (url.startsWith("file:")) {
    return url.slice("file:".length)
  }

  return url
}
