import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  createInMemoryWritingAppDatabase,
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "#db/client"

describe("Writing App DB client", () => {
  it("기본 SQLite DB 경로는 실행 위치가 바뀌어도 같다", () => {
    const pathFromRepositoryRoot = getDefaultDatabaseUrl()
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-db-cwd-")
    )
    const originalCwd = process.cwd()

    try {
      process.chdir(temporaryDirectory)

      expect(getDefaultDatabaseUrl()).toBe(pathFromRepositoryRoot)
    } finally {
      process.chdir(originalCwd)
      rmSync(temporaryDirectory, { recursive: true })
    }
  })

  it("close lifecycle은 여러 번 호출해도 SQLite를 한 번만 닫는다", () => {
    const client = createInMemoryWritingAppDatabase()

    client.close()

    expect(() => client.close()).not.toThrow()
  })

  it("상대 file: SQLite URL은 현재 실행 위치 기준 파일 경로로 연다", () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "writing-app-db-client-"))
    const originalCwd = process.cwd()

    try {
      mkdirSync(join(tempDirectory, "apps", "api", "data"), {
        recursive: true,
      })
      mkdirSync(join(tempDirectory, "data"), { recursive: true })
      process.chdir(join(tempDirectory, "apps", "api"))

      const client = createWritingAppDatabase("file:../../data/api.sqlite")

      try {
        const databaseFile = client.sqlite
          .query<{ readonly file: string }, []>("PRAGMA database_list")
          .all()
          .at(0)?.file

        expect(realpathSync(databaseFile ?? "")).toBe(
          realpathSync(join(tempDirectory, "data", "api.sqlite"))
        )
      } finally {
        client.close()
      }
    } finally {
      process.chdir(originalCwd)
      rmSync(tempDirectory, { recursive: true })
    }
  })

  it("쓰기 client는 WAL journal로 열어 sidecar를 만든다", () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "writing-app-db-wal-"))
    const databasePath = join(tempDirectory, "api.sqlite")
    const client = createWritingAppDatabase(databasePath)

    try {
      client.sqlite.exec("CREATE TABLE wal_probe (value TEXT NOT NULL)")

      expect(existsSync(`${databasePath}-wal`)).toBe(true)
    } finally {
      client.close()
      rmSync(tempDirectory, { recursive: true })
    }
  })

  it("in-memory SQLite DB에서 schema와 row를 저장한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE client_probe (value TEXT NOT NULL);
        INSERT INTO client_probe (value) VALUES ('stored');
      `)

      expect(
        client.sqlite
          .query<{ readonly value: string }, []>(
            "SELECT value FROM client_probe"
          )
          .get()
      ).toEqual({ value: "stored" })
    } finally {
      client.close()
    }
  })

  it("읽기 전용 client는 기존 DB를 조회하지만 쓰기를 거부한다", () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-db-readonly-")
    )
    const databasePath = join(tempDirectory, "audit.sqlite")
    const writableClient = createWritingAppDatabase(databasePath)

    try {
      writableClient.sqlite.exec(`
        CREATE TABLE readonly_probe (value TEXT NOT NULL);
        INSERT INTO readonly_probe (value) VALUES ('stored');
      `)
    } finally {
      writableClient.close()
    }

    const readOnlyClient = createReadOnlyWritingAppDatabase(databasePath)

    try {
      expect(
        readOnlyClient.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM readonly_probe"
          )
          .get()?.count
      ).toBe(1)
      expect(() =>
        readOnlyClient.sqlite.exec(
          "INSERT INTO readonly_probe (value) VALUES ('blocked')"
        )
      ).toThrow()
    } finally {
      readOnlyClient.close()
      rmSync(tempDirectory, { recursive: true })
    }
  })
})
