import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const client = createWritingAppDatabase(databaseUrl)

try {
  const migrations = runApplicationMigrations(client.sqlite)
  process.stdout.write(`${JSON.stringify({ migrations })}\n`)
} finally {
  client.close()
}
