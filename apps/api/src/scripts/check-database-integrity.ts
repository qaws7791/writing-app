import { createReadOnlyWritingAppDatabase } from "@workspace/db/client"

import { inspectSqliteIntegrity } from "@/db/sqlite-integrity"

const databaseUrl = process.env["DATABASE_URL"]?.trim()

if (databaseUrl === undefined || databaseUrl === "") {
  process.stderr.write(
    `${JSON.stringify({
      kind: "sqlite-integrity-check-failed",
      message: "명시적인 DATABASE_URL이 필요합니다.",
    })}\n`
  )
  process.exitCode = 2
} else {
  try {
    const client = createReadOnlyWritingAppDatabase(databaseUrl)
    try {
      const result = inspectSqliteIntegrity(client.sqlite)
      process.stdout.write(`${JSON.stringify(result)}\n`)
      if (result.status !== "ok") process.exitCode = 2
    } finally {
      client.close()
    }
  } catch {
    process.stderr.write(
      `${JSON.stringify({
        kind: "sqlite-integrity-check-failed",
        message: "SQLite integrity/FK 검사를 완료하지 못했습니다.",
      })}\n`
    )
    process.exitCode = 2
  }
}
