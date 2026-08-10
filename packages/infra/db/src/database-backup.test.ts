import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "#db/client"
import { createVerifiedDatabaseBackup } from "#db/database-backup"

describe("SQLite 백업", () => {
  it("백업은 격리 복구본에서 WAL의 백업 시점 데이터만 담는다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing-app-backup-"))
    const sourcePath = join(directory, "source.sqlite")
    const backupPath = join(directory, "backup", "snapshot.sqlite")
    const source = createWritingAppDatabase(sourcePath)
    let sourceClosed = false
    let restored: Database | undefined

    try {
      source.sqlite.exec("PRAGMA wal_autocheckpoint = 0")
      source.sqlite.exec(`
        CREATE TABLE backup_probe (value TEXT NOT NULL);
        INSERT INTO backup_probe (value) VALUES ('backup-before');
      `)
      expect(existsSync(`${sourcePath}-wal`)).toBe(true)

      createVerifiedDatabaseBackup({
        backupPath,
        requiredTables: ["backup_probe"],
        sourcePath,
      })
      source.sqlite.run("INSERT INTO backup_probe (value) VALUES (?)", [
        "source-after",
      ])
      source.close()
      sourceClosed = true

      restored = new Database(backupPath, {
        create: false,
        readonly: true,
        strict: true,
      })
      expect(
        restored
          .query<{ readonly value: string }, []>(
            "SELECT value FROM backup_probe ORDER BY rowid"
          )
          .all()
      ).toEqual([{ value: "backup-before" }])
      expect(
        restored
          .query<{ readonly journal_mode: string }, []>("PRAGMA journal_mode")
          .get()?.journal_mode
      ).toBe("delete")
      restored.close()
      restored = undefined
      expect(
        existsSync(`${backupPath}-wal`) || existsSync(`${backupPath}-shm`)
      ).toBe(false)
    } finally {
      restored?.close()
      if (!sourceClosed) source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
