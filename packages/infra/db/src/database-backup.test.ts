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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createWritingAppDatabase } from "#db/client"
import {
  createVerifiedDatabaseBackup,
  verifyDatabaseBackup,
} from "#db/database-backup"

// staging 파일이 최종 경로로 옮겨지는 순간 같은 경로가 생기는 경쟁을 재현할 수단이
// 프로덕션 API에 없어, link 경계에서만 충돌을 주입한다.
const linkRaceInjection = vi.hoisted(() => ({
  conflictingDestination: undefined as string | undefined,
}))

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>()

  return {
    ...actual,
    linkSync(
      existingPath: Parameters<typeof actual.linkSync>[0],
      newPath: Parameters<typeof actual.linkSync>[1]
    ): void {
      if (
        String(existingPath).endsWith(".partial") &&
        linkRaceInjection.conflictingDestination === String(newPath)
      ) {
        actual.writeFileSync(newPath, "경쟁 백업", { flag: "wx" })
      }

      actual.linkSync(existingPath, newPath)
    },
  }
})

const temporaryDirectories: string[] = []
const openBackupSources = new Set<ReturnType<typeof createWritingAppDatabase>>()

beforeEach(() => {
  linkRaceInjection.conflictingDestination = undefined
})

afterEach(() => {
  try {
    for (const source of openBackupSources) {
      source.close()
      openBackupSources.delete(source)
    }
  } finally {
    while (temporaryDirectories.length > 0) {
      const directory = temporaryDirectories.pop()

      if (directory !== undefined) {
        rmSync(directory, { recursive: true })
      }
    }
  }
})

