import { resolve } from "node:path"

import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import { createVerifiedDatabaseBackup } from "@workspace/db/database-backup"

import { resolveApplicationDatabasePath } from "@/db/application-database-backup"
import {
  adoptCurrentSchemaEra,
  inspectCurrentSchemaEraAdoption,
} from "@/db/current-schema-era-adoption"
import { readApplicationDatabaseBackupTables } from "@/db/schema-diagnostic"

const argumentsMap = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.split("=")
    return [key, value.join("=")] as const
  })
)
const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const sourcePath = resolveApplicationDatabasePath(databaseUrl)
const backupArgument = argumentsMap.get("--backup")

const source = createReadOnlyWritingAppDatabase(sourcePath)
let inspection: ReturnType<typeof inspectCurrentSchemaEraAdoption>
let requiredTables: readonly string[]
try {
  inspection = inspectCurrentSchemaEraAdoption(source.sqlite)
  requiredTables = readApplicationDatabaseBackupTables(source.sqlite)
} finally {
  source.close()
}

if (inspection.status === "already-current") {
  process.stdout.write(
    `${JSON.stringify({
      kind: "current-schema-era-adoption",
      status: "already-current",
    })}\n`
  )
} else {
  if (backupArgument === undefined || backupArgument.length === 0) {
    throw new Error("--backup=<검증 백업 파일 경로>가 필요합니다.")
  }

  const backup = createVerifiedDatabaseBackup({
    backupPath: resolve(backupArgument),
    requiredTables,
    sourcePath,
  })
  const database = createWritingAppDatabase(sourcePath)
  try {
    adoptCurrentSchemaEra(database.sqlite)
  } finally {
    database.close()
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        backup,
        kind: "current-schema-era-adoption",
        previousMigrationIds: inspection.previousMigrationIds,
        status: "adopted",
      },
      null,
      2
    )}\n`
  )
}
