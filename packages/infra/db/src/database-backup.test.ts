import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "#db/client"
import {
  createVerifiedDatabaseBackup,
  verifyDatabaseBackup,
} from "#db/database-backup"
import { runBaselineTestMigration } from "#db/test-support/application-migration"

describe("SQLite 백업과 복구 검증", () => {
  it("공백이 있는 file-backed WAL DB를 독립 백업하고 임시 복구한다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app backup "))
    const sourcePath = join(directory, "운영 database.sqlite")
    const backupPath = join(directory, "backup files", "검증 backup.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      runBaselineTestMigration(source.sqlite)
      source.sqlite.exec("PRAGMA wal_autocheckpoint = 0")
      source.sqlite.exec(`
        CREATE TABLE backup_probe (value TEXT NOT NULL);
        INSERT INTO backup_probe (value) VALUES ('backup-before');
      `)
      const sourceBeforeBackup = readFileSync(sourcePath)
      const sourceWalBeforeBackup = readFileSync(`${sourcePath}-wal`)
      const sourceShmSizeBeforeBackup = statSync(`${sourcePath}-shm`).size

      const report = createVerifiedDatabaseBackup({
        backupPath,
        requiredTables: ["backup_probe"],
        sourcePath,
      })
      expect(readFileSync(sourcePath)).toEqual(sourceBeforeBackup)
      expect(readFileSync(`${sourcePath}-wal`)).toEqual(sourceWalBeforeBackup)
      expect(statSync(`${sourcePath}-shm`).size).toBe(sourceShmSizeBeforeBackup)
      source.sqlite.exec(
        "INSERT INTO backup_probe (value) VALUES ('source-after')"
      )
      chmodSync(backupPath, 0o444)
      const backupBeforeVerification = readFileSync(backupPath)
      const isolatedInspection = inspectIsolatedBackup(backupPath)

      expect(isolatedInspection.probeRows).toEqual([{ value: "backup-before" }])
      expect(isolatedInspection.journalMode).toBe("delete")
      expect(isolatedInspection.sidecarsCreated).toBe(false)
      expect(isolatedInspection.queryOnlyEnabled).toBe(true)
      expect(isolatedInspection.temporaryDirectoryRemoved).toBe(true)
      expect(readFileSync(backupPath)).toEqual(backupBeforeVerification)
      expect(statSync(backupPath).mode & 0o777).toBe(0o444)
      expect(existsSync(`${backupPath}-wal`)).toBe(false)
      expect(existsSync(`${backupPath}-shm`)).toBe(false)
      expect(
        readdirSync(dirname(backupPath)).some((name) =>
          name.includes(".partial")
        )
      ).toBe(false)

      expect(report).toMatchObject({
        backupPath,
        kind: "database-backup-verified",
        sourcePath,
        verification: {
          integrityCheck: "ok",
          requiredTableReadSmoke: "ok",
        },
      })
      expect(report.backupBytes).toBeGreaterThan(0)
      expect(report.verification.schemaVersion).toBeGreaterThan(0)
      expect(
        verifyDatabaseBackup(backupPath, { requiredTables: ["backup_probe"] })
      ).toEqual(report.verification)
      expect(readFileSync(backupPath)).toEqual(backupBeforeVerification)
      expect(statSync(backupPath).mode & 0o777).toBe(0o444)
      expect(existsSync(`${backupPath}-wal`)).toBe(false)
      expect(existsSync(`${backupPath}-shm`)).toBe(false)
    } finally {
      source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  }, 15_000)

  it("손상 backup을 거부하고 기존 운영 파일과 산출물을 덮어쓰지 않는다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app restore "))
    const sourcePath = join(directory, "source.sqlite")
    const corruptedPath = join(directory, "corrupted.sqlite")
    const protectedPath = join(directory, "production.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      runBaselineTestMigration(source.sqlite)
      writeFileSync(corruptedPath, "SQLite format 3\0손상된 파일", "utf8")
      writeFileSync(protectedPath, "운영 파일 원본", "utf8")
      const protectedBefore = readFileSync(protectedPath)

      expect(() =>
        verifyDatabaseBackup(corruptedPath, { requiredTables: [] })
      ).toThrow()
      expect(() =>
        createVerifiedDatabaseBackup({
          backupPath: protectedPath,
          requiredTables: [],
          sourcePath,
        })
      ).toThrow("기존 백업 파일을 덮어쓰지 않습니다")
      expect(readFileSync(protectedPath)).toEqual(protectedBefore)
    } finally {
      source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

function inspectIsolatedBackup(backupPath: string): {
  readonly journalMode: string
  readonly probeRows: readonly { readonly value: string }[]
  readonly queryOnlyEnabled: boolean
  readonly sidecarsCreated: boolean
  readonly temporaryDirectoryRemoved: boolean
} {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "writing app isolated restore ")
  )
  const restoredPath = join(temporaryDirectory, "restored.sqlite")
  let restored: Database | undefined
  let journalMode = ""
  let probeRows: readonly { readonly value: string }[] = []
  let queryOnlyEnabled = false
  let sidecarsCreated = false

  try {
    copyFileSync(backupPath, restoredPath)
    chmodSync(restoredPath, 0o600)
    restored = new Database(restoredPath, {
      create: false,
      readonly: true,
      strict: true,
    })
    restored.exec("PRAGMA query_only = ON")
    queryOnlyEnabled =
      restored
        .query<{ readonly query_only: number }, []>("PRAGMA query_only")
        .get()?.query_only === 1
    restored.query("PRAGMA integrity_check").get()
    journalMode =
      restored
        .query<{ readonly journal_mode: string }, []>("PRAGMA journal_mode")
        .get()?.journal_mode ?? ""
    probeRows = restored
      .query<{ readonly value: string }, []>(
        "SELECT value FROM backup_probe ORDER BY rowid"
      )
      .all()
    sidecarsCreated =
      existsSync(`${restoredPath}-wal`) && existsSync(`${restoredPath}-shm`)
  } finally {
    restored?.close()
    rmSync(temporaryDirectory, { force: true, recursive: true })
  }

  return {
    journalMode,
    probeRows,
    queryOnlyEnabled,
    sidecarsCreated,
    temporaryDirectoryRemoved: !existsSync(temporaryDirectory),
  }
}
