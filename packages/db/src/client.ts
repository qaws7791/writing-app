import type { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import * as schema from "@/schema"

export type WritingAppDatabase = ReturnType<typeof createDatabase>

export function createDatabase(sqlite: Database) {
  sqlite.exec("pragma foreign_keys = on")

  return drizzle({
    client: sqlite,
    schema,
  })
}
