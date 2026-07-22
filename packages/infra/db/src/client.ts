import { fileURLToPath } from "node:url"

import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import {
  createSqliteDatabase,
  type SqliteDatabaseClient,
} from "#db/sqlite-database"

const databaseSchema = {}

export type WritingAppDatabase = BunSQLiteDatabase<typeof databaseSchema>

export type WritingAppDatabaseClient = SqliteDatabaseClient<
  typeof databaseSchema
>

export function getDefaultDatabaseUrl(): string {
  return fileURLToPath(new URL("../../../../data/api.sqlite", import.meta.url))
}

export function createWritingAppDatabase(
  url: string
): WritingAppDatabaseClient {
  return createSqliteDatabase({ filename: url, schema: databaseSchema })
}

export function createReadOnlyWritingAppDatabase(
  url: string
): WritingAppDatabaseClient {
  return createSqliteDatabase({
    filename: url,
    mode: "read-only",
    schema: databaseSchema,
  })
}

export function createInMemoryWritingAppDatabase(): WritingAppDatabaseClient {
  return createWritingAppDatabase(":memory:")
}