describe("SQLite 백업", () => {
  it("백업은 source DB와 WAL sidecar를 변경하지 않는다", () => {
    const fixture = createBackupSource()

    try {
      const backupPath = join(fixture.directory, "backup files", "백업.sqlite")
      const sourceBefore = readFileSync(fixture.sourcePath)
      const walBefore = readFileSync(`${fixture.sourcePath}-wal`)
      const shmSizeBefore = statSync(`${fixture.sourcePath}-shm`).size

      createVerifiedDatabaseBackup({
        backupPath,
        requiredTables: ["backup_probe"],
        sourcePath: fixture.sourcePath,
      })

      expect(readFileSync(fixture.sourcePath)).toEqual(sourceBefore)
      expect(readFileSync(`${fixture.sourcePath}-wal`)).toEqual(walBefore)
      expect(statSync(`${fixture.sourcePath}-shm`).size).toBe(shmSizeBefore)
    } finally {
      fixture.close()
    }
  })

  it("백업은 격리 복구본에서 백업 시점 데이터만 담는다", () => {
    const fixture = createBackupSource()
    const backupPath = join(fixture.directory, "backup files", "백업.sqlite")

    createVerifiedDatabaseBackup({
      backupPath,
      requiredTables: ["backup_probe"],
      sourcePath: fixture.sourcePath,
    })
    fixture.insertProbeValue("source-after")
    fixture.close()

    const inspection = inspectIsolatedBackup(backupPath)

    expect(inspection.probeRows).toEqual([{ value: "backup-before" }])
    expect(inspection.journalMode).toBe("delete")
    expect(inspection.sidecarsCreated).toBe(false)
  })

  it("백업 파일은 sidecar와 staging 잔여 파일을 남기지 않는다", () => {
    const fixture = createBackupSource()
    const backupPath = join(fixture.directory, "backup files", "백업.sqlite")

    createVerifiedDatabaseBackup({
      backupPath,
      requiredTables: ["backup_probe"],
      sourcePath: fixture.sourcePath,
    })
    fixture.close()

    expect(existsSync(`${backupPath}-wal`)).toBe(false)
    expect(existsSync(`${backupPath}-shm`)).toBe(false)
    expect(
      readdirSync(dirname(backupPath)).some((name) => name.includes(".partial"))
    ).toBe(false)
  })

  it("검증 report와 재검증 결과가 같은 계약을 만든다", () => {
    const fixture = createBackupSource()
    const backupPath = join(fixture.directory, "backup files", "백업.sqlite")

    const report = createVerifiedDatabaseBackup({
      backupPath,
      requiredTables: ["backup_probe"],
      sourcePath: fixture.sourcePath,
    })
    fixture.close()
    const backupBeforeVerification = readFileSync(backupPath)

    expect(report).toMatchObject({
      backupPath,
      kind: "database-backup-verified",
      sourcePath: fixture.sourcePath,
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
  })
})

describe("SQLite 백업 검증", () => {
  it("손상 backup 파일을 거부한다", () => {
    const directory = createTemporaryDirectory("writing app restore ")
    const corruptedPath = join(directory, "corrupted.sqlite")
    writeFileSync(corruptedPath, "SQLite format 3\0손상된 파일", "utf8")

    expect(() =>
      verifyDatabaseBackup(corruptedPath, { requiredTables: [] })
    ).toThrow()
  })

  it("무결성은 정상이지만 필수 table이 없는 backup을 거부한다", () => {
    const fixture = createBackupSource()
    const backupPath = join(fixture.directory, "backup", "snapshot.sqlite")

    createVerifiedDatabaseBackup({
      backupPath,
      requiredTables: ["backup_probe"],
      sourcePath: fixture.sourcePath,
    })
    fixture.close()

    expect(() =>
      verifyDatabaseBackup(backupPath, {
        requiredTables: ["missing_table"],
      })
    ).toThrow()
  })

  it("기존 운영 파일을 백업 대상으로 덮어쓰지 않는다", () => {
    const fixture = createBackupSource()
    const protectedPath = join(fixture.directory, "production.sqlite")
    writeFileSync(protectedPath, "운영 파일 원본", "utf8")
    const protectedBefore = readFileSync(protectedPath)

    expect(() =>
      createVerifiedDatabaseBackup({
        backupPath: protectedPath,
        requiredTables: [],
        sourcePath: fixture.sourcePath,
      })
    ).toThrow("기존 백업 파일을 덮어쓰지 않습니다")
    expect(readFileSync(protectedPath)).toEqual(protectedBefore)

    fixture.close()
  })

  it("publish 직전 같은 경로가 생성되어도 기존 백업을 덮어쓰지 않는다", () => {
    const fixture = createBackupSource()
    const backupPath = join(fixture.directory, "backup", "snapshot.sqlite")
    linkRaceInjection.conflictingDestination = backupPath

    expect(() =>
      createVerifiedDatabaseBackup({
        backupPath,
        requiredTables: ["backup_probe"],
        sourcePath: fixture.sourcePath,
      })
    ).toThrow("기존 백업 파일을 덮어쓰지 않습니다")
    expect(readFileSync(backupPath, "utf8")).toBe("경쟁 백업")
    expect(
      readdirSync(dirname(backupPath)).some((name) => name.includes(".partial"))
    ).toBe(false)

    fixture.close()
  })

  it("source close가 실패해도 미완성 backup 파일을 정리한다", () => {
    const fixture = createBackupSource()
    const backupPath = join(fixture.directory, "backup", "snapshot.sqlite")
    fixture.close()

    const nativeClose = Database.prototype.close
    const closeSpy = vi
      .spyOn(Database.prototype, "close")
      .mockImplementation(function (
        this: Database,
        throwOnError?: boolean
      ): void {
        nativeClose.call(this, throwOnError)
        if (this.filename === fixture.sourcePath) {
          throw new Error("source close failure")
        }
      })

    try {
      expect(() =>
        createVerifiedDatabaseBackup({
          backupPath,
          requiredTables: ["backup_probe"],
          sourcePath: fixture.sourcePath,
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
    }
  })

  // 파일 mode 계약은 POSIX 권한 모델에만 존재해 Windows 로컬에서는 건너뛴다. PR gate는 Linux에서 실행한다.
  it.skipIf(process.platform === "win32")(
    "새 output 디렉터리와 최종 backup만 private mode로 만든다",
    () => {
      const fixture = createBackupSource()
      fixture.close()
      const newOutputDirectory = join(fixture.directory, "new-output")
      const firstBackupPath = join(newOutputDirectory, "first.sqlite")
      const existingOutputDirectory = join(fixture.directory, "existing-output")
      const secondBackupPath = join(existingOutputDirectory, "second.sqlite")
      mkdirSync(existingOutputDirectory, { mode: 0o750 })
      chmodSync(existingOutputDirectory, 0o750)

      createVerifiedDatabaseBackup({
        backupPath: firstBackupPath,
        requiredTables: ["backup_probe"],
        sourcePath: fixture.sourcePath,
      })
      createVerifiedDatabaseBackup({
        backupPath: secondBackupPath,
        requiredTables: ["backup_probe"],
        sourcePath: fixture.sourcePath,
      })

      expect(statSync(newOutputDirectory).mode & 0o777).toBe(0o700)
      expect(statSync(existingOutputDirectory).mode & 0o777).toBe(0o750)
      expect(statSync(firstBackupPath).mode & 0o777).toBe(0o600)
      expect(statSync(secondBackupPath).mode & 0o777).toBe(0o600)
    }
  )
})

function createTemporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)

  return directory
}

function createBackupSource() {
  // 경로에 공백이 있는 실제 운영 환경을 재현한다.
  const directory = createTemporaryDirectory("writing app backup ")
  const sourcePath = join(directory, "운영 database.sqlite")
  const source = createWritingAppDatabase(sourcePath)
  openBackupSources.add(source)
  let closed = false

  source.sqlite.exec("PRAGMA wal_autocheckpoint = 0")
  source.sqlite.exec(`
    CREATE TABLE backup_probe (value TEXT NOT NULL);
    INSERT INTO backup_probe (value) VALUES ('backup-before');
  `)

  return {
    close() {
      if (closed) return
      source.close()
      closed = true
      openBackupSources.delete(source)
    },
    directory,
    insertProbeValue(value: string) {
      source.sqlite.run("INSERT INTO backup_probe (value) VALUES (?)", [value])
    },
    sourcePath,
  }
}

function inspectIsolatedBackup(backupPath: string): {
  readonly journalMode: string
  readonly probeRows: readonly { readonly value: string }[]
  readonly sidecarsCreated: boolean
} {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "writing app isolated restore ")
  )
  const restoredPath = join(temporaryDirectory, "restored.sqlite")
  let restored: Database | undefined
  let journalMode = ""
  let probeRows: readonly { readonly value: string }[] = []
  let sidecarsCreated = false

  try {
    copyFileSync(backupPath, restoredPath)
    chmodSync(restoredPath, 0o600)
    restored = new Database(restoredPath, {
      create: false,
      readonly: true,
      strict: true,
    })
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
    rmSync(temporaryDirectory, { recursive: true })
  }

  return { journalMode, probeRows, sidecarsCreated }
}
