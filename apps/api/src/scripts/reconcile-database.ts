import {
  createReadOnlyWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"

import { findDanglingSchemaReferences } from "@/db/schema-reconciliation"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const client = createReadOnlyWritingAppDatabase(databaseUrl)

try {
  const danglingReferences = findDanglingSchemaReferences(client.sqlite)
  process.stdout.write(
    `${JSON.stringify(
      {
        danglingReferences,
        kind: "schema-reference-reconciliation",
        status: danglingReferences.length === 0 ? "ok" : "dangling",
      },
      null,
      2
    )}\n`
  )
  if (danglingReferences.length > 0) process.exitCode = 2
} finally {
  client.close()
}
