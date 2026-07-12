import { resolve } from "node:path"

import { createVerifiedDatabaseBackup } from "@workspace/db/database-backup"
import { getDefaultDatabaseUrl } from "@workspace/db/client"

const argumentsMap = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.split("=")
    return [key, value.join("=")] as const
  })
)
const sourcePath = resolve(
  argumentsMap.get("--source") ??
    process.env["DATABASE_URL"] ??
    getDefaultDatabaseUrl()
)
const output = argumentsMap.get("--output")
if (output === undefined || output.length === 0) {
  throw new Error("--output=<백업 파일 경로>가 필요합니다.")
}

const report = createVerifiedDatabaseBackup({
  backupPath: resolve(output),
  sourcePath,
})
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
