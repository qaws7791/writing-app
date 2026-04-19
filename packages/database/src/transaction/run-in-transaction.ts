import { sql } from "drizzle-orm"

import type { DbClient } from "../types/index"

export async function runInTransaction<T>(
  database: DbClient,
  work: () => Promise<T>
): Promise<T> {
  database.run(sql.raw("begin"))

  try {
    const result = await work()
    database.run(sql.raw("commit"))
    return result
  } catch (error) {
    database.run(sql.raw("rollback"))
    throw error
  }
}
