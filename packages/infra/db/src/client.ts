import { fileURLToPath } from "node:url"

import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import * as authSchema from "@workspace/auth/schema"
import * as moduleSchema from "#db/schema"
import {
  createSqliteDatabase,
  type SqliteDatabaseClient,
} from "#db/sqlite-database"

const schema = { ...authSchema, ...moduleSchema }

export type WritingAppDatabase = BunSQLiteDatabase<typeof schema>

export type WritingAppDatabaseClient = SqliteDatabaseClient<typeof schema>

export function getDefaultDatabaseUrl(): string {
  return fileURLToPath(new URL("../../../../data/api.sqlite", import.meta.url))
}

export function createWritingAppDatabase(
  url: string
): WritingAppDatabaseClient {
  return createSqliteDatabase({ filename: url, schema })
}

export function createReadOnlyWritingAppDatabase(
  url: string
): WritingAppDatabaseClient {
  return createSqliteDatabase({ filename: url, mode: "read-only", schema })
}

export function createInMemoryWritingAppDatabase(): WritingAppDatabaseClient {
  return createWritingAppDatabase(":memory:")
}
