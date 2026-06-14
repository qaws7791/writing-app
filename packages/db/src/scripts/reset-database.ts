import { existsSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { getDefaultDatabaseUrl } from "@workspace/db/client"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const databasePath = getDatabaseFilePath(databaseUrl)

if (databasePath === null) {
  throw new Error("Cannot reset an in-memory database.")
}

for (const path of [
  databasePath,
  `${databasePath}-shm`,
  `${databasePath}-wal`,
]) {
  if (existsSync(path)) {
    rmSync(path, { force: true })
  }
}

function getDatabaseFilePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") {
    return null
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl)
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}
