import Database from "bun:sqlite"

import { configureSqliteConnection } from "../client"
import { runContentMigration } from "./run-content-migration"

const databaseUrl = Bun.env["DATABASE_URL"] ?? "file:../../data/api.sqlite"
const databasePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl

const sqlite = new Database(databasePath, { create: true })

try {
  configureSqliteConnection(sqlite)
  runContentMigration(sqlite)
} finally {
  sqlite.close()
}
