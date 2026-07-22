import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import {
  assertDestructiveDatabaseAllowed,
  inspectDatabaseResetTarget,
  resetSqliteDatabaseFiles,
} from "#db/destructive-operation-guard"

const dataDirectory = fileURLToPath(
  new URL("../../../../data", import.meta.url)
)
mkdirSync(dataDirectory, { recursive: true })

describe("파괴적 DB 작업 보호 장치", () => {
  it("저장소 data 밖 경로와 symlink escape를 거부한다", () => {
    const outsideDirectory = mkdtempSync(join(tmpdir(), "db-reset-outside-"))
    const outsideDatabase = join(outsideDirectory, "outside.sqlite")
    const linkDirectory = join(dataDirectory, `link-${crypto.randomUUID()}`)
    createSqliteDatabase(outsideDatabase)

    try {
      expect(() => inspectDatabaseResetTarget(outsideDatabase)).toThrow(
        "저장소 data 디렉터리 밖"
      )
      symlinkSync(outsideDirectory, linkDirectory, "junction")
      expect(() =>
        inspectDatabaseResetTarget(join(linkDirectory, "outside.sqlite"))
      ).toThrow("저장소 data 디렉터리 밖")
    } finally {
      rmSync(linkDirectory, { force: true, recursive: true })
      rmSync(outsideDirectory, { force: true, recursive: true })
    }
  })

  it.each([
    [false, false, false],
    [true, false, false],
    [true, true, false],
  ])(
    "production 승인이 불완전하면 거부한다 (%s, %s, %s)",
    (allowDatabaseReset, forceDatabaseReset, hasFingerprint) => {
      const target = createRepositoryDatabaseTarget()

      try {
        expect(() =>
          assertDestructiveDatabaseAllowed(target, {
            allowDatabaseReset,
            databaseUrl: target.databasePath,
            forceDatabaseReset,
            nodeEnv: "production",
            targetFingerprint: hasFingerprint ? target.fingerprint : undefined,
          })
        ).toThrow("일치하는 대상 fingerprint")
      } finally {
        cleanupTarget(target)
      }
    }
  )

  it("production은 세 승인 조건이 모두 일치할 때만 허용한다", () => {
    const target = createRepositoryDatabaseTarget()

    try {
      expect(() =>
        assertDestructiveDatabaseAllowed(target, {
          allowDatabaseReset: true,
          databaseUrl: target.databasePath,
          forceDatabaseReset: true,
          nodeEnv: "production",
          targetFingerprint: target.fingerprint,
        })
      ).not.toThrow()
    } finally {
      cleanupTarget(target)
    }
  })

  it("DB와 sidecar를 백업한 뒤 대상 파일만 삭제한다", () => {
    const target = createRepositoryDatabaseTarget()
    const walPath = `${target.databasePath}-wal`
    const shmPath = `${target.databasePath}-shm`
    const neighborPath = join(
      dirname(target.databasePath),
      `neighbor-${crypto.randomUUID()}.txt`
    )
    writeFileSync(walPath, "wal")
    writeFileSync(shmPath, "shm")
    writeFileSync(neighborPath, "keep")

    try {
      const result = resetSqliteDatabaseFiles({
        allowDatabaseReset: false,
        databaseUrl: target.databasePath,
        forceDatabaseReset: false,
        nodeEnv: "development",
      })

      if (result === null) {
        throw new Error("파일 DB reset 결과가 필요합니다.")
      }

      expect(existsSync(target.databasePath)).toBe(false)
      expect(existsSync(walPath)).toBe(false)
      expect(existsSync(shmPath)).toBe(false)
      expect(readFileSync(neighborPath, "utf8")).toBe("keep")
      expect(
        existsSync(join(result.backupDirectory, basename(target.databasePath)))
      ).toBe(true)
      expect(
        readFileSync(join(result.backupDirectory, basename(walPath)), "utf8")
      ).toBe("wal")
    } finally {
      rmSync(neighborPath, { force: true })
      cleanupTarget(target)
    }
  })

  it("SQLite가 아닌 파일은 삭제 전에 거부한다", () => {
    const directory = mkdtempSync(join(dataDirectory, "invalid-reset-"))
    const databasePath = join(directory, "invalid.sqlite")
    writeFileSync(databasePath, "not sqlite")

    try {
      expect(() => inspectDatabaseResetTarget(databasePath)).toThrow(
        "SQLite 데이터베이스 파일이 아닙니다"
      )
      expect(existsSync(databasePath)).toBe(true)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

function createRepositoryDatabaseTarget() {
  const directory = mkdtempSync(join(dataDirectory, "reset-guard-"))
  const databasePath = join(directory, "writing-app.sqlite")
  createSqliteDatabase(databasePath)
  const target = inspectDatabaseResetTarget(databasePath)

  if (target === null) {
    throw new Error("파일 DB reset 대상이 필요합니다.")
  }

  return target
}

function createSqliteDatabase(databasePath: string): void {
  const database = new Database(databasePath)

  try {
    database.exec("CREATE TABLE guard_test (id TEXT PRIMARY KEY)")
  } finally {
    database.close()
  }
}

function cleanupTarget(
  target: ReturnType<typeof createRepositoryDatabaseTarget>
): void {
  rmSync(dirname(target.databasePath), { force: true, recursive: true })
  rmSync(target.backupDirectory, { force: true, recursive: true })
}
