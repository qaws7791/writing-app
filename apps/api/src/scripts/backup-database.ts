import { existsSync } from "node:fs"
import { resolve } from "node:path"

import { getDefaultDatabaseUrl } from "@workspace/db/client"

import {
  createVerifiedApplicationDatabaseBackup,
  resolveApplicationDatabasePath,
} from "@/db/application-database-backup"

export type DatabaseBackupCommandReport =
  | ReturnType<typeof createVerifiedApplicationDatabaseBackup>
  | Readonly<{
      kind: "database-backup-skipped"
      reason: "source-missing"
      sourcePath: string
    }>

export function runDatabaseBackup(input: {
  readonly backupPath: string
  readonly skipMissingSource?: boolean
  readonly sourcePath: string
}): DatabaseBackupCommandReport {
  const sourcePath = resolveApplicationDatabasePath(input.sourcePath)
  if (input.skipMissingSource === true && !existsSync(sourcePath)) {
    return {
      kind: "database-backup-skipped",
      reason: "source-missing",
      sourcePath,
    }
  }

  return createVerifiedApplicationDatabaseBackup({
    backupPath: resolve(input.backupPath),
    sourcePath,
  })
}

if (import.meta.main) {
  const argumentsMap = new Map(
    process.argv.slice(2).map((argument) => {
      const [key, ...value] = argument.split("=")
      return [key, value.join("=")] as const
    })
  )
  const sourcePath =
    argumentsMap.get("--source") ??
    process.env["DATABASE_URL"] ??
    getDefaultDatabaseUrl()
  const output = argumentsMap.get("--output")
  if (output === undefined || output.length === 0) {
    throw new Error("--output=<백업 파일 경로>가 필요합니다.")
  }
  const missingSourceBehavior = argumentsMap.get("--if-source-missing")
  if (missingSourceBehavior !== undefined && missingSourceBehavior !== "skip") {
    throw new Error("--if-source-missing에는 skip만 사용할 수 있습니다.")
  }

  const report = runDatabaseBackup({
    backupPath: output,
    skipMissingSource: missingSourceBehavior === "skip",
    sourcePath,
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}
