import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import { schema } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

export type OpenedDb = {
  close: () => void
  db: DbClient
  sqlite: Database
}

export function openDb(path: string): OpenedDb {
  const resolvedPath = resolve(path)
  mkdirSync(dirname(resolvedPath), { recursive: true })

  const sqlite = new Database(resolvedPath, {
    create: true,
    strict: true,
  })
  sqlite.exec("pragma foreign_keys = on;")

  return {
    close: () => {
      sqlite.close(false)
    },
    db: drizzle({
      client: sqlite,
      schema,
    }),
    sqlite,
  }
}

export function readSqliteVersion(sqlite: Database): string {
  const row = sqlite.query("select sqlite_version() as version").get() as {
    version: string
  } | null

  if (!row) {
    throw new Error("SQLite 버전을 읽지 못했습니다.")
  }

  return row.version
}
