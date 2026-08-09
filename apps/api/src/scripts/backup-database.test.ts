import { afterEach, describe, expect, it } from "vitest"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { runDatabaseBackup } from "@/scripts/backup-database"

const temporaryDirectories: string[] = []

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { force: true, recursive: true })
  }
})

describe("database backup command", () => {
  it("setup의 새 DB만 source-missing으로 건너뛴다", async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "writing-app-setup-backup-")
    )
    temporaryDirectories.push(directory)
    const sourcePath = path.join(directory, "missing.sqlite")

    expect(
      runDatabaseBackup({
        backupPath: path.join(directory, "backup.sqlite"),
        skipMissingSource: true,
        sourcePath,
      })
    ).toEqual({
      kind: "database-backup-skipped",
      reason: "source-missing",
      sourcePath,
    })
  })
})
