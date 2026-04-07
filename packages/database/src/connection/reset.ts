import type { DbClient } from "../types/index"
import { schema } from "../schema/index"

export async function resetDatabase(database: DbClient): Promise<void> {
  const tables = Object.values(schema)

  for (const table of tables.reverse()) {
    await database.delete(table)
  }
}
