import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { normalizeVersionedStepContentOrThrow } from "@workspace/content/normalization"
import { runContentSchemaMigration } from "@workspace/content/schema"
import { runAiFeedbackSchemaMigration } from "@workspace/ai-feedback/schema"

import { runApiIdentitySchemaMigration } from "@/composition/identity-schema-migration"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const client = createWritingAppDatabase(databaseUrl)

try {
  runBaselineMigration(client.sqlite, {
    normalizeVersionedStepContent: normalizeVersionedStepContentOrThrow,
  })
  runContentSchemaMigration(client.sqlite)
  runAiFeedbackSchemaMigration(client.sqlite)
  runApiIdentitySchemaMigration(client.sqlite)
} finally {
  client.close()
}
