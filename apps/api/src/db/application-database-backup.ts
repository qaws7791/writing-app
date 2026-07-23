import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  createReadOnlyWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import {
  createVerifiedDatabaseBackup,
  type DatabaseBackupReport,
} from "@workspace/db/database-backup"

import { requiredDatabaseBackupTables } from "@/db/schema-architecture"
import {
  inspectApplicationDatabase,
  readApplicationDatabaseBackupTables,
} from "@/db/schema-diagnostic"

export function createVerifiedApplicationDatabaseBackup(input: {
  readonly backupPath: string
  readonly sourcePath: string
}): DatabaseBackupReport {
  const sourcePath = resolveDatabasePath(input.sourcePath)
  const source = createReadOnlyWritingAppDatabase(sourcePath)
  let requiredTables: readonly string[]

  try {
    requiredTables = selectRequiredBackupTables(source)
  } finally {
    source.close()
  }

  return createVerifiedDatabaseBackup({
    ...input,
    sourcePath,
    requiredTables,
  })
}

function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl)
  }
  if (databaseUrl.startsWith("file:")) {
    return resolve(databaseUrl.slice("file:".length))
  }
  return resolve(databaseUrl)
}

function selectRequiredBackupTables(
  source: WritingAppDatabaseClient
): readonly string[] {
  const diagnostic = inspectApplicationDatabase(source.sqlite)
  if (diagnostic.status === "blocked") {
    throw new Error(
      `database backup blocked: ${diagnostic.issues
        .map(({ message }) => message)
        .join("; ")}`
    )
  }

  const actualTables = readApplicationDatabaseBackupTables(source.sqlite)
  if (diagnostic.schema !== "current") return actualTables

  return Object.freeze(
    [...new Set([...requiredDatabaseBackupTables, ...actualTables])].sort()
  )
}
