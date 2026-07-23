import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { Database } from "bun:sqlite"
import { describe, expect, it, vi } from "vitest"

import { createWritingAppDatabase } from "#db/client"
import {
  createVerifiedDatabaseBackup,
  verifyDatabaseBackup,
} from "#db/database-backup"

const backupFileModeObservation = vi.hoisted(() => ({
  conflictingDestination: undefined as string | undefined,
  partialModes: [] as number[],
}))

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>()

  return {
    ...actual,
    linkSync(
      existingPath: Parameters<typeof actual.linkSync>[0],
      newPath: Parameters<typeof actual.linkSync>[1]
    ): void {
      if (String(existingPath).endsWith(".partial")) {
        backupFileModeObservation.partialModes.push(
          actual.statSync(existingPath).mode & 0o777
        )
        if (
          backupFileModeObservation.conflictingDestination === String(newPath)
        ) {
          actual.writeFileSync(newPath, "경쟁 백업", { flag: "wx" })
        }
      }
      actual.linkSync(existingPath, newPath)
    },
  }
})

describe("SQLite 백업과 복구 검증", () => {
  it("공백이 있는 file-backed WAL DB를 독립 백업하고 임시 복구한다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app backup "))
    const sourcePath = join(directory, "운영 database.sqlite")
    const backupPath = join(directory, "backup files", "검증 backup.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      createBackupTestSchema(source.sqlite)
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
      createBackupTestSchema(source.sqlite)
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

  it("publish 직전 같은 경로가 생성되어도 기존 백업을 덮어쓰지 않는다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app backup race "))
    const sourcePath = join(directory, "source.sqlite")
    const backupPath = join(directory, "backup", "snapshot.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      createBackupTestSchema(source.sqlite)
      backupFileModeObservation.conflictingDestination = backupPath

      expect(() =>
        createVerifiedDatabaseBackup({
          backupPath,
          requiredTables: ["backup_source"],
          sourcePath,
        })
      ).toThrow("기존 백업 파일을 덮어쓰지 않습니다")
      expect(readFileSync(backupPath, "utf8")).toBe("경쟁 백업")
      expect(
        readdirSync(dirname(backupPath)).some((name) =>
          name.includes(".partial")
        )
      ).toBe(false)
    } finally {
      backupFileModeObservation.conflictingDestination = undefined
      source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("source close가 실패해도 미완성 backup 파일을 정리한다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app close failure "))
    const sourcePath = join(directory, "source.sqlite")
    const backupPath = join(directory, "backup", "snapshot.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      createBackupTestSchema(source.sqlite)
    } finally {
      source.close()
    }

    const nativeClose = Database.prototype.close
    const closeSpy = vi
      .spyOn(Database.prototype, "close")
      .mockImplementation(function (
        this: Database,
        throwOnError?: boolean
      ): void {
        nativeClose.call(this, throwOnError)
        if (this.filename === sourcePath) {
          throw new Error("source close failure")
        }
      })

    try {
      expect(() =>
        createVerifiedDatabaseBackup({
          backupPath,
          requiredTables: ["backup_source"],
          sourcePath,
        })
      ).toThrow("source close failure")
      expect(existsSync(backupPath)).toBe(false)
      expect(
        readdirSync(dirname(backupPath)).some((name) =>
          name.includes(".partial")
        )
      ).toBe(false)
    } finally {
      closeSpy.mockRestore()
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it.skipIf(process.platform === "win32")(
    "새 output과 staging·최종 backup만 private mode로 만든다",
    () => {
      const directory = mkdtempSync(
        join(tmpdir(), "writing app private backup ")
      )
      const sourcePath = join(directory, "source.sqlite")
      const newOutputDirectory = join(directory, "new-output")
      const firstBackupPath = join(newOutputDirectory, "first.sqlite")
      const existingOutputDirectory = join(directory, "existing-output")
      const secondBackupPath = join(existingOutputDirectory, "second.sqlite")
      const source = createWritingAppDatabase(sourcePath)

      try {
        createBackupTestSchema(source.sqlite)
      } finally {
        source.close()
      }

      mkdirSync(existingOutputDirectory, { mode: 0o750 })
      chmodSync(existingOutputDirectory, 0o750)
      backupFileModeObservation.partialModes.length = 0

      try {
        createVerifiedDatabaseBackup({
          backupPath: firstBackupPath,
          requiredTables: ["backup_source"],
          sourcePath,
        })
        createVerifiedDatabaseBackup({
          backupPath: secondBackupPath,
          requiredTables: ["backup_source"],
          sourcePath,
        })

        expect(statSync(newOutputDirectory).mode & 0o777).toBe(0o700)
        expect(statSync(existingOutputDirectory).mode & 0o777).toBe(0o750)
        expect(backupFileModeObservation.partialModes).toEqual([0o600, 0o600])
        expect(statSync(firstBackupPath).mode & 0o777).toBe(0o600)
        expect(statSync(secondBackupPath).mode & 0o777).toBe(0o600)
      } finally {
        rmSync(directory, { force: true, recursive: true })
      }
    }
  )
})

function createBackupTestSchema(sqlite: Database): void {
  sqlite.exec("CREATE TABLE backup_source (value TEXT NOT NULL)")
}

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
