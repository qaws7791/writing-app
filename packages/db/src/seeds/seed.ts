import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { Database } from "bun:sqlite"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { seedContent } from "@/seeds/seed-content"

function parseDatabasePath(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return "data/api.sqlite"
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}

const databasePath = parseDatabasePath(process.env["DATABASE_URL"])
mkdirSync(dirname(databasePath), { recursive: true })

const sqlite = new Database(databasePath, { create: true })
runContentMigration(sqlite)
await seedContent(createDatabase(sqlite))

sqlite.close()
