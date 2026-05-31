import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { Database } from "bun:sqlite"

import { configureSqliteConnection, createDatabase } from "../client"
import { runContentMigration } from "../migrations/run-content-migration"
import { seedContent } from "./seed-content"

function parseDatabasePath(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return fileURLToPath(
      new URL("../../../../data/api.sqlite", import.meta.url)
    )
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}

const databasePath = parseDatabasePath(process.env["DATABASE_URL"])
mkdirSync(dirname(databasePath), { recursive: true })

const sqlite = new Database(databasePath, { create: true })
configureSqliteConnection(sqlite)
runContentMigration(sqlite)
await seedContent(createDatabase(sqlite))

sqlite.close()
