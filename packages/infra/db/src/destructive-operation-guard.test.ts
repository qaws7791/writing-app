import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"

import { Database } from "bun:sqlite"
import { afterEach, describe, expect, it } from "vitest"

import {
  assertDestructiveDatabaseAllowed,
  inspectDatabaseResetTarget,
  resetSqliteDatabaseFiles,
  type DatabaseResetTarget,
  type DestructiveDatabaseOptions,
} from "#db/destructive-operation-guard"

const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop()
    if (root !== undefined) rmSync(root, { force: true, recursive: true })
  }
})

describe("파괴적 DB 작업 보호 장치", () => {
  it("data 안에서 밖을 가리키는 symlink를 거부한다", () => {
    const dataDirectory = createTemporaryRoot("data-")
    const outsideDirectory = createTemporaryRoot("outside-")
    createSqliteFile(join(outsideDirectory, "outside.sqlite"))
    const linkDirectory = join(dataDirectory, "linked")
    symlinkSync(outsideDirectory, linkDirectory, "junction")

    expect(() =>
      inspectDatabaseResetTarget(
        join(linkDirectory, "outside.sqlite"),
        dataDirectory
      )
    ).toThrow("저장소 data 디렉터리 밖")
  })

  it.each([
    [
      "reset 미허용",
      (target: DatabaseResetTarget): DestructiveDatabaseOptions => ({
        allowDatabaseReset: false,
        databaseUrl: target.databasePath,
        forceDatabaseReset: true,
        nodeEnv: "production",
        targetFingerprint: target.fingerprint,
      }),
      "ALLOW_DATABASE_RESET=true와 --force",
    ],
    [
      "force 미지정",
      (target: DatabaseResetTarget): DestructiveDatabaseOptions => ({
        allowDatabaseReset: true,
        databaseUrl: target.databasePath,
        forceDatabaseReset: false,
        nodeEnv: "production",
        targetFingerprint: target.fingerprint,
      }),
      "ALLOW_DATABASE_RESET=true와 --force",
    ],
    [
      "fingerprint 불일치",
      (target: DatabaseResetTarget): DestructiveDatabaseOptions => ({
        allowDatabaseReset: true,
        databaseUrl: target.databasePath,
        forceDatabaseReset: true,
        nodeEnv: "production",
        targetFingerprint: "incorrect-fingerprint",
      }),
      "일치하는 대상 fingerprint",
    ],
  ])(
    "production에서 %s이면 거부한다",
    (_label, createOptions, errorMessage) => {
      const dataDirectory = createTemporaryRoot("data-")
      const target = createResetTarget(dataDirectory)

      expect(() =>
        assertDestructiveDatabaseAllowed(target, createOptions(target))
      ).toThrow(errorMessage)
    }
  )

  it("DB와 sidecar를 백업한 뒤 대상 파일만 삭제한다", () => {
    const dataDirectory = createTemporaryRoot("data-")
    const target = createResetTarget(dataDirectory)
    const walPath = `${target.databasePath}-wal`
    const shmPath = `${target.databasePath}-shm`
    const neighborPath = join(dirname(target.databasePath), "neighbor.txt")
    writeFileSync(walPath, "wal")
    writeFileSync(shmPath, "shm")
    writeFileSync(neighborPath, "keep")

    const result = resetSqliteDatabaseFiles(
      {
        allowDatabaseReset: true,
        databaseUrl: target.databasePath,
        forceDatabaseReset: true,
        nodeEnv: "development",
      },
      dataDirectory
    )

    if (result === null) throw new Error("파일 DB reset 결과가 필요합니다.")

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
  })
})

function createTemporaryRoot(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), `writing-app-${prefix}`))
  temporaryRoots.push(root)
  return root
}

function createResetTarget(dataDirectory: string) {
  const databasePath = join(dataDirectory, "writing-app.sqlite")
  createSqliteFile(databasePath)
  const target = inspectDatabaseResetTarget(databasePath, dataDirectory)

  if (target === null) throw new Error("파일 DB reset 대상이 필요합니다.")
  return target
}

function createSqliteFile(databasePath: string): void {
  const database = new Database(databasePath)
  try {
    database.exec("CREATE TABLE guard_test (id TEXT PRIMARY KEY)")
  } finally {
    database.close()
  }
}
