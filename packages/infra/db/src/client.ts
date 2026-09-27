import type { D1Database } from "@cloudflare/workers-types"
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"

import { createSqlDatabaseClient, type SqlDatabaseClient } from "#db/sql-client"

export type WritingAppDatabase = DrizzleD1Database & {
  readonly $client: D1Database
}
export type WritingAppDatabaseClient = Readonly<{
  db: WritingAppDatabase
  sqlite: SqlDatabaseClient
  close: () => Promise<void>
}>

export function createWritingAppDatabase(
  binding: D1Database
): WritingAppDatabaseClient {
  return {
    db: drizzle(binding),
    sqlite: createSqlDatabaseClient(binding),
    close: async () => {},
  }
}
