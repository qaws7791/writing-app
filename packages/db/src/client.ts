import type { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import * as schema from "./schema"

export type WritingAppDatabase = ReturnType<typeof createDatabase>

export function configureSqliteConnection(sqlite: Database) {
  sqlite.exec("pragma foreign_keys = on")
  sqlite.exec("pragma journal_mode = WAL")
  sqlite.exec("pragma synchronous = NORMAL")
  sqlite.exec("pragma busy_timeout = 5000")
  sqlite.exec("pragma wal_autocheckpoint = 1000")
  sqlite.exec("pragma journal_size_limit = 67108864")
  sqlite.exec("pragma mmap_size = 268435456")
  sqlite.exec("pragma temp_store = MEMORY")
  sqlite.exec("pragma optimize = 0x10002")
}

export function createDatabase(sqlite: Database) {
  configureSqliteConnection(sqlite)

  return drizzle({
    client: sqlite,
    schema,
  })
}
