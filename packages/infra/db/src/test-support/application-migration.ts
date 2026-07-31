import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

type ApplicationMigrationManifestEntry = Readonly<{
  checksum: string
  fileName: string
  id: string
}>

const applicationMigrationManifest = readApplicationMigrationManifest()

export function runCurrentTestMigration(sqlite: Database): void {
  for (const migration of applicationMigrationManifest) {
    const sql = normalizeLineEndings(
      readFileSync(
        new URL(
          `../../../../../apps/api/drizzle/${migration.fileName}`,
          import.meta.url
        ),
        "utf8"
      )
    )
    const checksum = createHash("sha256").update(sql).digest("hex")
    if (checksum !== migration.checksum) {
      throw new Error(
        `application migration checksum이 다릅니다: ${migration.id}`
      )
    }

    sqlite.exec(sql)
  }
}

function readApplicationMigrationManifest(): readonly ApplicationMigrationManifestEntry[] {
  const value: unknown = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../apps/api/drizzle/application-migrations.json",
        import.meta.url
      ),
      "utf8"
    )
  )
  if (!Array.isArray(value) || !value.every(isManifestEntry)) {
    throw new Error("application migration manifest 형식이 잘못되었습니다.")
  }

  return value
}

function isManifestEntry(
  value: unknown
): value is ApplicationMigrationManifestEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "checksum" in value &&
    typeof value.checksum === "string" &&
    "fileName" in value &&
    typeof value.fileName === "string" &&
    "id" in value &&
    typeof value.id === "string"
  )
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}
