import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import { normalizeVersionedStepContentOrThrow } from "@workspace/content/normalization"

import { runApplicationMigrations } from "@/db/migrate"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const client = createWritingAppDatabase(databaseUrl)

try {
  const migrations = runApplicationMigrations(client.sqlite, {
    normalizeVersionedStepContent: normalizeVersionedStepContentOrThrow,
  })
  process.stdout.write(`${JSON.stringify({ migrations })}\n`)
} finally {
  client.close()
}
