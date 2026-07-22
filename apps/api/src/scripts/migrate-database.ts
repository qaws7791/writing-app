import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const client = createWritingAppDatabase(databaseUrl)

try {
  runBaselineMigration(client.sqlite)
} finally {
  client.close()
}
