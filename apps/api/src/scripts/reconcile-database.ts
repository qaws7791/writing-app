import {
  createReadOnlyWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"

import { inspectApplicationDatabase } from "@/db/schema-diagnostic"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()

try {
  const client = createReadOnlyWritingAppDatabase(databaseUrl)
  try {
    const diagnostic = inspectApplicationDatabase(client.sqlite)
    process.stdout.write(`${JSON.stringify(diagnostic, null, 2)}\n`)
    if (diagnostic.schema !== "current" || diagnostic.status !== "ok") {
      process.exitCode = 2
    }
  } finally {
    client.close()
  }
} catch (error) {
  process.stdout.write(
    `${JSON.stringify(
      {
        checks: {
          danglingReferences: [],
          foreignKeyViolations: [],
          integrity: "unavailable",
        },
        issues: [
          {
            code: "database-check-unavailable",
            message: `database could not be opened: ${readErrorMessage(error)}`,
          },
        ],
        kind: "application-database-diagnostic",
        reason: `database could not be opened: ${readErrorMessage(error)}`,
        schema: "unsupported",
        status: "blocked",
      },
      null,
      2
    )}\n`
  )
  process.exitCode = 2
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error"
}
