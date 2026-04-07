import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

import { schema } from "../schema/index"
import type { DbClient } from "../types/index"

export type OpenedDb = {
  close: () => Promise<void>
  db: DbClient
  sql: postgres.Sql
}

export function openDb(connectionUrl: string): OpenedDb {
  const sql = postgres(connectionUrl)
  const db = drizzle({ client: sql, schema })

  return {
    close: () => sql.end(),
    db,
    sql,
  }
}
