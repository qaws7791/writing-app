import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import { schema } from "../schema/index"
import type { DbClient } from "../types/index"

export type OpenedDb = {
  close: () => Promise<void>
  db: DbClient
  sql: Database
}

export function openDb(path: string): OpenedDb {
  const sql = new Database(path)
  const db = drizzle({ client: sql, schema })

  return {
    close: () => Promise.resolve(sql.close()),
    db,
    sql,
  }
}
